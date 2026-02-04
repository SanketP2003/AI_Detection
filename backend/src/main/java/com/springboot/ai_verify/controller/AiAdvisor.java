package com.springboot.ai_verify.controller;

import com.springboot.ai_verify.service.AiAdvisorService;
import com.springboot.ai_verify.service.AiAdvisorService.ChatRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AiAdvisor {

    private static final Logger log = LoggerFactory.getLogger(AiAdvisor.class);

    private final AiAdvisorService aiAdvisorService;
    private final ChatController chatController;

    // BEST PRACTICE: Use constructor injection for all dependencies
    public AiAdvisor(AiAdvisorService aiAdvisorService, ChatController chatController) {
        this.aiAdvisorService = aiAdvisorService;
        this.chatController = chatController;
    }

    @PostMapping("/chat")
    public Mono<ResponseEntity<Map<String, String>>> chatWithMistral(
            @RequestBody ChatRequest request,
            Authentication auth) {

        return aiAdvisorService.chatWithMistral(request)
                .doOnSuccess(response -> {
                    // Log successful chat exchange
                    if (auth != null && response.getStatusCode().is2xxSuccessful()) {
                        String username = auth.getName();
                        Map<String, String> body = response.getBody();
                        if (body != null && body.containsKey("text")) {
                            chatController.logChatExchange(
                                username,
                                request.prompt(),
                                body.get("text")
                            );
                            log.debug("Chat logged for user: {}", username);
                        }
                    }
                })
                .doOnError(error -> {
                    String username = auth != null ? auth.getName() : "anonymous";
                    log.error("Chat error for user {}: {}", username, error.getMessage());
                });
    }
}
