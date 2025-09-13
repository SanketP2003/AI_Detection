(function () {
    const state = {
        chats: [],
        activeChatId: null,
        currentUser: {username: 'Guest', initials: 'G'},
        isAITyping: false,
    };

    const elements = {
        messageInput: document.getElementById('messageInput'),
        sendButton: document.getElementById('sendButton'),
        chatMessages: document.getElementById('chatMessages'),
        newChatBtn: document.getElementById('newChatBtn'),
        chatHistoryContainer: document.getElementById('chatHistory').querySelector('.history-items-grid'),
        welcomeScreen: document.getElementById('welcomeScreen'),
        userName: document.getElementById('userName'),
        userAvatar: document.getElementById('userAvatar'),
        menuToggle: document.getElementById('menuToggle'),
        sidebar: document.getElementById('sidebar'),
        sidebarOverlay: document.getElementById('sidebarOverlay'),
        logoutBtn: document.getElementById('logoutBtn'),
    };

    async function init() {
        setupEventListeners();
        await loadInitialState();
        autoResizeTextarea();
        updateSendButtonState();
    }

    function setupEventListeners() {
        elements.sendButton.addEventListener('click', handleSendMessage);
        elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
        elements.messageInput.addEventListener('input', () => {
            autoResizeTextarea();
            updateSendButtonState();
        });
        elements.newChatBtn.addEventListener('click', startNewChat);
        elements.menuToggle.addEventListener('click', toggleSidebar);
        elements.sidebarOverlay.addEventListener('click', toggleSidebar);
        elements.chatHistoryContainer.addEventListener('click', handleHistoryClick);
        elements.logoutBtn.addEventListener('click', () => {
            window.location.href = '/logout';
        });
    }

    async function loadInitialState() {
        try {
            const response = await fetch('/api/user/me');
            if (response.ok) {
                const userData = await response.json();
                if (userData && userData.authenticated) {
                    state.currentUser.username = userData.username;
                    state.currentUser.initials = userData.username.charAt(0).toUpperCase();
                }
            }
        } catch (error) {
            console.error('Failed to fetch user information:', error);
        }
        elements.userName.textContent = state.currentUser.username;
        elements.userAvatar.textContent = state.currentUser.initials;
        const storedChats = localStorage.getItem('aura_chats');
        state.chats = storedChats ? JSON.parse(storedChats) : [];

        const storedActiveChatId = localStorage.getItem('aura_activeChatId');

        if (storedActiveChatId && state.chats.find(c => c.id === storedActiveChatId)) {
            state.activeChatId = storedActiveChatId;
        } else if (state.chats.length > 0) {
            state.activeChatId = state.chats[0].id;
        } else {
            startNewChat(false);
        }

        renderUI();
    }

    function saveState() {
        localStorage.setItem('aura_chats', JSON.stringify(state.chats));
        localStorage.setItem('aura_activeChatId', state.activeChatId);
    }

    function renderUI() {
        renderChatHistory();
        renderActiveChatMessages();
    }

    function renderChatHistory() {
        elements.chatHistoryContainer.innerHTML = '';
        state.chats.forEach(chat => {
            const item = document.createElement('div');
            item.className = `history-item ${chat.id === state.activeChatId ? 'active' : ''}`;
            item.dataset.id = chat.id;
            item.innerHTML = `
                <i class="far fa-comment-alt"></i>
                <span class="history-title">${chat.title}</span>
                <button class="delete-chat-btn" data-id="${chat.id}" aria-label="Delete chat"><i class="fas fa-trash"></i></button>
            `;
            elements.chatHistoryContainer.appendChild(item);
        });
    }

    function renderActiveChatMessages() {
        const activeChat = state.chats.find(chat => chat.id === state.activeChatId);
        elements.chatMessages.innerHTML = '';
        if (!activeChat || activeChat.messages.length === 0) {
            elements.welcomeScreen.style.display = 'flex';
        } else {
            elements.welcomeScreen.style.display = 'none';
            activeChat.messages.forEach(msg => addMessageToDOM(msg.role, msg.text));
        }
        scrollToBottom();
    }

    async function handleSendMessage() {
        const prompt = elements.messageInput.value.trim();
        if (!prompt || state.isAITyping) return;

        state.isAITyping = true;
        updateSendButtonState();

        const activeChat = state.chats.find(c => c.id === state.activeChatId);
        if (activeChat.messages.length === 0) {
            activeChat.title = prompt.substring(0, 30) + (prompt.length > 30 ? '...' : '');
        }

        addMessageToHistory('user', prompt);
        addMessageToDOM('user', prompt);
        clearInput();
        renderChatHistory();
        showTypingIndicator();

        const historyForApi = activeChat.messages.slice(0, -1)
            .filter(msg => msg.role !== 'error')
            .map(msg => ({
                role: msg.role === 'ai' ? 'assistant' : msg.role,
                content: msg.text
            }));

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    history: historyForApi
                })
            });

            if (!response.ok) {
                const errorJson = await response.json().catch(() => null);
                const detail = errorJson?.detail ? JSON.stringify(errorJson.detail) : 'No further details.';
                const errorMessage = `API Error: ${response.statusText} (${response.status}). ${detail}`;
                throw new Error(errorMessage);
            }

            const data = await response.json();
            addMessageToHistory('ai', data.text);
            addMessageToDOM('ai', data.text);

        } catch (error) {
            console.error('Error fetching AI response:', error);
            const errorMessage = `Sorry, I encountered an error: ${error.message}`;
            addMessageToHistory('error', errorMessage);
            addMessageToDOM('error', errorMessage);
        } finally {
            removeTypingIndicator();
            state.isAITyping = false;
            updateSendButtonState();
            elements.messageInput.focus();
        }
    }

    function addMessageToHistory(role, text) {
        const activeChat = state.chats.find(chat => chat.id === state.activeChatId);
        if (activeChat) {
            activeChat.messages.push({role, text});
            saveState();
        }
    }

    function addMessageToDOM(sender, text) {
        elements.welcomeScreen.style.display = 'none';
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${sender}`;

        let avatarIcon;
        if (sender === 'user') {
            avatarIcon = state.currentUser.initials;
        } else if (sender === 'ai') {
            avatarIcon = '<svg width="24" height="24" viewBox="0 0 24 24" ...></svg>';
        } else { // error
            avatarIcon = '<i class="fas fa-exclamation-triangle"></i>';
        }

        bubble.innerHTML = `
            <div class="message-avatar">${avatarIcon}</div>
            <div class="message-content">${marked.parse(text)}</div>`;

        elements.chatMessages.appendChild(bubble);
        scrollToBottom();
    }

    function startNewChat(save = true) {
        const newChat = {id: `chat_${Date.now()}`, title: 'New Chat', messages: []};
        state.chats.unshift(newChat);
        state.activeChatId = newChat.id;
        if (save) saveState();
        renderUI();
        clearInput();
        if (window.innerWidth <= 768) toggleSidebar();
        elements.messageInput.focus();
    }

    function handleHistoryClick(e) {
        const target = e.target.closest('.history-item');
        const deleteButton = e.target.closest('.delete-chat-btn');

        if (deleteButton) {
            e.stopPropagation(); // Prevent selecting chat when deleting
            const chatIdToDelete = deleteButton.dataset.id;
            deleteChat(chatIdToDelete);
        } else if (target && target.dataset.id !== state.activeChatId) {
            state.activeChatId = target.dataset.id;
            saveState();
            renderUI();
            if (window.innerWidth <= 768) toggleSidebar();
        }
    }

    async function deleteChat(chatId) {
        if (!confirm('Are you sure you want to delete this chat?')) {
            return;
        }

        // Remove from state
        state.chats = state.chats.filter(chat => chat.id !== chatId);

        // If the deleted chat was the active one, switch to the most recent or start new
        if (state.activeChatId === chatId) {
            if (state.chats.length > 0) {
                state.activeChatId = state.chats[0].id;
            } else {
                state.activeChatId = null; // No active chat
                startNewChat(false); // Start a new chat without saving immediately
            }
        }
        saveState();
        renderUI();

        // Optionally, call backend API to delete from database if chats were persisted there
        // try {
        //     await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
        // } catch (error) {
        //     console.error('Failed to delete chat from backend:', error);
        // }
    }

    // --- UI Helpers ---
    function clearInput() {
        elements.messageInput.value = '';
        autoResizeTextarea();
        updateSendButtonState();
    }

    function autoResizeTextarea() {
        const el = elements.messageInput;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }

    function updateSendButtonState() {
        elements.sendButton.disabled = elements.messageInput.value.trim().length === 0 || state.isAITyping;
    }

    function showTypingIndicator() {
        if (document.querySelector('.typing-indicator')) return;
        const indicator = document.createElement('div');
        indicator.className = 'message-bubble ai typing-indicator';
        indicator.innerHTML = `
             <div class="message-avatar"><svg width="24" height="24" viewBox="0 0 24 24" ...></svg></div>
             <div class="message-content"><span></span><span></span><span></span></div>`;
        elements.chatMessages.appendChild(indicator);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const indicator = elements.chatMessages.querySelector('.typing-indicator');
        if (indicator) indicator.remove();
    }

    function scrollToBottom() {
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }

    function toggleSidebar() {
        elements.sidebar.classList.toggle('visible');
        elements.sidebarOverlay.classList.toggle('visible');
    }

    init();
})();
