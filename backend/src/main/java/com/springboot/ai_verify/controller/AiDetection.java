package com.springboot.ai_verify.controller;

import com.springboot.ai_verify.exception.InvalidRequestException;
import com.springboot.ai_verify.service.AiDetectionService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/detect")
public class AiDetection {

    private static final int MIN_TEXT_LENGTH = 10;
    private final AiDetectionService detectionService;

    public AiDetection(AiDetectionService detectionService) {
        this.detectionService = detectionService;
    }

    @PostMapping("/bulk-ai")
    public Mono<ResponseEntity<String>> detectContent(@RequestBody Map<String, String> request) {
        String text = request.get("text");

        if (text == null || text.trim().isEmpty() || text.length() < MIN_TEXT_LENGTH) {
            throw new InvalidRequestException("Text content must be at least " + MIN_TEXT_LENGTH + " characters long");
        }

        return detectionService.detectAiContent(text)
                .map(result -> ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(result));
    }
}
