package com.springboot.ai_verify.controller;

import com.springboot.ai_verify.dto.ApiResponse;
import com.springboot.ai_verify.dto.AuthUserDto;
import com.springboot.ai_verify.dto.UserProfileDto;
import com.springboot.ai_verify.exception.InvalidRequestException;
import com.springboot.ai_verify.exception.ResourceNotFoundException;
import com.springboot.ai_verify.model.User;
import com.springboot.ai_verify.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "timestamp", java.time.Instant.now().toString()
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthUserDto> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            if (userDetails == null) {
                return ResponseEntity.ok(new AuthUserDto(null, false, false));
            }
            // Safely handle potential null authorities from custom UserDetails implementation
            boolean isAdmin = false;
            try {
                if (userDetails.getAuthorities() != null) {
                    isAdmin = userDetails.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .anyMatch(role -> role.equals("ROLE_ADMIN"));
                }
            } catch (Exception e) {
                // If anything goes wrong determining roles, default to non-admin
                System.err.println("Error determining roles: " + e.getMessage());
            }
            return ResponseEntity.ok(new AuthUserDto(userDetails.getUsername(), isAdmin, true));
        } catch (Exception e) {
            // Log the error but return unauthenticated response instead of throwing
            System.err.println("Error in /me endpoint: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(new AuthUserDto(null, false, false));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileDto> getUserProfile(Authentication auth) {
        if (auth == null) {
            throw new InvalidRequestException("Authentication required");
        }

        User user = userService.getUserByUsername(auth.getName());
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        return ResponseEntity.ok(new UserProfileDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRoles()
        ));
    }

    @PutMapping("/profile/username")
    public ResponseEntity<ApiResponse<Map<String, String>>> updateUsername(
            @RequestBody Map<String, String> data,
            Authentication auth) {

        if (auth == null) {
            throw new InvalidRequestException("Authentication required");
        }

        String newUsername = data.get("username");
        if (newUsername == null || newUsername.trim().isEmpty()) {
            throw new InvalidRequestException("Username cannot be empty");
        }

        User updated = userService.updateUsername(auth.getName(), newUsername.trim());
        return ResponseEntity.ok(ApiResponse.success(
                "Username updated successfully",
                Map.of("username", updated.getUsername())
        ));
    }

    @PutMapping("/profile/password")
    public ResponseEntity<ApiResponse<Void>> updatePassword(
            @RequestBody Map<String, String> data,
            Authentication auth) {

        if (auth == null) {
            throw new InvalidRequestException("Authentication required");
        }

        String currentPass = data.get("currentPassword");
        String newPass = data.get("newPassword");

        if (newPass == null || newPass.length() < 6) {
            throw new InvalidRequestException("Password must be at least 6 characters");
        }

        userService.updatePassword(auth.getName(), currentPass, newPass);
        return ResponseEntity.ok(ApiResponse.success("Password updated successfully", null));
    }

    @PutMapping("/profile/email")
    public ResponseEntity<ApiResponse<Map<String, String>>> updateEmail(
            @RequestBody Map<String, String> data,
            Authentication auth) {

        if (auth == null) {
            throw new InvalidRequestException("Authentication required");
        }

        String newEmail = data.get("email");
        if (newEmail == null || !newEmail.contains("@")) {
            throw new InvalidRequestException("Invalid email address");
        }

        User updated = userService.updateEmail(auth.getName(), newEmail.trim());
        return ResponseEntity.ok(ApiResponse.success(
                "Email updated successfully",
                Map.of("email", updated.getEmail())
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, String>>> registerUser(@RequestBody User user) {
        User created = userService.saveUser(user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "User registered successfully",
                        Map.of("username", created.getUsername())
                ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        return ResponseEntity.ok(userService.updateUser(id, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
