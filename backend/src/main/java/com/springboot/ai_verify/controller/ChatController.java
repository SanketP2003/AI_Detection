package com.springboot.ai_verify.controller;

import com.springboot.ai_verify.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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

    private final List<ChatMessage> chatHistory = new ArrayList<>();
    private Long nextId = 1L;

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

    @GetMapping("/recent")
    public ResponseEntity<List<Map<String, Object>>> getRecentChats(Authentication auth) {
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
    public ResponseEntity<List<Map<String, Object>>> getAllChats(Authentication auth) {
        String username = auth.getName();
        List<Map<String, Object>> userChats = chatHistory.stream()
                .filter(c -> c.username.equals(username))
                .sorted((a, b) -> b.createdAt.compareTo(a.createdAt))
                .map(ChatMessage::toMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userChats);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteChat(@PathVariable Long id, Authentication auth) {
        String username = auth.getName();
        boolean removed = chatHistory.removeIf(c -> c.id.equals(id) && c.username.equals(username));

        if (removed) {
            return ResponseEntity.ok(ApiResponse.success("Chat deleted", null));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/admin/recent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ChatMessage>> getAdminRecentChats() {
        List<ChatMessage> recentChats = chatHistory.stream()
                .sorted((a, b) -> b.createdAt.compareTo(a.createdAt))
                .limit(100)
                .toList();
        return ResponseEntity.ok(recentChats);
    }

    @GetMapping("/admin/user/{username}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ChatMessage>> getAdminChatsForUser(@PathVariable String username) {
        List<ChatMessage> userChats = chatHistory.stream()
                .filter(c -> c.username.equals(username))
                .sorted((a, b) -> b.createdAt.compareTo(a.createdAt))
                .toList();
        return ResponseEntity.ok(userChats);
    }

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

