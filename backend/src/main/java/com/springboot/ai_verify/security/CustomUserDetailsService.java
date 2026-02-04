package com.springboot.ai_verify.security;

import com.springboot.ai_verify.model.User;
import com.springboot.ai_verify.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private static final Logger log = LoggerFactory.getLogger(CustomUserDetailsService.class);

    private final UserRepository userRepository;

    // BEST PRACTICE: Use constructor injection instead of field injection
    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        if (usernameOrEmail == null || usernameOrEmail.isBlank()) {
            throw new UsernameNotFoundException("Username or email is required");
        }

        try {
            User user = userRepository.findByUsername(usernameOrEmail);
            if (user == null) {
                user = userRepository.findByEmail(usernameOrEmail);
            }

            if (user == null) {
                log.warn("Login attempt with unknown user: {}", usernameOrEmail);
                throw new UsernameNotFoundException("Invalid username or email");
            }

            // Check if account is locked
            if (Boolean.TRUE.equals(user.getAccountLocked())) {
                log.warn("Login attempt for locked account: {}", usernameOrEmail);
                throw new UsernameNotFoundException("Account is locked. Please contact support.");
            }

            return new org.springframework.security.core.userdetails.User(
                    user.getUsername(),
                    user.getPassword(),
                    true,  // enabled
                    true,  // accountNonExpired
                    true,  // credentialsNonExpired
                    !Boolean.TRUE.equals(user.getAccountLocked()),  // accountNonLocked
                    getAuthorities(user.getRoles())
            );
        } catch (UsernameNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error loading user '{}': {}", usernameOrEmail, e.getMessage());
            throw new UsernameNotFoundException("Error loading user", e);
        }
    }

    private Collection<? extends GrantedAuthority> getAuthorities(String roles) {
        if (roles == null || roles.trim().isEmpty()) {
            return Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
        }

        return Arrays.stream(roles.split(","))
                .map(String::trim)
                .filter(role -> !role.isEmpty())
                .map(role -> {
                    // Normalize role format
                    String normalizedRole = role.toUpperCase();
                    if (!normalizedRole.startsWith("ROLE_")) {
                        normalizedRole = "ROLE_" + normalizedRole;
                    }
                    return new SimpleGrantedAuthority(normalizedRole);
                })
                .collect(Collectors.toList());
    }
}
