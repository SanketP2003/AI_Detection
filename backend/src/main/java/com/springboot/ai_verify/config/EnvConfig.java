package com.springboot.ai_verify.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Configuration;

import java.nio.file.Files;
import java.nio.file.Path;

@Configuration
public class EnvConfig {

    private static final String[] ENV_SEARCH_DIRS = {".", "./backend", "../backend"};

    static {
        try {
            Dotenv dotenv = loadDotenv();

            setPropertyIfMissing("SPRING_PROFILES_ACTIVE", dotenv.get("SPRING_PROFILES_ACTIVE"));
            setPropertyIfMissing("PORT", dotenv.get("PORT"));
            setPropertyIfMissing("DB_URL", dotenv.get("DB_URL"));
            setPropertyIfMissing("DB_USER", dotenv.get("DB_USER"));
            setPropertyIfMissing("DB_PASSWORD", dotenv.get("DB_PASSWORD"));
            setPropertyIfMissing("OPENROUTER_API_KEY", dotenv.get("OPENROUTER_API_KEY"));
            setPropertyIfMissing("OPENROUTER_API_URL", dotenv.get("OPENROUTER_API_URL"));
            setPropertyIfMissing("OPENROUTER_DETECTION_MODEL", dotenv.get("OPENROUTER_DETECTION_MODEL"));
            setPropertyIfMissing("OPENROUTER_ADVISOR_MODEL", dotenv.get("OPENROUTER_ADVISOR_MODEL"));
            setPropertyIfMissing("CLERK_SECRET_KEY", dotenv.get("CLERK_SECRET_KEY"));
            setPropertyIfMissing("CLERK_ISSUER_URI", dotenv.get("CLERK_ISSUER_URI"));
            setPropertyIfMissing("CLERK_JWK_SET_URI", dotenv.get("CLERK_JWK_SET_URI"));
            setPropertyIfMissing("MISTRAL_API_URL", dotenv.get("MISTRAL_API_URL"));
            setPropertyIfMissing("MISTRAL_API_KEY", dotenv.get("MISTRAL_API_KEY"));
            setPropertyIfMissing("MISTRAL_DETECTION_MODEL", dotenv.get("MISTRAL_DETECTION_MODEL"));
            setPropertyIfMissing("NVIDIA_API_KEY", dotenv.get("NVIDIA_API_KEY"));
            setPropertyIfMissing("GEMINI_API_KEY", dotenv.get("GEMINI_API_KEY"));
            setPropertyIfMissing("NVIDIA_API_URL", dotenv.get("NVIDIA_API_URL"));
            setPropertyIfMissing("NVIDIA_DETECTION_MODEL", dotenv.get("NVIDIA_DETECTION_MODEL"));
            setPropertyIfMissing("NVIDIA_ADVISOR_MODEL", dotenv.get("NVIDIA_ADVISOR_MODEL"));
            setPropertyIfMissing("GOOGLE_CLIENT_ID", dotenv.get("GOOGLE_CLIENT_ID"));
            setPropertyIfMissing("GOOGLE_CLIENT_SECRET", dotenv.get("GOOGLE_CLIENT_SECRET"));
            setPropertyIfMissing("SESSION_COOKIE_SAME_SITE", dotenv.get("SESSION_COOKIE_SAME_SITE"));
            setPropertyIfMissing("SESSION_COOKIE_SECURE", dotenv.get("SESSION_COOKIE_SECURE"));
            setPropertyIfMissing("SECURITY_RATE_LIMIT_ENABLED", dotenv.get("SECURITY_RATE_LIMIT_ENABLED"));
            setPropertyIfMissing("SECURITY_RATE_LIMIT_LOGIN_MAX_ATTEMPTS", dotenv.get("SECURITY_RATE_LIMIT_LOGIN_MAX_ATTEMPTS"));
            setPropertyIfMissing("SECURITY_RATE_LIMIT_LOGIN_WINDOW_SECONDS", dotenv.get("SECURITY_RATE_LIMIT_LOGIN_WINDOW_SECONDS"));
            setPropertyIfMissing("SECURITY_RATE_LIMIT_API_MAX_REQUESTS", dotenv.get("SECURITY_RATE_LIMIT_API_MAX_REQUESTS"));
            setPropertyIfMissing("SECURITY_RATE_LIMIT_API_WINDOW_SECONDS", dotenv.get("SECURITY_RATE_LIMIT_API_WINDOW_SECONDS"));
            setPropertyIfMissing("BILLING_ENABLED", dotenv.get("BILLING_ENABLED"));
            setPropertyIfMissing("BILLING_PROVIDER", dotenv.get("BILLING_PROVIDER"));
            setPropertyIfMissing("STRIPE_SECRET_KEY", dotenv.get("STRIPE_SECRET_KEY"));
            setPropertyIfMissing("STRIPE_WEBHOOK_SECRET", dotenv.get("STRIPE_WEBHOOK_SECRET"));
            setPropertyIfMissing("STRIPE_PRICE_PRO_MONTHLY", dotenv.get("STRIPE_PRICE_PRO_MONTHLY"));
            setPropertyIfMissing("STRIPE_PRICE_PRO_YEARLY", dotenv.get("STRIPE_PRICE_PRO_YEARLY"));
            setPropertyIfMissing("STRIPE_PRICE_TEAM_MONTHLY", dotenv.get("STRIPE_PRICE_TEAM_MONTHLY"));
            setPropertyIfMissing("STRIPE_PORTAL_CONFIGURATION_ID", dotenv.get("STRIPE_PORTAL_CONFIGURATION_ID"));
            setPropertyIfMissing("APP_PUBLIC_URL", dotenv.get("APP_PUBLIC_URL"));
            setPropertyIfMissing("BILLING_TRIAL_DAYS", dotenv.get("BILLING_TRIAL_DAYS"));
            setPropertyIfMissing("BILLING_GRACE_DAYS", dotenv.get("BILLING_GRACE_DAYS"));

            // Support both the legacy env var and the Spring-style property key.
            String corsOrigins = dotenv.get("CORS_ALLOWED_ORIGINS");
            setPropertyIfMissing("CORS_ALLOWED_ORIGINS", corsOrigins);
            if (corsOrigins != null && !corsOrigins.isBlank() &&
                    System.getProperty("cors.allowed-origins") == null &&
                    System.getenv("cors.allowed-origins") == null) {
                System.setProperty("cors.allowed-origins", corsOrigins);
            }

            String trustProxy = dotenv.get("SECURITY_RATE_LIMIT_TRUST_PROXY");
            setPropertyIfMissing("SECURITY_RATE_LIMIT_TRUST_PROXY", trustProxy);
            if (trustProxy != null && !trustProxy.isBlank() &&
                    System.getProperty("security.rate-limit.trust-proxy") == null &&
                    System.getenv("security.rate-limit.trust-proxy") == null) {
                System.setProperty("security.rate-limit.trust-proxy", trustProxy);
            }

        } catch (Exception e) {
            System.out.println("Warning: Could not load .env file: " + e.getMessage());
            // Continue startup even if .env is not found - default values will be used
        }
    }

    private static Dotenv loadDotenv() {
        for (String dir : ENV_SEARCH_DIRS) {
            if (Files.exists(Path.of(dir, ".env"))) {
                return Dotenv.configure()
                        .directory(dir)
                        .ignoreIfMissing()
                        .load();
            }
        }

        // Fall back to current directory with ignoreIfMissing for cloud environments.
        return Dotenv.configure()
                .ignoreIfMissing()
                .load();
    }

    private static void setPropertyIfMissing(String key, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        if (System.getenv(key) == null && System.getProperty(key) == null) {
            System.setProperty(key, value);
        }
    }
}
