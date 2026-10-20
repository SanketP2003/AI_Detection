package com.springboot.ai_verify.workspace.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "workspaces", indexes = {
    @Index(name = "idx_workspaces_owner", columnList = "owner_user_id"),
    @Index(name = "idx_workspaces_slug", columnList = "slug", unique = true)
})
public class Workspace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(name = "owner_user_id", nullable = false)
    private Long ownerUserId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Workspace() {}

    public Workspace(String name, String slug, Long ownerUserId) {
        this.name = name;
        this.slug = slug;
        this.ownerUserId = ownerUserId;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public Long getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(Long ownerUserId) { this.ownerUserId = ownerUserId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
