package com.springboot.ai_verify.controller;

import com.springboot.ai_verify.service.AiAdvisorService;
import com.springboot.ai_verify.service.AiAdvisorService.ChatRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class AiAdvisor {

    private final AiAdvisorService aiAdvisorService;

    @Autowired
    private ChatController chatController;

    public AiAdvisor(AiAdvisorService aiAdvisorService) {
        this.aiAdvisorService = aiAdvisorService;
    }

    @PostMapping("/chat")
    public Mono<ResponseEntity<Map<String, String>>> chatWithMistral(
            @RequestBody ChatRequest request,
            Authentication auth) {

        return aiAdvisorService.chatWithMistral(request)
                .doOnSuccess(response -> {
                    // Save chat to history if user is authenticated
                    if (auth != null && response.getStatusCode().is2xxSuccessful()) {
                        String username = auth.getName();
                        Map<String, String> body = response.getBody();
                        if (body != null && body.containsKey("text")) {
                            chatController.logChatExchange(
                                username,
                                request.prompt(),
                                body.get("text")
                            );
                        }
                    }
                });
    }
}

