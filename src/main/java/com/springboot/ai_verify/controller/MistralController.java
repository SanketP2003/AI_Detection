package com.springboot.ai_verify.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/mistral")
public class MistralController {

    @Value("${mistralmodel.api.key:}")
    private String apiKey;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> checkHealth() {
        if (apiKey == null || apiKey.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "status", "CONFIG_MISSING",
                    "message", "Mistral API key is not configured"
            ));
        }

        if (!apiKey.startsWith("sk-") && apiKey.length() < 10) {
            return ResponseEntity.ok(Map.of(
                    "status", "INVALID_FORMAT",
                    "message", "Mistral API key format appears invalid"
            ));
        }

        return ResponseEntity.ok(Map.of(
                "status", "OK",
                "message", "Mistral API is configured"
        ));
    }
}

