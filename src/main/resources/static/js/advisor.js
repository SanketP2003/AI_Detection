document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.querySelector('.chat-messages');
    const chatInput = document.querySelector('.chat-input input');
    const sendButton = document.querySelector('.chat-input button');

    function createMessageElement(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : ''}`;

        const timestamp = new Date().toLocaleTimeString([], {
            hour: '2-digit', minute: '2-digit'
        });

        messageDiv.innerHTML = `
            <p>${text}</p>
            <span class="timestamp">${timestamp} ${isUser ? '✅' : ''}</span>
        `;
        return messageDiv;
    }

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // Add user message
        chatMessages.appendChild(createMessageElement(message, true));
        chatInput.value = '';

        // Add loading indicator
        const loading = createMessageElement('Thinking...');
        chatMessages.appendChild(loading);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: message })
            });

            const data = await response.json();
            chatMessages.removeChild(loading);

            if (data.error) {
                chatMessages.appendChild(createMessageElement(`Error: ${data.error}`));
            } else {
                chatMessages.appendChild(createMessageElement(data.text));
            }
        } catch (error) {
            chatMessages.removeChild(loading);
            chatMessages.appendChild(createMessageElement('Connection error. Please try again.'));
        }

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Event Listeners
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.querySelector('.chat-messages');
    const chatInput = document.querySelector('.chat-input input');
    const sendButton = document.querySelector('.chat-input button');
    const newChatBtn = document.querySelector('.nav-section h3'); // New Chat button
    const historyBtn = document.querySelector('.nav-item[href="#"]'); // History button
    let currentChatId = null;

    // History Modal Elements
    const historyModal = document.createElement('div');
    historyModal.className = 'history-modal';
    historyModal.innerHTML = `
        <div class="history-content">
            <div class="history-header">
                <h3>Chat History</h3>
                <span class="close-history">&times;</span>
            </div>
            <div class="history-list"></div>
        </div>
    `;
    document.body.appendChild(historyModal);

    // Load existing history
    let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];

    // Create new chat
    function createNewChat() {
        // Save current chat if exists
        if(currentChatId && chatMessages.children.length > 0) {
            const existingChat = chatHistory.find(c => c.id === currentChatId);
            if(!existingChat) {
                chatHistory.push({
                    id: currentChatId,
                    title: chatMessages.children[0].textContent.slice(0, 30) + '...',
                    timestamp: new Date().toISOString(),
                    messages: Array.from(chatMessages.children).map(msg => msg.outerHTML)
                });
            }
        }

        // Create new chat
        currentChatId = Date.now().toString();
        chatMessages.innerHTML = '';
        chatInput.value = '';
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        updateHistoryList();
    }

    // Update history list UI
    function updateHistoryList() {
        const historyList = historyModal.querySelector('.history-list');
        historyList.innerHTML = chatHistory
            .map(chat => `
                <div class="history-item" data-chatid="${chat.id}">
                    <div class="history-item-header">
                        <span>${chat.title}</span>
                        <small>${new Date(chat.timestamp).toLocaleDateString()}</small>
                    </div>
                    <button class="delete-history">&times;</button>
                </div>
            `).join('');
    }

    // Load chat from history
    function loadChat(chatId) {
        const chat = chatHistory.find(c => c.id === chatId);
        if(chat) {
            currentChatId = chatId;
            chatMessages.innerHTML = chat.messages.join('');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // Message creation (same as before)
    function createMessageElement(text, isUser = false) {
        // ... (keep previous implementation)
    }

    // Modified sendMessage function
    async function sendMessage() {
        // ... (keep previous implementation)
        // Add auto-save after successful response
        if(!currentChatId) createNewChat();
        // ... rest of implementation
    }

    // Event Listeners
    newChatBtn.addEventListener('click', () => {
        createNewChat();
    });

    historyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        historyModal.style.display = 'block';
        updateHistoryList();
    });

    historyModal.querySelector('.close-history').addEventListener('click', () => {
        historyModal.style.display = 'none';
    });

    historyModal.addEventListener('click', (e) => {
        if(e.target.classList.contains('history-item')) {
            loadChat(e.target.dataset.chatid);
            historyModal.style.display = 'none';
        }
        if(e.target.classList.contains('delete-history')) {
            const chatId = e.target.parentElement.dataset.chatid;
            chatHistory = chatHistory.filter(c => c.id !== chatId);
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
            updateHistoryList();
        }
    });

    // Initialize first chat
    createNewChat();
});