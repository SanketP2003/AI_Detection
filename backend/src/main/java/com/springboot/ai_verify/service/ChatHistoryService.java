package com.springboot.ai_verify.service;

import com.springboot.ai_verify.exception.InvalidRequestException;
import com.springboot.ai_verify.exception.ResourceNotFoundException;
import com.springboot.ai_verify.model.ChatHistory;
import com.springboot.ai_verify.repository.ChatHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class ChatHistoryService {

    private static final int MAX_MESSAGE_LENGTH = 1000;
    private static final int MAX_RESPONSE_LENGTH = 2000;

    private final ChatHistoryRepository chatHistoryRepository;

    public ChatHistoryService(ChatHistoryRepository chatHistoryRepository) {
        this.chatHistoryRepository = chatHistoryRepository;
    }

    @Transactional
    public ChatHistory logChatExchange(String username, String message, String response) {
        validateUsername(username);
        if (message == null || message.isBlank()) {
            throw new InvalidRequestException("Message is required");
        }

        ChatHistory chat = new ChatHistory();
        chat.setUsername(username);
        chat.setMessage(truncate(message, MAX_MESSAGE_LENGTH));
        chat.setResponse(truncate(response, MAX_RESPONSE_LENGTH));
        chat.setCreatedAt(Instant.now());
        return chatHistoryRepository.save(chat);
    }

    public List<ChatHistory> recentForUser(String username) {
        validateUsername(username);
        return chatHistoryRepository.findTop20ByUsernameOrderByCreatedAtDesc(username);
    }

    public List<ChatHistory> allForUser(String username) {
        validateUsername(username);
        return chatHistoryRepository.findTop100ByUsernameOrderByCreatedAtDesc(username);
    }

    public List<ChatHistory> recentForAdmin() {
        return chatHistoryRepository.findTop100ByOrderByCreatedAtDesc();
    }

    public List<ChatHistory> allForUserAsAdmin(String username) {
        validateUsername(username);
        return chatHistoryRepository.findAllByUsernameOrderByCreatedAtDesc(username);
    }

    public long getTotalCount() {
        return chatHistoryRepository.count();
    }

    @Transactional
    public void deleteByIdForUser(Long id, String username) {
        validateId(id);
        validateUsername(username);

        long deletedCount = chatHistoryRepository.deleteByIdAndUsername(id, username);
        if (deletedCount > 0) {
            return;
        }

        if (!chatHistoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Chat not found");
        }

        throw new InvalidRequestException("You do not have permission to delete this chat");
    }

    @Transactional
    public void deleteByIdAsAdmin(Long id) {
        validateId(id);
        if (!chatHistoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Chat not found");
        }
        chatHistoryRepository.deleteById(id);
    }

    private void validateUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new InvalidRequestException("Username is required");
        }
    }

    private void validateId(Long id) {
        if (id == null || id <= 0) {
            throw new InvalidRequestException("Valid ID is required");
        }
    }

    private String truncate(String text, int maxLength) {
        if (text == null) {
            return null;
        }
        if (text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + "...";
    }
}
