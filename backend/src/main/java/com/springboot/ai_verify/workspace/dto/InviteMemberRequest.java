package com.springboot.ai_verify.workspace.dto;

import com.springboot.ai_verify.workspace.model.WorkspaceRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class InviteMemberRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;

    @NotNull(message = "Role is required")
    private WorkspaceRole role = WorkspaceRole.MEMBER;

    public InviteMemberRequest() {}

    public InviteMemberRequest(String email, WorkspaceRole role) {
        this.email = email;
        this.role = role;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public WorkspaceRole getRole() { return role; }
    public void setRole(WorkspaceRole role) { this.role = role; }
}
