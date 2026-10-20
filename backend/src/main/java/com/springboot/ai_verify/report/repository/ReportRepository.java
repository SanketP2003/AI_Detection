package com.springboot.ai_verify.report.repository;

import com.springboot.ai_verify.report.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId);
    Optional<Report> findByIdAndWorkspaceId(Long id, Long workspaceId);
}
