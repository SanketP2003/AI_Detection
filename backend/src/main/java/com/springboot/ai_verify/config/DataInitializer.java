package com.springboot.ai_verify.config;

import com.springboot.ai_verify.model.User;
import com.springboot.ai_verify.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;


@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initializeData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            
            if (userRepository.findByUsername("testuser") == null) {
                User testUser = new User();
                testUser.setUsername("testuser");
                testUser.setEmail("testuser@example.com");
                testUser.setPassword(passwordEncoder.encode("password123"));
                testUser.setRoles("ROLE_USER");
                userRepository.save(testUser);
                System.out.println("✓ Test user 'testuser' created (password: password123)");
            }

            
            if (userRepository.findByUsername("admin") == null) {
                User adminUser = new User();
                adminUser.setUsername("admin");
                adminUser.setEmail("admin@example.com");
                adminUser.setPassword(passwordEncoder.encode("admin123"));
                adminUser.setRoles("ROLE_ADMIN");
                userRepository.save(adminUser);
                System.out.println("✓ Admin user 'admin' created (password: admin123)");
            }
        };
    }
}

