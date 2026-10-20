package com.springboot.ai_verify.workspace.dto;

import com.springboot.ai_verify.workspace.model.WorkspaceRole;
import java.time.Instant;

public class PublicInvitationDto {
    private String workspaceName;
    private String email;
    private WorkspaceRole role;
    private String inviterName;
    private Instant expiresAt;
    private boolean isValid;

    public PublicInvitationDto() {}

    public PublicInvitationDto(String workspaceName, String email, WorkspaceRole role,
                               String inviterName, Instant expiresAt, boolean isValid) {
        this.workspaceName = workspaceName;
        this.email = email;
        this.role = role;
        this.inviterName = inviterName;
        this.expiresAt = expiresAt;
        this.isValid = isValid;
    }

    public String getWorkspaceName() { return workspaceName; }
    public void setWorkspaceName(String workspaceName) { this.workspaceName = workspaceName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public WorkspaceRole getRole() { return role; }
    public void setRole(WorkspaceRole role) { this.role = role; }

    public String getInviterName() { return inviterName; }
    public void setInviterName(String inviterName) { this.inviterName = inviterName; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public boolean isValid() { return isValid; }
    public void setValid(boolean valid) { isValid = valid; }
}
