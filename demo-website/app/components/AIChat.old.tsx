'use client';

import { useState, useRef, useEffect } from 'react';
import { useNavigation, navigationEngine, componentRegistry } from 'desktopuse-sdk';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AIChatProps {
  onNavigateToComponent: (componentId: string) => void;
}

export function AIChat({ onNavigateToComponent }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I can control this website for you. Try commands like:\n\n• "navigate to input page"\n• "set slider to 75"\n• "type john@example.com in email field"\n• "increase slider by 20"',
      timestamp: Date.now()
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

  // Execute MCP tool calls via SDK
  const executeToolCall = async (toolName: string, input: Record<string, any>) => {
    try {
      switch (toolName) {
        case 'navigate_to_component':
          // Directly update the active component state
          console.log(`[AI Chat] Navigating to component: ${input.componentType}`);
          onNavigateToComponent(input.componentType);
          
          // Small wait to ensure React reconciliation
          await new Promise(resolve => setTimeout(resolve, 100));
          break;

        case 'click_component':
          await navigationEngine.executeStep({
            componentId: input.componentId,
            action: 'click',
            wait: input.waitAfter || 300,
          });
          break;

        case 'type_text':
          await navigationEngine.executeStep({
            componentId: input.componentId,
            action: 'type',
            value: input.text,
            wait: 300,
          });
          break;

        case 'execute_custom_action':
          await navigationEngine.executeStep({
            componentId: input.componentId,
            action: input.actionName as any,
            value: input.actionValue,
            wait: 300,
          });
          break;

        case 'get_ui_state':
          const uiState = componentRegistry.exportForLLM();
          console.log('[AI Chat] Current UI State:', uiState);
          console.log('[AI Chat] Sitemap:', {
            totalComponents: uiState.components.length,
            visibleComponents: uiState.currentlyVisible.length,
            hierarchy: uiState.hierarchy,
            componentsByType: uiState.components.reduce((acc, c) => {
              acc[c.type] = (acc[c.type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          });
          break;

        case 'find_component':
          const components = componentRegistry.findComponents({
            label: input.query,
            type: input.type,
          });
          console.log('[AI Chat] Found components:', components);
          break;

        default:
          console.warn(`[AI Chat] Unknown tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`[AI Chat] Error executing tool ${toolName}:`, error);
    }
  };

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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Execute tool calls if any
      if (data.toolCalls && Array.isArray(data.toolCalls)) {
        for (const toolCall of data.toolCalls) {
          await executeToolCall(toolCall.name, toolCall.input);
        }
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
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
    <div ref={chatRef} className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800">
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
            <p className="text-sm text-gray-400">Control the website via chat</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-[#FF3B8A] text-white'
                  : 'bg-zinc-800 text-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
