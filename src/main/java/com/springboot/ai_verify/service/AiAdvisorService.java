package com.springboot.ai_verify.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeoutException;

@Service
public class AiAdvisorService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${mistralmodel.api.url}")
    private String mistralApiUrl;

    @Value("${mistralmodel.api.key}")
    private String mistralApiKey;

    @Value("${mistralmodel.model}")
    private String mistralModel;

    private static final String SYSTEM_PROMPT = """
            You are a professional chat advisor with a specialization in offering clear,
            concise, and helpful advice. Respond in a friendly, conversational tone that builds trust and ease,
            while maintaining a sense of professionalism and respect. Always keep your answers focused on the
            user’s question, avoiding unnecessary information. Adapt your language to suit the user’s level of
            understanding—whether they’re a beginner or an expert. Your goal is to make the user feel supported,
            informed, and confident moving forward.""";

    public AiAdvisorService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);
    }

    public record MistralMessage(String role, String content) {
    }

    public record ChatRequest(String prompt, List<MistralMessage> history) {
    }

    public record MistralRequest(String model, List<MistralMessage> messages, boolean stream) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MistralResponse(List<Choice> choices) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Choice(MistralMessage message) {
    }

    public Mono<ResponseEntity<Map<String, String>>> chatWithMistral(ChatRequest request) {
        if (request == null || request.prompt() == null || request.prompt().trim().isEmpty()) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("error", "Prompt is required.")));
        }
        if (mistralApiKey == null || mistralApiKey.trim().isEmpty() || mistralApiKey.equals("YOUR_MISTRAL_API_KEY_HERE")) {
            return Mono.just(ResponseEntity.status(503)
                    .body(Map.of("error", "AI service is not configured on the server.")));
        }

        List<MistralMessage> messages = new ArrayList<>();
        messages.add(new MistralMessage("system", SYSTEM_PROMPT));

        if (request.history() != null) {
            messages.addAll(request.history());
        }
        messages.add(new MistralMessage("user", request.prompt()));

        MistralRequest payload = new MistralRequest(mistralModel, messages, false);

        try {
            String jsonPayload = objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            System.err.println("Error serializing payload for logging: " + e.getMessage());
        }

        return webClient.post()
                .uri(mistralApiUrl)
                .header("Authorization", "Bearer " + mistralApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(MistralResponse.class)
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(2))
                        .jitter(0.5)
                        .filter(throwable -> {
                            if (throwable instanceof WebClientResponseException) {
                                int statusCode = ((WebClientResponseException) throwable).getStatusCode().value();
                                return statusCode == 429 || (statusCode >= 500 && statusCode < 600);
                            }
                            return throwable instanceof TimeoutException;
                        })
                        .onRetryExhaustedThrow((retryBackoffSpec, retrySignal) -> retrySignal.failure()))
                .timeout(Duration.ofSeconds(60))
                .map(response -> {
                    String text = (response.choices() != null && !response.choices().isEmpty() &&
                            response.choices().get(0).message() != null) ?
                            response.choices().get(0).message().content() :
                            "Sorry, I couldn't get a valid response from the AI.";
                    return ResponseEntity.ok(Map.of("text", text));
                })
                .onErrorResume(e -> {
                    System.err.println("Error calling Mistral API: " + e.getMessage());
                    if (e instanceof WebClientResponseException wcre) {
                        System.err.println("Error Status Code: " + wcre.getStatusCode());
                        System.err.println("Error Response Body: " + wcre.getResponseBodyAsString());
                    }
                    String friendlyError = "The AI service could not be reached or failed to process the request. Please try again later.";
                    return Mono.just(ResponseEntity.status(503).body(Map.of("text", friendlyError, "error", e.getMessage())));
                });
    }
}