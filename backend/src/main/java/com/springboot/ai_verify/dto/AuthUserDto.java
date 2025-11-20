package com.springboot.ai_verify.dto;

public record AuthUserDto(
    String username,
    boolean isAdmin,
    boolean authenticated
) {}

