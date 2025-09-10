package com.springboot.ai_verify.controller;

import com.springboot.ai_verify.service.AiAdvisorService;
import com.springboot.ai_verify.service.AiAdvisorService.ChatRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class AiAdvisor {

    private final AiAdvisorService aiAdvisorService;

    public AiAdvisor(AiAdvisorService aiAdvisorService) {
        this.aiAdvisorService = aiAdvisorService;
    }

    @PostMapping("/chat")
    public Mono<ResponseEntity<Map<String, String>>> chatWithMistral(@RequestBody ChatRequest request) {
        return aiAdvisorService.chatWithMistral(request);
    }
}