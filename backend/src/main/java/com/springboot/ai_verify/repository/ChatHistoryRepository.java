package com.springboot.ai_verify.repository;

import com.springboot.ai_verify.model.ChatHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface ChatHistoryRepository extends JpaRepository<ChatHistory, Long> {
    List<ChatHistory> findTop20ByUsernameOrderByCreatedAtDesc(String username);
    List<ChatHistory> findTop100ByUsernameOrderByCreatedAtDesc(String username);
    List<ChatHistory> findTop20ByUsernameAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(String username, Instant cutoff);
    List<ChatHistory> findTop100ByUsernameAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(String username, Instant cutoff);
    List<ChatHistory> findTop100ByOrderByCreatedAtDesc();
    List<ChatHistory> findAllByUsernameOrderByCreatedAtDesc(String username);
    List<ChatHistory> findAllByUsernameAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(String username, Instant cutoff);
    long deleteByIdAndUsername(Long id, String username);
}
