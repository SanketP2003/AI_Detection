package com.springboot.ai_verify.controller;

import com.springboot.ai_verify.dto.ApiResponse;
import com.springboot.ai_verify.model.DetectionHistory;
import com.springboot.ai_verify.model.User;
import com.springboot.ai_verify.service.DetectionHistoryService;
import com.springboot.ai_verify.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final DetectionHistoryService historyService;

    public AdminController(UserService userService, DetectionHistoryService historyService) {
        this.userService = userService;
        this.historyService = historyService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/users/username/{username}")
    public ResponseEntity<User> getUserByUsername(@PathVariable String username) {
        User user = userService.getUserByUsername(username);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User created = userService.saveUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        User updated = userService.updateUser(id, user);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }

    @GetMapping("/admin-user")
    public ResponseEntity<User> getAdminUser() {
        List<User> users = userService.getAllUsers();
        User adminUser = users.stream()
                .filter(u -> u.getRoles() != null && u.getRoles().contains("ROLE_ADMIN"))
                .findFirst()
                .orElse(null);
        return ResponseEntity.ok(adminUser);
    }

    @GetMapping("/history/recent")
    public ResponseEntity<List<DetectionHistory>> getRecentHistory() {
        return ResponseEntity.ok(historyService.getAllHistory());
    }

    @GetMapping("/history/user/{username}")
    public ResponseEntity<List<DetectionHistory>> getHistoryForUser(@PathVariable String username) {
        return ResponseEntity.ok(historyService.allForUser(username));
    }

    @DeleteMapping("/history/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHistoryEntry(@PathVariable Long id) {
        historyService.deleteByIdAsAdmin(id);
        return ResponseEntity.ok(ApiResponse.success("Detection history entry deleted successfully", null));
    }
}

