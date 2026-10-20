package com.springboot.ai_verify.workspace;

import com.springboot.ai_verify.exception.InvalidRequestException;
import com.springboot.ai_verify.model.ChatHistory;
import com.springboot.ai_verify.model.DetectionHistory;
import com.springboot.ai_verify.model.User;
import com.springboot.ai_verify.repository.ChatHistoryRepository;
import com.springboot.ai_verify.repository.DetectionHistoryRepository;
import com.springboot.ai_verify.repository.UserRepository;
import com.springboot.ai_verify.service.ChatHistoryService;
import com.springboot.ai_verify.service.DetectionHistoryService;
import com.springboot.ai_verify.service.UserService;
import com.springboot.ai_verify.workspace.model.Workspace;
import com.springboot.ai_verify.workspace.service.WorkspaceService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class TenancyAndAuthorizationTest {

    @MockBean
    private JwtDecoder jwtDecoder;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DetectionHistoryService detectionHistoryService;

    @Autowired
    private DetectionHistoryRepository detectionHistoryRepository;

    @Autowired
    private ChatHistoryService chatHistoryService;

    @Autowired
    private ChatHistoryRepository chatHistoryRepository;

    @Test
    @DisplayName("Non-member cannot access workspace resources")
    void testNonMemberCannotAccessWorkspace() {
        User userA = new User();
        userA.setUsername("user_alpha_" + System.currentTimeMillis());
        userA.setPassword("secretPassword123!");
        userA = userService.saveUser(userA);

        User userB = new User();
        userB.setUsername("user_beta_" + System.currentTimeMillis());
        userB.setPassword("secretPassword123!");
        userB = userService.saveUser(userB);

        Workspace wsA = workspaceService.getOrCreateDefaultWorkspace(userA);
        assertNotNull(wsA);

        // User B attempting to access User A's workspace must be denied
        final Long wsAId = wsA.getId();
        final Long userBId = userB.getId();
        assertThrows(AccessDeniedException.class, () -> {
            workspaceService.getWorkspaceForUser(wsAId, userBId);
        });
    }

    @Test
    @DisplayName("User A cannot delete User B's detection history")
    void testUserCannotDeleteAnotherUsersDetectionHistory() {
        String userA = "alice_" + System.currentTimeMillis();
        String userB = "bob_" + System.currentTimeMillis();

        DetectionHistory dh = new DetectionHistory();
        dh.setUsername(userB);
        dh.setContentPreview("Sample text for Bob");
        dh.setResult("{\"probability\": 10}");
        dh.setConfidence(10);
        dh = detectionHistoryService.save(dh);

        final Long dhId = dh.getId();

        // Alice attempting to delete Bob's detection must fail
        InvalidRequestException ex = assertThrows(InvalidRequestException.class, () -> {
            detectionHistoryService.deleteById(dhId, userA);
        });
        assertTrue(ex.getMessage().contains("permission"));

        // Bob can delete his own detection
        assertDoesNotThrow(() -> {
            detectionHistoryService.deleteById(dhId, userB);
        });
    }

    @Test
    @DisplayName("User A cannot delete User B's chat history")
    void testUserCannotDeleteAnotherUsersChatHistory() {
        String userA = "alice_chat_" + System.currentTimeMillis();
        String userB = "bob_chat_" + System.currentTimeMillis();

        ChatHistory chat = chatHistoryService.logChatExchange(userB, "Hello Advisor", "Hello Bob!");
        assertNotNull(chat);

        final Long chatId = chat.getId();

        // Alice attempting to delete Bob's chat must fail
        InvalidRequestException ex = assertThrows(InvalidRequestException.class, () -> {
            chatHistoryService.deleteByIdForUser(chatId, userA);
        });
        assertTrue(ex.getMessage().contains("permission"));

        // Bob can delete his own chat
        assertDoesNotThrow(() -> {
            chatHistoryService.deleteByIdForUser(chatId, userB);
        });
    }

    @Test
    @DisplayName("History retention filter excludes records older than retention days")
    void testHistoryRetentionFilter() {
        String username = "retention_test_user_" + System.currentTimeMillis();

        // Recent record (1 day old)
        DetectionHistory recentRecord = new DetectionHistory();
        recentRecord.setUsername(username);
        recentRecord.setContentPreview("Recent record");
        recentRecord.setResult("{}");
        recentRecord.setCreatedAt(Instant.now().minus(1, ChronoUnit.DAYS));
        detectionHistoryRepository.save(recentRecord);

        // Old record (45 days old)
        DetectionHistory oldRecord = new DetectionHistory();
        oldRecord.setUsername(username);
        oldRecord.setContentPreview("Old record");
        oldRecord.setResult("{}");
        oldRecord.setCreatedAt(Instant.now().minus(45, ChronoUnit.DAYS));
        detectionHistoryRepository.save(oldRecord);

        // Under 30-day retention, only recentRecord should be returned
        List<DetectionHistory> list30 = detectionHistoryService.allForUser(username, 30);
        assertEquals(1, list30.size());
        assertEquals("Recent record", list30.get(0).getContentPreview());

        // Under 60-day retention (e.g. PRO), both records are returned
        List<DetectionHistory> list60 = detectionHistoryService.allForUser(username, 60);
        assertEquals(2, list60.size());
    }
}
