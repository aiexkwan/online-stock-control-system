'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { QuerySuggestions } from '@/components/ask-database/QuerySuggestions';
import { ErrorDisplay } from '@/components/ask-database/ErrorDisplay';
import { queryErrorHandler } from '@/lib/ask-database/error-handler';

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
    sql?: string;
    data?: any[];
    error?: any;
  };
}

interface ChatInterfaceProps {
  onNewMessage?: () => void;
}

export default function EnhancedChatInterface({ onNewMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [currentContext, setCurrentContext] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 自動滾動到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 更新上下文
  useEffect(() => {
    const lastUserMessage = messages
      .filter(m => m.type === 'user')
      .slice(-1)[0];
    if (lastUserMessage) {
      setCurrentContext(lastUserMessage.content);
    }
  }, [messages]);

  const handleSendMessage = async (question: string) => {
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setShowSuggestions(false);
    const userMessageId = `user_${Date.now()}`;
    
    // 添加用戶訊息
    const userMessage: ChatMessage = {
      id: userMessageId,
      type: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // 更新最近查詢
    setRecentQueries(prev => [question, ...prev.slice(0, 4)]);
    
    onNewMessage?.();

    try {
      const response = await fetch('/api/ask-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question,
          sessionId 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // 添加 AI 回應（包含數據）
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
          sql: result.sql,
          data: result.result.data,
        }
      };
      
      // 如果有上下文解析信息，更新用戶消息
      if (result.resolvedQuestion || result.references) {
        setMessages(prev => prev.map(msg => 
          msg.id === userMessageId 
            ? {
                ...msg,
                metadata: {
                  ...msg.metadata,
                  resolvedQuestion: result.resolvedQuestion,
                  references: result.references
                }
              }
            : msg
        ));
      }
      
      setMessages(prev => [...prev, aiMessage]);
      onNewMessage?.();
    } catch (error: any) {
      // 使用錯誤處理器
      const errorResponse = queryErrorHandler.handleError(error, {
        query: question,
        previousQueries: recentQueries
      });
      
      // 添加錯誤訊息
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'error',
        content: errorResponse.message,
        timestamp: new Date().toISOString(),
        metadata: {
          error: errorResponse
        }
      };
      
      setMessages(prev => [...prev, errorMessage]);
      onNewMessage?.();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    const lastUserMessage = messages
      .filter(m => m.type === 'user')
      .slice(-1)[0];
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.content);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowSuggestions(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 訊息區域 */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
      >
        {messages.length === 0 && showSuggestions && (
          <div className="space-y-4">
            <div className="text-center text-slate-400 py-8">
              <Brain className="h-12 w-12 mx-auto mb-4 text-purple-400/50" />
              <p className="text-lg font-medium mb-2">Start a conversation</p>
              <p className="text-sm">Ask me anything about your database</p>
            </div>
            
            {/* 查詢建議 */}
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-medium text-slate-300">Query Suggestions</h4>
              </div>
              <QuerySuggestions 
                onSelect={handleSendMessage}
                currentContext={currentContext}
                recentQueries={recentQueries}
              />
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((message) => {
            if (message.type === 'error') {
              return (
                <ErrorDisplay
                  key={message.id}
                  error={message.metadata?.error || {}}
                  onRetry={handleRetry}
                  onShowSchema={() => console.log('Show schema')}
                  onShowExamples={() => setShowSuggestions(true)}
                />
              );
            }
            
            // 如果有數據，顯示表格
            if (message.type === 'ai' && message.metadata?.data && message.metadata.data.length > 0) {
              return (
                <div key={message.id} className="space-y-4">
                  <ChatMessage message={message} />
                  <div className="bg-slate-900/50 rounded-lg p-4 overflow-x-auto max-h-[500px] overflow-y-auto">
                    <DataTable data={message.metadata.data} />
                  </div>
                </div>
              );
            }
            
            return <ChatMessage key={message.id} message={message} />;
          })}
        </AnimatePresence>

        {/* 加載指示器 */}
        {isLoading && (
          <ChatMessage 
            message={{
              id: 'loading',
              type: 'ai',
              content: 'Analyzing your query...',
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
    </div>
  );
}

// 簡單的表格組件
function DataTable({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <p className="text-slate-400">No data to display</p>;
  
  // Ensure data is in the correct format
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="text-slate-400">No data to display</p>;
  }
  
  // Unwrap data if it's wrapped in result objects
  let actualData = data;
  if (data[0] && data[0].result) {
    actualData = data.map(item => item.result);
  }
  
  // Get columns from the first row
  const firstRow = actualData[0];
  if (typeof firstRow !== 'object' || firstRow === null) {
    return <p className="text-slate-400">Invalid data format</p>;
  }
  
  const columns = Object.keys(firstRow);
  
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-700">
          {columns.map((col) => (
            <th key={col} className="px-4 py-2 text-left text-slate-300 font-medium whitespace-nowrap">
              {formatColumnName(col)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {actualData.slice(0, 10).map((row, idx) => (
          <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
            {columns.map((col) => (
              <td key={col} className="px-4 py-2 text-slate-400 whitespace-nowrap">
                {formatValue(row[col])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 格式化列名
function formatColumnName(col: string): string {
  return col
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  
  // Handle dates
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
    try {
      const date = new Date(value);
      return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return value;
    }
  }
  
  if (value instanceof Date) return value.toLocaleString();
  
  // For objects, just show [Object]
  if (typeof value === 'object') {
    return '[Object]';
  }
  
  return String(value);
}