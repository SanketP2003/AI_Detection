package com.springboot.ai_verify.controller;

import com.springboot.ai_verify.dto.ApiResponse;
import com.springboot.ai_verify.entitlement.dto.PlanDefinition;
import com.springboot.ai_verify.entitlement.service.EntitlementService;
import com.springboot.ai_verify.entitlement.service.QuotaService;
import com.springboot.ai_verify.exception.InvalidRequestException;
import com.springboot.ai_verify.model.DetectionHistory;
import com.springboot.ai_verify.model.User;
import com.springboot.ai_verify.service.DetectionHistoryService;
import com.springboot.ai_verify.service.UserService;
import com.springboot.ai_verify.workspace.model.Workspace;
import com.springboot.ai_verify.workspace.service.WorkspaceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/detections")
public class DetectionHistoryController {

    private static final Logger log = LoggerFactory.getLogger(DetectionHistoryController.class);
    private static final int MAX_PREVIEW_LENGTH = 255;

    private final DetectionHistoryService service;
    private final UserService userService;
    private final WorkspaceService workspaceService;
    private final EntitlementService entitlementService;
    private final QuotaService quotaService;

    public DetectionHistoryController(DetectionHistoryService service,
                                      UserService userService,
                                      WorkspaceService workspaceService,
                                      EntitlementService entitlementService,
                                      QuotaService quotaService) {
        this.service = service;
        this.userService = userService;
        this.workspaceService = workspaceService;
        this.entitlementService = entitlementService;
        this.quotaService = quotaService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> save(@RequestBody Map<String, Object> payload, Authentication auth) {
        String username = requireAuthenticatedUsername(auth);
        String contentPreview = truncate(String.valueOf(payload.getOrDefault("contentPreview", "")), MAX_PREVIEW_LENGTH);
        String result = String.valueOf(payload.getOrDefault("result", ""));

        if (result.isBlank()) {
            throw new InvalidRequestException("Result is required");
        }

        int confidence;
        try {
            confidence = Integer.parseInt(String.valueOf(payload.getOrDefault("confidence", 0)));
            if (confidence < 0 || confidence > 100) {
                throw new InvalidRequestException("Confidence must be between 0 and 100");
            }
        } catch (NumberFormatException e) {
            throw new InvalidRequestException("Invalid confidence value");
        }

        User user = userService.getUserByUsername(username);
        Workspace ws = user != null ? workspaceService.getOrCreateDefaultWorkspace(user) : null;

        DetectionHistory dh = new DetectionHistory();
        dh.setUsername(username);
        if (ws != null) {
            dh.setWorkspaceId(ws.getId());
        }
        if (user != null) {
            dh.setUserId(user.getId());
        }
        dh.setContentPreview(contentPreview);
        dh.setResult(result);
        dh.setConfidence(confidence);
        dh.setCreatedAt(Instant.now());

        DetectionHistory saved = service.save(dh);
        log.debug("Detection history saved for user {} with id {}", username, saved.getId());

        return ResponseEntity.ok(Map.of("id", saved.getId()));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<DetectionHistory>> recent(Authentication auth) {
        String username = requireAuthenticatedUsername(auth);
        int retentionDays = resolveRetentionDays(username);
        return ResponseEntity.ok(service.recentForUser(username, retentionDays));
    }

    @GetMapping("/all")
    public ResponseEntity<List<DetectionHistory>> all(Authentication auth) {
        String username = requireAuthenticatedUsername(auth);
        int retentionDays = resolveRetentionDays(username);
        return ResponseEntity.ok(service.allForUser(username, retentionDays));
    }

    @GetMapping("/export")
    public ResponseEntity<String> exportDetections(
            @RequestParam(defaultValue = "csv") String format,
            Authentication auth) {
        String username = requireAuthenticatedUsername(auth);
        User user = userService.getUserByUsername(username);
        if (user == null) {
            user = userService.getOrCreateClerkUser(username, null);
        }
        Workspace ws = workspaceService.getOrCreateDefaultWorkspace(user);

        // Enforce export entitlement check (PRO and TEAM only)
        quotaService.validateCanExport(ws.getId());

        int retentionDays = resolveRetentionDays(username);
        List<DetectionHistory> list = service.allForUser(username, retentionDays);

        StringBuilder csv = new StringBuilder();
        csv.append("id,username,contentPreview,confidence,createdAt\n");
        for (DetectionHistory item : list) {
            csv.append(item.getId()).append(",")
               .append(escapeCsv(item.getUsername())).append(",")
               .append(escapeCsv(item.getContentPreview())).append(",")
               .append(item.getConfidence()).append(",")
               .append(item.getCreatedAt()).append("\n");
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"ai-verify-detections.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv.toString());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id, Authentication auth) {
        service.deleteById(id, requireAuthenticatedUsername(auth));
        return ResponseEntity.ok(ApiResponse.success("Detection history entry deleted successfully", null));
    }

    private int resolveRetentionDays(String username) {
        try {
            User user = userService.getUserByUsername(username);
            if (user != null) {
                Workspace ws = workspaceService.getOrCreateDefaultWorkspace(user);
                PlanDefinition plan = entitlementService.getEffectivePlan(ws.getId());
                return plan.getHistoryRetentionDays();
            }
        } catch (Exception ignored) {}
        return 30; // default FREE retention
    }

    private String escapeCsv(String value) {
        if (value == null) return "\"\"";
        return "\"" + value.replace("\"", "\"\"").replace("\n", " ").replace("\r", " ") + "\"";
    }

    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength - 3) + "...";
    }

    private String requireAuthenticatedUsername(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            throw new org.springframework.security.authentication.InsufficientAuthenticationException("Authentication required");
        }
        String username = auth.getName();
        if (username == null || username.isBlank() || "anonymousUser".equalsIgnoreCase(username)) {
            throw new org.springframework.security.authentication.InsufficientAuthenticationException("Authentication required");
        }
        return username;
    }
}
