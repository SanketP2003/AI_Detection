package com.springboot.ai_verify.dto;

import java.util.List;

public record UserProfileDto(
    Long id,
    String username,
    String email,
    List<String> roles
) {}

