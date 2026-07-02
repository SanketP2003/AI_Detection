package com.springboot.ai_verify.controller;

import com.springboot.ai_verify.service.NvidiaAdvisorService;
import com.springboot.ai_verify.service.NvidiaAdvisorService.ChatRequest;
import com.springboot.ai_verify.service.ChatHistoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api")
public class AiAdvisor {

    private static final Logger log = LoggerFactory.getLogger(AiAdvisor.class);

    private final NvidiaAdvisorService advisorService;
    private final ChatHistoryService chatHistoryService;

    // BEST PRACTICE: Use constructor injection for all dependencies
    public AiAdvisor(NvidiaAdvisorService advisorService,
                    ChatHistoryService chatHistoryService) {
        this.advisorService = advisorService;
        this.chatHistoryService = chatHistoryService;
    }

    @PostMapping("/chat")
    public Mono<ResponseEntity<Map<String, String>>> chatWithMistral(
            @RequestBody ChatRequest request,
            Authentication auth) {

        return advisorService.chatWithNvidia(request)
                .doOnSuccess(response -> {
                    // Log successful chat exchange
                    if (auth != null && response.getStatusCode().is2xxSuccessful()) {
                        String username = auth.getName();
                        Map<String, String> body = response.getBody();
                        if (body != null && body.containsKey("text")) {
                            CompletableFuture.runAsync(() -> {
                                try {
                                    chatHistoryService.logChatExchange(
                                        username,
                                        request.prompt(),
                                        body.get("text")
                                    );
                                    log.debug("Chat logged for user: {}", username);
                                } catch (Exception e) {
                                    log.error("Failed to log chat history to database asynchronously: {}", e.getMessage());
                                }
                            });
                        }
                    }
                })
                .doOnError(error -> {
                    String username = auth != null ? auth.getName() : "anonymous";
                    log.error("Chat error for user {}: {}", username, error.getMessage());
                });
    }
}
