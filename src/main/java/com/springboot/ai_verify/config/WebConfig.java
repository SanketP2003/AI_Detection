package com.springboot.ai_verify.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Map the /login URL path to the index.html file
        registry.addViewController("/login").setViewName("forward:/index.html");
        // Also map the root path to the index.html file
        registry.addViewController("/").setViewName("forward:/index.html");
    }
}
