package com.springboot.ai_verify.service;

import com.springboot.ai_verify.model.User;
import com.springboot.ai_verify.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User updateUsername(String currentUsername, String newUsername) {
        User user = getUserByUsername(currentUsername);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        // Check if new username is already taken
        User existingUser = userRepository.findByUsername(newUsername);
        if (existingUser != null && !existingUser.getId().equals(user.getId())) {
            throw new RuntimeException("Username already taken");
        }

        user.setUsername(newUsername);
        return userRepository.save(user);
    }

    public void updatePassword(String username, String currentPassword, String newPassword) {
        User user = getUserByUsername(username);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public User updateEmail(String username, String newEmail) {
        User user = getUserByUsername(username);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        user.setEmail(newEmail);
        return userRepository.save(user);
    }

    public User updateUser(Long id, User user) {
        User existingUser = userRepository.findById(id).orElse(null);
        if (existingUser != null) {
            existingUser.setUsername(user.getUsername());
            if (user.getPassword() != null && !user.getPassword().isEmpty()) {
                existingUser.setPassword(passwordEncoder.encode(user.getPassword()));
            }
            existingUser.setRoles(user.getRoles());
            return userRepository.save(existingUser);
        }
        return null;
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public User saveUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            user.setRoles("ROLE_USER");
        }
        return userRepository.save(user);
    }
}
