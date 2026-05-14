package com.springboot.ai_verify.controller;

import com.springboot.ai_verify.dto.ApiResponse;
import com.springboot.ai_verify.exception.InvalidRequestException;
import com.springboot.ai_verify.model.DetectionHistory;
import com.springboot.ai_verify.service.DetectionHistoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/detections")
public class DetectionHistoryController {

    private static final Logger log = LoggerFactory.getLogger(DetectionHistoryController.class);
    private static final int MAX_PREVIEW_LENGTH = 255;

    private final DetectionHistoryService service;

    public DetectionHistoryController(DetectionHistoryService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> save(@RequestBody Map<String, Object> payload, Authentication auth) {
        String username = requireAuthenticatedUsername(auth);
        String contentPreview = truncate(String.valueOf(payload.getOrDefault("contentPreview", "")), MAX_PREVIEW_LENGTH);
        String result = String.valueOf(payload.getOrDefault("result", ""));

        if (result.isBlank()) {
            throw new InvalidRequestException("Result is required");
        }

        int confidence;
        try {
            confidence = Integer.parseInt(String.valueOf(payload.getOrDefault("confidence", 0)));
            if (confidence < 0 || confidence > 100) {
                throw new InvalidRequestException("Confidence must be between 0 and 100");
            }
        } catch (NumberFormatException e) {
            throw new InvalidRequestException("Invalid confidence value");
        }

        DetectionHistory dh = new DetectionHistory();
        dh.setUsername(username);
        dh.setContentPreview(contentPreview);
        dh.setResult(result);
        dh.setConfidence(confidence);
        dh.setCreatedAt(Instant.now());

        DetectionHistory saved = service.save(dh);
        log.debug("Detection history saved for user {} with id {}", username, saved.getId());

        return ResponseEntity.ok(Map.of("id", saved.getId()));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<DetectionHistory>> recent(Authentication auth) {
        return ResponseEntity.ok(service.recentForUser(requireAuthenticatedUsername(auth)));
    }

    @GetMapping("/all")
    public ResponseEntity<List<DetectionHistory>> all(Authentication auth) {
        return ResponseEntity.ok(service.allForUser(requireAuthenticatedUsername(auth)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id, Authentication auth) {
        service.deleteById(id, requireAuthenticatedUsername(auth));
        return ResponseEntity.ok(ApiResponse.success("Detection history entry deleted successfully", null));
    }

    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength - 3) + "...";
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
}
