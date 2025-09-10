package com.springboot.ai_verify.service;

import com.springboot.ai_verify.model.DetectionHistory;
import com.springboot.ai_verify.repository.DetectionHistoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DetectionHistoryService {
    private final DetectionHistoryRepository repo;

    public DetectionHistoryService(DetectionHistoryRepository repo) {
        this.repo = repo;
    }

    public DetectionHistory save(DetectionHistory dh) {
        return repo.save(dh);
    }

    public List<DetectionHistory> recentForUser(String username) {
        return repo.findTop20ByUsernameOrderByCreatedAtDesc(username);
    }
    public List<DetectionHistory> allForUser(String username) {
        return repo.findAll();
    }

    public void deleteById(Long id, String username) {
        repo.deleteById(id);
    }
}
