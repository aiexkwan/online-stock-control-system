'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Clock, Zap, Brain, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QueryResult {
  question: string;
  sql: string;
  result: {
    data: any[];
    rowCount: number;
    executionTime: number;
  };
  answer: string;
  complexity: 'simple' | 'medium' | 'complex';
  tokensUsed: number;
  cached: boolean;
  timestamp: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  metadata?: {
    complexity?: string;
    executionTime?: number;
    tokensUsed?: number;
    cached?: boolean;
  };
}

export default function AskDatabaseInlineCard() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    messagesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToTop();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    const currentQuestion = question;
    const userMessageId = `user_${Date.now()}`;
    
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: userMessageId,
      type: 'user',
      content: currentQuestion,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setQuestion('');

    try {
      console.log('[AskDatabaseInlineCard] Submitting question:', currentQuestion);
      
      const response = await fetch('/api/ask-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: currentQuestion,
          sessionId 
        }),
      });

      console.log('[AskDatabaseInlineCard] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[AskDatabaseInlineCard] Error response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: QueryResult = await response.json();
      console.log('[AskDatabaseInlineCard] Success result:', result);
      
      // Add AI response message
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
        }
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('[AskDatabaseInlineCard] Request failed:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'ai',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'complex': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const exampleQuestions = [
    "How many pallets were generated today?",
    "Show the top 5 products with the highest stock",
    "What are the transfer records for this week?",
    "Which products have less than 100 units in stock?",
    "How many GRN receipts were recorded today?",
    "What is the total stock of MHCOL2 products?"
  ];

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Chat with Database</h3>
          </div>
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
           Pennine Assistant
          </Badge>
        </div>
        {messages.length > 0 && (
          <Button
            onClick={clearChat}
            variant="outline"
            size="sm"
            className="bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-600/50 hover:text-white"
          >
            Clear Chat
          </Button>
        )}
      </div>

      {/* Chat Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="text-center text-slate-400 py-8">
              <Brain className="h-12 w-12 mx-auto mb-4 text-purple-400/50" />
              <p className="text-lg font-medium mb-2">Start a conversation</p>
              <p className="text-sm">Ask me anything about your database</p>
            </div>
            
            {/* Example Questions */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-300">Quick Query Examples:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {exampleQuestions.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setQuestion(example)}
                    className="p-3 text-left bg-slate-700/30 hover:bg-slate-700/50 rounded-lg border border-slate-600/30 hover:border-purple-500/50 transition-all duration-200 text-slate-300 hover:text-white text-sm"
                    disabled={loading}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'bg-blue-500/20 text-blue-300' 
                    : 'bg-purple-500/20 text-purple-300'
                }`}>
                  {message.type === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>

                {/* Message Content */}
                <div className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-2xl px-4 py-3 max-w-full ${
                    message.type === 'user'
                      ? 'bg-blue-600/80 text-white rounded-br-md'
                      : 'bg-slate-700/80 text-slate-100 rounded-bl-md'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                  
                  {/* Message Metadata */}
                  <div className={`flex items-center gap-2 mt-1 text-xs text-slate-400 ${
                    message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}>
                    <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                    
                    {message.metadata && (
                      <>
                        {message.metadata.cached && (
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                            <Zap className="h-2 w-2 mr-1" />
                            Cached
                          </Badge>
                        )}
                        {message.metadata.complexity && (
                          <Badge className={`${getComplexityColor(message.metadata.complexity)} text-xs`}>
                            {message.metadata.complexity}
                          </Badge>
                        )}
                        {message.metadata.executionTime && (
                          <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600/50 text-xs">
                            <Clock className="h-2 w-2 mr-1" />
                            {formatExecutionTime(message.metadata.executionTime)}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex gap-3 max-w-[80%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-slate-700/80 text-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-700/50 p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question here..."
              className="min-h-[60px] bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 resize-none focus:border-purple-500/50 focus:ring-purple-500/20 pr-12"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
            />
            <Button
              type="submit"
              disabled={!question.trim() || loading}
              className="absolute bottom-2 right-2 bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 