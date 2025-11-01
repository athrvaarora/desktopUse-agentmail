import { X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useNavigation } from 'desktopuse-sdk';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

// Use environment variable for Chat API (same as demo-website pattern)
// The MCP server handles tool execution via WebSocket automatically
const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || 'https://desktopuse.replit.app/api/chat';

export const ChatPanel = ({ isOpen, onClose }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I can help you edit your photos using voice commands. Try commands like:\n\n• "set brightness to 2"\n• "increase contrast by 20"\n• "make it brighter"\n• "decrease highlights by 10"',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tag chat panel for component registry
  const { ref: chatRef } = useNavigation({
    id: 'chat-panel',
    type: 'card',
    label: 'AI Chat Panel',
    availableActions: ['type', 'click'],
    metadata: {
      description: 'AI-powered chat interface for controlling RapidRAW',
      messageCount: messages.length,
      isOpen,
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      console.log(`[ChatPanel] Sending message to: ${CHAT_API_URL}`);
      
      // Call MCP chat API - server executes actions via WebSocket automatically
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, newMessage].map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();

      // Note: Tool execution happens automatically via WebSocket
      // The MCP server sends action_request messages to the browser
      // and the NavigationEngine executes them

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('[ChatPanel] Error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '❌ Sorry, I encountered an error connecting to the server. Please make sure:\n\n1. MCP server is running at https://desktopuse.replit.app\n2. WebSocket connection is established\n3. Check browser console for connection status',
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 320 }}
          animate={{ x: 0 }}
          exit={{ x: 320 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="h-screen w-80 bg-bg-secondary shadow-2xl flex flex-col border-l border-surface flex-shrink-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-surface bg-bg-primary">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <h2 className="text-lg font-semibold text-text-primary">Desktop Use</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-hover-color rounded-md transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-black text-white border border-surface'
                      : 'bg-black text-white border border-surface'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Messages end ref */}
          <div ref={messagesEndRef} />

          {/* Input */}
          <div className="p-4 border-t border-surface bg-bg-primary">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-black border border-surface rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={inputValue.trim() === '' || isLoading}
                className="p-2 bg-accent hover:bg-accent/90 disabled:bg-surface disabled:cursor-not-allowed rounded-lg transition-colors"
                aria-label="Send message"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
            <p className="text-xs text-text-secondary mt-2 text-center">
              {isLoading ? 'Processing...' : 'Press Enter to send'}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
