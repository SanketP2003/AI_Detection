package com.springboot.ai_verify.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple in-memory rate limiting filter to prevent brute force attacks.
 *
 * ARCHITECTURAL NOTE: In production, use Redis-based rate limiting for
 * distributed deployments (e.g., spring-boot-starter-data-redis with Bucket4j).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);

    @Value("${security.rate-limit.enabled:true}")
    private boolean enabled;

    @Value("${security.rate-limit.login.max-attempts:5}")
    private int loginMaxAttempts;

    @Value("${security.rate-limit.login.window-seconds:60}")
    private int loginWindowSeconds;

    @Value("${security.rate-limit.api.max-requests:100}")
    private int apiMaxRequests;

    @Value("${security.rate-limit.api.window-seconds:60}")
    private int apiWindowSeconds;

    // Simple in-memory rate limit tracking
    private final Map<String, RateLimitBucket> loginBuckets = new ConcurrentHashMap<>();
    private final Map<String, RateLimitBucket> apiBuckets = new ConcurrentHashMap<>();

    private static class RateLimitBucket {
        final AtomicInteger count = new AtomicInteger(0);
        volatile long windowStart = System.currentTimeMillis();

        synchronized boolean tryConsume(int maxRequests, int windowSeconds) {
            long now = System.currentTimeMillis();
            long windowMs = windowSeconds * 1000L;

            if (now - windowStart > windowMs) {
                // Reset window
                windowStart = now;
                count.set(1);
                return true;
            }

            if (count.incrementAndGet() > maxRequests) {
                return false;
            }
            return true;
        }

        int getRetryAfterSeconds(int windowSeconds) {
            long elapsed = System.currentTimeMillis() - windowStart;
            return Math.max(1, (int) ((windowSeconds * 1000L - elapsed) / 1000));
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        String path = request.getRequestURI();

        // Apply stricter rate limiting to login endpoint
        if ("/login".equals(path) && "POST".equalsIgnoreCase(request.getMethod())) {
            RateLimitBucket bucket = loginBuckets.computeIfAbsent(clientIp, k -> new RateLimitBucket());

            if (!bucket.tryConsume(loginMaxAttempts, loginWindowSeconds)) {
                log.warn("Rate limit exceeded for login from IP: {}", clientIp);
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.setHeader("Retry-After", String.valueOf(bucket.getRetryAfterSeconds(loginWindowSeconds)));
                response.getWriter().write("{\"error\":\"Too many login attempts. Please try again later.\"}");
                return;
            }
        }

        // Apply general rate limiting to API endpoints
        if (path.startsWith("/api/")) {
            RateLimitBucket bucket = apiBuckets.computeIfAbsent(clientIp, k -> new RateLimitBucket());

            if (!bucket.tryConsume(apiMaxRequests, apiWindowSeconds)) {
                log.warn("Rate limit exceeded for API from IP: {}", clientIp);
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.setHeader("Retry-After", String.valueOf(bucket.getRetryAfterSeconds(apiWindowSeconds)));
                response.getWriter().write("{\"error\":\"Too many requests. Please slow down.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);

        // Cleanup old buckets periodically (simple approach - could be improved with scheduled task)
        if (Math.random() < 0.01) { // 1% chance to clean up
            cleanupOldBuckets();
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // Take the first IP if there are multiple
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    private void cleanupOldBuckets() {
        long now = System.currentTimeMillis();
        long maxAge = 300_000L; // 5 minutes

        loginBuckets.entrySet().removeIf(e -> now - e.getValue().windowStart > maxAge);
        apiBuckets.entrySet().removeIf(e -> now - e.getValue().windowStart > maxAge);
    }
}
