package com.springboot.ai_verify.entitlement.controller;

import com.springboot.ai_verify.entitlement.service.QuotaService;
import com.springboot.ai_verify.model.User;
import com.springboot.ai_verify.service.UserService;
import com.springboot.ai_verify.workspace.model.Workspace;
import com.springboot.ai_verify.workspace.service.WorkspaceService;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/usage")
public class UsageController {

    private final QuotaService quotaService;
    private final UserService userService;
    private final WorkspaceService workspaceService;

    public UsageController(QuotaService quotaService,
                           UserService userService,
                           WorkspaceService workspaceService) {
        this.quotaService = quotaService;
        this.userService = userService;
        this.workspaceService = workspaceService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getUsage(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        User user = userService.getUserByUsername(auth.getName());
        if (user == null) {
            user = userService.getOrCreateClerkUser(auth.getName(), null);
        }

        Workspace ws = workspaceService.getOrCreateDefaultWorkspace(user);
        Map<String, Object> summary = quotaService.getUsageSummary(ws.getId());

        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(30, TimeUnit.SECONDS).cachePrivate())
                .body(summary);
    }
}
