package com.springboot.ai_verify.workspace;

import com.springboot.ai_verify.billing.model.Subscription;
import com.springboot.ai_verify.billing.repository.SubscriptionRepository;
import com.springboot.ai_verify.entitlement.exception.EntitlementException;
import com.springboot.ai_verify.exception.InvalidRequestException;
import com.springboot.ai_verify.model.User;
import com.springboot.ai_verify.repository.UserRepository;
import com.springboot.ai_verify.workspace.dto.InvitationDto;
import com.springboot.ai_verify.workspace.dto.WorkspaceDto;
import com.springboot.ai_verify.workspace.dto.WorkspaceMemberDto;
import com.springboot.ai_verify.workspace.model.Workspace;
import com.springboot.ai_verify.workspace.model.WorkspaceRole;
import com.springboot.ai_verify.workspace.repository.InvitationRepository;
import com.springboot.ai_verify.workspace.repository.MembershipRepository;
import com.springboot.ai_verify.workspace.service.WorkspaceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class TeamAndSeatsTest {

    @org.springframework.boot.test.mock.mockito.MockBean
    private org.springframework.security.oauth2.jwt.JwtDecoder jwtDecoder;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private InvitationRepository invitationRepository;

    private User ownerUser;
    private User inviteeUser;
    private User intruderUser;
    private Workspace teamWs;

    @BeforeEach
    void setUp() {
        ownerUser = new User();
        ownerUser.setUsername("owner_" + System.currentTimeMillis());
        ownerUser.setEmail("owner_" + System.currentTimeMillis() + "@example.com");
        ownerUser.setPassword("password123");
        ownerUser = userRepository.save(ownerUser);

        inviteeUser = new User();
        inviteeUser.setUsername("invitee_" + System.currentTimeMillis());
        inviteeUser.setEmail("colleague@example.com");
        inviteeUser.setPassword("password123");
        inviteeUser = userRepository.save(inviteeUser);

        intruderUser = new User();
        intruderUser.setUsername("intruder_" + System.currentTimeMillis());
        intruderUser.setEmail("intruder@example.com");
        intruderUser.setPassword("password123");
        intruderUser = userRepository.save(intruderUser);

        // Create team workspace with 2 seats
        WorkspaceDto wsDto = workspaceService.createWorkspace("Engineering Alpha", ownerUser);
        teamWs = workspaceService.getWorkspaceForUser(wsDto.getId(), ownerUser.getId());

        Subscription sub = subscriptionRepository.findByWorkspaceId(teamWs.getId()).orElseThrow();
        sub.setPlan("TEAM");
        sub.setSeats(2); // 1 owner + 1 additional seat
        subscriptionRepository.save(sub);
    }

    @Test
    @DisplayName("Cross-workspace isolation: Non-members cannot list members or invite to another workspace")
    void testCrossWorkspaceAccessDenied() {
        // Intruder is not a member of teamWs
        assertThrows(AccessDeniedException.class, () ->
                workspaceService.getWorkspaceMembers(teamWs.getId(), intruderUser)
        );

        assertThrows(AccessDeniedException.class, () ->
                workspaceService.inviteMember(teamWs.getId(), "test@example.com", WorkspaceRole.MEMBER, intruderUser)
        );
    }

    @Test
    @DisplayName("Seat limit blocks invitation when workspace capacity is reached (SEAT_LIMIT_REACHED)")
    void testSeatLimitEnforcement() {
        // Seat capacity = 2. Owner is 1. We invite 1 member -> allocated = 2.
        InvitationDto invite1 = workspaceService.inviteMember(teamWs.getId(), "colleague@example.com", WorkspaceRole.MEMBER, ownerUser);
        assertNotNull(invite1);
        assertNotNull(invite1.getToken());

        // Attempting to invite a 2nd member when limit is 2 must throw SEAT_LIMIT_REACHED
        EntitlementException ex = assertThrows(EntitlementException.class, () ->
                workspaceService.inviteMember(teamWs.getId(), "extra@example.com", WorkspaceRole.MEMBER, ownerUser)
        );

        assertEquals("SEAT_LIMIT_REACHED", ex.getCode());
        assertEquals(402, ex.getStatus().value());
    }

    @Test
    @DisplayName("Invitation acceptance requires matching email address and creates membership")
    void testInvitationAcceptanceAndEmailVerification() {
        InvitationDto invite = workspaceService.inviteMember(teamWs.getId(), "colleague@example.com", WorkspaceRole.MEMBER, ownerUser);

        // Intruder with different email attempts to accept -> rejected
        InvalidRequestException emailMismatchEx = assertThrows(InvalidRequestException.class, () ->
                workspaceService.acceptInvitation(invite.getToken(), intruderUser)
        );
        assertTrue(emailMismatchEx.getMessage().contains("Please sign in with the matching email"));

        // Right user accepts -> successfully joined
        Workspace acceptedWs = workspaceService.acceptInvitation(invite.getToken(), inviteeUser);
        assertEquals(teamWs.getId(), acceptedWs.getId());

        // Verify membership
        List<WorkspaceMemberDto> members = workspaceService.getWorkspaceMembers(teamWs.getId(), ownerUser);
        assertEquals(2, members.size());
        assertTrue(members.stream().anyMatch(m -> m.getEmail().equals("colleague@example.com") && m.getRole() == WorkspaceRole.MEMBER));

        // Replay of accepted token must fail
        assertThrows(InvalidRequestException.class, () ->
                workspaceService.acceptInvitation(invite.getToken(), inviteeUser)
        );
    }

    @Test
    @DisplayName("Removing a member revokes access immediately")
    void testImmediateRevocationOnMemberRemoval() {
        InvitationDto invite = workspaceService.inviteMember(teamWs.getId(), "colleague@example.com", WorkspaceRole.MEMBER, ownerUser);
        workspaceService.acceptInvitation(invite.getToken(), inviteeUser);

        // Member currently has access
        assertTrue(workspaceService.isUserMember(teamWs.getId(), inviteeUser.getId()));

        // Owner removes member
        workspaceService.removeMember(teamWs.getId(), inviteeUser.getId(), ownerUser);

        // Access is immediately revoked
        assertFalse(workspaceService.isUserMember(teamWs.getId(), inviteeUser.getId()));
        assertThrows(AccessDeniedException.class, () ->
                workspaceService.getWorkspaceMembers(teamWs.getId(), inviteeUser)
        );
    }

    @Test
    @DisplayName("Personal workspace cannot be deleted")
    void testPersonalWorkspaceCannotBeDeleted() {
        Workspace personalWs = workspaceService.createPersonalWorkspace(ownerUser);

        InvalidRequestException ex = assertThrows(InvalidRequestException.class, () ->
                workspaceService.deleteWorkspace(personalWs.getId(), ownerUser)
        );
        assertTrue(ex.getMessage().contains("Personal workspace cannot be deleted"));
    }

    @Test
    @DisplayName("Ownership transfer promotes member to OWNER and demotes previous owner to ADMIN")
    void testOwnershipTransfer() {
        InvitationDto invite = workspaceService.inviteMember(teamWs.getId(), "colleague@example.com", WorkspaceRole.ADMIN, ownerUser);
        workspaceService.acceptInvitation(invite.getToken(), inviteeUser);

        workspaceService.transferOwnership(teamWs.getId(), inviteeUser.getId(), ownerUser);

        // Verify new owner
        Workspace updated = workspaceService.getWorkspaceForUser(teamWs.getId(), inviteeUser.getId());
        assertEquals(inviteeUser.getId(), updated.getOwnerUserId());

        // Verify roles
        assertEquals(WorkspaceRole.OWNER, workspaceService.getUserRoleInWorkspace(teamWs.getId(), inviteeUser.getId()).orElse(null));
        assertEquals(WorkspaceRole.ADMIN, workspaceService.getUserRoleInWorkspace(teamWs.getId(), ownerUser.getId()).orElse(null));
    }
}
