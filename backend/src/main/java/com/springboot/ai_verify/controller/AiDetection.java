package com.springboot.ai_verify.controller;

import com.springboot.ai_verify.exception.InvalidRequestException;
import com.springboot.ai_verify.model.DetectionHistory;
import com.springboot.ai_verify.service.NvidiaDetectionService;
import com.springboot.ai_verify.service.DetectionHistoryService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/detect")
public class AiDetection {

    private static final Logger log = LoggerFactory.getLogger(AiDetection.class);
    private static final int MIN_TEXT_LENGTH = 10;
    
    private final NvidiaDetectionService detectionService;
    private final DetectionHistoryService historyService;

    public AiDetection(NvidiaDetectionService detectionService, 
                      DetectionHistoryService historyService) {
        this.detectionService = detectionService;
        this.historyService = historyService;
    }

    @PostMapping("/bulk-ai")
    public Mono<ResponseEntity<String>> detectContent(@RequestBody Map<String, String> request, org.springframework.security.core.Authentication auth) {
        String text = request.get("text");

        if (text == null || text.trim().isEmpty() || text.length() < MIN_TEXT_LENGTH) {
            throw new InvalidRequestException("Text content must be at least " + MIN_TEXT_LENGTH + " characters long");
        }

        return detectionService.detectAiContent(text)
                .flatMap(result -> {
                    // Attempt to persist detection result for the user (if authenticated)
                    try {
                        String username = auth != null ? auth.getName() : null;
                        DetectionHistory dh = new DetectionHistory();
                        dh.setUsername(username == null ? "anonymous" : username);
                        dh.setContentPreview(text.length() > 200 ? text.substring(0, 200) + "..." : text);
                        dh.setResult(result);
                        // Try to extract a numeric probability if present
                        int confidence = 0;
                        try {
                            com.fasterxml.jackson.databind.JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(result);
                            if (root.has("probability")) {
                                confidence = root.get("probability").asInt(0);
                            }
                        } catch (Exception e) {
                            // ignore parse errors; keep confidence=0
                        }
                        dh.setConfidence(confidence);
                        historyService.save(dh);
                    } catch (Exception e) {
                        // logging only - do not fail the request on persistence issues
                        log.warn("Could not persist detection history: {}", e.getMessage());
                    }

                    return Mono.just(ResponseEntity.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(result));
                });
    }
}
