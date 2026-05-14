package com.springboot.ai_verify.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
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
        )
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
