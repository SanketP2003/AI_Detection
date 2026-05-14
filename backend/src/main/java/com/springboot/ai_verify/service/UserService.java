package com.springboot.ai_verify.service;

import com.springboot.ai_verify.exception.InvalidRequestException;
import com.springboot.ai_verify.exception.ResourceNotFoundException;
import com.springboot.ai_verify.model.User;
import com.springboot.ai_verify.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User updateUsername(String currentUsername, String newUsername) {
        User user = getUserByUsername(currentUsername);
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        String normalizedNewUsername = newUsername.trim();

        User existingUser = userRepository.findByUsername(normalizedNewUsername);
        if (existingUser != null && !existingUser.getId().equals(user.getId())) {
            throw new InvalidRequestException("Username already taken");
        }

        user.setUsername(normalizedNewUsername);
        return userRepository.save(user);
    }

    public void updatePassword(String username, String currentPassword, String newPassword) {
        User user = getUserByUsername(username);
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new InvalidRequestException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public User updateEmail(String username, String newEmail) {
        User user = getUserByUsername(username);
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        String normalizedEmail = normalizeOptionalEmail(newEmail);
        if (normalizedEmail != null) {
            User existingUser = userRepository.findByEmail(normalizedEmail);
            if (existingUser != null && !existingUser.getId().equals(user.getId())) {
                throw new InvalidRequestException("Email already in use");
            }
        }

        user.setEmail(normalizedEmail);
        return userRepository.save(user);
    }

    public User updateUser(Long id, User user) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getUsername() == null || user.getUsername().isBlank()) {
            throw new InvalidRequestException("Username is required");
        }
        String normalizedUsername = user.getUsername().trim();
        User userWithSameUsername = userRepository.findByUsername(normalizedUsername);
        if (userWithSameUsername != null && !userWithSameUsername.getId().equals(existingUser.getId())) {
            throw new InvalidRequestException("Username already taken");
        }
        existingUser.setUsername(normalizedUsername);

        String normalizedEmail = normalizeOptionalEmail(user.getEmail());
        if (normalizedEmail != null) {
            User userWithSameEmail = userRepository.findByEmail(normalizedEmail);
            if (userWithSameEmail != null && !userWithSameEmail.getId().equals(existingUser.getId())) {
                throw new InvalidRequestException("Email already in use");
            }
        }
        existingUser.setEmail(normalizedEmail);

        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            existingUser.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        existingUser.setRoles(normalizeRoles(user.getRoles()));
        return userRepository.save(existingUser);
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found");
        }
        userRepository.deleteById(id);
    }

    public User saveUser(User user) {
        if (user == null) {
            throw new InvalidRequestException("User data is required");
        }
        if (user.getUsername() == null || user.getUsername().isBlank()) {
            throw new InvalidRequestException("Username is required");
        }
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new InvalidRequestException("Password is required");
        }

        String normalizedUsername = user.getUsername().trim();
        if (userRepository.findByUsername(normalizedUsername) != null) {
            throw new InvalidRequestException("Username already taken");
        }

        String normalizedEmail = normalizeOptionalEmail(user.getEmail());
        if (normalizedEmail != null && userRepository.findByEmail(normalizedEmail) != null) {
            throw new InvalidRequestException("Email already in use");
        }

        user.setUsername(normalizedUsername);
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRoles(normalizeRoles(user.getRoles()));
        return userRepository.save(user);
    }

    private String normalizeOptionalEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return email.trim().toLowerCase();
    }

    private String normalizeRoles(String roles) {
        if (roles == null || roles.isBlank()) {
            return "ROLE_USER";
        }

        Set<String> normalizedRoles = Arrays.stream(roles.split(","))
                .map(String::trim)
                .filter(role -> !role.isBlank())
                .map(role -> role.toUpperCase().startsWith("ROLE_") ? role.toUpperCase() : "ROLE_" + role.toUpperCase())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (normalizedRoles.isEmpty()) {
            normalizedRoles.add("ROLE_USER");
        }

        return String.join(",", normalizedRoles);
    }
}
