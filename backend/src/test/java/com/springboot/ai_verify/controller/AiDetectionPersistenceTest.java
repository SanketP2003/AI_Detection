package com.springboot.ai_verify.controller;

import com.springboot.ai_verify.entitlement.service.QuotaReservation;
import com.springboot.ai_verify.entitlement.service.QuotaService;
import com.springboot.ai_verify.model.User;
import com.springboot.ai_verify.service.DetectionHistoryService;
import com.springboot.ai_verify.service.GeminiDetectionService;
import com.springboot.ai_verify.service.UserService;
import com.springboot.ai_verify.workspace.model.Workspace;
import com.springboot.ai_verify.workspace.service.WorkspaceService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.Executor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AiDetectionPersistenceTest {

    @Test
    @DisplayName("Detection response succeeds even when asynchronous history persistence throws an exception")
    void detectionSucceedsWhenPersistenceFails() {
        GeminiDetectionService mockDetectionService = mock(GeminiDetectionService.class);
        DetectionHistoryService mockHistoryService = mock(DetectionHistoryService.class);
        UserService mockUserService = mock(UserService.class);
        WorkspaceService mockWorkspaceService = mock(WorkspaceService.class);
        QuotaService mockQuotaService = mock(QuotaService.class);
        Executor directExecutor = Runnable::run; // Executes synchronously for reliable testing

        User testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("test_user");

        Workspace testWs = new Workspace("Personal", "test-ws", 1L);
        testWs.setId(10L);

        when(mockUserService.getUserByUsername("test_user")).thenReturn(testUser);
        when(mockWorkspaceService.getOrCreateDefaultWorkspace(testUser)).thenReturn(testWs);
        when(mockQuotaService.reserveQuota(eq(10L), eq(1L), eq(QuotaService.KIND_SCANS), eq(1), anyString()))
                .thenReturn(new QuotaReservation(10L, 1L, QuotaService.KIND_SCANS, 1, "req-1", Instant.now()));

        String validJsonResult = "{\"probability\": 85, \"analysis\": \"Highly likely AI generated\"}";
        when(mockDetectionService.detectAiContent(anyString()))
                .thenReturn(Mono.just(validJsonResult));

        // Simulate database persistence failure
        when(mockHistoryService.save(any()))
                .thenThrow(new RuntimeException("Simulated database connection failure"));

        Authentication mockAuth = mock(Authentication.class);
        when(mockAuth.getName()).thenReturn("test_user");
        when(mockAuth.isAuthenticated()).thenReturn(true);

        AiDetection controller = new AiDetection(
                mockDetectionService,
                mockHistoryService,
                mockUserService,
                mockWorkspaceService,
                mockQuotaService,
                directExecutor
        );

        Map<String, Object> request = Map.of("text", "This is an authentic sample text long enough to satisfy minimum length requirements.");
        ResponseEntity<String> response = controller.detectContent(request, mockAuth).block();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(validJsonResult, response.getBody());

        // Verify persistence was attempted despite throwing exception
        verify(mockHistoryService, times(1)).save(any());
        // Verify quota was committed on success
        verify(mockQuotaService, times(1)).commit(any());
    }
}
