package com.springboot.ai_verify.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/nvidia")
public class NvidiaController {

    @Value("${nvidia.api.key:}")
    private String apiKey;

    @Value("${nvidia.detection.model:meta/llama-3.1-70b-instruct}")
    private String detectionModel;

    @Value("${nvidia.advisor.model:meta/llama-3.1-70b-instruct}")
    private String advisorModel;

    @PreAuthorize("permitAll()")
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> response = new java.util.HashMap<>();
        
        if (apiKey == null || apiKey.isEmpty()) {
            response.put("status", "CONFIG_MISSING");
            response.put("message", "NVIDIA API key is not configured");
            return ResponseEntity.ok(response);
        }

        if (!apiKey.startsWith("nvapi-")) {
            response.put("status", "INVALID_FORMAT");
            response.put("message", "NVIDIA API key format appears invalid (should start with 'nvapi-')");
            return ResponseEntity.ok(response);
        }

        response.put("status", "OK");
        response.put("message", "NVIDIA API is configured");
        response.put("detectionModel", detectionModel);
        response.put("advisorModel", advisorModel);
        response.put("fallbackModels", new String[]{
                "meta/llama-3.1-70b-instruct",
                "nvidia/llama-3.1-nemotron-70b-instruct",
                "mistralai/mixtral-8x22b-instruct-v0.1"
        });
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("permitAll()")
    @GetMapping("/models")
    public ResponseEntity<Map<String, Object>> getModels() {
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("detectionModel", detectionModel);
        response.put("advisorModel", advisorModel);
        response.put("availableModels", new String[]{
                "meta/llama-3-70b-instruct",
                "meta/llama-3.1-70b-instruct",
                "nvidia/llama-3.1-nemotron-70b-instruct",
                "mistralai/mixtral-8x22b-instruct-v0.1",
                "mistralai/mistral-large"
        });
        return ResponseEntity.ok(response);
    }
}
