package com.springboot.ai_verify.controller;

import com.springboot.ai_verify.dto.ApiResponse;
import com.springboot.ai_verify.dto.AuthUserDto;
import com.springboot.ai_verify.dto.UserProfileDto;
import com.springboot.ai_verify.dto.UserRegistrationDto;
import com.springboot.ai_verify.exception.InvalidRequestException;
import com.springboot.ai_verify.exception.ResourceNotFoundException;
import com.springboot.ai_verify.model.User;
import com.springboot.ai_verify.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // SECURITY FIX: Removed getAllUsers endpoint - this should be admin-only

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "timestamp", java.time.Instant.now().toString()
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthUserDto> getCurrentUser(Authentication authentication) {
        try {
            if (!isAuthenticated(authentication)) {
                return ResponseEntity.ok(new AuthUserDto(null, false, false));
            }

            boolean isAdmin = false;
            try {
                if (authentication.getAuthorities() != null) {
                    isAdmin = authentication.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .anyMatch(role -> role.equals("ROLE_ADMIN"));
                }
            } catch (Exception e) {
                log.error("Error determining roles for user {}: {}", authentication.getName(), e.getMessage());
            }

            String username = resolveUsername(authentication);
            return ResponseEntity.ok(new AuthUserDto(username, isAdmin, true));
        } catch (Exception e) {
            log.error("Error in /me endpoint: {}", e.getMessage());
            return ResponseEntity.ok(new AuthUserDto(null, false, false));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileDto> getUserProfile(Authentication auth) {
        User user = resolveAuthenticatedUser(auth);

        return ResponseEntity.ok(new UserProfileDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                parseRoles(user.getRoles())
        ));
    }

    @PutMapping("/profile/username")
    public ResponseEntity<ApiResponse<Map<String, String>>> updateUsername(
            @RequestBody Map<String, String> data,
            Authentication auth) {

        User currentUser = resolveAuthenticatedUser(auth);

        String newUsername = data.get("username");
        if (newUsername == null || newUsername.trim().isEmpty()) {
            throw new InvalidRequestException("Username cannot be empty");
        }

        // Validate username format
        if (!newUsername.matches("^[a-zA-Z0-9_-]+$")) {
            throw new InvalidRequestException("Username can only contain letters, numbers, underscores, and hyphens");
        }

        if (newUsername.length() < 3 || newUsername.length() > 50) {
            throw new InvalidRequestException("Username must be between 3 and 50 characters");
        }

        User updated = userService.updateUsername(currentUser.getUsername(), newUsername.trim());
        log.info("User {} updated username to {}", currentUser.getUsername(), newUsername);

        return ResponseEntity.ok(ApiResponse.success(
                "Username updated successfully",
                Map.of("username", updated.getUsername())
        ));
    }

    @PutMapping("/profile/password")
    public ResponseEntity<ApiResponse<Void>> updatePassword(
            @RequestBody Map<String, String> data,
            Authentication auth) {

        User currentUser = resolveAuthenticatedUser(auth);

        String currentPass = data.get("currentPassword");
        String newPass = data.get("newPassword");

        if (currentPass == null || currentPass.isEmpty()) {
            throw new InvalidRequestException("Current password is required");
        }

        // SECURITY FIX: Enforce stronger password requirements
        if (newPass == null || newPass.length() < 8) {
            throw new InvalidRequestException("Password must be at least 8 characters");
        }

        // Check for password complexity
        if (!newPass.matches(".*[A-Z].*") || !newPass.matches(".*[a-z].*") || !newPass.matches(".*[0-9].*")) {
            throw new InvalidRequestException("Password must contain at least one uppercase letter, one lowercase letter, and one number");
        }

        userService.updatePassword(currentUser.getUsername(), currentPass, newPass);
        log.info("User {} updated their password", currentUser.getUsername());

        return ResponseEntity.ok(ApiResponse.success("Password updated successfully", null));
    }

    @PutMapping("/profile/email")
    public ResponseEntity<ApiResponse<Map<String, String>>> updateEmail(
            @RequestBody Map<String, String> data,
            Authentication auth) {

        User currentUser = resolveAuthenticatedUser(auth);

        String newEmail = data.get("email");
        if (newEmail == null || !newEmail.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new InvalidRequestException("Invalid email address");
        }

        User updated = userService.updateEmail(currentUser.getUsername(), newEmail.trim());
        log.info("User {} updated email to {}", currentUser.getUsername(), newEmail);

        return ResponseEntity.ok(ApiResponse.success(
                "Email updated successfully",
                Map.of("email", updated.getEmail())
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, String>>> registerUser(
            @Valid @RequestBody UserRegistrationDto registrationDto) {

        // Validate password strength
        String password = registrationDto.password();
        if (password == null || password.length() < 8) {
            throw new InvalidRequestException("Password must be at least 8 characters");
        }

        User user = new User();
        user.setUsername(registrationDto.username());
        user.setEmail(registrationDto.email());
        user.setPassword(password);

        User created = userService.saveUser(user);
        log.info("New user registered: {}", created.getUsername());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "User registered successfully",
                        Map.of("username", created.getUsername())
                ));
    }

    // SECURITY FIX: Removed @PutMapping("/{id}") and @DeleteMapping("/{id}")
    // These endpoints allowed ANY authenticated user to modify ANY user
    // User modification should only be allowed via /profile/* endpoints (self)
    // or via /api/admin/* endpoints (admin only)

    private boolean isAuthenticated(Authentication authentication) {
        return authentication != null &&
                authentication.isAuthenticated() &&
                !(authentication instanceof AnonymousAuthenticationToken);
    }

    private String resolveUsername(Authentication auth) {
        if (!isAuthenticated(auth)) {
            return null;
        }

        User user = userService.getUserByUsername(auth.getName());
        if (user != null) {
            return user.getUsername();
        }

        String principalName = auth.getName();
        return principalName != null && !principalName.isBlank() ? principalName : null;
    }

    private User resolveAuthenticatedUser(Authentication auth) {
        if (!isAuthenticated(auth)) {
            throw new InvalidRequestException("Authentication required");
        }

        User user = userService.getUserByUsername(auth.getName());

        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        return user;
    }

    private List<String> parseRoles(String roles) {
        if (roles == null || roles.isBlank()) {
            return List.of("ROLE_USER");
        }

        return Arrays.stream(roles.split(","))
                .map(String::trim)
                .filter(role -> !role.isBlank())
                .toList();
    }
}
