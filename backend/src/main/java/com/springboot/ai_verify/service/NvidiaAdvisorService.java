package com.springboot.ai_verify.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.net.SocketException;
import java.util.concurrent.TimeoutException;

@Service
public class NvidiaAdvisorService {

    private static final Logger log = LoggerFactory.getLogger(NvidiaAdvisorService.class);
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(60);

    private final WebClient webClient;

    @Value("${nvidia.api.url:https://integrate.api.nvidia.com/v1/chat/completions}")
    private String nvidiaApiUrl;

    @Value("${nvidia.api.key:}")
    private String nvidiaApiKey;

    @Value("${nvidia.advisor.model:meta/llama-3.1-70b-instruct}")
    private String advisorModel;

    private static final List<String> FALLBACK_MODELS = List.of(
            "meta/llama-3.1-70b-instruct",
            "nvidia/llama-3.1-nemotron-70b-instruct",
            "mistralai/mixtral-8x22b-instruct-v0.1"
    );

    private static final String SYSTEM_PROMPT = """
            You are a professional chat advisor with a specialization in offering clear,
            concise, and helpful advice. Respond in a friendly, conversational tone that builds trust and ease,
            while maintaining a sense of professionalism and respect. Always keep your answers focused on the
            user's question, avoiding unnecessary information. Adapt your language to suit the user's level of
            understanding—whether they're a beginner or an expert. Your goal is to make the user feel supported,
            informed, and confident moving forward.""";

    public NvidiaAdvisorService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public record NvidiaMessage(String role, String content) {}

    public record ChatRequest(String prompt, List<NvidiaMessage> history) {}

    public record NvidiaAdvisorRequest(
            String model,
            List<NvidiaMessage> messages,
            double temperature,
            int max_new_tokens
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record NvidiaResponse(List<Choice> choices) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Choice(NvidiaMessage message) {}

    public Mono<ResponseEntity<Map<String, String>>> chatWithNvidia(ChatRequest request) {
        if (request == null || request.prompt() == null || request.prompt().trim().isEmpty()) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("error", "Prompt is required.")));
        }
        
        if (nvidiaApiKey == null || nvidiaApiKey.trim().isEmpty()) {
            return Mono.just(ResponseEntity.status(503)
                    .body(Map.of("error", "NVIDIA AI service is not configured on the server.")));
        }

        List<NvidiaMessage> messages = new ArrayList<>();
        messages.add(new NvidiaMessage("system", SYSTEM_PROMPT));

        if (request.history() != null) {
            messages.addAll(request.history());
        }
        messages.add(new NvidiaMessage("user", request.prompt()));

        return chatWithModelCandidates(messages)
                .map(response -> {
                    String text = (response.choices() != null && !response.choices().isEmpty() &&
                            response.choices().getFirst().message() != null) ?
                            response.choices().getFirst().message().content() :
                            "Sorry, I couldn't get a valid response from the NVIDIA AI.";
                    return ResponseEntity.ok(Map.of("text", text));
                })
                .onErrorResume(e -> {
                    log.error("Error calling NVIDIA API: {}", e.getMessage());
                    if (e instanceof WebClientResponseException wcre) {
                        log.error("Error Status Code: {}", wcre.getStatusCode());
                        log.debug("Error Response Body: {}", wcre.getResponseBodyAsString());
                    }
                    String friendlyError = "The NVIDIA AI service could not be reached. Please try again later.";
                    return Mono.just(ResponseEntity.status(503).body(Map.of("error", friendlyError)));
                });
    }

    private Mono<NvidiaResponse> chatWithModelCandidates(List<NvidiaMessage> messages) {
        List<String> candidates = new ArrayList<>();
        if (advisorModel != null && !advisorModel.isBlank()) {
            candidates.add(advisorModel.trim());
        }
        FALLBACK_MODELS.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(model -> !model.isEmpty() && !candidates.contains(model))
                .forEach(candidates::add);

        return tryNextModel(candidates, messages);
    }

    private Mono<NvidiaResponse> tryNextModel(List<String> models, List<NvidiaMessage> messages) {
        if (models.isEmpty()) {
            return Mono.error(new IllegalStateException("No NVIDIA models are configured."));
        }

        String model = models.getFirst();
        NvidiaAdvisorRequest payload = new NvidiaAdvisorRequest(model, messages, 0.7, 1024);

        return webClient.post()
                .uri(nvidiaApiUrl)
                .header("Authorization", "Bearer " + nvidiaApiKey)
                .header("Accept", "application/json")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(NvidiaResponse.class)
                .timeout(REQUEST_TIMEOUT)
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(2))
                        .jitter(0.5)
                        .filter(NvidiaAdvisorService::isRetryableError)
                        .onRetryExhaustedThrow((retryBackoffSpec, retrySignal) -> retrySignal.failure()))
                .onErrorResume(WebClientResponseException.NotFound.class, ex -> {
                    if (models.size() <= 1) {
                        return Mono.error(ex);
                    }
                    String responseBody = ex.getResponseBodyAsString();
                    log.warn("NVIDIA model '{}' was not found; trying fallback model. Response: {}", model, responseBody);
                    return tryNextModel(models.subList(1, models.size()), messages);
                });
    }

    private static boolean isRetryableError(Throwable throwable) {
        if (throwable instanceof WebClientResponseException wcre) {
            int statusCode = wcre.getStatusCode().value();
            return statusCode == 429 || (statusCode >= 500 && statusCode < 600);
        }

        if (throwable instanceof TimeoutException || throwable instanceof WebClientRequestException) {
            Throwable cause = throwable.getCause();
            return cause == null || cause instanceof IOException || cause instanceof SocketException;
        }

        Throwable cause = throwable.getCause();
        return cause instanceof IOException || cause instanceof SocketException;
    }
}
