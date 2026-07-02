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

            setPropertyIfMissing("DB_URL", dotenv.get("DB_URL"));
            setPropertyIfMissing("DB_USER", dotenv.get("DB_USER"));
            setPropertyIfMissing("DB_PASSWORD", dotenv.get("DB_PASSWORD"));
            setPropertyIfMissing("MISTRAL_API_URL", dotenv.get("MISTRAL_API_URL"));
            setPropertyIfMissing("MISTRAL_API_KEY", dotenv.get("MISTRAL_API_KEY"));
            setPropertyIfMissing("MISTRAL_DETECTION_MODEL", dotenv.get("MISTRAL_DETECTION_MODEL"));
            setPropertyIfMissing("NVIDIA_API_KEY", dotenv.get("NVIDIA_API_KEY"));
            setPropertyIfMissing("GEMINI_API_KEY", dotenv.get("GEMINI_API_KEY"));
            setPropertyIfMissing("NVIDIA_API_URL", dotenv.get("NVIDIA_API_URL"));
            setPropertyIfMissing("NVIDIA_DETECTION_MODEL", dotenv.get("NVIDIA_DETECTION_MODEL"));
            setPropertyIfMissing("NVIDIA_ADVISOR_MODEL", dotenv.get("NVIDIA_ADVISOR_MODEL"));
            setPropertyIfMissing("PORT", dotenv.get("PORT"));
            setPropertyIfMissing("GOOGLE_CLIENT_ID", dotenv.get("GOOGLE_CLIENT_ID"));
            setPropertyIfMissing("GOOGLE_CLIENT_SECRET", dotenv.get("GOOGLE_CLIENT_SECRET"));

            // Support both the legacy env var and the Spring-style property key.
            String corsOrigins = dotenv.get("CORS_ALLOWED_ORIGINS");
            setPropertyIfMissing("CORS_ALLOWED_ORIGINS", corsOrigins);
            if (corsOrigins != null && !corsOrigins.isBlank() &&
                    System.getProperty("cors.allowed-origins") == null &&
                    System.getenv("cors.allowed-origins") == null) {
                System.setProperty("cors.allowed-origins", corsOrigins);
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
