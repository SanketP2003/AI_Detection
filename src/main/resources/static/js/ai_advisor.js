document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatHistory = document.getElementById('chatHistory');
    const chatMessages = document.getElementById('chatMessages');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const newChatBtn = document.getElementById('newChatBtn');
    const suggestionCards = document.querySelectorAll('.suggestion-card');

    // --- Configuration ---
    // Make sure this URL matches your Spring Boot application's address
    const API_BASE_URL = 'http://localhost:8080';

    // State variables
    let currentChatId = null;
    let chats = JSON.parse(localStorage.getItem('aiChats')) || [];
    let isWaitingForResponse = false;

    // Initialize the app
    function initApp() {
        renderChatHistory();
        if (chats.length > 0) {
            // Open the most recent chat
            openChat(chats[0].id);
        }

        // Add event listeners
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keydown', handleKeyDown);
        newChatBtn.addEventListener('click', createNewChat);

        // Add event listeners to suggestion cards
        suggestionCards.forEach(card => {
            card.addEventListener('click', () => {
                const prompt = card.getAttribute('data-prompt');
                if (!currentChatId) {
                    createNewChat();
                }
                messageInput.value = prompt;
                sendMessage();
            });
        });
    }

    // Render chat history in sidebar
    function renderChatHistory() {
        chatHistory.innerHTML = '';

        if (chats.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'chat-timestamp';
            emptyState.textContent = 'No chats yet';
            chatHistory.appendChild(emptyState);
            return;
        }

        // Sort chats by most recent timestamp before rendering
        chats.sort((a, b) => b.timestamp - a.timestamp);

        chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = `chat-history-item ${currentChatId === chat.id ? 'active' : ''}`;
            chatItem.dataset.id = chat.id;

            chatItem.innerHTML = `
                <div class="chat-item-header">
                  <div class="chat-title">${chat.title}</div>
                  <button class="delete-btn" data-id="${chat.id}">×</button>
                </div>
                <div class="chat-timestamp">${formatDate(chat.timestamp)}</div>
            `;

            chatItem.addEventListener('click', () => openChat(chat.id));

            const deleteBtn = chatItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteChat(chat.id);
            });

            chatHistory.appendChild(chatItem);
        });
    }

    // Format date for display
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours} hr ago`;
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }

    // Create a new chat
    function createNewChat() {
        const newChat = {
            id: Date.now(),
            title: 'New Chat',
            timestamp: Date.now(),
            messages: []
        };

        chats.unshift(newChat);
        saveChats();
        openChat(newChat.id);
        renderChatHistory(); // No need to call this here, openChat does it.
    }

    // Open a chat
    function openChat(chatId) {
        const chat = chats.find(c => c.id === chatId);
        if (!chat) return;

        currentChatId = chatId;
        welcomeScreen.style.display = 'none';
        chatMessages.style.display = 'flex';
        chatMessages.innerHTML = '';

        chat.messages.forEach(message => {
            addMessageToUI(message.role, message.content);
        });

        chatMessages.scrollTop = chatMessages.scrollHeight;
        renderChatHistory();
    }

    // Delete a chat
    function deleteChat(chatId) {
        chats = chats.filter(chat => chat.id !== chatId);

        if (currentChatId === chatId) {
            currentChatId = null;
            welcomeScreen.style.display = 'flex';
            chatMessages.style.display = 'none';
            chatMessages.innerHTML = '';
        }

        saveChats();
        renderChatHistory();
        // If no chats are left, show the welcome screen
        if (chats.length === 0) {
            welcomeScreen.style.display = 'flex';
            chatMessages.style.display = 'none';
        } else if (currentChatId === null) {
            // If the deleted chat was active, open the most recent one
            openChat(chats[0].id);
        }
    }

    // Save chats to localStorage
    function saveChats() {
        localStorage.setItem('aiChats', JSON.stringify(chats));
    }

    // Handle Enter key
    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    // Send a message
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (!message || isWaitingForResponse) return;

        if (!currentChatId) {
            createNewChat();
        }

        const chat = chats.find(c => c.id === currentChatId);

        // Add user message to state and UI
        addMessageToUI('user', message);
        chat.messages.push({ role: 'user', content: message });

        if (chat.messages.length === 1) {
            chat.title = message.length > 30 ? message.substring(0, 30) + '...' : message;
        }

        messageInput.value = '';
        showTypingIndicator();
        isWaitingForResponse = true;

        try {
            // *** MODIFICATION START: Call the real backend API ***
            const aiResponse = await getAiResponse(message, chat.messages);

            removeTypingIndicator();

            // Add AI response to state and UI
            addMessageToUI('ai', aiResponse);
            chat.messages.push({ role: 'ai', content: aiResponse });

            // Update timestamp and save
            chat.timestamp = Date.now();
            saveChats();
            renderChatHistory();
            // *** MODIFICATION END ***

        } catch (error) {
            console.error('Error:', error);
            removeTypingIndicator();
            const errorMessage = error.message || 'Sorry, I encountered an error. Please try again.';
            addMessageToUI('ai', errorMessage);
        }

        isWaitingForResponse = false;
    }

    // Add message to UI
    function addMessageToUI(role, content) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${role}-message`;

        const avatarClass = role === 'ai' ? 'ai-avatar-small' : 'user-avatar-small';
        const avatarText = role === 'ai' ? 'AI' : 'You'; // Changed for clarity

        // Note: Using a library like 'marked' would be better for rendering markdown
        const formattedContent = content.replace(/```python\n([\s\S]*?)\n```/g, '<pre><code>$1</code></pre>')
            .replace(/```\n([\s\S]*?)\n```/g, '<pre><code>$1</code></pre>')
            .replace(/\n/g, '<br>');


        messageElement.innerHTML = `
            <div class="message-header">
                <div class="message-avatar ${avatarClass}">${avatarText.substring(0,2)}</div>
                <strong>${avatarText}</strong>
            </div>
            <div class="message-content">${formattedContent}</div>
        `;

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Show typing indicator
    function showTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.className = 'message ai-message'; // Match AI message style
        typingElement.id = 'typingIndicator';
        typingElement.innerHTML = `
             <div class="message-header">
                <div class="message-avatar ai-avatar-small">AI</div>
                <strong>AI Assistant</strong>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;

        chatMessages.appendChild(typingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Remove typing indicator
    function removeTypingIndicator() {
        const typingElement = document.getElementById('typingIndicator');
        if (typingElement) {
            typingElement.remove();
        }
    }

    // *** NEW FUNCTION: Replaces simulateApiCall to integrate with the backend ***
    async function getAiResponse(prompt, history) {
        // We send all messages *except* the latest user one as history.
        // The latest one is the new 'prompt'.
        const historyForApi = history.slice(0, -1).map(msg => ({
            role: msg.role === 'ai' ? 'model' : 'user', // Map frontend roles to backend roles
            text: msg.content
        }));

        const payload = {
            prompt: prompt,
            history: historyForApi
        };

        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // The backend returns a JSON object like { "text": "AI response" }
        return data.text;
    }

    // Initialize the app
    initApp();
});