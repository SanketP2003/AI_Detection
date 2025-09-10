package com.springboot.ai_verify.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Controller
public class IndexController {

    @GetMapping(value = "/index.html", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String serveLogin(@RequestParam(value = "error", required = false) String error,
                           @RequestParam(value = "logout", required = false) String logout) throws IOException {
        ClassPathResource resource = new ClassPathResource("static/index.html");
        byte[] bytes = resource.getInputStream().readAllBytes();
        String html = new String(bytes, StandardCharsets.UTF_8);

        // Replace visible labels and input type to make it username/password based
        html = html.replace("<label for=\"email\">Email</label>", "<label for=\"email\">Username</label>");
        html = html.replace("type=\"email\"", "type=\"text\"");
        html = html.replace("placeholder=\"you@example.com\"", "placeholder=\"Your username\"");
        // disable native validation to avoid any leftover browser checks
        html = html.replace("<form class=\"login-form\" action=\"/login\" method=\"post\">",
                "<form class=\"login-form\" action=\"/login\" method=\"post\" novalidate>");
        
        // Add error message if login failed
        if (error != null) {
            String errorMessage = "<div class=\"error-message\" style=\"color: red; margin-bottom: 15px;\">Invalid username or password</div>";
            html = html.replace("<form class=\"login-form\" action=\"/login\" method=\"post\" novalidate>", 
                              "<form class=\"login-form\" action=\"/login\" method=\"post\" novalidate>" + errorMessage);
        }
        
        // Add logout message
        if (logout != null) {
            String logoutMessage = "<div class=\"logout-message\" style=\"color: green; margin-bottom: 15px;\">You have been successfully logged out</div>";
            html = html.replace("<form class=\"login-form\" action=\"/login\" method=\"post\" novalidate>", 
                              "<form class=\"login-form\" action=\"/login\" method=\"post\" novalidate>" + logoutMessage);
        }
        
        return html;
    }
}