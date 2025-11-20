import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, AlertCircle, History, Trash2, RefreshCw, X, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      content: "Hello! I'm your AI Chat Advisor. I can help you with content analysis, writing tips, AI detection insights, and general questions. How can I assist you today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [mistralStatus, setMistralStatus] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // On mount, check backend Mistral health and load history if user is logged in
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/mistral/health`, { credentials: 'include' });
        const data = await res.json();
        setMistralStatus(data);
        if (data?.status === 'CONFIG_MISSING') {
          setError('AI service is not configured on the server (missing API key).');
        } else if (data?.status === 'UNAUTHORIZED') {
          setError('AI service key is unauthorized. Please verify the Mistral API key on the server.');
        } else if (data?.status === 'INVALID_FORMAT') {
          setError('The configured Mistral API key format looks wrong (should start with sk-).');
        }
      } catch {
        // ignore; backend may be starting
      }
    };

    const init = async () => {
      await checkHealth();
      // Try to load chat history (will silently fail if not authenticated)
      await loadChatHistory();
    };

    init();
  }, []);

  const loadChatHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE}/api/chats/recent`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data);
      } else if (res.status === 401) {
        // User not authenticated - this is fine, just don't show history
        setChatHistory([]);
      }
    } catch (err) {
      // Network error or other issue - silently ignore
      console.log('Chat history not available:', err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const deleteChatHistory = async (chatId) => {
    try {
      const res = await fetch(`${API_BASE}/api/chats/${chatId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  const loadChatFromHistory = (chat) => {
    const userMsg = {
      id: `history-user-${chat.id}`,
      content: chat.message,
      sender: 'user',
      timestamp: new Date(chat.createdAt)
    };
    const aiMsg = {
      id: `history-ai-${chat.id}`,
      content: chat.response,
      sender: 'ai',
      timestamp: new Date(chat.createdAt)
    };
    setMessages([messages[0], userMsg, aiMsg]);
    setShowHistory(false);
  };

  const buildHistory = () => {
    // Convert messages to Mistral format, excluding the initial greeting
    return messages
      .filter(msg => msg.id !== '1')
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    if (mistralStatus?.status === 'CONFIG_MISSING' || mistralStatus?.status === 'UNAUTHORIZED' || mistralStatus?.status === 'INVALID_FORMAT') {
      // Prevent spamming the backend when we know it cannot serve
      setError('AI service is unavailable due to configuration/authorization. Please try again later.');
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          prompt: userMessage.content,
          history: buildHistory()
        }),
      });

      if (response.status === 401) {
        setError('Please log in to use the chat advisor.');
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          content: 'Please log in to continue chatting.',
          sender: 'ai',
          timestamp: new Date(),
          isError: true
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: data.text || "I apologize, but I couldn't generate a response. Please try again.",
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      // Refresh history after successful chat (only if authenticated)
      loadChatHistory();
    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to connect to the AI advisor. Please check your connection and try again.');

      // Add error message to chat
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please check your connection and try again.',
        sender: 'ai',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearCurrentChat = () => {
    setMessages([messages[0]]);
    setError(null);
  };

  return (
    <div className="max-w-7xl mx-auto h-[680px] flex gap-4">
      {/* Chat History Sidebar - Desktop */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
            />

            <motion.div
              className="fixed lg:relative inset-y-0 left-0 z-50 lg:z-0 w-80 lg:w-72 bg-carbon border border-white/10 rounded-3xl flex flex-col overflow-hidden"
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <History className="h-4 w-4" />
                  <span className="text-sm font-medium tracking-wide uppercase">History</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={loadChatHistory} className="p-2 rounded-xl border border-white/10 hover:border-white/30 transition" disabled={isLoadingHistory}>
                    <RefreshCw className={`h-4 w-4 ${isLoadingHistory ? 'animate-spin text-accent' : 'text-white'}`} />
                  </button>
                  <button onClick={() => setShowHistory(false)} className="p-2 rounded-xl border border-white/10 hover:border-white/30 transition lg:hidden">
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="h-5 w-5 text-accent animate-spin" />
                  </div>
                ) : chatHistory.length === 0 ? (
                  <div className="text-center py-8 text-mist/70 text-sm">
                    Nothing logged yet
                  </div>
                ) : (
                  chatHistory.map((chat) => (
                    <motion.div
                      key={chat.id}
                      className="border border-white/10 rounded-2xl p-3 hover:border-white/40 cursor-pointer"
                      onClick={() => loadChatFromHistory(chat)}
                      whileHover={{ y: -3 }}
                    >
                      <p className="text-xs text-white/80 line-clamp-2">{chat.message}</p>
                      <div className="flex items-center justify-between mt-2 text-[11px] text-mist/60">
                        <span>{new Date(chat.createdAt).toLocaleDateString()}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChatHistory(chat.id);
                          }}
                          className="text-warning"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Chat Interface */}
      <motion.div
        className="flex-1 glass-panel border-white/5 flex flex-col overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Chat Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="lg:hidden p-2 rounded-xl border border-white/10 hover:border-white/40 transition"
            >
              <Menu className="h-4 w-4 text-white" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-carbon border border-white/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-white font-space">Advisor</p>
              <p className="text-xs text-mist/70">Mistral stack</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="hidden lg:inline-flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-[0.3em] rounded-xl border border-white/10 hover:border-white/40"
            >
              <History className="h-3 w-3" /> History
            </button>
            <button
              onClick={clearCurrentChat}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-[0.3em] rounded-xl border border-white/10 hover:border-white/40"
            >
              <RefreshCw className="h-3 w-3" /> Reset
            </button>
          </div>
        </div>
        {error && (
          <motion.div
            className="px-5 py-3 border-b border-white/5 text-xs text-warning flex items-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle className="h-3 w-3" />
            {error}
          </motion.div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-onyx/70">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
              >
                <div className={`flex max-w-[85%] gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className="w-10 h-10 rounded-2xl bg-carbon border border-white/5 flex items-center justify-center">
                    {message.sender === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-accent" />}
                  </div>
                  <div className={`rounded-2xl px-4 py-3 border border-white/5 text-sm leading-relaxed ${
                    message.sender === 'user'
                      ? 'bg-white text-black'
                      : message.isError
                        ? 'bg-red-500/10 text-red-200'
                        : 'bg-carbon/70 text-white'
                  }`}>
                    {message.content}
                    <p className={`text-[11px] mt-2 ${message.sender === 'user' ? 'text-black/60' : 'text-mist/70'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {isTyping && (
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-carbon border border-white/5 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-accent" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 border border-white/5 text-sm text-mist flex items-center gap-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    thinking
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-5 border-t border-white/5 bg-carbon/80">
          <div className="flex gap-3">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about AI detection, writing tone, or strategy..."
              className="flex-1 rounded-2xl bg-onyx border border-white/10 text-white p-4 text-sm placeholder:text-mist/50 focus:outline-none focus:ring-2 focus:ring-white/20"
              rows={2}
              disabled={isTyping}
            />
            <motion.button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping || (mistralStatus?.status && mistralStatus.status !== 'OK')}
              className="px-5 py-3 rounded-2xl bg-white text-black font-space text-xs uppercase tracking-[0.4em] disabled:opacity-40"
              whileHover={{ scale: inputMessage.trim() ? 1.03 : 1 }}
              whileTap={{ scale: inputMessage.trim() ? 0.97 : 1 }}
            >
              <Send className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatInterface;
