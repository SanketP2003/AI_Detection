package com.springboot.ai_verify.workspace.dto;

import com.springboot.ai_verify.workspace.model.WorkspaceRole;
import jakarta.validation.constraints.NotNull;

public class UpdateRoleRequest {
    @NotNull(message = "Role is required")
    private WorkspaceRole role;

    public UpdateRoleRequest() {}

    public UpdateRoleRequest(WorkspaceRole role) {
        this.role = role;
    }

    public WorkspaceRole getRole() { return role; }
    public void setRole(WorkspaceRole role) { this.role = role; }
}
