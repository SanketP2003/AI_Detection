package com.springboot.ai_verify.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.springboot.ai_verify.entitlement.service.QuotaReservation;
import com.springboot.ai_verify.entitlement.service.QuotaService;
import com.springboot.ai_verify.exception.InvalidRequestException;
import com.springboot.ai_verify.model.DetectionHistory;
import com.springboot.ai_verify.model.User;
import com.springboot.ai_verify.service.DetectionHistoryService;
import com.springboot.ai_verify.service.GeminiDetectionService;
import com.springboot.ai_verify.service.UserService;
import com.springboot.ai_verify.workspace.model.Workspace;
import com.springboot.ai_verify.workspace.service.WorkspaceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executor;

@RestController
@RequestMapping("/api/detect")
public class AiDetection {

    private static final Logger log = LoggerFactory.getLogger(AiDetection.class);
    private static final int MIN_TEXT_LENGTH = 10;
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private final GeminiDetectionService detectionService;
    private final DetectionHistoryService historyService;
    private final UserService userService;
    private final WorkspaceService workspaceService;
    private final QuotaService quotaService;
    private final Executor taskExecutor;

    public AiDetection(GeminiDetectionService detectionService,
                       DetectionHistoryService historyService,
                       UserService userService,
                       WorkspaceService workspaceService,
                       QuotaService quotaService,
                       @Qualifier("applicationTaskExecutor") Executor taskExecutor) {
        this.detectionService = detectionService;
        this.historyService = historyService;
        this.userService = userService;
        this.workspaceService = workspaceService;
        this.quotaService = quotaService;
        this.taskExecutor = taskExecutor;
    }

    @PostMapping("/bulk-ai")
    public Mono<ResponseEntity<String>> detectContent(@RequestBody Map<String, Object> request, Authentication auth) {
        Object textObj = request.get("text");
        String text = textObj != null ? String.valueOf(textObj) : null;

        if (text == null || text.trim().isEmpty() || text.length() < MIN_TEXT_LENGTH) {
            throw new InvalidRequestException("Text content must be at least " + MIN_TEXT_LENGTH + " characters long");
        }

        // Resolve authenticated user and workspace
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
                            .contentType(MediaType.APPLICATION_JSON)
                            .body("{\"error\":\"Viewers have read-only access and cannot run new detections\"}"));
                }
            }
        }

        // Server-side checks: upload size (if file metadata sent) and character limit
        if (ws != null) {
            if (request.containsKey("fileSizeBytes")) {
                try {
                    long size = Long.parseLong(String.valueOf(request.get("fileSizeBytes")));
                    quotaService.validateUploadSize(ws.getId(), size);
                } catch (NumberFormatException ignored) {}
            }
            quotaService.validateCharacterLimit(ws.getId(), text.length());
        }

        // Pre-call quota reservation
        final QuotaReservation reservation;
        if (ws != null && user != null) {
            String requestId = UUID.randomUUID().toString();
            reservation = quotaService.reserveQuota(ws.getId(), user.getId(), QuotaService.KIND_SCANS, 1, requestId);
        } else {
            reservation = null;
        }

        final User finalUser = user;
        final Workspace finalWs = ws;

        return detectionService.detectAiContent(text)
                .flatMap(result -> {
                    // Successful analysis: commit quota reservation
                    if (reservation != null) {
                        try {
                            quotaService.commit(reservation);
                        } catch (Exception e) {
                            log.error("Failed to commit quota reservation: {}", e.getMessage());
                        }
                    }

                    // Attempt to persist detection result for the user asynchronously
                    taskExecutor.execute(() -> {
                        try {
                            DetectionHistory dh = new DetectionHistory();
                            dh.setUsername(finalUser != null ? finalUser.getUsername() : "anonymous");
                            if (finalWs != null) {
                                dh.setWorkspaceId(finalWs.getId());
                            }
                            if (finalUser != null) {
                                dh.setUserId(finalUser.getId());
                            }
                            dh.setContentPreview(text.length() > 200 ? text.substring(0, 200) + "..." : text);
                            dh.setResult(result);

                            int confidence = 0;
                            try {
                                JsonNode root = objectMapper.readTree(result);
                                if (root.has("probability")) {
                                    confidence = root.get("probability").asInt(0);
                                }
                            } catch (Exception ignored) {}
                            dh.setConfidence(confidence);

                            historyService.save(dh);
                        } catch (Exception e) {
                            log.warn("Could not persist detection history asynchronously: {}", e.getMessage());
                        }
                    });

                    return Mono.just(ResponseEntity.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(result));
                })
                .doOnError(error -> {
                    // Failed provider call: rollback quota reservation so failed calls consume NO quota
                    if (reservation != null) {
                        try {
                            quotaService.rollback(reservation);
                        } catch (Exception e) {
                            log.error("Failed to rollback quota reservation: {}", e.getMessage());
                        }
                    }
                });
    }
}
