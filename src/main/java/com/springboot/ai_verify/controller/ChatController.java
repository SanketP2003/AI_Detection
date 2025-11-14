package com.springboot.ai_verify.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chats")
@CrossOrigin(origins = "*")
public class ChatController {

    // In-memory storage for demo purposes
    // In production, you'd want to persist to a database
    public static class ChatMessage {
        public Long id;
        public String username;
        public String message;
        public String response;
        public Instant createdAt;

        public Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("id", id);
            map.put("username", username);
            map.put("message", message);
            map.put("response", response);
            map.put("createdAt", createdAt.toString());
            return map;
        }
    }

    private final List<ChatMessage> chatHistory = new ArrayList<>();
    private Long nextId = 1L;

    private boolean isAdmin(Authentication auth) {
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_ADMIN"));
    }

    @GetMapping("/recent")
    public ResponseEntity<?> getRecentChats(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String username = auth.getName();
        List<Map<String, Object>> userChats = chatHistory.stream()
                .filter(c -> c.username.equals(username))
                .sorted((a, b) -> b.createdAt.compareTo(a.createdAt))
                .limit(20)
                .map(ChatMessage::toMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userChats);
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllChats(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String username = auth.getName();
        List<Map<String, Object>> userChats = chatHistory.stream()
                .filter(c -> c.username.equals(username))
                .sorted((a, b) -> b.createdAt.compareTo(a.createdAt))
                .map(ChatMessage::toMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userChats);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteChat(@PathVariable Long id, Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String username = auth.getName();
        boolean removed = chatHistory.removeIf(c -> c.id.equals(id) && c.username.equals(username));
        if (removed) {
            return ResponseEntity.ok(Map.of("message", "Chat deleted"));
        }
        return ResponseEntity.status(404).body(Map.of("error", "Chat not found"));
    }

    @GetMapping("/admin/recent")
    public ResponseEntity<?> getAdminRecentChats(Authentication auth) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        List<ChatMessage> recentChats = chatHistory.stream()
                .sorted((a, b) -> b.createdAt.compareTo(a.createdAt))
                .limit(100)
                .toList();
        return ResponseEntity.ok(recentChats);
    }

    @GetMapping("/admin/user/{username}")
    public ResponseEntity<?> getAdminChatsForUser(@PathVariable String username, Authentication auth) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        List<ChatMessage> userChats = chatHistory.stream()
                .filter(c -> c.username.equals(username))
                .sorted((a, b) -> b.createdAt.compareTo(a.createdAt))
                .toList();
        return ResponseEntity.ok(userChats);
    }

    // Helper method to log chat exchanges (called from AiAdvisor controller)
    public void logChatExchange(String username, String message, String response) {
        ChatMessage chat = new ChatMessage();
        chat.id = nextId++;
        chat.username = username;
        chat.message = message;
        chat.response = response;
        chat.createdAt = Instant.now();
        chatHistory.add(chat);
    }
}

