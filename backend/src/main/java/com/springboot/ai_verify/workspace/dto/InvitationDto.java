package com.springboot.ai_verify.workspace.dto;

import com.springboot.ai_verify.workspace.model.WorkspaceRole;
import java.time.Instant;

public class InvitationDto {
    private Long id;
    private Long workspaceId;
    private String workspaceName;
    private String email;
    private WorkspaceRole role;
    private String token;
    private Instant expiresAt;
    private Instant createdAt;

    public InvitationDto() {}

    public InvitationDto(Long id, Long workspaceId, String workspaceName, String email,
                         WorkspaceRole role, String token, Instant expiresAt, Instant createdAt) {
        this.id = id;
        this.workspaceId = workspaceId;
        this.workspaceName = workspaceName;
        this.email = email;
        this.role = role;
        this.token = token;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getWorkspaceId() { return workspaceId; }
    public void setWorkspaceId(Long workspaceId) { this.workspaceId = workspaceId; }

    public String getWorkspaceName() { return workspaceName; }
    public void setWorkspaceName(String workspaceName) { this.workspaceName = workspaceName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public WorkspaceRole getRole() { return role; }
    public void setRole(WorkspaceRole role) { this.role = role; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
