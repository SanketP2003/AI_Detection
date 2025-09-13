package com.springboot.ai_verify.dto;

public record MistralResponse (
        Candidate[] candidates
) {
    public record Candidate(Content content) {}
    public record Content(Part[] parts) {}
    public record Part(String text) {}
}
