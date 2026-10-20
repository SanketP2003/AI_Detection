package com.springboot.ai_verify.workspace.service;

import com.springboot.ai_verify.billing.model.Subscription;
import com.springboot.ai_verify.billing.repository.SubscriptionRepository;
import com.springboot.ai_verify.billing.service.BillingProvider;
import com.springboot.ai_verify.entitlement.exception.EntitlementException;
import com.springboot.ai_verify.entitlement.service.PlanCatalog;
import com.springboot.ai_verify.exception.InvalidRequestException;
import com.springboot.ai_verify.exception.ResourceNotFoundException;
import com.springboot.ai_verify.model.User;
import com.springboot.ai_verify.repository.UserRepository;
import com.springboot.ai_verify.workspace.dto.*;
import com.springboot.ai_verify.workspace.model.Invitation;
import com.springboot.ai_verify.workspace.model.Membership;
import com.springboot.ai_verify.workspace.model.Workspace;
import com.springboot.ai_verify.workspace.model.WorkspaceRole;
import com.springboot.ai_verify.workspace.repository.InvitationRepository;
import com.springboot.ai_verify.workspace.repository.MembershipRepository;
import com.springboot.ai_verify.workspace.repository.WorkspaceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class WorkspaceService {

    private static final Logger log = LoggerFactory.getLogger(WorkspaceService.class);

    private final WorkspaceRepository workspaceRepository;
    private final MembershipRepository membershipRepository;
    private final InvitationRepository invitationRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final PlanCatalog planCatalog;
    private final BillingProvider billingProvider;

    public WorkspaceService(WorkspaceRepository workspaceRepository,
                            MembershipRepository membershipRepository,
                            InvitationRepository invitationRepository,
                            SubscriptionRepository subscriptionRepository,
                            UserRepository userRepository,
                            PlanCatalog planCatalog,
                            BillingProvider billingProvider) {
        this.workspaceRepository = workspaceRepository;
        this.membershipRepository = membershipRepository;
        this.invitationRepository = invitationRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.planCatalog = planCatalog;
        this.billingProvider = billingProvider;
    }

    @Transactional
    public Workspace createPersonalWorkspace(User user) {
        if (user == null || user.getId() == null) {
            throw new InvalidRequestException("Valid saved user required to create workspace");
        }

        String baseSlug = (user.getUsername() != null ? user.getUsername().toLowerCase().replaceAll("[^a-z0-9]", "-") : "user")
                + "-" + UUID.randomUUID().toString().substring(0, 8);
        String wsName = (user.getUsername() != null ? user.getUsername() : "Personal") + "'s Workspace";

        Workspace workspace = new Workspace(wsName, baseSlug, user.getId());
        workspace = workspaceRepository.save(workspace);

        Membership membership = new Membership(workspace.getId(), user.getId(), WorkspaceRole.OWNER);
        membershipRepository.save(membership);

        user.setDefaultWorkspaceId(workspace.getId());
        userRepository.save(user);

        // Ensure default subscription exists for workspace
        Subscription sub = new Subscription(workspace.getId(), user.getPlan() != null ? user.getPlan() : "FREE");
        subscriptionRepository.save(sub);

        log.info("Provisioned personal workspace {} (id={}) for user {}", wsName, workspace.getId(), user.getUsername());
        return workspace;
    }

    @Transactional
    public Workspace getOrCreateDefaultWorkspace(User user) {
        if (user == null || user.getId() == null) {
            throw new InvalidRequestException("Valid user required");
        }

        if (user.getDefaultWorkspaceId() != null) {
            var wsOpt = workspaceRepository.findById(user.getDefaultWorkspaceId());
            if (wsOpt.isPresent() && isUserMember(wsOpt.get().getId(), user.getId())) {
                return wsOpt.get();
            }
        }

        List<Membership> memberships = membershipRepository.findByUserId(user.getId());
        if (!memberships.isEmpty()) {
            Workspace ws = workspaceRepository.findById(memberships.get(0).getWorkspaceId())
                    .orElse(null);
            if (ws != null) {
                user.setDefaultWorkspaceId(ws.getId());
                userRepository.save(user);
                return ws;
            }
        }

        return createPersonalWorkspace(user);
    }

    public Workspace getWorkspaceForUser(Long workspaceId, Long userId) {
        if (workspaceId == null || userId == null) {
            throw new InvalidRequestException("Workspace ID and User ID are required");
        }

        if (!membershipRepository.existsByWorkspaceIdAndUserId(workspaceId, userId)) {
            throw new AccessDeniedException("User is not a member of workspace: " + workspaceId);
        }

        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + workspaceId));
    }

    public boolean isUserMember(Long workspaceId, Long userId) {
        if (workspaceId == null || userId == null) return false;
        return membershipRepository.existsByWorkspaceIdAndUserId(workspaceId, userId);
    }

    public Optional<WorkspaceRole> getUserRoleInWorkspace(Long workspaceId, Long userId) {
        if (workspaceId == null || userId == null) return Optional.empty();
        return membershipRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .map(Membership::getRole);
    }

    public List<Membership> getUserMemberships(Long userId) {
        return membershipRepository.findByUserId(userId);
    }

    // ------------------------------------------------------------------------
    // Workspace & Team Management APIs
    // ------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<WorkspaceDto> getUserWorkspaces(User user) {
        if (user == null || user.getId() == null) {
            throw new InvalidRequestException("Valid user required");
        }

        List<Membership> memberships = membershipRepository.findByUserId(user.getId());
        List<WorkspaceDto> dtos = new ArrayList<>();

        for (Membership m : memberships) {
            Workspace ws = workspaceRepository.findById(m.getWorkspaceId()).orElse(null);
            if (ws == null) continue;

            long memberCount = membershipRepository.countByWorkspaceId(ws.getId());
            Subscription sub = subscriptionRepository.findByWorkspaceId(ws.getId()).orElse(null);
            String plan = sub != null ? sub.getPlan() : "FREE";
            int seats = sub != null && sub.getSeats() != null ? sub.getSeats() : planCatalog.getPlan(plan).getSeats();
            boolean isDefault = user.getDefaultWorkspaceId() != null && user.getDefaultWorkspaceId().equals(ws.getId());

            dtos.add(new WorkspaceDto(
                    ws.getId(),
                    ws.getName(),
                    ws.getSlug(),
                    ws.getOwnerUserId(),
                    m.getRole(),
                    memberCount,
                    seats,
                    plan,
                    isDefault,
                    ws.getCreatedAt()
            ));
        }

        return dtos;
    }

    @Transactional
    public WorkspaceDto createWorkspace(String name, User user) {
        if (user == null || user.getId() == null) {
            throw new InvalidRequestException("Valid user required");
        }
        if (name == null || name.trim().length() < 2 || name.trim().length() > 100) {
            throw new InvalidRequestException("Workspace name must be between 2 and 100 characters");
        }

        String trimmedName = name.trim();
        String slug = trimmedName.toLowerCase().replaceAll("[^a-z0-9]", "-") + "-" + UUID.randomUUID().toString().substring(0, 8);

        Workspace workspace = new Workspace(trimmedName, slug, user.getId());
        workspace = workspaceRepository.save(workspace);

        Membership membership = new Membership(workspace.getId(), user.getId(), WorkspaceRole.OWNER);
        membershipRepository.save(membership);

        Subscription subscription = new Subscription(workspace.getId(), "FREE");
        subscriptionRepository.save(subscription);

        user.setDefaultWorkspaceId(workspace.getId());
        userRepository.save(user);

        log.info("Created team workspace {} (id={}) by user {}", trimmedName, workspace.getId(), user.getUsername());

        return new WorkspaceDto(
                workspace.getId(),
                workspace.getName(),
                workspace.getSlug(),
                workspace.getOwnerUserId(),
                WorkspaceRole.OWNER,
                1,
                1,
                "FREE",
                true,
                workspace.getCreatedAt()
        );
    }

    @Transactional
    public WorkspaceDto switchDefaultWorkspace(Long workspaceId, User user) {
        if (workspaceId == null || user == null) {
            throw new InvalidRequestException("Workspace ID and User required");
        }

        Membership membership = membershipRepository.findByWorkspaceIdAndUserId(workspaceId, user.getId())
                .orElseThrow(() -> new AccessDeniedException("User is not a member of workspace: " + workspaceId));

        Workspace ws = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + workspaceId));

        user.setDefaultWorkspaceId(workspaceId);
        userRepository.save(user);

        long memberCount = membershipRepository.countByWorkspaceId(workspaceId);
        Subscription sub = subscriptionRepository.findByWorkspaceId(workspaceId).orElse(null);
        String plan = sub != null ? sub.getPlan() : "FREE";
        int seats = sub != null && sub.getSeats() != null ? sub.getSeats() : planCatalog.getPlan(plan).getSeats();

        return new WorkspaceDto(
                ws.getId(),
                ws.getName(),
                ws.getSlug(),
                ws.getOwnerUserId(),
                membership.getRole(),
                memberCount,
                seats,
                plan,
                true,
                ws.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<WorkspaceMemberDto> getWorkspaceMembers(Long workspaceId, User currentUser) {
        validateWorkspaceAccess(workspaceId, currentUser);

        List<Membership> memberships = membershipRepository.findByWorkspaceId(workspaceId);
        List<WorkspaceMemberDto> members = new ArrayList<>();

        for (Membership m : memberships) {
            User u = userRepository.findById(m.getUserId()).orElse(null);
            if (u == null) continue;

            members.add(new WorkspaceMemberDto(
                    u.getId(),
                    u.getUsername(),
                    u.getEmail(),
                    m.getRole(),
                    m.getCreatedAt(),
                    u.getId().equals(currentUser.getId()),
                    m.getRole() == WorkspaceRole.OWNER
            ));
        }

        return members;
    }

    @Transactional
    public InvitationDto inviteMember(Long workspaceId, String email, WorkspaceRole role, User currentUser) {
        validateWorkspaceRole(workspaceId, currentUser, WorkspaceRole.OWNER, WorkspaceRole.ADMIN);

        if (role == WorkspaceRole.OWNER) {
            throw new InvalidRequestException("Cannot invite a member directly as OWNER. Use Transfer Ownership instead.");
        }
        if (email == null || email.trim().isBlank() || !email.contains("@")) {
            throw new InvalidRequestException("A valid email address is required");
        }

        String normalizedEmail = email.trim().toLowerCase();

        // Check if user is already a member
        User existingUser = userRepository.findByEmail(normalizedEmail);
        if (existingUser != null && membershipRepository.existsByWorkspaceIdAndUserId(workspaceId, existingUser.getId())) {
            throw new InvalidRequestException("User with email " + normalizedEmail + " is already a member of this workspace");
        }

        // Check for active pending invite
        Optional<Invitation> pendingOpt = invitationRepository.findByWorkspaceIdAndEmailAndAcceptedAtIsNull(workspaceId, normalizedEmail);
        if (pendingOpt.isPresent() && pendingOpt.get().getExpiresAt().isAfter(Instant.now())) {
            throw new InvalidRequestException("An active invitation already exists for " + normalizedEmail);
        }

        // Reconcile and enforce seat limits
        Subscription sub = subscriptionRepository.findByWorkspaceId(workspaceId).orElse(null);
        String plan = sub != null ? sub.getPlan() : "FREE";
        int planSeats = sub != null && sub.getSeats() != null ? sub.getSeats() : planCatalog.getPlan(plan).getSeats();

        long activeMembers = membershipRepository.countByWorkspaceId(workspaceId);
        long pendingInvites = invitationRepository.countByWorkspaceIdAndAcceptedAtIsNull(workspaceId);
        long totalAllocatedSeats = activeMembers + pendingInvites;

        if (totalAllocatedSeats >= planSeats) {
            throw EntitlementException.seatLimitReached(
                    (int) totalAllocatedSeats,
                    planSeats,
                    "Seat limit reached (" + planSeats + " seats). Upgrade your plan or add additional seats to invite more members."
            );
        }

        // Generate secure single-use raw token and store hash
        String rawToken = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        String tokenHash = hashToken(rawToken);
        Instant expiresAt = Instant.now().plus(7, ChronoUnit.DAYS);

        Invitation invitation = new Invitation();
        invitation.setWorkspaceId(workspaceId);
        invitation.setEmail(normalizedEmail);
        invitation.setRole(role);
        invitation.setTokenHash(tokenHash);
        invitation.setExpiresAt(expiresAt);
        invitation.setCreatedAt(Instant.now());
        invitation = invitationRepository.save(invitation);

        Workspace ws = workspaceRepository.findById(workspaceId).orElseThrow();
        log.info("Created invitation id={} for email={} to workspace {} (id={}) by user {}",
                invitation.getId(), normalizedEmail, ws.getName(), workspaceId, currentUser.getUsername());

        return new InvitationDto(
                invitation.getId(),
                workspaceId,
                ws.getName(),
                normalizedEmail,
                role,
                rawToken,
                expiresAt,
                invitation.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<InvitationDto> getPendingInvitations(Long workspaceId, User currentUser) {
        validateWorkspaceRole(workspaceId, currentUser, WorkspaceRole.OWNER, WorkspaceRole.ADMIN);

        Workspace ws = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + workspaceId));

        List<Invitation> pending = invitationRepository.findByWorkspaceIdAndAcceptedAtIsNull(workspaceId);
        List<InvitationDto> dtos = new ArrayList<>();
        Instant now = Instant.now();

        for (Invitation inv : pending) {
            if (inv.getExpiresAt().isAfter(now)) {
                dtos.add(new InvitationDto(
                        inv.getId(),
                        inv.getWorkspaceId(),
                        ws.getName(),
                        inv.getEmail(),
                        inv.getRole(),
                        null, // Never leak token in list
                        inv.getExpiresAt(),
                        inv.getCreatedAt()
                ));
            }
        }

        return dtos;
    }

    @Transactional
    public void cancelInvitation(Long workspaceId, Long invitationId, User currentUser) {
        validateWorkspaceRole(workspaceId, currentUser, WorkspaceRole.OWNER, WorkspaceRole.ADMIN);

        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found: " + invitationId));

        if (!invitation.getWorkspaceId().equals(workspaceId)) {
            throw new AccessDeniedException("Invitation does not belong to workspace: " + workspaceId);
        }

        invitationRepository.delete(invitation);
        log.info("Canceled invitation id={} for workspace {}", invitationId, workspaceId);
    }

    @Transactional(readOnly = true)
    public PublicInvitationDto getPublicInvitation(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new InvalidRequestException("Invitation token is required");
        }

        String tokenHash = hashToken(rawToken);
        Invitation invitation = invitationRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found or invalid token"));

        boolean isValid = invitation.getAcceptedAt() == null && invitation.getExpiresAt().isAfter(Instant.now());

        Workspace ws = workspaceRepository.findById(invitation.getWorkspaceId()).orElse(null);
        String wsName = ws != null ? ws.getName() : "Workspace";

        String inviterName = "Workspace Owner";
        if (ws != null) {
            User owner = userRepository.findById(ws.getOwnerUserId()).orElse(null);
            if (owner != null && owner.getUsername() != null) {
                inviterName = owner.getUsername();
            }
        }

        return new PublicInvitationDto(
                wsName,
                invitation.getEmail(),
                invitation.getRole(),
                inviterName,
                invitation.getExpiresAt(),
                isValid
        );
    }

    @Transactional
    public Workspace acceptInvitation(String rawToken, User currentUser) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new InvalidRequestException("Invitation token is required");
        }
        if (currentUser == null || currentUser.getId() == null) {
            throw new AccessDeniedException("Authentication required to accept invitation");
        }

        String tokenHash = hashToken(rawToken);
        Invitation invitation = invitationRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found or invalid token"));

        if (invitation.getAcceptedAt() != null) {
            throw new InvalidRequestException("This invitation has already been accepted");
        }
        if (invitation.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidRequestException("This invitation has expired");
        }

        // Verify signed-in user email matches invited email
        if (currentUser.getEmail() == null || !currentUser.getEmail().trim().equalsIgnoreCase(invitation.getEmail().trim())) {
            throw new InvalidRequestException("This invitation was issued to " + invitation.getEmail()
                    + ", but you are currently signed in as " + (currentUser.getEmail() != null ? currentUser.getEmail() : currentUser.getUsername())
                    + ". Please sign in with the matching email.");
        }

        Long workspaceId = invitation.getWorkspaceId();
        Workspace ws = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace no longer exists"));

        // If user already member, just mark accepted
        if (membershipRepository.existsByWorkspaceIdAndUserId(workspaceId, currentUser.getId())) {
            invitation.setAcceptedAt(Instant.now());
            invitationRepository.save(invitation);
            return ws;
        }

        // Final seat limit check
        Subscription sub = subscriptionRepository.findByWorkspaceId(workspaceId).orElse(null);
        String plan = sub != null ? sub.getPlan() : "FREE";
        int planSeats = sub != null && sub.getSeats() != null ? sub.getSeats() : planCatalog.getPlan(plan).getSeats();
        long activeMembers = membershipRepository.countByWorkspaceId(workspaceId);

        if (activeMembers >= planSeats) {
            throw EntitlementException.seatLimitReached(
                    (int) activeMembers,
                    planSeats,
                    "This workspace has reached its maximum member seat limit (" + planSeats + " seats)."
            );
        }

        Membership membership = new Membership(workspaceId, currentUser.getId(), invitation.getRole());
        membershipRepository.save(membership);

        invitation.setAcceptedAt(Instant.now());
        invitationRepository.save(invitation);

        currentUser.setDefaultWorkspaceId(workspaceId);
        userRepository.save(currentUser);

        log.info("User {} (id={}) accepted invitation to workspace {} with role {}",
                currentUser.getUsername(), currentUser.getId(), ws.getName(), invitation.getRole());

        return ws;
    }

    @Transactional
    public void updateMemberRole(Long workspaceId, Long targetUserId, WorkspaceRole newRole, User currentUser) {
        validateWorkspaceRole(workspaceId, currentUser, WorkspaceRole.OWNER, WorkspaceRole.ADMIN);

        Workspace ws = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        if (ws.getOwnerUserId().equals(targetUserId)) {
            throw new InvalidRequestException("Cannot change the role of the workspace Owner. Use Transfer Ownership instead.");
        }

        Membership currentMembership = membershipRepository.findByWorkspaceIdAndUserId(workspaceId, currentUser.getId()).orElseThrow();
        if (currentMembership.getRole() == WorkspaceRole.ADMIN && newRole == WorkspaceRole.OWNER) {
            throw new AccessDeniedException("Administrators cannot promote members to Owner");
        }

        Membership targetMembership = membershipRepository.findByWorkspaceIdAndUserId(workspaceId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this workspace"));

        targetMembership.setRole(newRole);
        membershipRepository.save(targetMembership);
        log.info("Updated role for user {} in workspace {} to {}", targetUserId, workspaceId, newRole);
    }

    @Transactional
    public void removeMember(Long workspaceId, Long targetUserId, User currentUser) {
        validateWorkspaceAccess(workspaceId, currentUser);

        Workspace ws = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        boolean isSelfLeaving = currentUser.getId().equals(targetUserId);

        if (isSelfLeaving) {
            if (ws.getOwnerUserId().equals(targetUserId)) {
                throw new InvalidRequestException("The workspace Owner cannot leave the workspace. You must transfer ownership first or delete the workspace.");
            }
            if (isPersonalWorkspace(ws, currentUser)) {
                throw new InvalidRequestException("You cannot leave your personal workspace");
            }
        } else {
            // Removing someone else requires OWNER or ADMIN
            Membership currentMembership = membershipRepository.findByWorkspaceIdAndUserId(workspaceId, currentUser.getId()).orElseThrow();
            if (currentMembership.getRole() != WorkspaceRole.OWNER && currentMembership.getRole() != WorkspaceRole.ADMIN) {
                throw new AccessDeniedException("Only workspace owners or administrators can remove members");
            }
            if (ws.getOwnerUserId().equals(targetUserId)) {
                throw new InvalidRequestException("Cannot remove the workspace Owner");
            }
        }

        membershipRepository.deleteByWorkspaceIdAndUserId(workspaceId, targetUserId);
        log.info("Removed user {} from workspace {} (triggered by user {})", targetUserId, workspaceId, currentUser.getUsername());

        // If target user had this workspace as default, fallback to personal workspace
        User targetUser = userRepository.findById(targetUserId).orElse(null);
        if (targetUser != null && workspaceId.equals(targetUser.getDefaultWorkspaceId())) {
            List<Membership> remaining = membershipRepository.findByUserId(targetUserId);
            if (!remaining.isEmpty()) {
                targetUser.setDefaultWorkspaceId(remaining.get(0).getWorkspaceId());
            } else {
                targetUser.setDefaultWorkspaceId(null);
            }
            userRepository.save(targetUser);
        }
    }

    @Transactional
    public void transferOwnership(Long workspaceId, Long newOwnerUserId, User currentUser) {
        validateWorkspaceRole(workspaceId, currentUser, WorkspaceRole.OWNER);

        if (currentUser.getId().equals(newOwnerUserId)) {
            throw new InvalidRequestException("You are already the owner of this workspace");
        }

        Workspace ws = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        Membership newOwnerMembership = membershipRepository.findByWorkspaceIdAndUserId(workspaceId, newOwnerUserId)
                .orElseThrow(() -> new InvalidRequestException("New owner must be an existing member of the workspace"));

        Membership currentOwnerMembership = membershipRepository.findByWorkspaceIdAndUserId(workspaceId, currentUser.getId()).orElseThrow();

        // Transfer
        ws.setOwnerUserId(newOwnerUserId);
        workspaceRepository.save(ws);

        newOwnerMembership.setRole(WorkspaceRole.OWNER);
        membershipRepository.save(newOwnerMembership);

        currentOwnerMembership.setRole(WorkspaceRole.ADMIN);
        membershipRepository.save(currentOwnerMembership);

        log.info("Transferred ownership of workspace {} from user {} to user {}",
                workspaceId, currentUser.getUsername(), newOwnerUserId);
    }

    @Transactional
    public void deleteWorkspace(Long workspaceId, User currentUser) {
        validateWorkspaceRole(workspaceId, currentUser, WorkspaceRole.OWNER);

        Workspace ws = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        if (isPersonalWorkspace(ws, currentUser)) {
            throw new InvalidRequestException("Personal workspace cannot be deleted");
        }

        // Clean up memberships
        membershipRepository.deleteByWorkspaceId(workspaceId);

        // Delete workspace
        workspaceRepository.delete(ws);
        log.info("Deleted workspace {} (id={}) by owner {}", ws.getName(), workspaceId, currentUser.getUsername());

        // Reset default workspace if needed
        if (workspaceId.equals(currentUser.getDefaultWorkspaceId())) {
            getOrCreateDefaultWorkspace(currentUser);
        }
    }

    // ------------------------------------------------------------------------
    // Helper & Validation Methods
    // ------------------------------------------------------------------------

    private void validateWorkspaceAccess(Long workspaceId, User user) {
        if (workspaceId == null || user == null || !membershipRepository.existsByWorkspaceIdAndUserId(workspaceId, user.getId())) {
            throw new AccessDeniedException("Access denied: You are not a member of workspace: " + workspaceId);
        }
    }

    private void validateWorkspaceRole(Long workspaceId, User user, WorkspaceRole... allowedRoles) {
        validateWorkspaceAccess(workspaceId, user);
        Membership membership = membershipRepository.findByWorkspaceIdAndUserId(workspaceId, user.getId())
                .orElseThrow(() -> new AccessDeniedException("Membership not found"));

        for (WorkspaceRole role : allowedRoles) {
            if (membership.getRole() == role) {
                return;
            }
        }
        throw new AccessDeniedException("Action requires one of the following roles: " + Arrays.toString(allowedRoles));
    }

    private boolean isPersonalWorkspace(Workspace ws, User user) {
        if (ws == null || user == null) return false;
        // Personal workspace has owner = user and name contains username or 'Personal'
        String userPrefix = user.getUsername() != null ? user.getUsername().toLowerCase().replaceAll("[^a-z0-9]", "-") : "user";
        return ws.getOwnerUserId().equals(user.getId()) &&
                (ws.getSlug().startsWith(userPrefix + "-") || ws.getName().contains("Personal's Workspace") || ws.getName().equals(user.getUsername() + "'s Workspace"));
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedHash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodedHash.length);
            for (byte b : encodedHash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm unavailable", e);
        }
    }
}
