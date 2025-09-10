package com.springboot.ai_verify.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;

@Service
public class AiDetectionService {

    private static final Logger log = LoggerFactory.getLogger(AiDetectionService.class);

    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api.url}")
    private String apiUrl;

    @Value("${gemini.api.key}")
    private String apiKey;

    public AiDetectionService(WebClient.Builder builder) {
        this.webClient = builder.build();
    }

    /**
     * Sends text to Gemini API for AI-content detection.
     */
    public Mono<JsonNode> detectContent(String inputText) {
        String prompt = "Analyze the following text and return JSON with fields: "
                + "likelyAi (boolean), aiScore (0-1), perplexity, burstiness, summary.\n\n"
                + inputText;

        return webClient.post()
                .uri(apiUrl)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(buildRequestBody(prompt))
                .retrieve()
                .bodyToMono(String.class)
                .map(this::toJsonNode)
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(2))
                        .filter(this::is429TooManyRequests)
                        .onRetryExhaustedThrow((spec, signal) ->
                                new RuntimeException("Exceeded retry attempts due to 429 Too Many Requests")))
                .doOnError(e -> log.error("Error calling Gemini API: {}", e.getMessage()));
    }

    /**
     * Builds request body JSON for Gemini API.
     */
    private String buildRequestBody(String prompt) {
        return "{\n" +
                "  \"contents\": [\n" +
                "    {\"parts\":[{\"text\":\"" + prompt.replace("\"", "\\\"") + "\"}]}\n" +
                "  ]\n" +
                "}";
    }

    /**
     * Converts raw JSON string to JsonNode safely.
     */
    public JsonNode toJsonNode(String jsonString) {
        try {
            return objectMapper.readTree(jsonString);
        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", e.getMessage());
            return objectMapper.createObjectNode().put("error", "Invalid JSON response");
        }
    }

    /**
     * Detects if error is a 429 Too Many Requests.
     */
    private boolean is429TooManyRequests(Throwable t) {
        return t instanceof WebClientResponseException.TooManyRequests;
    }
}
