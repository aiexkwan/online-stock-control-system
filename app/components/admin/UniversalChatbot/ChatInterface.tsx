'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Brain } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'error';
  content: string;
  timestamp: string;
  metadata?: {
    complexity?: string;
    executionTime?: number;
    tokensUsed?: number;
    cached?: boolean;
    resolvedQuestion?: string;
    references?: any[];
    sql?: string;
    data?: any[];
    error?: any;
  };
}

interface ChatInterfaceProps {
  onNewMessage?: () => void;
}

export default function ChatInterface({ onNewMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 自動滾動到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const exampleQuestions = [
    'How many pallets were generated today?',
    'Show the top 5 products with the highest stock',
    'What are the transfer records for this week?',
    'Which products have less than 100 units in stock?',
    'How many GRN receipts were recorded today?',
    'What is the total stock of MHCOL2 products?',
  ];

  const handleSendMessage = async (question: string) => {
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    const userMessageId = `user_${Date.now()}`;

    // 添加用戶訊息
    const userMessage: ChatMessage = {
      id: userMessageId,
      type: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    onNewMessage?.();

    try {
      const response = await fetch('/api/ask-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // 添加 AI 回應
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: result.answer,
        timestamp: result.timestamp,
        metadata: {
          complexity: result.complexity,
          executionTime: result.result.executionTime,
          tokensUsed: result.tokensUsed,
          cached: result.cached,
        },
      };

      setMessages(prev => [...prev, aiMessage]);
      onNewMessage?.();
    } catch (error: any) {
      // 添加錯誤訊息
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'ai',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
      onNewMessage?.();
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    handleSendMessage(example);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* 訊息區域 */}
      <div ref={messagesContainerRef} className='flex-1 space-y-4 overflow-y-auto p-4'>
        {messages.length === 0 && (
          <div className='space-y-4'>
            <div className='py-8 text-center text-slate-400'>
              <Brain className='mx-auto mb-4 h-12 w-12 text-purple-400/50' />
              <p className='mb-2 text-lg font-medium'>Start a conversation</p>
              <p className='text-sm'>Ask me anything about your database</p>
            </div>

            {/* 範例問題 */}
            <div className='space-y-3'>
              <h4 className='text-sm font-medium text-slate-300'>Quick Query Examples:</h4>
              <div className='grid grid-cols-1 gap-2'>
                {exampleQuestions.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className='rounded-lg border border-slate-700/30 bg-slate-800/30 p-3 text-left text-sm text-slate-300 transition-all duration-200 hover:border-purple-500/50 hover:bg-slate-700/50 hover:text-white'
                    disabled={isLoading}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map(message => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </AnimatePresence>

        {/* 加載指示器 */}
        {isLoading && (
          <ChatMessage
            message={{
              id: 'loading',
              type: 'ai',
              content: 'Thinking...',
              timestamp: new Date().toISOString(),
            }}
            isLoading
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 輸入區域 */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        onClearChat={messages.length > 0 ? clearChat : undefined}
      />
    </>
  );
}
