package com.springboot.ai_verify.workspace.dto;

import jakarta.validation.constraints.NotNull;

public class TransferOwnershipRequest {
    @NotNull(message = "New owner user ID is required")
    private Long newOwnerUserId;

    public TransferOwnershipRequest() {}

    public TransferOwnershipRequest(Long newOwnerUserId) {
        this.newOwnerUserId = newOwnerUserId;
    }

    public Long getNewOwnerUserId() { return newOwnerUserId; }
    public void setNewOwnerUserId(Long newOwnerUserId) { this.newOwnerUserId = newOwnerUserId; }
}
