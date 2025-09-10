package com.springboot.ai_verify.repository;

import com.springboot.ai_verify.model.DetectionHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DetectionHistoryRepository extends JpaRepository<DetectionHistory, Long> {
    List<DetectionHistory> findTop20ByUsernameOrderByCreatedAtDesc(String username);
}