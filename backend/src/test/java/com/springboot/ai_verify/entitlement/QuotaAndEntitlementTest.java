package com.springboot.ai_verify.entitlement;

import com.springboot.ai_verify.billing.model.Subscription;
import com.springboot.ai_verify.billing.model.SubscriptionStatus;
import com.springboot.ai_verify.billing.repository.SubscriptionRepository;
import com.springboot.ai_verify.entitlement.config.PlanProperties;
import com.springboot.ai_verify.entitlement.dto.PlanDefinition;
import com.springboot.ai_verify.entitlement.exception.EntitlementException;
import com.springboot.ai_verify.entitlement.repository.UsageCounterRepository;
import com.springboot.ai_verify.entitlement.repository.UsageEventRepository;
import com.springboot.ai_verify.entitlement.service.EntitlementService;
import com.springboot.ai_verify.entitlement.service.PlanCatalog;
import com.springboot.ai_verify.entitlement.service.QuotaReservation;
import com.springboot.ai_verify.entitlement.service.QuotaService;
import com.springboot.ai_verify.workspace.service.WorkspaceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class QuotaAndEntitlementTest {

    @MockBean
    private JwtDecoder jwtDecoder;

    @Autowired
    private QuotaService quotaService;

    @Autowired
    private EntitlementService entitlementService;

    @Autowired
    private PlanCatalog planCatalog;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private UsageCounterRepository usageCounterRepository;

    @Autowired
    private UsageEventRepository usageEventRepository;

    @Test
    @DisplayName("PlanCatalog initializes standard FREE, PRO, TEAM defaults matching Section 3")
    void testPlanCatalogDefaults() {
        PlanDefinition free = planCatalog.getPlan("FREE");
        assertNotNull(free);
        assertEquals(20, free.getMonthlyScans());
        assertEquals(5000, free.getMaxCharsPerAnalysis());
        assertEquals(10, free.getMonthlyAdvisorMessages());
        assertEquals(30, free.getHistoryRetentionDays());
        assertFalse(free.isExportEnabled());

        PlanDefinition pro = planCatalog.getPlan("PRO");
        assertNotNull(pro);
        assertEquals(1000, pro.getMonthlyScans());
        assertEquals(50000, pro.getMaxCharsPerAnalysis());
        assertEquals(300, pro.getMonthlyAdvisorMessages());
        assertTrue(pro.isExportEnabled());
    }

    @Test
    @DisplayName("FREE user is blocked at 20 analyses with 402 QUOTA_EXCEEDED")
    void testFreeUserBlockedAtLimit() {
        Long workspaceId = 99101L;
        Long userId = 99101L;

        // Exhaust 20 scans
        for (int i = 1; i <= 20; i++) {
            QuotaReservation res = quotaService.reserveQuota(workspaceId, userId, QuotaService.KIND_SCANS, 1, "req-" + i);
            assertNotNull(res);
            quotaService.commit(res);
        }

        // 21st scan must fail with QUOTA_EXCEEDED and status 402
        EntitlementException ex = assertThrows(EntitlementException.class, () -> {
            quotaService.reserveQuota(workspaceId, userId, QuotaService.KIND_SCANS, 1, "req-21");
        });

        assertEquals(402, ex.getStatus().value());
        assertEquals("QUOTA_EXCEEDED", ex.getCode());
        assertEquals("scans", ex.getDetails().get("entitlement"));
        assertEquals(20, ex.getDetails().get("limit"));
    }

    @Test
    @DisplayName("Rolled back quota reservation frees up quota")
    void testQuotaRollback() {
        Long workspaceId = 99201L;
        Long userId = 99201L;

        // Reserve 20 scans, rollback the 20th
        List<QuotaReservation> reservations = new ArrayList<>();
        for (int i = 1; i <= 19; i++) {
            QuotaReservation res = quotaService.reserveQuota(workspaceId, userId, QuotaService.KIND_SCANS, 1, "req-" + i);
            quotaService.commit(res);
        }

        QuotaReservation res20 = quotaService.reserveQuota(workspaceId, userId, QuotaService.KIND_SCANS, 1, "req-20");
        // Rollback 20th
        quotaService.rollback(res20);

        // Subsequent reservation must succeed because rollback freed the slot
        QuotaReservation resRetry = quotaService.reserveQuota(workspaceId, userId, QuotaService.KIND_SCANS, 1, "req-retry");
        assertNotNull(resRetry);
        quotaService.commit(resRetry);
    }

    @Test
    @DisplayName("Character limit validation throws 402 PLAN_REQUIRED when exceeded")
    void testCharacterLimitValidation() {
        Long workspaceId = 99301L;
        // FREE plan max is 5000
        assertDoesNotThrow(() -> quotaService.validateCharacterLimit(workspaceId, 4999));
        assertDoesNotThrow(() -> quotaService.validateCharacterLimit(workspaceId, 5000));

        EntitlementException ex = assertThrows(EntitlementException.class, () -> {
            quotaService.validateCharacterLimit(workspaceId, 5001);
        });

        assertEquals(402, ex.getStatus().value());
        assertEquals("PLAN_REQUIRED", ex.getCode());
    }

    @Test
    @DisplayName("Export validation allows PRO but blocks FREE with 402 FEATURE_NOT_IN_PLAN")
    void testExportValidation() {
        Long freeWsId = 99401L;
        EntitlementException ex = assertThrows(EntitlementException.class, () -> {
            quotaService.validateCanExport(freeWsId);
        });
        assertEquals(402, ex.getStatus().value());
        assertEquals("FEATURE_NOT_IN_PLAN", ex.getCode());

        // PRO workspace
        Long proWsId = 99402L;
        Subscription proSub = new Subscription(proWsId, "PRO");
        proSub.setStatus(SubscriptionStatus.ACTIVE);
        subscriptionRepository.save(proSub);

        assertDoesNotThrow(() -> quotaService.validateCanExport(proWsId));
    }

    @Test
    @DisplayName("Concurrent reservations cannot overspend against limit (atomic race prevention)")
    void testConcurrentQuotaReservationsCannotOverspend() throws Exception {
        Long workspaceId = 99501L;
        Long userId = 99501L;
        int threadCount = 30; // 30 threads attempting against 20 limit

        // Pre-initialize counter row so concurrency tests the atomic reservation boundary
        usageCounterRepository.saveAndFlush(new com.springboot.ai_verify.entitlement.model.UsageCounter(
                workspaceId, quotaService.getCurrentPeriodStart(), QuotaService.KIND_SCANS, 0, 20
        ));

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger quotaExceededCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            final int idx = i;
            executor.submit(() -> {
                try {
                    startLatch.await(); // Synchronize all threads to start concurrently
                    QuotaReservation res = quotaService.reserveQuota(workspaceId, userId, QuotaService.KIND_SCANS, 1, "req-conc-" + idx);
                    successCount.incrementAndGet();
                    quotaService.commit(res);
                } catch (EntitlementException ee) {
                    if ("QUOTA_EXCEEDED".equals(ee.getCode())) {
                        quotaExceededCount.incrementAndGet();
                    }
                } catch (Exception ignored) {
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown(); // Fire all threads simultaneously
        assertTrue(doneLatch.await(10, TimeUnit.SECONDS));
        executor.shutdown();

        // Exactly 20 must have succeeded, and exactly 10 must have failed with QUOTA_EXCEEDED
        assertEquals(20, successCount.get(), "Exactly 20 concurrent requests must be granted");
        assertEquals(10, quotaExceededCount.get(), "Exactly 10 excess requests must be rejected with QUOTA_EXCEEDED");
    }
}
