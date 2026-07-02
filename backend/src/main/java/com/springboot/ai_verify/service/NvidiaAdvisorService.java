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
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(6);

    private final WebClient webClient;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

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

    // Gemini API Request payload structures
    public record GeminiPart(String text) {}

    public record GeminiContent(String role, List<GeminiPart> parts) {}

    public record GeminiInstruction(List<GeminiPart> parts) {}

    public record GeminiRequest(
            List<GeminiContent> contents,
            GeminiInstruction systemInstruction
    ) {}

    // Gemini API Response payload structures
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GeminiResponse(List<Candidate> candidates) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Candidate(Content content) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Content(List<GeminiPart> parts) {}

    public Mono<ResponseEntity<Map<String, String>>> chatWithNvidia(ChatRequest request) {
        if (request == null || request.prompt() == null || request.prompt().trim().isEmpty()) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("error", "Prompt is required.")));
        }
        
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            String prompt = request.prompt().toLowerCase();
            String fallbackReply = getFallbackAdvisorResponse(prompt);
            return Mono.just(ResponseEntity.ok(Map.of("text", fallbackReply)));
        }

        List<GeminiContent> contents = new ArrayList<>();
        
        // Convert history to Gemini format
        if (request.history() != null) {
            for (NvidiaMessage msg : request.history()) {
                String geminiRole = "user".equalsIgnoreCase(msg.role()) ? "user" : "model";
                contents.add(new GeminiContent(geminiRole, List.of(new GeminiPart(msg.content()))));
            }
        }
        
        // Add current prompt turn
        contents.add(new GeminiContent("user", List.of(new GeminiPart(request.prompt()))));
        
        // Build instruction
        GeminiInstruction sysInstr = new GeminiInstruction(List.of(new GeminiPart(SYSTEM_PROMPT)));
        GeminiRequest payload = new GeminiRequest(contents, sysInstr);

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;

        return webClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(GeminiResponse.class)
                .timeout(REQUEST_TIMEOUT)
                .map(response -> {
                    String text = (response.candidates() != null && !response.candidates().isEmpty() &&
                            response.candidates().getFirst().content() != null &&
                            response.candidates().getFirst().content().parts() != null &&
                            !response.candidates().getFirst().content().parts().isEmpty()) ?
                            response.candidates().getFirst().content().parts().getFirst().text() :
                            "Sorry, I couldn't get a valid response from Gemini.";
                    return ResponseEntity.ok(Map.of("text", text));
                })
                .onErrorResume(e -> {
                    log.error("Error calling Gemini API (falling back to mock responses): {}", e.getMessage());
                    if (e instanceof WebClientResponseException wcre) {
                        log.error("Error Status Code: {}", wcre.getStatusCode());
                        log.debug("Error Response Body: {}", wcre.getResponseBodyAsString());
                    }
                    String prompt = request.prompt().toLowerCase();
                    String fallbackReply = getFallbackAdvisorResponse(prompt);
                    return Mono.just(ResponseEntity.ok(Map.of("text", fallbackReply)));
                });
    }

    private String getFallbackAdvisorResponse(String prompt) {
        String cleanPrompt = prompt.trim().toLowerCase();
        
        if (cleanPrompt.contains("perplexity")) {
            return "Perplexity measures text predictability. Lower scores (e.g. < 30%) indicate high predictability, commonly associated with LLM generators like GPT-4 or Claude. Humans write with much higher perplexity because we make unexpected word choices.";
        }
        if (cleanPrompt.contains("burstiness")) {
            return "Burstiness analyzes the variation in sentence lengths. AI models tend to produce paragraphs with uniform sentence lengths (low burstiness), whereas humans naturally write in 'bursts'—mixing short, punchy sentences with long, complex ones.";
        }
        if (cleanPrompt.contains("consistency") || cleanPrompt.contains("uniformity") || cleanPrompt.contains("rhythm")) {
            return "Consistency checks the overall style matching across document segments. High consistency (e.g., matching perplexity spikes) suggests a machine-generated origin. Human writing exhibits shifting flow and style variations.";
        }
        if (cleanPrompt.contains("api") || cleanPrompt.contains("sdk") || cleanPrompt.contains("webhook")) {
            return "To integrate Guardian, go to 'Settings' and enable Developer Keys. You can then invoke:\n`POST http://localhost:8080/api/v2/analyze`\nwith a JSON payload containing the 'content' field. Our sub-15ms response latency is built for LMS/CMS workflows.";
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
            "perplexity or how to write an integration for '%s'?",
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
