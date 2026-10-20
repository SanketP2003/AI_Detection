package com.springboot.ai_verify.service;

import com.springboot.ai_verify.exception.InvalidRequestException;
import com.springboot.ai_verify.exception.ResourceNotFoundException;
import com.springboot.ai_verify.model.User;
import com.springboot.ai_verify.repository.UserRepository;
import com.springboot.ai_verify.workspace.service.WorkspaceService;
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
    private final WorkspaceService workspaceService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, WorkspaceService workspaceService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.workspaceService = workspaceService;
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
        if (user.getPlan() == null) {
            user.setPlan("FREE");
        }
        User saved = userRepository.save(user);
        workspaceService.createPersonalWorkspace(saved);
        return saved;
    }

    public synchronized User getOrCreateClerkUser(String clerkId, String email) {
        if (clerkId == null || clerkId.isBlank()) {
            return null;
        }

        // 1. Check by real clerkId column
        User existing = userRepository.findByClerkId(clerkId);
        if (existing != null) {
            if (existing.getDefaultWorkspaceId() == null) {
                workspaceService.getOrCreateDefaultWorkspace(existing);
            }
            return existing;
        }

        String safeUsername = clerkId.replaceAll("[^a-zA-Z0-9_-]", "_").trim();
        if (safeUsername.length() > 50) {
            safeUsername = safeUsername.substring(0, 50);
        }

        // 2. Check by safe username
        existing = userRepository.findByUsername(safeUsername);
        if (existing != null) {
            existing.setClerkId(clerkId);
            if (existing.getDefaultWorkspaceId() == null) {
                workspaceService.getOrCreateDefaultWorkspace(existing);
            }
            return userRepository.save(existing);
        }

        // 3. Check by normalized email
        String normalizedEmail = normalizeOptionalEmail(email);
        if (normalizedEmail != null) {
            existing = userRepository.findByEmail(normalizedEmail);
            if (existing != null) {
                existing.setClerkId(clerkId);
                if (existing.getDefaultWorkspaceId() == null) {
                    workspaceService.getOrCreateDefaultWorkspace(existing);
                }
                return userRepository.save(existing);
            }
        }

        // 4. Create new user with personal workspace
        User newUser = new User();
        newUser.setClerkId(clerkId);
        newUser.setUsername(safeUsername);
        newUser.setEmail(normalizedEmail != null ? normalizedEmail : safeUsername + "@clerk.user");
        newUser.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
        newUser.setRoles("ROLE_USER");
        newUser.setPlan("FREE");
        User savedUser = userRepository.save(newUser);

        workspaceService.createPersonalWorkspace(savedUser);
        return savedUser;
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

    public org.springframework.data.domain.Page<User> getUsersPaginated(int page, int size, String query) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("id").descending());
        if (query != null && !query.trim().isBlank()) {
            String q = query.trim();
            return userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(q, q, pageable);
        }
        return userRepository.findAll(pageable);
    }

    public User getUserById(Long id) {
        if (id == null) return null;
        return userRepository.findById(id).orElse(null);
    }

    public User setUserLockedStatus(Long userId, boolean locked) {
        User user = getUserById(userId);
        if (user == null) {
            throw new ResourceNotFoundException("User not found: " + userId);
        }
        user.setAccountLocked(locked);
        return userRepository.save(user);
    }
}
