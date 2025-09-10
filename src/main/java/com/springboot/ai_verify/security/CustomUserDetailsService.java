package com.springboot.ai_verify.security;

import com.springboot.ai_verify.model.User;
import com.springboot.ai_verify.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collection;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        // First, try to find the user by username
        User user = userRepository.findByUsername(usernameOrEmail);

        // If not found by username, try to find by email
        if (user == null) {
            user = userRepository.findByEmail(usernameOrEmail);
        }

        // If still not found, throw an exception with a clear message
        if (user == null) {
            throw new UsernameNotFoundException("Invalid username or email");
        }
        
        // Check if user has roles assigned
        if (user.getRoles() == null || user.getRoles().trim().isEmpty()) {
            throw new UsernameNotFoundException("User account has no roles assigned");
        }

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                getAuthorities(user.getRoles()));
    }

    private Collection<? extends GrantedAuthority> getAuthorities(String roles) {
        if (roles == null || roles.trim().isEmpty()) {
            return Arrays.asList();
        }
        return Arrays.stream(roles.split(","))
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }
}
