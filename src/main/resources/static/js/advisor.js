(function () {
    // State Management
    const state = {
        chats: [],
        activeChatId: null,
        currentUser: { username: 'Guest', initials: 'U' },
        isSidebarOpen: false,
        isContextualPanelOpen: false
    };

    // DOM Elements
    const elements = {
        messageInput: document.getElementById('messageInput'),
        sendButton: document.getElementById('sendButton'),
        clearButton: document.getElementById('clearButton'),
        chatMessages: document.getElementById('chatMessages'),
        newChatBtn: document.getElementById('newChatBtn'),
        chatHistory: document.getElementById('chatHistory'),
        menuToggle: document.getElementById('menuToggle'),
        sidebar: document.getElementById('sidebar'),
        sidebarOverlay: document.getElementById('sidebarOverlay'),
        newChatNav: document.getElementById('newChatNav'),
        historyNav: document.getElementById('historyNav'),
        profileNav: document.getElementById('profileNav'),
        toolsNav: document.getElementById('toolsNav'),
        contextualPanel: document.getElementById('contextualPanel'),
        logoutBtn: document.getElementById('logoutBtn'),
        welcomeScreen: document.getElementById('welcomeScreen'),
        pinBtn: document.querySelector('button[aria-label*="Pin conversation"]'),
        exportBtn: document.querySelector('button[aria-label="Export chat"]'),
        aiDetectionBtn: document.getElementById('aiDetectionBtn'),
        themeBtn: document.querySelector('button[aria-label="Toggle theme"]')
    };

    // Storage Utility
    const storage = {
        saveChats() {
            localStorage.setItem('aura_chats', JSON.stringify(state.chats));
        },
        loadChats() {
            const stored = localStorage.getItem('aura_chats');
            if (stored) state.chats = JSON.parse(stored);
        },
        clearChats() {
            localStorage.removeItem('aura_chats');
            state.chats = [];
            state.activeChatId = null;
        }
    };

    // UI Rendering
    const ui = {
        renderChatHistory() {
            const grid = elements.chatHistory.querySelector('.history-items-grid');
            grid.innerHTML = '';
            elements.chatHistory.querySelector('.no-chats-message').style.display = state.chats.length ? 'none' : 'block';

            const sorted = [...state.chats].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || parseInt(b.id) - parseInt(a.id));
            sorted.forEach(chat => {
                const item = document.createElement('div');
                item.className = `history-item ${chat.id === state.activeChatId ? 'active' : ''}`;
                item.dataset.id = chat.id;
                item.setAttribute('role', 'button');
                item.setAttribute('tabindex', '0');
                item.setAttribute('aria-label', `Select chat: ${chat.title}`);
                item.innerHTML = `
                    <div class="history-content">
                        <i class="fas ${chat.pinned ? 'fa-thumbtack' : 'fa-comment-dots'}" aria-hidden="true"></i>
                        <div class="history-details">
                            <span class="history-title" title="${chat.title}">${chat.title}</span>
                            <span class="history-preview">${chat.messages[0]?.text?.substring(0, 30) || 'No messages'}${chat.messages[0]?.text?.length > 30 ? '...' : ''}</span>
                            <span class="history-date">${new Date(parseInt(chat.id)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                    </div>
                    <button class="delete-chat-btn" data-id="${chat.id}" aria-label="Delete chat">
                        <i class="fas fa-trash-alt" aria-hidden="true"></i>
                    </button>
                `;
                grid.appendChild(item);
            });
        },
        renderActiveChatMessages() {
            const activeChat = state.chats.find(chat => chat.id === state.activeChatId);
            elements.chatMessages.innerHTML = '';
            elements.welcomeScreen.style.display = activeChat?.messages.length ? 'none' : 'block';

            if (activeChat?.messages.length) {
                activeChat.messages.forEach(message => ui.addMessage(message.role, message.text));
                elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
            }
        },
        addMessage(sender, text) {
            const bubble = document.createElement('div');
            bubble.className = `message-bubble ${sender}`;
            bubble.innerHTML = `
                <div class="message-avatar ${sender}">${sender === 'user' ? state.currentUser.initials : '<i class="fas fa-robot"></i>'}</div>
                <div class="message-content">${marked.parse(text)}</div>
            `;
            elements.chatMessages.appendChild(bubble);
            bubble.querySelectorAll('pre').forEach(ui.enhanceCodeBlock);
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        },
        showTypingIndicator() {
            const typing = document.createElement('div');
            typing.className = 'loading-indicator';
            typing.innerHTML = '<div class="spinner"></div><p>AI is thinking...</p>';
            elements.chatMessages.appendChild(typing);
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        },
        removeTypingIndicator() {
            const indicator = elements.chatMessages.querySelector('.loading-indicator');
            if (indicator) indicator.remove();
        },
        enhanceCodeBlock(preElement) {
            const code = preElement.querySelector('code');
            if (!code) return;
            const lang = code.className.match(/language-(\S+)/)?.[1] || 'text';
            const header = document.createElement('div');
            header.className = 'code-header';
            header.innerHTML = `<span>${lang}</span><button class="copy-code-btn"><i class="far fa-copy"></i> Copy code</button>`;
            preElement.insertBefore(header, code);
            header.querySelector('.copy-code-btn').addEventListener('click', () => {
                navigator.clipboard.writeText(code.innerText).then(() => {
                    header.querySelector('.copy-code-btn').innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => {
                        header.querySelector('.copy-code-btn').innerHTML = '<i class="far fa-copy"></i> Copy code';
                    }, 2000);
                });
            });
        },
        updatePinButtonLabel() {
            if (!elements.pinBtn) return;
            const activeChat = state.chats.find(c => c.id === state.activeChatId);
            const isPinned = activeChat?.pinned;
            elements.pinBtn.innerHTML = `<i class="fas fa-thumbtack"></i> ${isPinned ? 'Unpin' : 'Pin'} Conversation`;
            elements.pinBtn.setAttribute('aria-label', `${isPinned ? 'Unpin' : 'Pin'} conversation`);
        },
        toggleTheme() {
            document.body.classList.toggle('light');
            localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
        },
        showAiDetectionResult(result) {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'ai-detection-result';
            if (result.error) {
                resultDiv.innerHTML = `
                    <h3>AI Detection Error</h3>
                    <p>${result.error}</p>
                `;
            } else {
                resultDiv.innerHTML = `
                    <h3>AI Detection Results</h3>
                    <p><strong>Probability of AI-generated content:</strong> ${result.probability}%</p>
                    <div class="metrics">
                        <div class="metric"><strong>Perplexity:</strong> ${result.metrics.perplexity}</div>
                        <div class="metric"><strong>Burstiness:</strong> ${result.metrics.burstiness}</div>
                        <div class="metric"><strong>Consistency:</strong> ${result.metrics.consistency}</div>
                    </div>
                    <p><strong>Analysis:</strong> ${result.analysis}</p>
                    <p class="patterns"><strong>Patterns:</strong> ${result.patterns.join(', ')}</p>
                `;
            }
            elements.chatMessages.innerHTML = '';
            elements.welcomeScreen.style.display = 'none';
            elements.chatMessages.appendChild(resultDiv);
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        }
    };

    // Chat Management
    const chat = {
        startNew() {
            const newChat = {
                id: Date.now().toString(),
                title: 'New Chat',
                messages: [],
                pinned: false
            };
            state.chats.unshift(newChat);
            state.activeChatId = newChat.id;
            storage.saveChats();
            ui.renderChatHistory();
            ui.renderActiveChatMessages();
            ui.updatePinButtonLabel();
            ui.closeSidebar();
            ui.closeContextualPanel();
        },
        delete(id) {
            state.chats = state.chats.filter(chat => chat.id !== id);
            if (state.activeChatId === id) {
                state.activeChatId = state.chats.length ? state.chats[0].id : null;
                ui.renderActiveChatMessages();
            }
            storage.saveChats();
            ui.renderChatHistory();
        },
        pin(id) {
            const chat = state.chats.find(c => c.id === id);
            if (chat) {
                chat.pinned = !chat.pinned;
                storage.saveChats();
                ui.renderChatHistory();
                ui.updatePinButtonLabel();
            }
        },
        export(id) {
            const chat = state.chats.find(c => c.id === id);
            if (!chat) return;
            const blob = new Blob([JSON.stringify(chat.messages, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `aura_chat_${chat.id}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    // API Handler
    const api = {
        async sendMessage(prompt, history) {
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ prompt, history })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'The AI service returned an invalid response.' }));
                    throw new Error(errorData.error || 'The AI service failed to respond.');
                }

                return response.json();
            } catch (error) {
                console.error('Error calling chat API:', error);
                throw error; // Re-throw to be handled by the caller
            }
        },
        async detectAiContent(text) {
            try {
                const response = await fetch('/api/detect/bulk-ai', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ text })
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch AI detection results');
                }
                return response.json();
            } catch (error) {
                return { error: error.message };
            }
        },
        async fetchUser() {
            // Mock user fetch
            return { authenticated: true, username: 'user@example.com' };
        },
        async logout() {
            // Mock logout
            return true;
        }
    };

    // Event Handlers
    const handlers = {
        async sendMessage() {
            const prompt = elements.messageInput.value.trim();
            if (!prompt) return;

            let activeChat = state.chats.find(c => c.id === state.activeChatId);
            if (!activeChat) {
                chat.startNew();
                activeChat = state.chats.find(c => c.id === state.activeChatId);
            }

            if (!activeChat.messages.length) {
                activeChat.title = prompt.substring(0, 30) + (prompt.length > 30 ? '...' : '');
            }

            activeChat.messages.push({ role: 'user', text: prompt });
            ui.addMessage('user', prompt);
            elements.messageInput.value = '';
            ui.autoResizeTextarea();
            ui.showTypingIndicator();

            try {
                const historyForApi = activeChat.messages
                    .slice(0, -1)
                    .map(msg => ({ role: msg.role, content: msg.text }))
                    .filter(msg => msg.content && String(msg.content).trim() !== '');
                const response = await api.sendMessage(prompt, historyForApi);
                activeChat.messages.push({ role: 'assistant', text: response.text });
                ui.addMessage('ai', response.text);
                storage.saveChats();
                ui.renderChatHistory();
            } catch (error) {
                ui.addMessage('ai', `Error: ${error.message}`);
            } finally {
                ui.removeTypingIndicator();
            }
        },
        async runAiDetection() {
            const activeChat = state.chats.find(c => c.id === state.activeChatId);
            if (!activeChat || !activeChat.messages.length) {
                ui.showAiDetectionResult({ error: 'No messages in the current chat to analyze.' });
                return;
            }

            const textToAnalyze = activeChat.messages
                .filter(m => m.role === 'assistant')
                .map(m => m.text)
                .join('\n');

            if (textToAnalyze.length < 10) {
                ui.showAiDetectionResult({ error: 'Text content must be at least 10 characters long.' });
                return;
            }

            ui.showTypingIndicator();
            const result = await api.detectAiContent(textToAnalyze);
            ui.removeTypingIndicator();
            ui.showAiDetectionResult(result);
            ui.closeContextualPanel();
        },
        handleChatHistoryClick(e) {
            const historyItem = e.target.closest('.history-item');
            const deleteButton = e.target.closest('.delete-chat-btn');
            if (deleteButton) {
                e.stopPropagation();
                chat.delete(deleteButton.dataset.id);
            } else if (historyItem) {
                state.activeChatId = historyItem.dataset.id;
                ui.renderActiveChatMessages();
                ui.renderChatHistory();
                ui.closeSidebar();
            }
        },
        handleChatHistoryKeydown(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                const historyItem = e.target.closest('.history-item');
                if (historyItem) {
                    state.activeChatId = historyItem.dataset.id;
                    ui.renderActiveChatMessages();
                    ui.renderChatHistory();
                    ui.closeSidebar();
                }
            }
        }
    };

    // UI Utilities
    ui.autoResizeTextarea = () => {
        elements.messageInput.style.height = 'auto';
        elements.messageInput.style.height = `${Math.min(elements.messageInput.scrollHeight, 150)}px`;
    };

    ui.openSidebar = () => {
        state.isSidebarOpen = true;
        elements.sidebar.classList.add('visible');
        elements.sidebarOverlay.style.display = 'block';
    };

    ui.closeSidebar = () => {
        state.isSidebarOpen = false;
        elements.sidebar.classList.remove('visible');
        elements.sidebarOverlay.style.display = 'none';
    };

    ui.openContextualPanel = () => {
        state.isContextualPanelOpen = true;
        elements.contextualPanel.classList.add('visible');
        elements.sidebarOverlay.style.display = 'block';
    };

    ui.closeContextualPanel = () => {
        state.isContextualPanelOpen = false;
        elements.contextualPanel.classList.remove('visible');
        elements.sidebarOverlay.style.display = 'none';
    };

    // Initialization
    async function init() {
        storage.loadChats();
        if (state.chats.length) {
            state.activeChatId = state.chats[0].id;
        } else {
            chat.startNew();
        }

        try {
            const user = await api.fetchUser();
            if (user.authenticated && user.username) {
                state.currentUser.username = user.username;
                const parts = user.username.split('@')[0].replace(/[^a-zA-Z0-9 ]/g, ' ').trim().split(/\s+/);
                state.currentUser.initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0]?.slice(0, 2).toUpperCase() || 'U';
                document.querySelector('.user-name').textContent = user.username;
                document.querySelector('.user-avatar').textContent = state.currentUser.initials;
            }
        } catch (e) {
            console.warn('Failed to fetch user:', e);
        }

        ui.renderChatHistory();
        ui.renderActiveChatMessages();
        ui.autoResizeTextarea();
        ui.updatePinButtonLabel();

        // Load theme
        if (localStorage.getItem('theme') === 'light') {
            document.body.classList.add('light');
        }

        // Event Listeners
        elements.newChatBtn.addEventListener('click', chat.startNew);
        elements.newChatNav.addEventListener('click', chat.startNew);
        elements.sendButton.addEventListener('click', handlers.sendMessage);
        elements.clearButton.addEventListener('click', () => {
            elements.messageInput.value = '';
            ui.autoResizeTextarea();
        });
        elements.menuToggle.addEventListener('click', ui.openSidebar);
        elements.historyNav.addEventListener('click', ui.openSidebar);
        elements.profileNav.addEventListener('click', ui.openSidebar);
        elements.toolsNav.addEventListener('click', ui.openContextualPanel);
        elements.sidebarOverlay.addEventListener('click', () => {
            ui.closeSidebar();
            ui.closeContextualPanel();
        });
        elements.logoutBtn.addEventListener('click', async () => {
            storage.clearChats();
            await api.logout();
            window.location.href = 'index.html';
        });
        elements.messageInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handlers.sendMessage();
            }
        });
        elements.messageInput.addEventListener('input', ui.autoResizeTextarea);
        elements.chatHistory.addEventListener('click', handlers.handleChatHistoryClick);
        elements.chatHistory.addEventListener('keydown', handlers.handleChatHistoryKeydown);
        elements.pinBtn?.addEventListener('click', () => chat.pin(state.activeChatId));
        elements.exportBtn?.addEventListener('click', () => chat.export(state.activeChatId));
        elements.aiDetectionBtn?.addEventListener('click', handlers.runAiDetection);
        elements.themeBtn?.addEventListener('click', ui.toggleTheme);
        elements.welcomeScreen.querySelectorAll('.suggestion-card').forEach(card => {
            card.addEventListener('click', () => {
                elements.messageInput.value = card.dataset.prompt;
                handlers.sendMessage();
            });
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();