package com.springboot.ai_verify.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class OAuth2FailureHandler extends SimpleUrlAuthenticationFailureHandler {

    private final String frontendUrl;

    public OAuth2FailureHandler(
            @Value("${frontend.url:${FRONTEND_URL:}}") String frontendEnvUrl,
            @Value("${cors.allowed-origins:${CORS_ALLOWED_ORIGINS:http://localhost:5173}}") String allowedOrigins
    ) {
        String url = "http://localhost:5173";
        if (frontendEnvUrl != null && !frontendEnvUrl.isBlank()) {
            url = frontendEnvUrl.trim();
        } else if (allowedOrigins != null && !allowedOrigins.isBlank()) {
            String[] origins = allowedOrigins.split(",");
            if (origins.length > 0) {
                url = origins[0].trim();
            }
        }
        this.frontendUrl = url;
    }

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException, ServletException {
        getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/signin?error=oauth");
    }
}
