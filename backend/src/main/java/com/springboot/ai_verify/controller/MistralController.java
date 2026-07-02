package com.springboot.ai_verify.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/mistral")
public class MistralController {

    @Value("${mistral.api.key:}")
    private String apiKey;

    @Value("${mistral.detection.model:mistral-large-latest}")
    private String detectionModel;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> response = new HashMap<>();
        if (apiKey == null || apiKey.isEmpty()) {
            response.put("status", "CONFIG_MISSING");
            response.put("message", "Mistral API key is not configured");
            return ResponseEntity.ok(response);
        }

        response.put("status", "OK");
        response.put("message", "Mistral API is configured");
        response.put("detectionModel", detectionModel);
        response.put("availableModels", new String[]{
                "mistral-large-latest",
                "mistral-medium-latest",
                "mistral-small-latest",
                "open-mixtral-8x22b"
        });
        return ResponseEntity.ok(response);
    }

    @GetMapping("/models")
    public ResponseEntity<Map<String, Object>> getModels() {
        Map<String, Object> response = new HashMap<>();
        response.put("detectionModel", detectionModel);
        response.put("availableModels", new String[]{
                "mistral-large-latest",
                "mistral-medium-latest",
                "mistral-small-latest",
                "open-mixtral-8x22b"
        });
        return ResponseEntity.ok(response);
    }
}
