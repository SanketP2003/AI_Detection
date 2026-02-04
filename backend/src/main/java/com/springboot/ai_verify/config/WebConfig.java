package com.springboot.ai_verify.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC configuration.
 * Note: CORS is configured in SecurityConfig to ensure proper integration with Spring Security.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    // ARCHITECTURAL FIX: Removed duplicate CORS configuration.
    // CORS is already configured in SecurityConfig.java.
    // Having it in two places can cause conflicts and maintenance issues.

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/login").setViewName("forward:/index.html");
        registry.addViewController("/").setViewName("forward:/index.html");
    }
}
