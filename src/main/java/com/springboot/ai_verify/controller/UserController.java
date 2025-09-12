package com.springboot.ai_verify.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails != null) {
            // With roles standardized in CustomUserDetailsService, we can now do a simple, exact check.
            boolean isAdmin = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_ADMIN"));

            Map<String, Object> userInfo = Map.of(
                "username", userDetails.getUsername(),
                "isAdmin", isAdmin,
                "authenticated", true
            );
            return ResponseEntity.ok(userInfo);
        }
        // If no user is authenticated, return a clear unauthenticated status.
        return ResponseEntity.ok(Map.of("authenticated", false));
    }
}
