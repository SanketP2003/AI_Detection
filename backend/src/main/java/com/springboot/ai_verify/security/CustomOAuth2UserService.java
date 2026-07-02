package com.springboot.ai_verify.security;

import com.springboot.ai_verify.model.User;
import com.springboot.ai_verify.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private static final Logger log = LoggerFactory.getLogger(CustomOAuth2UserService.class);
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public CustomOAuth2UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        try {
            return processOAuth2User(oAuth2User);
        } catch (Exception ex) {
            log.error("Error processing OAuth2 user: {}", ex.getMessage(), ex);
            throw new OAuth2AuthenticationException(ex.getMessage());
        }
    }

    private OAuth2User processOAuth2User(OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email not found from OAuth2 provider");
        }

        User user = userRepository.findByEmail(email);
        if (user == null) {
            // User does not exist, register them
            user = new User();
            user.setEmail(email);
            
            // Generate a safe username from the email
            String name = oAuth2User.getAttribute("name");
            String username = generateUniqueUsername(name, email);
            user.setUsername(username);
            
            // Set a secure random password since password field is required in database/entity
            user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            user.setRoles("ROLE_USER");
            user = userRepository.save(user);
            log.info("Registered new Google OAuth2 user: {}", user.getUsername());
        } else {
            log.info("Logging in existing user via Google OAuth2: {}", user.getUsername());
        }

        // Return a DefaultOAuth2User with appropriate authorities and attributes
        Map<String, Object> attributes = new HashMap<>(oAuth2User.getAttributes());
        // Put our internal username so Spring Security uses it
        attributes.put("username", user.getUsername());

        return new DefaultOAuth2User(
                Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                "username" // Name attribute key mapped to internal username
        );
    }

    private String generateUniqueUsername(String name, String email) {
        String baseUsername = "";
        if (name != null && !name.isBlank()) {
            baseUsername = name.replaceAll("[^a-zA-Z0-9_-]", "");
        } else {
            baseUsername = email.split("@")[0].replaceAll("[^a-zA-Z0-9_-]", "");
        }

        if (baseUsername.length() < 3) {
            baseUsername = baseUsername + "user";
        }
        if (baseUsername.length() > 40) {
            baseUsername = baseUsername.substring(0, 40);
        }

        String username = baseUsername;
        int count = 1;
        while (userRepository.findByUsername(username) != null) {
            String suffix = String.valueOf(count);
            if (baseUsername.length() + suffix.length() > 50) {
                username = baseUsername.substring(0, 50 - suffix.length()) + suffix;
            } else {
                username = baseUsername + suffix;
            }
            count++;
        }
        return username;
    }
}
