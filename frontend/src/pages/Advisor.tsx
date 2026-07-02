import { Bot, MessageSquarePlus, Send, Trash2, Sparkles, MessageSquare, Compass, ShieldCheck } from 'lucide-react';
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

const suggestedPrompts = [
  "Explain perplexity and burstiness metrics.",
  "How does the AI Classifier detect paragraph patterns?",
  "What is the consistency score inside the diagnostic report?",
  "How can I integrate Guardian APIs into my LMS?"
];

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
    // Remove from localStorage if empty
    if (newConversations.length === 0) {
      localStorage.removeItem('advisor_conversations');
    }
  }

  function updateConversation(id: string, updates: Partial<Conversation>) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c))
    );
  }

  async function sendPrompt(customText?: string) {
    const textToSend = (customText || prompt).trim();
    if (!textToSend || !activeConversationId) return;

    const userMessage: Message = {
      role: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    setPrompt('');
    setLoading(true);

    // Get current messages
    const currentMessages = currentConversation?.messages || [];
    const updatedMessages = [...currentMessages, userMessage];

    // Add user message to conversation immediately
    updateConversation(activeConversationId, {
      messages: updatedMessages,
      title: currentConversation?.title === 'New Conversation' ? textToSend.substring(0, 40) : currentConversation?.title || 'Conversation',
    });

    try {
      // Map message structure expected by API client
      const history = currentMessages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const reply = await chatWithAdvisor(textToSend, history);

      const assistantMessage: Message = {
        role: 'assistant',
        text: reply,
        timestamp: Date.now(),
      };

      // Add assistant reply to conversation
      updateConversation(activeConversationId, {
        messages: [...updatedMessages, assistantMessage],
      });
    } catch (e: any) {
      const errorMessage: Message = {
        role: 'assistant',
        text: e?.message || 'I failed to analyze your query. Please check your backend service.',
        timestamp: Date.now(),
      };
      updateConversation(activeConversationId, {
        messages: [...updatedMessages, errorMessage],
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex bg-neutral-50/40 dark:bg-[#070707] min-h-screen text-neutral-900 dark:text-neutral-100 transition-colors duration-300 w-full">
      <Sidebar />

      <main className="flex-1 flex overflow-hidden h-screen w-full relative">
        
        {/* Left Side: Conversation Hub */}
        <aside className="w-80 border-r border-neutral-200/40 dark:border-neutral-800/40 bg-white/40 dark:bg-[#090909]/40 backdrop-blur-md flex flex-col justify-between hidden lg:flex">
          <div className="p-6 flex flex-col h-full overflow-hidden">
            <button
              onClick={createNewConversation}
              className="w-full py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 rounded-2xl text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all hover:scale-103 active:scale-97 shadow-sm flex items-center justify-center gap-2 mb-6"
            >
              <MessageSquarePlus className="w-4 h-4" />
              New Conversation
            </button>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              <p className="text-[9px] font-bold text-neutral-450 dark:text-neutral-555 uppercase tracking-widest mb-3 pl-2">Recent Chats</p>
              <AnimatePresence initial={false}>
                {conversations.map((c) => {
                  const isActive = c.id === activeConversationId;
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                        isActive
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-sm'
                          : 'hover:bg-neutral-100/70 dark:hover:bg-neutral-900/40 text-neutral-600 dark:text-neutral-300'
                      }`}
                      onClick={() => setActiveConversationId(c.id)}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <MessageSquare className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs font-semibold truncate leading-tight">{c.title}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(c.id);
                        }}
                        className={`opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 rounded transition-opacity ${
                          isActive ? 'text-white/60 dark:text-neutral-950/60 hover:text-white' : 'text-neutral-400'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {conversations.length === 0 && (
                <div className="text-center py-10 text-neutral-400 dark:text-neutral-500 text-xs font-semibold">
                  No active chats. Start one now!
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Right Side: Main Chat window */}
        <section className="flex-1 flex flex-col justify-between h-full bg-transparent overflow-hidden">
          
          {/* Active Conversation messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-8 py-8 space-y-6 w-full max-w-4xl mx-auto"
          >
            {currentConversation && currentConversation.messages.length > 0 ? (
              <AnimatePresence initial={false}>
                {currentConversation.messages.map((m, idx) => {
                  const isBot = m.role === 'assistant';
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-4 max-w-3xl ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                    >
                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 shadow-sm ${
                        isBot 
                          ? 'bg-neutral-900 border-neutral-900 dark:bg-white dark:border-white text-white dark:text-neutral-900' 
                          : 'bg-white border-neutral-200/50 dark:bg-neutral-950 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300'
                      }`}>
                        {isBot ? <Bot className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </div>

                      {/* Bubble */}
                      <div className={`rounded-2xl p-5 border text-sm leading-relaxed shadow-sm max-w-xl font-medium ${
                        isBot 
                          ? 'bg-white border-neutral-200/40 dark:bg-neutral-950 dark:border-neutral-850 text-neutral-800 dark:text-neutral-200' 
                          : 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-950'
                      }`}>
                        {renderMessageText(m.text)}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            ) : (
              /* Empty Greeting Screen */
              <div className="h-full flex flex-col justify-center items-center max-w-xl mx-auto text-center space-y-8">
                <div className="h-16 w-16 rounded-2xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center shadow-sm border border-neutral-200/10">
                  <Sparkles className="h-6 w-6 text-neutral-500 animate-pulse" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-black text-neutral-900 dark:text-white">Guardian AI Advisor</h2>
                  <p className="text-sm text-neutral-550 dark:text-neutral-400 font-semibold leading-relaxed">
                    Ask me anything about text classification algorithms, language model entropy, or integrating verification workflows.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full pt-4">
                  {suggestedPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (!activeConversationId) {
                          const newId = Date.now().toString();
                          const newConv: Conversation = {
                            id: newId,
                            title: p.substring(0, 40),
                            messages: [],
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                          };
                          setConversations([newConv]);
                          setActiveConversationId(newId);
                          // Delay sending slightly so active conversation is registered
                          setTimeout(() => sendPrompt(p), 100);
                        } else {
                          sendPrompt(p);
                        }
                      }}
                      className="p-4 rounded-xl border border-neutral-200/40 dark:border-neutral-850 bg-white dark:bg-neutral-950 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-all duration-200 flex items-start gap-3.5 shadow-sm"
                    >
                      <Compass className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {loading && (
              <div className="flex gap-4 max-w-3xl mr-auto">
                <div className="w-9 h-9 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-2xl p-5 border border-neutral-200/40 dark:border-neutral-850 bg-white dark:bg-neutral-950 shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Chat input pill */}
          <div className="p-6 border-t border-neutral-200/40 dark:border-neutral-800/40 bg-white/40 dark:bg-[#070707]/40 backdrop-blur-md sticky bottom-0 z-10 w-full">
            <div className="max-w-4xl mx-auto flex gap-3">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (!activeConversationId) {
                      createNewConversation();
                      setTimeout(() => sendPrompt(), 100);
                    } else {
                      sendPrompt();
                    }
                  }
                }}
                disabled={loading}
                placeholder="Ask Guardian Advisor a question..."
                className="flex-1 px-5 py-3.5 rounded-2xl border border-neutral-200/40 dark:border-neutral-850 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-450 leading-relaxed shadow-sm"
              />
              <button
                onClick={() => {
                  if (!activeConversationId) {
                    createNewConversation();
                    setTimeout(() => sendPrompt(), 100);
                  } else {
                    sendPrompt();
                  }
                }}
                disabled={loading || !prompt.trim()}
                className="w-12 h-12 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 dark:hover:bg-neutral-100 transition shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// Helpers for rendering formatted markdown responses
const parseInlineFormatting = (content: string) => {
  const boldRegex = /\*\*(.*?)\*\*/g;
  const parts: any[] = [];
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }
    parts.push(
      <strong key={match.index} className="font-extrabold text-neutral-900 dark:text-white">
        {match[1]}
      </strong>
    );
    lastIndex = boldRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  if (parts.length === 0) {
    // Process inline code blocks `code` if no bold tags exist
    const inlineCodeRegex = /`(.*?)`/g;
    const codeParts: any[] = [];
    let codeLastIdx = 0;
    let codeMatch;
    
    while ((codeMatch = inlineCodeRegex.exec(content)) !== null) {
      if (codeMatch.index > codeLastIdx) {
        codeParts.push(content.substring(codeLastIdx, codeMatch.index));
      }
      codeParts.push(
        <code key={codeMatch.index} className="bg-neutral-100 dark:bg-neutral-900 px-1.5 py-0.5 rounded text-xs font-mono font-bold text-neutral-900 dark:text-white mx-0.5 border border-neutral-200/40">
          {codeMatch[1]}
        </code>
      );
      codeLastIdx = inlineCodeRegex.lastIndex;
    }
    
    if (codeLastIdx < content.length) {
      codeParts.push(content.substring(codeLastIdx));
    }
    return codeParts.length > 0 ? codeParts : content;
  }

  return parts;
};

const renderMessageText = (text: string) => {
  if (!text) return null;

  const lines = text.split('\n');
  return lines.map((line, idx) => {
    // Code block lines
    if (line.startsWith('`')) {
      const code = line.replace(/`/g, '');
      return (
        <code key={idx} className="block bg-neutral-100 dark:bg-neutral-900 px-3.5 py-2 rounded-xl text-xs font-mono my-2 overflow-x-auto border border-neutral-200/40 max-w-full text-neutral-900 dark:text-neutral-100">
          {code}
        </code>
      );
    }
    
    // Headers
    if (line.startsWith('### ')) {
      return <h4 key={idx} className="text-sm font-bold text-neutral-900 dark:text-white mt-4 mb-2">{line.replace('### ', '')}</h4>;
    }
    if (line.startsWith('## ')) {
      return <h3 key={idx} className="text-base font-bold text-neutral-900 dark:text-white mt-4 mb-2">{line.replace('## ', '')}</h3>;
    }
    if (line.startsWith('# ')) {
      return <h2 key={idx} className="text-lg font-bold text-neutral-900 dark:text-white mt-4 mb-2">{line.replace('# ', '')}</h2>;
    }

    // List items
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      const content = line.trim().substring(2);
      return (
        <li key={idx} className="list-disc list-inside ml-4 text-xs md:text-sm my-1 text-neutral-700 dark:text-neutral-350">
          {parseInlineFormatting(content)}
        </li>
      );
    }

    const numMatch = line.trim().match(/^\d+\.\s(.*)/);
    if (numMatch) {
      return (
        <li key={idx} className="list-decimal list-inside ml-4 text-xs md:text-sm my-1 text-neutral-700 dark:text-neutral-350">
          {parseInlineFormatting(numMatch[1])}
        </li>
      );
    }

    // Empty lines or raw paragraphs
    return (
      <p key={idx} className="my-1.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-350 min-h-[0.5rem] leading-relaxed">
        {parseInlineFormatting(line)}
      </p>
    );
  });
};
