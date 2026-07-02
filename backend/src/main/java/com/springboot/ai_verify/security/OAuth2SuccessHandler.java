package com.springboot.ai_verify.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final String frontendUrl;

    public OAuth2SuccessHandler(
            @Value("${cors.allowed-origins:${CORS_ALLOWED_ORIGINS:http://localhost:5173}}") String allowedOrigins
    ) {
        String url = "http://localhost:5173";
        if (allowedOrigins != null && !allowedOrigins.isBlank()) {
            String[] origins = allowedOrigins.split(",");
            if (origins.length > 0) {
                url = origins[0].trim();
            }
        }
        this.frontendUrl = url;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        // Redirect to frontend dashboard upon successful OAuth2 login
        getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/dashboard");
    }
}
