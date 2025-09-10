package com.springboot.ai_verify.controller;

import com.springboot.ai_verify.model.DetectionHistory;
import com.springboot.ai_verify.service.DetectionHistoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/detections")
public class DetectionHistoryController {

    private final DetectionHistoryService service;

    public DetectionHistoryController(DetectionHistoryService service) {
        this.service = service;
    }

    @PostMapping
    public Map<String, Object> save(@RequestBody Map<String, Object> payload, Authentication auth) {
        if (auth == null) {
            throw new RuntimeException("Unauthorized");
        }
        String username = auth.getName();
        String contentPreview = String.valueOf(payload.getOrDefault("contentPreview", ""));
        String result = String.valueOf(payload.getOrDefault("result", ""));
        int confidence = Integer.parseInt(String.valueOf(payload.getOrDefault("confidence", 0)));

        DetectionHistory dh = new DetectionHistory();
        dh.setUsername(username);
        dh.setContentPreview(contentPreview);
        dh.setResult(result);
        dh.setConfidence(confidence);
        dh.setCreatedAt(Instant.now());
        DetectionHistory saved = service.save(dh);
        return Map.of("id", saved.getId());
    }

    @GetMapping("/recent")
    public List<DetectionHistory> recent(Authentication auth) {
        if (auth == null) {
            throw new RuntimeException("Unauthorized");
        }
        return service.recentForUser(auth.getName());
    }

    @GetMapping("/all")
    public List<DetectionHistory> all(Authentication auth) {
        if (auth == null) {
            throw new RuntimeException("Unauthorized");
        }
        return service.allForUser(auth.getName());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id, Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized access"));
        }
        String username = auth.getName();
        try {
            service.deleteById(id, username);
            return ResponseEntity.ok(Map.of("message", "Detection history entry deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "History entry not found or you lack permission to delete it"));
        }
    }
}
