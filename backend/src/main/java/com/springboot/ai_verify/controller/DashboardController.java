package com.springboot.ai_verify.controller;

import com.springboot.ai_verify.model.ChatHistory;
import com.springboot.ai_verify.model.DetectionHistory;
import com.springboot.ai_verify.service.ChatHistoryService;
import com.springboot.ai_verify.service.DetectionHistoryService;
import com.springboot.ai_verify.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class DashboardController {

    private final UserService userService;
    private final DetectionHistoryService detectionHistoryService;
    private final ChatHistoryService chatHistoryService;

    public DashboardController(UserService userService, DetectionHistoryService detectionHistoryService, ChatHistoryService chatHistoryService) {
        this.userService = userService;
        this.detectionHistoryService = detectionHistoryService;
        this.chatHistoryService = chatHistoryService;
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        Map<String, Object> out = new HashMap<>();
        long totalUsers = userService.getAllUsers().size();
        long totalDetections = detectionHistoryService.getTotalCount();
        long totalChats = chatHistoryService.getTotalCount();

        List<DetectionHistory> recentDetections = detectionHistoryService.getAllHistory();
        List<ChatHistory> recentChats = chatHistoryService.recentForAdmin();

        out.put("totalUsers", totalUsers);
        out.put("totalDetections", totalDetections);
        out.put("totalChats", totalChats);
        out.put("recentDetections", recentDetections);
        out.put("recentChats", recentChats);

        return ResponseEntity.ok(out);
    }
}
