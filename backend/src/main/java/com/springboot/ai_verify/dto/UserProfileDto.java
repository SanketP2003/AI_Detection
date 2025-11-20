package com.springboot.ai_verify.dto;

public record UserProfileDto(
    Long id,
    String username,
    String email,
    String roles
) {}

