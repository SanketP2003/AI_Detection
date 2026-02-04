package com.springboot.ai_verify.service;

import com.springboot.ai_verify.exception.InvalidRequestException;
import com.springboot.ai_verify.exception.ResourceNotFoundException;
import com.springboot.ai_verify.model.DetectionHistory;
import com.springboot.ai_verify.repository.DetectionHistoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DetectionHistoryService {

    private static final Logger log = LoggerFactory.getLogger(DetectionHistoryService.class);

    private final DetectionHistoryRepository repo;

    public DetectionHistoryService(DetectionHistoryRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public DetectionHistory save(DetectionHistory dh) {
        if (dh.getUsername() == null || dh.getUsername().isBlank()) {
            throw new InvalidRequestException("Username is required for detection history");
        }
        return repo.save(dh);
    }

    public List<DetectionHistory> recentForUser(String username) {
        if (username == null || username.isBlank()) {
            throw new InvalidRequestException("Username is required");
        }
        return repo.findTop20ByUsernameOrderByCreatedAtDesc(username);
    }

    public List<DetectionHistory> allForUser(String username) {
        if (username == null || username.isBlank()) {
            throw new InvalidRequestException("Username is required");
        }
        return repo.findAllByUsernameOrderByCreatedAtDesc(username);
    }

    public List<DetectionHistory> getAllHistory() {
        return repo.findTop100ByOrderByCreatedAtDesc();
    }

    /**
     * SECURITY FIX: Delete with ownership verification
     * Only allows deletion if the record belongs to the specified user.
     */
    @Transactional
    public void deleteById(Long id, String username) {
        if (id == null || username == null || username.isBlank()) {
            throw new InvalidRequestException("ID and username are required");
        }

        DetectionHistory history = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Detection history not found with id: " + id));

        // SECURITY FIX: Verify ownership before deletion
        if (!username.equals(history.getUsername())) {
            log.warn("User '{}' attempted to delete detection history id {} belonging to '{}'",
                    username, id, history.getUsername());
            throw new InvalidRequestException("You do not have permission to delete this record");
        }

        repo.deleteById(id);
        log.info("User '{}' deleted detection history id {}", username, id);
    }

    /**
     * Admin-only deletion without ownership check
     */
    @Transactional
    public void deleteByIdAsAdmin(Long id) {
        if (id == null) {
            throw new InvalidRequestException("ID is required");
        }
        if (!repo.existsById(id)) {
            throw new ResourceNotFoundException("Detection history not found with id: " + id);
        }
        repo.deleteById(id);
        log.info("Admin deleted detection history id {}", id);
    }
}
