package com.springboot.ai_verify.dto;

import java.util.List;

public record MistralRequest(
        List<Content> contents
) {
    public record Content(List<Part> parts) {}
    public record Part(String text) {}
}
