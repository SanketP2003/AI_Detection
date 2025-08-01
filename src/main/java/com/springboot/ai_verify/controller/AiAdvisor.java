package com.springboot.ai_verify.controller;

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

    public record Message(String role, String text) {}

    public record ChatRequest(String prompt, List<Message> history) {}

    @PostMapping("/chat")
    public Mono<ResponseEntity<Map<String, String>>> chatWithGemini(@RequestBody ChatRequest request) {
        List<Map<String, Object>> contents = new ArrayList<>();
        contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", SYSTEM_PROMPT))));
        contents.add(Map.of("role", "model", "parts", List.of(Map.of("text", "Understood. I'm ready to help."))));
        if (request.history() != null) {
            List<Map<String, Object>> historyContents = request.history().stream()
                    .map(message -> Map.of(
                            "role", message.role().equals("model") ? "model" : "user",
                            "parts", List.of(Map.of("text", message.text()))
                    ))
                    .collect(Collectors.toList());
            contents.addAll(historyContents);
        }
        contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", request.prompt()))));

        Map<String, Object> payload = Map.of("contents", contents);

        return webClient.post()
                .uri(geminiApiUrl + "?key=" + geminiApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofSeconds(60))
                .map(response -> {
                    try {
                        List<?> candidates = (List<?>) response.get("candidates");
                        Map<?,?> candidate = (Map<?,?>) candidates.get(0);
                        Map<?,?> content = (Map<?,?>) candidate.get("content");
                        List<?> parts = (List<?>) content.get("parts");
                        Map<?,?> part = (Map<?,?>) parts.get(0);
                        String result = part.get("text").toString();
                        return ResponseEntity.ok(Map.of("text", result));
                    } catch (Exception ex) {
                        return ResponseEntity.internalServerError()
                                .body(Map.of("error", "Invalid response structure from Gemini: " + ex.getMessage()));
                    }
                })
                .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError()
                        .body(Map.of("error", "Error communicating with the AI service: " + e.getMessage()))));
    }
}