package com.springboot.ai_verify.workspace.dto;

import com.springboot.ai_verify.workspace.model.WorkspaceRole;
import java.time.Instant;

public class WorkspaceMemberDto {
    private Long userId;
    private String username;
    private String email;
    private WorkspaceRole role;
    private Instant joinedAt;
    private boolean isCurrentUser;
    private boolean isOwner;

    public WorkspaceMemberDto() {}

    public WorkspaceMemberDto(Long userId, String username, String email, WorkspaceRole role,
                              Instant joinedAt, boolean isCurrentUser, boolean isOwner) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.role = role;
        this.joinedAt = joinedAt;
        this.isCurrentUser = isCurrentUser;
        this.isOwner = isOwner;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public WorkspaceRole getRole() { return role; }
    public void setRole(WorkspaceRole role) { this.role = role; }

    public Instant getJoinedAt() { return joinedAt; }
    public void setJoinedAt(Instant joinedAt) { this.joinedAt = joinedAt; }

    public boolean isCurrentUser() { return isCurrentUser; }
    public void setCurrentUser(boolean currentUser) { isCurrentUser = currentUser; }

    public boolean isOwner() { return isOwner; }
    public void setOwner(boolean owner) { isOwner = owner; }
}
