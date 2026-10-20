package com.springboot.ai_verify.controller;

import com.springboot.ai_verify.entitlement.service.QuotaReservation;
import com.springboot.ai_verify.entitlement.service.QuotaService;
import com.springboot.ai_verify.model.User;
import com.springboot.ai_verify.service.ChatHistoryService;
import com.springboot.ai_verify.service.NvidiaAdvisorService;
import com.springboot.ai_verify.service.NvidiaAdvisorService.ChatRequest;
import com.springboot.ai_verify.service.UserService;
import com.springboot.ai_verify.workspace.model.Workspace;
import com.springboot.ai_verify.workspace.service.WorkspaceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executor;

@RestController
@RequestMapping("/api")
public class AiAdvisor {

    private static final Logger log = LoggerFactory.getLogger(AiAdvisor.class);

    private final NvidiaAdvisorService advisorService;
    private final ChatHistoryService chatHistoryService;
    private final UserService userService;
    private final WorkspaceService workspaceService;
    private final QuotaService quotaService;
    private final Executor taskExecutor;

    public AiAdvisor(NvidiaAdvisorService advisorService,
                     ChatHistoryService chatHistoryService,
                     UserService userService,
                     WorkspaceService workspaceService,
                     QuotaService quotaService,
                     @Qualifier("applicationTaskExecutor") Executor taskExecutor) {
        this.advisorService = advisorService;
        this.chatHistoryService = chatHistoryService;
        this.userService = userService;
        this.workspaceService = workspaceService;
        this.quotaService = quotaService;
        this.taskExecutor = taskExecutor;
    }

    @PostMapping("/chat")
    public Mono<ResponseEntity<Map<String, String>>> chatWithMistral(
            @RequestBody ChatRequest request,
            Authentication auth) {

        User user = null;
        Workspace ws = null;
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            user = userService.getUserByUsername(auth.getName());
            if (user == null) {
                user = userService.getOrCreateClerkUser(auth.getName(), null);
            }
            if (user != null) {
                ws = workspaceService.getOrCreateDefaultWorkspace(user);
                var userRole = workspaceService.getUserRoleInWorkspace(ws.getId(), user.getId());
                if (userRole.isPresent() && userRole.get() == com.springboot.ai_verify.workspace.model.WorkspaceRole.VIEWER) {
                    return Mono.just(ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "Viewers have read-only access and cannot start chat sessions")));
                }
            }
        }

        // Reserve quota before calling AI advisor provider
        final QuotaReservation reservation;
        if (ws != null && user != null) {
            String requestId = UUID.randomUUID().toString();
            reservation = quotaService.reserveQuota(ws.getId(), user.getId(), QuotaService.KIND_ADVISOR_MESSAGES, 1, requestId);
        } else {
            reservation = null;
        }

        final User finalUser = user;
        final Workspace finalWs = ws;

        return advisorService.chatWithNvidia(request)
                .doOnSuccess(response -> {
                    if (reservation != null && response.getStatusCode().is2xxSuccessful()) {
                        try {
                            quotaService.commit(reservation);
                        } catch (Exception e) {
                            log.error("Failed to commit advisor quota reservation: {}", e.getMessage());
                        }
                    }

                    if (finalUser != null && response.getStatusCode().is2xxSuccessful()) {
                        String username = finalUser.getUsername();
                        Map<String, String> body = response.getBody();
                        if (body != null && body.containsKey("text")) {
                            taskExecutor.execute(() -> {
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
                    if (reservation != null) {
                        try {
                            quotaService.rollback(reservation);
                        } catch (Exception e) {
                            log.error("Failed to rollback advisor quota reservation: {}", e.getMessage());
                        }
                    }
                    String username = finalUser != null ? finalUser.getUsername() : "anonymous";
                    log.error("Chat error for user {}: {}", username, error.getMessage());
                });
    }
}
