package com.springboot.ai_verify.controller;

import com.springboot.ai_verify.service.AiDetectionService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/detect")
public class AiDetection {

    private final AiDetectionService aiDetectionService;

    public AiDetection(AiDetectionService aiDetectionService) {
        this.aiDetectionService = aiDetectionService;
    }

    @PostMapping("/bulk-ai")
    public Mono<ResponseEntity<String>> detectContent(@RequestBody Map<String, String> request) {
        String textToAnalyze = request.get("text");

        if (textToAnalyze == null || textToAnalyze.trim().isEmpty() || textToAnalyze.length() < 10) {
            String errorJson = "{\"error\": \"Text content must be at least 10 characters long\"}";
            return Mono.just(ResponseEntity.badRequest().contentType(MediaType.APPLICATION_JSON).body(errorJson));
        }

        // The service already returns a Mono<String> containing the JSON body.
        // We just need to map it into the ResponseEntity.
        return aiDetectionService.detectAiContent(textToAnalyze)
                .map(jsonBody -> ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(jsonBody));
    }
}
