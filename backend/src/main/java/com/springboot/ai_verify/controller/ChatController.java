package com.springboot.ai_verify.controller;

import com.springboot.ai_verify.dto.ApiResponse;
import com.springboot.ai_verify.exception.InvalidRequestException;
import com.springboot.ai_verify.model.ChatHistory;
import com.springboot.ai_verify.service.ChatHistoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller for managing chat history.
 */
@RestController
@RequestMapping("/api/chats")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final ChatHistoryService chatHistoryService;

    public ChatController(ChatHistoryService chatHistoryService) {
        this.chatHistoryService = chatHistoryService;
    }

    @GetMapping("/recent")
    public ResponseEntity<List<Map<String, Object>>> getRecentChats(Authentication auth) {
        String username = requireAuthenticatedUsername(auth);
        List<Map<String, Object>> chats = chatHistoryService.recentForUser(username).stream()
                .map(this::toMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(chats);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Map<String, Object>>> getAllChats(Authentication auth) {
        String username = requireAuthenticatedUsername(auth);
        List<Map<String, Object>> chats = chatHistoryService.allForUser(username).stream()
                .map(this::toMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(chats);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteChat(@PathVariable Long id, Authentication auth) {
        String username = requireAuthenticatedUsername(auth);
        chatHistoryService.deleteByIdForUser(id, username);
        log.info("User {} deleted chat {}", username, id);
        return ResponseEntity.ok(ApiResponse.success("Chat deleted", null));
    }

    @GetMapping("/admin/recent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAdminRecentChats() {
        List<Map<String, Object>> recentChats = chatHistoryService.recentForAdmin().stream()
                .map(this::toMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(recentChats);
    }

    @GetMapping("/admin/user/{username}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAdminChatsForUser(@PathVariable String username) {
        if (username == null || username.isBlank()) {
            throw new InvalidRequestException("Username is required");
        }

        List<Map<String, Object>> userChats = chatHistoryService.allForUserAsAdmin(username).stream()
                .map(this::toMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userChats);
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteChatAsAdmin(@PathVariable Long id) {
        chatHistoryService.deleteByIdAsAdmin(id);
        return ResponseEntity.ok(ApiResponse.success("Chat deleted", null));
    }

    public void logChatExchange(String username, String message, String response) {
        if (username == null || username.isBlank() || message == null || message.isBlank()) {
            log.warn("Attempted to log chat with null username or message");
            return;
        }
        chatHistoryService.logChatExchange(username, message, response);
    }

    private String requireAuthenticatedUsername(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            throw new InvalidRequestException("Authentication required");
        }
        String username = auth.getName();
        if (username == null || username.isBlank() || "anonymousUser".equalsIgnoreCase(username)) {
            throw new InvalidRequestException("Authentication required");
        }
        return username;
    }

    private Map<String, Object> toMap(ChatHistory chat) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", chat.getId());
        map.put("username", chat.getUsername());
        map.put("message", chat.getMessage());
        map.put("response", chat.getResponse());
        map.put("createdAt", chat.getCreatedAt() != null ? chat.getCreatedAt().toString() : null);
        return map;
    }
}
