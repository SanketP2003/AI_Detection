package com.springboot.ai_verify.controller;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class AiAdvisor {

    private final WebClient webClient;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private static final String SYSTEM_PROMPT = "You are a professional chat advisor with a specialization in offering clear, concise, and helpful advice. Respond in a friendly, conversational tone that builds trust and ease, while maintaining a sense of professionalism and respect. Always keep your answers focused on the user’s question, avoiding unnecessary information. Adapt your language to suit the user’s level of understanding—whether they’re a beginner or an expert. Your goal is to make the user feel supported, informed, and confident moving forward.";

    public AiAdvisor(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    // --- DTOs for Gemini API ---
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GeminiResponse(List<Candidate> candidates) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Candidate(Content content) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Content(List<Part> parts) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Part(String text) {}

    // --- DTOs for our API ---
    public record Message(String role, String text) {}
    public record ChatRequest(String prompt, List<Message> history) {}


    @PostMapping("/chat")
    public Mono<ResponseEntity<Map<String, String>>> chatWithGemini(@RequestBody ChatRequest request) {
        // Validate input prompt
        if (request == null || request.prompt() == null || request.prompt().trim().isEmpty()) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("error", "Prompt is required")));
        }
        // Validate API key presence
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            return Mono.just(ResponseEntity.internalServerError()
                    .body(Map.of("error", "AI service is not configured: missing Gemini API key")));
        }

        // --- Construct the request payload for Gemini ---
        List<Map<String, Object>> contents = new ArrayList<>();
        // 1. Add the system prompt to set the AI's persona
        contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", SYSTEM_PROMPT))));
        contents.add(Map.of("role", "model", "parts", List.of(Map.of("text", "Understood. I'm ready to help."))));

        // 2. Add the existing chat history
        if (request.history() != null) {
            List<Map<String, Object>> historyContents = request.history().stream()
                    .map(message -> Map.of(
                            "role", message.role().equals("model") ? "model" : "user",
                            "parts", List.of(Map.of("text", message.text()))
                    ))
                    .collect(Collectors.toList());
            contents.addAll(historyContents);
        }

        // 3. Add the user's latest prompt
        contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", request.prompt()))));

        Map<String, Object> payload = Map.of("contents", contents);

        // --- Call the Gemini API ---
        return webClient.post()
                .uri(geminiApiUrl + "?key=" + geminiApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(GeminiResponse.class) // Deserialize into our DTO
                .timeout(Duration.ofSeconds(60))
                .map(geminiResponse -> {
                    // Extract the text from the DTO, which is much safer and cleaner
                    String responseText = Optional.ofNullable(geminiResponse)
                            .map(GeminiResponse::candidates)
                            .filter(candidates -> !candidates.isEmpty())
                            .map(candidates -> candidates.get(0))
                            .map(Candidate::content)
                            .map(Content::parts)
                            .filter(parts -> !parts.isEmpty())
                            .map(parts -> parts.get(0))
                            .map(Part::text)
                            .orElse("Sorry, I couldn't process that response.");

                    return ResponseEntity.ok(Map.of("text", responseText));
                })
                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                        .body(Map.of("error", "Error communicating with the AI service: " + e.getMessage()))));
    }
}