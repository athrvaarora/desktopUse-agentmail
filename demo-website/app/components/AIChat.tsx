'use client';

import { useState, useRef, useEffect } from 'react';
import { useNavigation } from 'desktopuse-sdk';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AIChatProps {
  onNavigateToComponent: (componentId: string) => void;
}

// Use environment variable for API endpoint (defaults to local for testing)
const CHAT_API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL || 'http://localhost:3001/api/chat';

export function AIChat({ onNavigateToComponent }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I can control this website for you. Try commands like:\n\n• "navigate to input page"\n• "set slider to 75"\n• "type john@example.com in email field"\n• "increase slider by 20"',
      timestamp: 0
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { ref: chatRef } = useNavigation({
    id: 'ai-chat',
    type: 'card',
    label: 'AI Chat Interface',
    availableActions: ['click', 'type'],
    metadata: {
      description: 'AI-powered chat interface for controlling the website',
      messageCount: messages.length
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      console.log(`[AI Chat] Sending message to: ${CHAT_API_URL}`);
      
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('[AI Chat] Error:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error connecting to the server. Please make sure:\n\n1. The server is running\n2. WebSocket connection is established\n3. Your app is wrapped with NavigationProvider\n\nTry refreshing the page.',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div ref={chatRef} className="flex flex-col h-full w-96 min-w-96 max-w-96 bg-zinc-900 border-l border-zinc-800">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF3B8A] to-[#FF6B9D] flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012-2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">AI Assistant</h2>
            <p className="text-sm text-gray-400">Powered by Desktop.use</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} min-w-0`}
          >
            <div
              className={`max-w-[80%] min-w-0 rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-[#FF3B8A] text-white'
                  : 'bg-zinc-800 text-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words overflow-hidden overflow-wrap-anywhere">{message.content}</p>
              <span className="text-xs opacity-60 mt-2 block">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:100ms]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:200ms]"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-zinc-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask AI to control the website..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF3B8A] focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-[#FF3B8A] text-white font-medium rounded-lg hover:bg-[#ff1f75] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Try: "navigate to slider" • "set slider to 80" • "type text in email"
        </p>
      </div>
    </div>
  );
}
