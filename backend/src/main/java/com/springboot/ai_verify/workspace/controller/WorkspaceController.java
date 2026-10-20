package com.springboot.ai_verify.workspace.controller;

import com.springboot.ai_verify.model.User;
import com.springboot.ai_verify.service.UserService;
import com.springboot.ai_verify.workspace.dto.*;
import com.springboot.ai_verify.workspace.model.Workspace;
import com.springboot.ai_verify.workspace.service.WorkspaceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workspaces")
public class WorkspaceController {

    private final WorkspaceService workspaceService;
    private final UserService userService;

    public WorkspaceController(WorkspaceService workspaceService, UserService userService) {
        this.workspaceService = workspaceService;
        this.userService = userService;
    }

    private User resolveAuthenticatedUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new AccessDeniedException("Authentication required");
        }
        User user = userService.getUserByUsername(auth.getName());
        if (user == null) {
            user = userService.getOrCreateClerkUser(auth.getName(), null);
        }
        if (user == null) {
            throw new AccessDeniedException("Authenticated user record not found");
        }
        return user;
    }

    @GetMapping
    public ResponseEntity<List<WorkspaceDto>> getWorkspaces(Authentication auth) {
        User user = resolveAuthenticatedUser(auth);
        return ResponseEntity.ok(workspaceService.getUserWorkspaces(user));
    }

    @PostMapping
    public ResponseEntity<WorkspaceDto> createWorkspace(@Valid @RequestBody CreateWorkspaceRequest request,
                                                         Authentication auth) {
        User user = resolveAuthenticatedUser(auth);
        WorkspaceDto created = workspaceService.createWorkspace(request.getName(), user);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{id}/switch-default")
    public ResponseEntity<WorkspaceDto> switchDefaultWorkspace(@PathVariable("id") Long workspaceId,
                                                               Authentication auth) {
        User user = resolveAuthenticatedUser(auth);
        WorkspaceDto switched = workspaceService.switchDefaultWorkspace(workspaceId, user);
        return ResponseEntity.ok(switched);
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<WorkspaceMemberDto>> getWorkspaceMembers(@PathVariable("id") Long workspaceId,
                                                                        Authentication auth) {
        User user = resolveAuthenticatedUser(auth);
        return ResponseEntity.ok(workspaceService.getWorkspaceMembers(workspaceId, user));
    }

    @PatchMapping("/{id}/members/{userId}/role")
    public ResponseEntity<Map<String, String>> updateMemberRole(@PathVariable("id") Long workspaceId,
                                                                 @PathVariable("userId") Long targetUserId,
                                                                 @Valid @RequestBody UpdateRoleRequest request,
                                                                 Authentication auth) {
        User user = resolveAuthenticatedUser(auth);
        workspaceService.updateMemberRole(workspaceId, targetUserId, request.getRole(), user);
        return ResponseEntity.ok(Map.of("message", "Member role updated successfully"));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Map<String, String>> removeMember(@PathVariable("id") Long workspaceId,
                                                            @PathVariable("userId") Long targetUserId,
                                                            Authentication auth) {
        User user = resolveAuthenticatedUser(auth);
        workspaceService.removeMember(workspaceId, targetUserId, user);
        return ResponseEntity.ok(Map.of("message", "Member removed successfully"));
    }

    @GetMapping("/{id}/invitations")
    public ResponseEntity<List<InvitationDto>> getPendingInvitations(@PathVariable("id") Long workspaceId,
                                                                    Authentication auth) {
        User user = resolveAuthenticatedUser(auth);
        return ResponseEntity.ok(workspaceService.getPendingInvitations(workspaceId, user));
    }

    @PostMapping("/{id}/invitations")
    public ResponseEntity<InvitationDto> inviteMember(@PathVariable("id") Long workspaceId,
                                                      @Valid @RequestBody InviteMemberRequest request,
                                                      Authentication auth) {
        User user = resolveAuthenticatedUser(auth);
        InvitationDto invitation = workspaceService.inviteMember(workspaceId, request.getEmail(), request.getRole(), user);
        return ResponseEntity.status(HttpStatus.CREATED).body(invitation);
    }

    @DeleteMapping("/{id}/invitations/{invitationId}")
    public ResponseEntity<Map<String, String>> cancelInvitation(@PathVariable("id") Long workspaceId,
                                                                @PathVariable("invitationId") Long invitationId,
                                                                Authentication auth) {
        User user = resolveAuthenticatedUser(auth);
        workspaceService.cancelInvitation(workspaceId, invitationId, user);
        return ResponseEntity.ok(Map.of("message", "Invitation canceled successfully"));
    }

    @GetMapping("/invitations/{token}")
    public ResponseEntity<PublicInvitationDto> getPublicInvitation(@PathVariable("token") String token) {
        return ResponseEntity.ok(workspaceService.getPublicInvitation(token));
    }

    @PostMapping("/invitations/{token}/accept")
    public ResponseEntity<WorkspaceDto> acceptInvitation(@PathVariable("token") String token,
                                                         Authentication auth) {
        User user = resolveAuthenticatedUser(auth);
        Workspace ws = workspaceService.acceptInvitation(token, user);
        return ResponseEntity.ok(workspaceService.switchDefaultWorkspace(ws.getId(), user));
    }

    @PostMapping("/{id}/transfer-ownership")
    public ResponseEntity<Map<String, String>> transferOwnership(@PathVariable("id") Long workspaceId,
                                                                 @Valid @RequestBody TransferOwnershipRequest request,
                                                                 Authentication auth) {
        User user = resolveAuthenticatedUser(auth);
        workspaceService.transferOwnership(workspaceId, request.getNewOwnerUserId(), user);
        return ResponseEntity.ok(Map.of("message", "Workspace ownership transferred successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteWorkspace(@PathVariable("id") Long workspaceId,
                                                               Authentication auth) {
        User user = resolveAuthenticatedUser(auth);
        workspaceService.deleteWorkspace(workspaceId, user);
        return ResponseEntity.ok(Map.of("message", "Workspace deleted successfully"));
    }
}
