package com.springboot.ai_verify.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springdoc.core.models.GroupedOpenApi;

@OpenAPIDefinition(
        info = @Info(
                title = "AI Verify API",
                version = "1.0.0",
                description = "Comprehensive API documentation for AI content verification platform. " +
                        "This API provides endpoints for user authentication, AI content detection, " +
                        "chat interactions, and detection history management.",
                contact = @Contact(
                        name = "AI Verify Support Team",
                        email = "support@aiverify.com",
                        url = "https://aiverify.com"
                ),
                license = @License(
                        name = "Apache 2.0",
                        url = "https://www.apache.org/licenses/LICENSE-2.0.html"
                )
        ),
        servers = {
                @Server(
                        url = "http://localhost:8080",
                        description = "Local Development Server"
                ),
                @Server(
                        url = "https://api.aiverify.com",
                        description = "Production Server"
                )
        }
)
@SecurityScheme(
        name = "bearerAuth",
        description = "JWT Bearer Authentication via Authorization header. " +
                "Include 'Bearer <token>' in the Authorization header.",
        scheme = "bearer",
        type = io.swagger.v3.oas.annotations.enums.SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        in = SecuritySchemeIn.HEADER
)
@Configuration
public class OpenApiConfig {

    @Bean
    public GroupedOpenApi publicApi() {
        return GroupedOpenApi.builder()
                .group("public")
                .pathsToMatch("/api/**")
                .build();
    }
}
