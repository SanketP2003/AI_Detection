package com.springboot.ai_verify.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class NvidiaAdvisorService {

    private static final Logger log = LoggerFactory.getLogger(NvidiaAdvisorService.class);
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(20);

    private final WebClient webClient;

    @Value("${openrouter.api.key:${gemini.api.key:}}")
    private String openRouterApiKey;

    @Value("${openrouter.api.url:https://openrouter.ai/api/v1/chat/completions}")
    private String openRouterApiUrl;

    @Value("${openrouter.model.advisor:google/gemini-2.5-flash}")
    private String advisorModel;

    private static final String SYSTEM_PROMPT = """
            You are a professional writing and content authenticity advisor. Respond in a friendly, conversational tone that builds trust and ease, while maintaining a sense of professionalism and respect. Always keep your answers focused on the user's question, providing clear, actionable feedback regarding writing clarity, linguistic flow, style naturalness, and authentic voice. Adapt your language to suit the user's level of understanding.""";

    public NvidiaAdvisorService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public record NvidiaMessage(String role, String content) {}

    public record ChatRequest(String prompt, List<NvidiaMessage> history) {}

    // OpenRouter Request payload structures
    public record OpenRouterMessage(String role, String content) {}

    public record OpenRouterRequest(
            String model,
            Integer max_tokens,
            List<OpenRouterMessage> messages
    ) {}

    // OpenRouter Response payload structures
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OpenRouterResponse(List<Choice> choices) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Choice(OpenRouterMessage message) {}

    public Mono<ResponseEntity<Map<String, String>>> chatWithNvidia(ChatRequest request) {
        if (request == null || request.prompt() == null || request.prompt().trim().isEmpty()) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("error", "Prompt is required.")));
        }

        if (openRouterApiKey == null || openRouterApiKey.trim().isEmpty()) {
            String prompt = request.prompt().toLowerCase();
            String fallbackReply = getFallbackAdvisorResponse(prompt);
            return Mono.just(ResponseEntity.ok(Map.of("text", fallbackReply)));
        }

        List<OpenRouterMessage> messages = new ArrayList<>();
        messages.add(new OpenRouterMessage("system", SYSTEM_PROMPT));

        // Convert conversation history
        if (request.history() != null) {
            for (NvidiaMessage msg : request.history()) {
                String role = "assistant".equalsIgnoreCase(msg.role()) || "model".equalsIgnoreCase(msg.role())
                        ? "assistant"
                        : "user";
                messages.add(new OpenRouterMessage(role, msg.content()));
            }
        }

        // Add current user prompt
        messages.add(new OpenRouterMessage("user", request.prompt()));

        OpenRouterRequest payload = new OpenRouterRequest(
                advisorModel,
                1000,
                messages
        );

        return webClient.post()
                .uri(openRouterApiUrl)
                .header("Authorization", "Bearer " + openRouterApiKey.trim())
                .header("HTTP-Referer", "http://localhost:3000")
                .header("X-Title", "AI Verify")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(OpenRouterResponse.class)
                .timeout(REQUEST_TIMEOUT)
                .map(response -> {
                    String text = (response.choices() != null && !response.choices().isEmpty() &&
                            response.choices().getFirst().message() != null &&
                            response.choices().getFirst().message().content() != null)
                            ? response.choices().getFirst().message().content()
                            : "Sorry, I couldn't get a valid response from the advisor service.";
                    return ResponseEntity.ok(Map.of("text", text));
                })
                .onErrorResume(e -> {
                    log.error("Error calling OpenRouter Advisor API: {}", e.getMessage());
                    if (e instanceof WebClientResponseException wcre) {
                        log.error("OpenRouter Status Code: {}", wcre.getStatusCode());
                        log.debug("OpenRouter Error Body: {}", wcre.getResponseBodyAsString());
                    }
                    String prompt = request.prompt().toLowerCase();
                    String fallbackReply = getFallbackAdvisorResponse(prompt);
                    return Mono.just(ResponseEntity.ok(Map.of("text", fallbackReply)));
                });
    }

    private String getFallbackAdvisorResponse(String prompt) {
        String cleanPrompt = prompt.trim().toLowerCase();

        if (cleanPrompt.contains("perplexity")) {
            return "Perplexity measures text predictability. Lower scores indicate high predictability, commonly associated with automated generators. Humans write with much higher perplexity because we make unexpected word choices.";
        }
        if (cleanPrompt.contains("burstiness")) {
            return "Burstiness analyzes the variation in sentence lengths. AI models tend to produce paragraphs with uniform sentence lengths (low burstiness), whereas humans naturally write in 'bursts'—mixing short, punchy sentences with long, complex ones.";
        }
        if (cleanPrompt.contains("consistency") || cleanPrompt.contains("uniformity") || cleanPrompt.contains("rhythm")) {
            return "Consistency checks the overall style matching across document segments. High consistency suggests a machine-generated origin. Human writing exhibits shifting flow and style variations.";
        }
        if (cleanPrompt.contains("api") || cleanPrompt.contains("sdk") || cleanPrompt.contains("webhook")) {
            return "To integrate Guardian, go to 'Settings' and enable Developer Keys. You can then invoke:\n`POST http://localhost:8080/api/detect/bulk-ai`\nwith a JSON payload containing the 'text' field.";
        }
        if (cleanPrompt.contains("privacy") || cleanPrompt.contains("data") || cleanPrompt.contains("security") || cleanPrompt.contains("store")) {
            return "Guardian operates on a Zero Retention framework. Your text inputs are processed strictly in RAM and are immediately scrubbed after analysis. We do not store, log, or use any user content to train future models.";
        }
        if (cleanPrompt.contains("how are you") || cleanPrompt.contains("how's it going")) {
            return "I am doing great! Ready to help you verify content authenticity and explain linguistic metrics. What are you working on today?";
        }
        if (cleanPrompt.contains("hello") || cleanPrompt.contains("hi ") || cleanPrompt.contains("hey")) {
            return "Hello! I am your Guardian AI Advisor. Ask me about language perplexity, sentence burstiness, verification APIs, or zero-retention privacy frameworks.";
        }

        // Generate a dynamic mock conversation structure
        String subject = extractSubject(cleanPrompt);
        return String.format(
            "Analyzing your question about '%s'. Under our linguistic verification framework, " +
            "this relates directly to pattern predictability. When assessing content authenticity, we analyze " +
            "semantic flow and word-choice entropy. Would you like me to explain how we calculate " +
            "perplexity or how to refine '%s'?",
            subject, subject
        );
    }

    private String extractSubject(String prompt) {
        String[] words = prompt.split("\\s+");
        List<String> stopwords = List.of("what", "is", "how", "to", "the", "a", "an", "about", "on", "can", "you", "me", "do", "for", "in", "of");
        for (int i = words.length - 1; i >= 0; i--) {
            String word = words[i].replaceAll("[^a-zA-Z]", "");
            if (word.length() > 3 && !stopwords.contains(word)) {
                return word;
            }
        }
        return "this topic";
    }
}
