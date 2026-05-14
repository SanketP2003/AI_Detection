import { Bot, MessageSquarePlus, Send, Trash2, UserRound } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { chatWithAdvisor } from '../api/client';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export default function Advisor() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Load conversations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('advisor_conversations');
    if (saved) {
      const parsed = JSON.parse(saved);
      setConversations(parsed);
      if (parsed.length > 0 && !activeConversationId) {
        setActiveConversationId(parsed[0].id);
      }
    }
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('advisor_conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeConversationId, conversations]);

  const currentConversation = conversations.find((c) => c.id === activeConversationId);

  function createNewConversation() {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
  }

  function deleteConversation(id: string) {
    const newConversations = conversations.filter((c) => c.id !== id);
    setConversations(newConversations);
    if (activeConversationId === id && newConversations.length > 0) {
      setActiveConversationId(newConversations[0].id);
    } else if (newConversations.length === 0) {
      setActiveConversationId(null);
    }
  }

  function updateConversation(id: string, updates: Partial<Conversation>) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c))
    );
  }

  async function sendPrompt() {
    if (!prompt.trim() || !activeConversationId) return;

    const userText = prompt.trim();
    const userMessage: Message = {
      role: 'user',
      text: userText,
      timestamp: Date.now(),
    };

    setPrompt('');
    setLoading(true);

    // Add user message to conversation
    updateConversation(activeConversationId, {
      messages: [...(currentConversation?.messages || []), userMessage],
      title: currentConversation?.title === 'New Conversation' ? userText.substring(0, 50) : currentConversation?.title || 'Conversation',
    });

    try {
      const response = await chatWithAdvisor(userText, currentConversation?.messages || []);
      const assistantMessage: Message = {
        role: 'assistant',
        text: response || 'No response from AI.',
        timestamp: Date.now(),
      };
      updateConversation(activeConversationId, {
        messages: [...(currentConversation?.messages || []), userMessage, assistantMessage],
      });
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        text: `Error: ${error?.message || 'Unknown error occurred'}`,
        timestamp: Date.now(),
      };
      updateConversation(activeConversationId, {
        messages: [...(currentConversation?.messages || []), userMessage, errorMessage],
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!activeConversationId ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Bot className="h-16 w-16 text-neutral-200 mb-4" />
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">Start a Conversation</h2>
              <p className="text-neutral-500 mb-6">Create a new chat to ask for security guidance and incident response advice.</p>
              <button
                onClick={createNewConversation}
                className="flex items-center gap-2 rounded-lg bg-neutral-900 text-white py-3 px-6 text-sm font-semibold hover:bg-neutral-800 transition"
              >
                <MessageSquarePlus className="h-4 w-4" />
                New Chat
              </button>
            </div>
          ) : (
            <>
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-8 py-6 space-y-4"
              >
                {currentConversation?.messages && currentConversation.messages.length > 0 ? (
                  currentConversation.messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-2xl flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.role === 'user'
                              ? 'bg-neutral-900 text-white'
                              : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          {message.role === 'user' ? (
                            <UserRound className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                        <div
                          className={`rounded-lg px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-neutral-900 text-white'
                              : 'bg-neutral-100 text-neutral-900'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.text}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 text-neutral-400">
                    <p className="text-sm">No messages yet. Start the conversation!</p>
                  </div>
                )}

                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-neutral-100 rounded-lg px-4 py-3">
                        <div className="flex gap-1">
                          <div className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce" />
                          <div className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-neutral-200 bg-white px-8 py-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !loading) sendPrompt();
                    }}
                    placeholder="Ask about suspicious content, incident response, or security guidance..."
                    className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                  />
                  <button
                    onClick={sendPrompt}
                    disabled={loading || !prompt.trim()}
                    className="rounded-lg bg-neutral-900 text-white p-3 hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-neutral-400 mt-2 text-center">
                  AI can make mistakes. Verify important information.
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Right Sidebar - Conversation History */}
      <AnimatePresence>
        <motion.aside
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          className="w-64 border-l border-neutral-200 bg-neutral-50 flex flex-col overflow-hidden"
        >
          <div className="p-4 border-b border-neutral-200">
            <button
              onClick={createNewConversation}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-neutral-900 text-white py-3 px-4 text-sm font-semibold hover:bg-neutral-800 transition"
            >
              <MessageSquarePlus className="h-4 w-4" />
              New Chat
            </button>
          </div>

          {/* Conversation History */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-sm">
                No conversations yet.
              </div>
            ) : (
              conversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={`group p-3 rounded-lg cursor-pointer transition ${
                    activeConversationId === conversation.id
                      ? 'bg-white border border-neutral-200'
                      : 'hover:bg-neutral-100'
                  }`}
                  onClick={() => setActiveConversationId(conversation.id)}
                >
                  <div className="flex items-start gap-2 justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {conversation.title}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {new Date(conversation.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conversation.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="h-4 w-4 text-neutral-400 hover:text-red-600" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.aside>
      </AnimatePresence>
    </div>
  );
}
