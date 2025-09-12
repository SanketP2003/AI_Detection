    (function () {
    const state = {
    chats: [],
    activeChatId: null,
    currentUser: { username: 'Guest', initials: 'G' },
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

    // --- Main Initialization ---
    async function init() {
    setupEventListeners();
    await loadInitialState(); // Now async
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
    // Redirect to the Spring Security logout endpoint
    window.location.href = '/logout';
});
}

    // --- State & UI Management ---
    async function loadInitialState() {
    // Fetch user info from the backend
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
    // Will gracefully default to 'Guest'
}

    // Update the UI with user info
    elements.userName.textContent = state.currentUser.username;
    elements.userAvatar.textContent = state.currentUser.initials;

    // Load chat history from local storage
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
    item.innerHTML = `<i class="far fa-comment-alt"></i><span class="history-title">${chat.title}</span>`;
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

    // --- Main Send Message Handler with API Integration ---
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

    // **** FIX STARTS HERE ****
    // Prepare history for the API call, ensuring it matches the expected format.
    const historyForApi = activeChat.messages.slice(0, -1) // Exclude the last user message just added
    .filter(msg => msg.role !== 'error') // Don't send internal error messages to the API
    .map(msg => ({
    // 1. Map internal role 'ai' to the required 'assistant' role for the API.
    role: msg.role === 'ai' ? 'assistant' : msg.role,
    // 2. Use the 'content' key instead of 'text' as required by the API.
    content: msg.text
}));
    // **** FIX ENDS HERE ****

    try {
    const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json',
},
    // The body now sends the prompt and the corrected history list.
    body: JSON.stringify({
    prompt: prompt,
    history: historyForApi
})
});

    if (!response.ok) {
    // Try to parse error details from the backend response
    const errorJson = await response.json().catch(() => null);
    const detail = errorJson?.detail ? JSON.stringify(errorJson.detail) : 'No further details.';
    const errorMessage = `API Error: ${response.statusText} (${response.status}). ${detail}`;
    throw new Error(errorMessage);
}

    const data = await response.json();
    // Store the AI's response with the internal role 'ai'
    addMessageToHistory('ai', data.text);
    addMessageToDOM('ai', data.text);

} catch (error) {
    console.error('Error fetching AI response:', error);
    const errorMessage = `Sorry, I encountered an error: ${error.message}`;
    addMessageToHistory('error', errorMessage); // Store error in history
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
    activeChat.messages.push({ role, text });
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
    avatarIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12C9 13.3807 10.1193 14.5 11.5 14.5C12.8807 14.5 14 13.3807 14 12C14 10.6193 12.8807 9.5 11.5 9.5C10.1193 9.5 9 10.6193 9 12Z" stroke="currentColor" stroke-width="1.5"/><path d="M21.5 12C21.5 17.2467 17.2467 21.5 12 21.5C6.75329 21.5 2.5 17.2467 2.5 12C2.5 6.75329 6.75329 2.5 12 2.5C17.2467 2.5 21.5 6.75329 21.5 12Z" stroke="currentColor" stroke-width="1.5"/></svg>';
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
    const newChat = { id: `chat_${Date.now()}`, title: 'New Chat', messages: [] };
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
    if (target && target.dataset.id !== state.activeChatId) {
    state.activeChatId = target.dataset.id;
    saveState();
    renderUI();
    if (window.innerWidth <= 768) toggleSidebar();
}
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

    // --- Start ---
    init();
})();
