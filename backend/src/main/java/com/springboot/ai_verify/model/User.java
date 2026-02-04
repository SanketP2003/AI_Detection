package com.springboot.ai_verify.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_username", columnList = "username"),
    @Index(name = "idx_users_email", columnList = "email")
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_-]+$", message = "Username can only contain letters, numbers, underscores, and hyphens")
    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    @Column(length = 100)
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @JsonIgnore // SECURITY FIX: Never expose password hash in responses
    @Column(nullable = false)
    private String password;

    @Size(max = 100, message = "Roles must not exceed 100 characters")
    @Column(length = 100)
    private String roles;

    // Audit fields
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "last_login")
    private Instant lastLogin;

    @Column(name = "failed_login_attempts")
    private Integer failedLoginAttempts = 0;

    @Column(name = "account_locked")
    private Boolean accountLocked = false;

    public User() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    @JsonIgnore
    public String getPassword() { return password; }

    @JsonProperty // Allow setting password via JSON (e.g., registration)
    public void setPassword(String password) { this.password = password; }

    public String getRoles() { return roles; }
    public void setRoles(String roles) { this.roles = roles; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Instant getLastLogin() { return lastLogin; }
    public void setLastLogin(Instant lastLogin) { this.lastLogin = lastLogin; }

    public Integer getFailedLoginAttempts() { return failedLoginAttempts; }
    public void setFailedLoginAttempts(Integer failedLoginAttempts) {
        this.failedLoginAttempts = failedLoginAttempts;
    }

    public Boolean getAccountLocked() { return accountLocked; }
    public void setAccountLocked(Boolean accountLocked) {
        this.accountLocked = accountLocked;
    }

    // Utility method for account lockout
    public void incrementFailedLoginAttempts() {
        this.failedLoginAttempts = (this.failedLoginAttempts == null ? 0 : this.failedLoginAttempts) + 1;
        if (this.failedLoginAttempts >= 5) {
            this.accountLocked = true;
        }
    }

    public void resetFailedLoginAttempts() {
        this.failedLoginAttempts = 0;
        this.accountLocked = false;
    }
}
