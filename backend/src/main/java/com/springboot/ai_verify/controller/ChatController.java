package com.springboot.ai_verify.controller;

import com.springboot.ai_verify.dto.ApiResponse;
import com.springboot.ai_verify.exception.InvalidRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Controller for managing chat history.
 *
 * ARCHITECTURAL NOTE: In production, this should be backed by a database or Redis
 * for persistence and horizontal scalability. The current in-memory implementation
 * is suitable for single-instance deployments only.
 */
@RestController
@RequestMapping("/api/chats")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    // SECURITY/PERFORMANCE FIX: Limit max history to prevent memory exhaustion
    private static final int MAX_HISTORY_SIZE = 10000;
    private static final int MAX_USER_HISTORY = 100;

    // THREAD-SAFETY FIX: Use concurrent data structures
    private final ConcurrentLinkedDeque<ChatMessage> chatHistory = new ConcurrentLinkedDeque<>();
    private final AtomicLong nextId = new AtomicLong(1L);

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
            map.put("createdAt", createdAt != null ? createdAt.toString() : null);
            return map;
        }
    }

    @GetMapping("/recent")
    public ResponseEntity<List<Map<String, Object>>> getRecentChats(Authentication auth) {
        if (auth == null) {
            throw new InvalidRequestException("Authentication required");
        }

        String username = auth.getName();
        List<Map<String, Object>> userChats = chatHistory.stream()
                .filter(c -> username.equals(c.username))
                .sorted((a, b) -> b.createdAt.compareTo(a.createdAt))
                .limit(20)
                .map(ChatMessage::toMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userChats);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Map<String, Object>>> getAllChats(Authentication auth) {
        if (auth == null) {
            throw new InvalidRequestException("Authentication required");
        }

        String username = auth.getName();
        List<Map<String, Object>> userChats = chatHistory.stream()
                .filter(c -> username.equals(c.username))
                .sorted((a, b) -> b.createdAt.compareTo(a.createdAt))
                .limit(MAX_USER_HISTORY)
                .map(ChatMessage::toMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userChats);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteChat(@PathVariable Long id, Authentication auth) {
        if (auth == null) {
            throw new InvalidRequestException("Authentication required");
        }

        String username = auth.getName();
        // SECURITY FIX: Verify ownership before deletion
        boolean removed = chatHistory.removeIf(c -> c.id.equals(id) && username.equals(c.username));

        if (removed) {
            log.info("User {} deleted chat {}", username, id);
            return ResponseEntity.ok(ApiResponse.success("Chat deleted", null));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/admin/recent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAdminRecentChats() {
        List<Map<String, Object>> recentChats = chatHistory.stream()
                .sorted((a, b) -> b.createdAt.compareTo(a.createdAt))
                .limit(100)
                .map(ChatMessage::toMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(recentChats);
    }

    @GetMapping("/admin/user/{username}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAdminChatsForUser(@PathVariable String username) {
        if (username == null || username.isBlank()) {
            throw new InvalidRequestException("Username is required");
        }

        List<Map<String, Object>> userChats = chatHistory.stream()
                .filter(c -> username.equals(c.username))
                .sorted((a, b) -> b.createdAt.compareTo(a.createdAt))
                .map(ChatMessage::toMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userChats);
    }

    /**
     * Logs a chat exchange to the in-memory history.
     * This method is thread-safe.
     */
    public void logChatExchange(String username, String message, String response) {
        if (username == null || message == null) {
            log.warn("Attempted to log chat with null username or message");
            return;
        }

        ChatMessage chat = new ChatMessage();
        chat.id = nextId.getAndIncrement(); // THREAD-SAFETY FIX: Atomic ID generation
        chat.username = username;
        chat.message = truncateIfNeeded(message, 1000);
        chat.response = truncateIfNeeded(response, 2000);
        chat.createdAt = Instant.now();

        chatHistory.addFirst(chat);

        // MEMORY LEAK FIX: Evict old entries when limit exceeded
        while (chatHistory.size() > MAX_HISTORY_SIZE) {
            ChatMessage removed = chatHistory.pollLast();
            if (removed != null) {
                log.debug("Evicted old chat entry {} to maintain size limit", removed.id);
            }
        }
    }

    /**
     * Truncates a string if it exceeds the maximum length.
     */
    private String truncateIfNeeded(String text, int maxLength) {
        if (text == null) {
            return null;
        }
        if (text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + "...";
    }
}
