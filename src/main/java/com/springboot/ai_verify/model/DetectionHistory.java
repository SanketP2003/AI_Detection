package com.springboot.ai_verify.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Data
@Entity
@Table(name = "detection_history")
public class DetectionHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username; // store username of the authenticated user

    @Column(length = 255)
    private String contentPreview;

    private String result; // AI or Human or label

    private int confidence; // 0-100

    private Instant createdAt = Instant.now();
}
