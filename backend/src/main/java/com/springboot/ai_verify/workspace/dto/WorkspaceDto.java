package com.springboot.ai_verify.workspace.dto;

import com.springboot.ai_verify.workspace.model.WorkspaceRole;
import java.time.Instant;

public class WorkspaceDto {
    private Long id;
    private String name;
    private String slug;
    private Long ownerUserId;
    private WorkspaceRole role;
    private long memberCount;
    private int seats;
    private String plan;
    private boolean isDefault;
    private Instant createdAt;

    public WorkspaceDto() {}

    public WorkspaceDto(Long id, String name, String slug, Long ownerUserId, WorkspaceRole role,
                        long memberCount, int seats, String plan, boolean isDefault, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.ownerUserId = ownerUserId;
        this.role = role;
        this.memberCount = memberCount;
        this.seats = seats;
        this.plan = plan;
        this.isDefault = isDefault;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public Long getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(Long ownerUserId) { this.ownerUserId = ownerUserId; }

    public WorkspaceRole getRole() { return role; }
    public void setRole(WorkspaceRole role) { this.role = role; }

    public long getMemberCount() { return memberCount; }
    public void setMemberCount(long memberCount) { this.memberCount = memberCount; }

    public int getSeats() { return seats; }
    public void setSeats(int seats) { this.seats = seats; }

    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }

    public boolean isDefault() { return isDefault; }
    public void setDefault(boolean aDefault) { isDefault = aDefault; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
