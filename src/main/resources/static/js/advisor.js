document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.getElementById('chatMessages');
    const newChatBtn = document.getElementById('newChatBtn');
    const chatHistoryList = document.getElementById('chatHistory');
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const sidebar = document.querySelector('.chat-sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    // --- State Management ---
    let chats = [];
    let activeChatId = null;

    // --- LOCALSTORAGE FUNCTIONS (For browser-side persistence) ---
    const saveChatsToLocalStorage = () => {
        localStorage.setItem('ai_advisor_chats', JSON.stringify(chats));
    };

    const loadChatsFromLocalStorage = () => {
        const storedChats = localStorage.getItem('ai_advisor_chats');
        if (storedChats) {
            chats = JSON.parse(storedChats);
        }
    };

    // --- CORE CHAT & UI RENDERING ---
    const renderChatHistory = () => {
        chatHistoryList.innerHTML = ''; // Clear the list first
        if (chats.length === 0) {
            chatHistoryList.innerHTML = `<div class="no-chats-message">No chats yet.</div>`;
            return;
        }

        chats.forEach(chat => {
            const item = document.createElement('div');
            item.className = 'chat-history-item';
            item.dataset.id = chat.id;
            if (chat.id === activeChatId) {
                item.classList.add('active');
            }

            const title = document.createElement('span');
            title.className = 'chat-title';
            title.textContent = chat.title;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-chat-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.dataset.id = chat.id;

            item.appendChild(title);
            item.appendChild(deleteBtn);
            chatHistoryList.appendChild(item);
        });
    };

    const renderActiveChatMessages = () => {
        const activeChat = chats.find(chat => chat.id === activeChatId);
        chatMessages.innerHTML = '';

        if (!activeChat || activeChat.messages.length === 0) {
            showWelcomeScreen();
        } else {
            activeChat.messages.forEach(message => {
                addMessageToUI(message.role === 'user' ? 'user' : 'ai', message.text);
            });
        }
    };

    const startNewChat = () => {
        const newChat = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: []
        };
        chats.unshift(newChat); // Add to the beginning of the array
        activeChatId = newChat.id;

        saveChatsToLocalStorage();
        renderChatHistory();
        renderActiveChatMessages();
        closeSidebar();
    };

    const sendMessage = async () => {
        const prompt = messageInput.value.trim();
        if (!prompt) return;

        let activeChat = chats.find(chat => chat.id === activeChatId);
        if (!activeChat) return;

        if (activeChat.messages.length === 0) {
            chatMessages.innerHTML = '';
            activeChat.title = prompt.substring(0, 40) + (prompt.length > 40 ? '...' : '');
        }

        const userMessage = { role: 'user', text: prompt };
        activeChat.messages.push(userMessage);
        addMessageToUI('user', prompt);

        messageInput.value = '';
        autoResizeTextarea();
        showTypingIndicator();

        // ===================================================================
        // MODIFIED SECTION: This now calls your actual Java backend controller
        // ===================================================================
        try {
            // The history sent to the backend excludes the most recent user prompt,
            // as the prompt is passed separately in the request body.
            const historyForApi = activeChat.messages.slice(0, -1);

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    history: historyForApi
                }),
            });

            removeTypingIndicator();

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const aiResponseText = data.text;
            const aiMessage = { role: 'model', text: aiResponseText };
            activeChat.messages.push(aiMessage);

            addMessageToUI('ai', aiResponseText);

            saveChatsToLocalStorage();
            renderChatHistory(); // Update title if it was the first message

        } catch (error) {
            console.error('Chat API Error:', error);
            removeTypingIndicator();
            addMessageToUI('ai', `Sorry, an error occurred: ${error.message}`);
        }
        // ===================================================================
        // END OF MODIFIED SECTION
        // ===================================================================
    };

    // --- UI HELPER FUNCTIONS ---
    const addMessageToUI = (sender, text) => {
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('message-wrapper');
        if (sender === 'ai') messageWrapper.classList.add('ai');

        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message');

        const avatarClass = sender === 'user' ? 'user' : 'ai';
        const avatarContent = sender === 'user' ? 'JD' : '<i class="fas fa-robot"></i>';
        const avatar = `<div class="message-avatar ${avatarClass}">${avatarContent}</div>`;

        const content = document.createElement('div');
        content.classList.add('message-content');
        content.innerHTML = marked.parse(text);

        messageContainer.innerHTML = avatar;
        messageContainer.appendChild(content);
        messageWrapper.appendChild(messageContainer);
        chatMessages.appendChild(messageWrapper);

        content.querySelectorAll('pre').forEach(enhanceCodeBlock);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const showWelcomeScreen = () => {
        chatMessages.innerHTML = `<div class="welcome-container"> <div class="welcome-logo"> <img src="img/logo.jpg" alt="AIVerify Logo"> </div> <h1>How can I help you today?</h1> <div class="suggestion-grid"> <button class="suggestion-card" data-prompt="Explain quantum computing in simple terms"> <h3>Explain quantum computing</h3> <p>in simple terms</p> </button> <button class="suggestion-card" data-prompt="Give me creative ideas for a science fiction story"> <h3>Get creative ideas</h3> <p>for a science fiction story</p> </button> <button class="suggestion-card" data-prompt="Write a Python script to sort a list of dictionaries"> <h3>Write a Python script</h3> <p>to sort a list of dictionaries</p> </button> <button class="suggestion-card" data-prompt="What are the pros and cons of microservices architecture?"> <h3>Pros and cons</h3> <p>of microservices architecture</p> </button> </div> </div>`;
        document.querySelectorAll('.suggestion-card').forEach(card => card.addEventListener('click', () => { const prompt = card.dataset.prompt; messageInput.value = prompt; sendMessage(); }));
    };

    const showTypingIndicator = () => {
        const typingElement = document.createElement('div'); typingElement.classList.add('message-wrapper', 'ai', 'typing-indicator'); typingElement.innerHTML = `<div class="message"><div class="message-avatar ai"><i class="fas fa-robot"></i></div><div class="message-content"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`; chatMessages.appendChild(typingElement); chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const removeTypingIndicator = () => {
        const indicator = chatMessages.querySelector('.typing-indicator'); if (indicator) indicator.remove();
    };

    const autoResizeTextarea = () => {
        messageInput.style.height = 'auto'; const newHeight = Math.min(messageInput.scrollHeight, 200); messageInput.style.height = `${newHeight}px`;
    };

    const enhanceCodeBlock = (preElement) => {
        const codeElement = preElement.querySelector('code');
        if (!codeElement) return;
        const codeText = codeElement.innerText;
        const langMatch = codeElement.className.match(/language-(\S+)/);
        const lang = langMatch ? langMatch[1] : 'text';
        const header = document.createElement('div');
        header.className = 'code-header';
        header.innerHTML = `<span>${lang}</span>`;
        const copyBtn = document.createElement('button'); copyBtn.className = 'copy-code-btn';
        copyBtn.innerHTML = '<i class="far fa-copy"></i> Copy code';
        header.appendChild(copyBtn);
        preElement.insertBefore(header, preElement.firstChild);
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(codeText).then(() => {
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                copyBtn.classList.add('copied');
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="far fa-copy"></i> Copy code';
                    copyBtn.classList.remove('copied');
                    }, 2000);
            });
        });
    };

    const openSidebar = () => {
        sidebar.classList.add('visible'); sidebarOverlay.classList.add('visible');
    };

    const closeSidebar = () => {
        sidebar.classList.remove('visible'); sidebarOverlay.classList.remove('visible');
    };

    // --- EVENT LISTENERS ---
    newChatBtn.addEventListener('click', startNewChat);
    sendButton.addEventListener('click', sendMessage);
    menuToggleBtn.addEventListener('click', openSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);

    messageInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
    messageInput.addEventListener('input', autoResizeTextarea);

    // Event delegation for history items
    chatHistoryList.addEventListener('click', (e) => {
        const historyItem = e.target.closest('.chat-history-item');
        const deleteButton = e.target.closest('.delete-chat-btn');

        if (deleteButton) {
            e.stopPropagation();
            const chatIdToDelete = deleteButton.dataset.id;
            chats = chats.filter(chat => chat.id !== chatIdToDelete);
            saveChatsToLocalStorage();

            if (activeChatId === chatIdToDelete) {
                activeChatId = chats.length > 0 ? chats[0].id : null;
                if (activeChatId) {
                    renderActiveChatMessages();
                } else {
                    startNewChat();
                }
            }
            renderChatHistory();
        } else if (historyItem) {
            const chatIdToLoad = historyItem.dataset.id;
            activeChatId = chatIdToLoad;
            renderActiveChatMessages();
            renderChatHistory();
            closeSidebar();
        }
    });

    // --- INITIALIZATION ---
    const initialize = () => {
        loadChatsFromLocalStorage();
        if (chats.length > 0) {
            activeChatId = chats[0].id;
        } else {
            startNewChat();
        }
        renderChatHistory();
        renderActiveChatMessages();
    };

    initialize();
});

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    // Function to open the sidebar
    const openSidebar = () => {
        sidebar.classList.add('visible');
        sidebarOverlay.style.display = 'block';
    };

    // Function to close the sidebar
    const closeSidebar = () => {
        sidebar.classList.remove('visible');
        sidebarOverlay.style.display = 'none';
    };

    // Event listeners
    menuToggle.addEventListener('click', openSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
});