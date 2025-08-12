'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Brain, Sparkles, Send, Loader2, AlertCircle, Database, MessageCircle, Table,
  Package, ClipboardList, TrendingUp, Search, Calendar, Truck, 
  AlertTriangle, RefreshCw, HelpCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { GlassmorphicCard } from '../components/GlassmorphicCard';
import { cn } from '@/lib/utils';
import type { AIResponse, AIListItem, AITableRow, ChatMessage, ChatbotCardProps } from '../types/ai-response';
import { useAuth } from '@/app/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';


interface SuggestionCategory {
  category: string;
  icon: React.ReactNode;
  queries: string[];
}

interface Anomaly {
  type: 'stuck_pallets' | 'inventory_mismatch' | 'overdue_orders';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  count: number;
  data: Record<string, unknown>[];
  suggestedAction: string;
  detectedAt: string;
}

interface EnhancedError {
  message: string;
  details?: string;
  suggestions?: string[];
  alternatives?: string[];
  showSchema?: boolean;
  showExamples?: boolean;
  showHelp?: boolean;
}

// Render AI response based on type
const renderAIResponse = (response: AIResponse): React.ReactNode => {
  switch (response.type) {
    case 'list':
      const listData = response.data as AIListItem[];
      return (
        <div className="space-y-3">
          {response.summary && <p className="text-sm mb-2">{response.summary}</p>}
          <div className="space-y-2">
            {listData.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                {item.rank && (
                  <span className="text-purple-400 font-semibold min-w-[24px]">
                    {item.rank}.
                  </span>
                )}
                <div className="flex-1">
                  <span className="font-medium">{item.label}</span>
                  {item.value && (
                    <span className="ml-2 text-purple-300">
                      - {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                      {item.unit && ` ${item.unit}`}
                    </span>
                  )}
                  {item.description && (
                    <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {response.conclusion && (
            <p className="text-sm mt-3 pt-2 border-t border-slate-700/50">
              {response.conclusion}
            </p>
          )}
        </div>
      );

    case 'table':
      const tableData = response.data as AITableRow[];
      const columns = response.columns || [];
      return (
        <div className="space-y-3">
          {response.summary && <p className="text-sm mb-2">{response.summary}</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={cn(
                        "px-2 py-1 text-slate-400",
                        col.align === 'right' ? 'text-right' : 'text-left'
                      )}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-700/30">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-2 py-1",
                          col.align === 'right' ? 'text-right' : 'text-left'
                        )}
                      >
                        {col.type === 'number' && typeof row[col.key] === 'number'
                          ? (row[col.key] as number).toLocaleString()
                          : String(row[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {response.conclusion && (
            <p className="text-sm mt-3">{response.conclusion}</p>
          )}
        </div>
      );

    case 'single':
      return (
        <div className="space-y-2">
          {response.summary && <p className="text-sm">{response.summary}</p>}
          <div className="text-2xl font-bold text-purple-400">
            {String(response.data)}
          </div>
          {response.conclusion && <p className="text-sm text-slate-400">{response.conclusion}</p>}
        </div>
      );

    case 'empty':
      return (
        <div className="text-center py-4">
          <AlertCircle className="h-8 w-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-400">
            {response.summary || 'No data found'}
          </p>
          {response.conclusion && (
            <p className="text-xs text-slate-500 mt-2">{response.conclusion}</p>
          )}
        </div>
      );

    case 'summary':
    default:
      return (
        <div className="space-y-2">
          {response.summary && <p className="text-sm">{response.summary}</p>}
          {response.data && (
            <p className="text-sm">
              {typeof response.data === 'string' 
                ? response.data
                : typeof response.data === 'number' 
                ? response.data.toString()
                : typeof response.data === 'object' && response.data !== null
                ? JSON.stringify(response.data)
                : String(response.data)}
            </p>
          )}
          {response.conclusion && (
            <p className="text-sm text-slate-400 mt-2">{response.conclusion}</p>
          )}
        </div>
      );
  }
};

// Enhanced error display component
const EnhancedErrorDisplay: React.FC<{ error: EnhancedError; onRetry: () => void }> = ({ error, onRetry }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-400' />
        <div className="flex-1">
          <h4 className='font-medium text-red-400'>{error.message}</h4>
          {error.details && <p className='mt-1 text-sm text-slate-400'>{error.details}</p>}
        </div>
      </div>

      {error.alternatives && error.alternatives.length > 0 && (
        <div className='rounded-lg bg-slate-800/50 p-3'>
          <p className='mb-2 text-sm text-slate-300'>Did you mean:</p>
          <div className='flex flex-wrap gap-2'>
            {error.alternatives.map((alt, i) => (
              <code key={i} className='rounded bg-slate-700 px-2 py-1 text-xs text-purple-300'>
                {alt}
              </code>
            ))}
          </div>
        </div>
      )}

      {error.suggestions && error.suggestions.length > 0 && (
        <div className='space-y-2'>
          <p className='text-sm text-slate-300'>Suggestions:</p>
          <ul className='space-y-1'>
            {error.suggestions.map((suggestion, i) => (
              <li key={i} className='flex items-start gap-2 text-sm text-slate-400'>
                <span className='mt-0.5 text-slate-500'>•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className='flex flex-wrap gap-2 pt-2'>
        <Button onClick={onRetry} size='sm' variant='outline' className='text-xs'>
          <RefreshCw className='mr-1 h-3 w-3' />
          Retry Query
        </Button>
        {error.showHelp && (
          <Button
            onClick={() => window.open('/help/ask-database', '_blank')}
            size='sm'
            variant='outline'
            className='text-xs'
          >
            <HelpCircle className='mr-1 h-3 w-3' />
            View Help
          </Button>
        )}
      </div>
    </div>
  );
};

// Format message content - handle both string and JSON
const formatMessageContent = (content: string | AIResponse | EnhancedError, onRetry?: () => void): React.ReactNode => {
  // If it's an enhanced error
  if (typeof content === 'object' && 'message' in content && 'suggestions' in content) {
    return <EnhancedErrorDisplay error={content as EnhancedError} onRetry={onRetry || (() => {})} />;
  }
  
  // If it's already an AIResponse object, render it
  if (typeof content === 'object' && 'type' in content) {
    return renderAIResponse(content as AIResponse);
  }
  
  // Try to parse as JSON
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content) as AIResponse;
      if (parsed && typeof parsed === 'object' && 'type' in parsed) {
        return renderAIResponse(parsed);
      }
    } catch {
      // Not JSON, render as plain text
    }
  }
  
  // Fallback to simple text display
  return <div className="text-sm leading-relaxed">{String(content)}</div>;
};

// Chat Message Component
const ChatMessageComponent: React.FC<{ message: ChatMessage; onRetry?: () => void }> = ({ message, onRetry }) => {
  const isUser = message.type === 'user';
  const isError = message.type === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex w-full gap-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
          {isError ? (
            <AlertCircle className="h-4 w-4 text-red-400" />
          ) : (
            <Database className="h-4 w-4 text-purple-400" />
          )}
        </div>
      )}
      
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2',
          isUser
            ? 'bg-purple-500/20 text-white'
            : isError
            ? 'bg-red-500/10 text-red-400'
            : 'bg-slate-800/50 text-slate-200'
        )}
      >
        <div className="text-sm">{formatMessageContent(message.content, onRetry)}</div>
        
        
      </div>
      
      {isUser && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
          <MessageCircle className="h-4 w-4 text-purple-400" />
        </div>
      )}
    </motion.div>
  );
};

// Main ChatbotCard Component
export default function ChatbotCard({ className }: ChatbotCardProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      type: 'ai',
      content: 'Hello! I can help you query the database. Ask me anything about your inventory, orders, or stock levels.',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true); // Enable streaming by default
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[] | null>(null);
  const [showAnomalies, setShowAnomalies] = useState(false);
  const [isDetectingAnomalies, setIsDetectingAnomalies] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [sessionId] = useState(() => `session_${Date.now()}`);

  // Check for anomaly detection access
  const hasAnomalyDetectionAccess = user?.email === 'akwan@pennineindustries.com';

  // Query suggestion categories
  const allSuggestions: SuggestionCategory[] = [
    {
      category: 'Real-time Inventory',
      icon: <Package className='h-4 w-4' />,
      queries: [
        'Show all pallets in Await location',
        'What is the total stock for product code MH001?',
        'How many pallets arrived today?',
        'Which warehouse has the most available space?',
        'Show products with stock below 100 units',
        'List all pallets that have been in Await for more than 7 days',
      ],
    },
    {
      category: 'Order Status',
      icon: <ClipboardList className='h-4 w-4' />,
      queries: [
        'Show all pending orders',
        'How many items need to be shipped today?',
        'What is the status of order REF001?',
        'Show all unprocessed ACO orders',
        'List orders that are overdue',
        'Which orders are partially loaded?',
      ],
    },
    {
      category: 'Efficiency Analysis',
      icon: <TrendingUp className='h-4 w-4' />,
      queries: [
        'How many pallets were produced today?',
        'Show monthly shipping statistics',
        'What is the average transfer time?',
        'Show work level by department today',
        'Compare this week vs last week production',
        'Show most active products today',
      ],
    },
    {
      category: 'Anomaly Detection',
      icon: <AlertCircle className='h-4 w-4' />,
      queries: [
        'Show pallets that have not moved for 30 days',
        'Find duplicate pallet numbers',
        'Show products with inventory discrepancies',
        'List any errors recorded today',
        'Show pallets with missing information',
        'Find orders without customer details',
      ],
    },
  ];

  // Filter suggestions based on permissions
  const suggestions = hasAnomalyDetectionAccess
    ? allSuggestions
    : allSuggestions.filter(cat => cat.category !== 'Anomaly Detection');

  // Context-aware suggestions
  const contextualSuggestions = useMemo(() => {
    const lastMessage = messages.filter(m => m.type === 'user').pop();
    if (!lastMessage) return [];

    const content = lastMessage.content.toString().toLowerCase();
    const suggestions: string[] = [];

    if (content.includes('stock') || content.includes('inventory')) {
      suggestions.push(
        'Show stock movement history for this product',
        'Compare current stock with last month',
        'Show location distribution for this product'
      );
    }

    if (content.includes('order')) {
      suggestions.push(
        'Show all items in this order',
        'Check loading progress for this order',
        'Show similar orders from the same customer'
      );
    }

    if (content.includes('pallet')) {
      suggestions.push(
        'Show movement history for this pallet',
        'Find pallets with the same product',
        'Check QC status for this pallet'
      );
    }

    return suggestions;
  }, [messages]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Run anomaly detection
  const runAnomalyDetection = async () => {
    setIsDetectingAnomalies(true);
    try {
      const response = await fetch('/api/anomaly-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to detect anomalies');
      }

      const data = await response.json();
      const results = data.anomalies || [];
      
      setAnomalies(results);
      setShowAnomalies(true);

      if (results.length > 0) {
        const aiMessage: ChatMessage = {
          id: `ai_anomaly_${Date.now()}`,
          role: 'assistant',
          type: 'ai',
          content: `Found ${results.length} anomalies requiring attention. Click on each to see details.`,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('[AnomalyDetection] Error:', error);
    } finally {
      setIsDetectingAnomalies(false);
    }
  };

  const handleSendMessage = async (question?: string) => {
    const messageToSend = question || input.trim();
    if (!messageToSend || isLoading) return;

    setIsLoading(true);
    setInput('');
    setShowSuggestions(false);

    // Track recent queries
    setRecentQueries(prev => {
      const updated = [messageToSend, ...prev.filter(q => q !== messageToSend)];
      return updated.slice(0, 10); // Keep last 10 queries
    });

    // Add user message
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      type: 'user',
      content: messageToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Use unified API endpoint with mode parameter
    try {
      const requestBody = {
        question: messageToSend,
        sessionId,
        stream: useStreaming,
        features: {
          enableCache: true,
          enableOptimization: true,
          enableAnalysis: false, // Can be toggled based on user preference
        },
      };

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add streaming header if streaming mode is enabled
      if (useStreaming) {
        headers['Accept'] = 'text/event-stream';
      }

      const response = await fetch('/api/ask-database', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok && !useStreaming) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (useStreaming) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedAnswer = '';

        if (reader) {
          // Add placeholder message for streaming
          const streamingMessageId = `ai_streaming_${Date.now()}`;
          setMessages(prev => [...prev, {
            id: streamingMessageId,
            role: 'assistant',
            type: 'ai',
            content: '...',
            timestamp: new Date().toISOString(),
          }]);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;

                try {
                  const parsed = JSON.parse(data);
                  
                  if (parsed.type === 'answer_chunk') {
                    accumulatedAnswer += parsed.content;
                    // Update the streaming message
                    setMessages(prev => prev.map(msg => 
                      msg.id === streamingMessageId 
                        ? { ...msg, content: accumulatedAnswer }
                        : msg
                    ));
                  } else if (parsed.type === 'complete') {
                    // Replace with final parsed answer
                    const finalAnswer = parsed.answer;
                    setMessages(prev => prev.map(msg => 
                      msg.id === streamingMessageId 
                        ? { ...msg, content: finalAnswer }
                        : msg
                    ));
                  } else if (parsed.type === 'cache_hit') {
                    console.log(`Cache hit: ${parsed.level}`);
                  } else if (parsed.type === 'error') {
                    throw new Error(parsed.message);
                  }
                } catch (e) {
                  console.error('Parse error:', e);
                }
              }
            }
          }
        }
      } else {
        // Handle standard JSON response
        const result = await response.json();

        // Build AI response
        const aiMessage: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          type: 'ai',
          content: result.answer || 'Query executed successfully',
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
        const errorMessage: ChatMessage = {
          id: `error_${Date.now()}`,
          role: 'system',
          type: 'error',
          content: error instanceof Error ? error.message : 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <GlassmorphicCard className={cn('flex h-full flex-col p-6', className)}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Database className="h-6 w-6 text-purple-400" />
            <Sparkles className="absolute -right-1 -top-1 h-3 w-3 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Chat with Database</h3>
            <p className="text-xs text-slate-400">Ask questions about your data</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseStreaming(!useStreaming)}
            className="text-xs text-slate-400 hover:text-purple-400 transition-colors"
            title={useStreaming ? 'Streaming enabled' : 'Streaming disabled'}
          >
            {useStreaming ? '⚡ Fast' : '🐢 Normal'}
          </button>
          <Brain className="h-5 w-5 text-purple-400 animate-pulse" />
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-hidden rounded-lg bg-slate-900/30 p-4">
        <div className="h-full overflow-y-auto space-y-4 pr-2">
          {messages.map((message) => (
            <ChatMessageComponent 
              key={message.id} 
              message={message} 
              onRetry={() => {
                // Retry the last user message
                const lastUserMessage = messages.filter(m => m.type === 'user').pop();
                if (lastUserMessage && typeof lastUserMessage.content === 'string') {
                  handleSendMessage(lastUserMessage.content);
                }
              }}
            />
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Enhanced Query Suggestions */}
      {showSuggestions && messages.length === 1 && (
        <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
          {/* Recent Queries */}
          {recentQueries.length > 0 && (
            <div className='rounded-lg border border-slate-700 bg-slate-800 p-4'>
              <h3 className='mb-3 flex items-center gap-2 text-sm font-medium text-slate-300'>
                <Calendar className='h-4 w-4' />
                Recent Queries
              </h3>
              <div className='space-y-1'>
                {recentQueries.slice(0, 3).map((query, index) => (
                  <Button
                    key={index}
                    variant='ghost'
                    size='sm'
                    onClick={() => handleSendMessage(query)}
                    className='w-full justify-start rounded border border-slate-600 bg-slate-700 text-left text-white transition-all hover:bg-slate-600'
                  >
                    <Search className='mr-2 h-3 w-3 opacity-50' />
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Contextual Suggestions */}
          {contextualSuggestions.length > 0 && (
            <div className='rounded-lg border border-blue-600 bg-blue-900/50 p-4'>
              <h3 className='mb-3 flex items-center gap-2 text-sm font-medium text-blue-300'>
                <Database className='h-4 w-4' />
                Related Queries
              </h3>
              <div className='space-y-1'>
                {contextualSuggestions.map((query, index) => (
                  <Button
                    key={index}
                    variant='ghost'
                    size='sm'
                    onClick={() => handleSendMessage(query)}
                    className='w-full justify-start rounded border border-blue-600 bg-blue-700 text-left text-white transition-all hover:bg-blue-600'
                  >
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Category Suggestions */}
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            {suggestions.map(cat => (
              <Card
                key={cat.category}
                className='cursor-pointer border border-slate-600 bg-slate-800 transition-all hover:border-purple-500/50'
                onClick={() => setSelectedCategory(selectedCategory === cat.category ? null : cat.category)}
              >
                <div className='p-3'>
                  <h3 className='mb-2 flex items-center gap-2 font-medium text-white'>
                    {cat.icon}
                    {cat.category}
                    {selectedCategory === cat.category ? (
                      <ChevronUp className='ml-auto h-4 w-4' />
                    ) : (
                      <ChevronDown className='ml-auto h-4 w-4' />
                    )}
                  </h3>

                  {selectedCategory === cat.category && (
                    <div className='mt-3 space-y-1'>
                      {cat.queries.map((query, index) => (
                        <Button
                          key={index}
                          variant='ghost'
                          size='sm'
                          onClick={e => {
                            e.stopPropagation();
                            handleSendMessage(query);
                          }}
                          className='w-full justify-start rounded border border-slate-600 bg-slate-700 px-3 py-2 text-left text-sm text-white transition-all hover:bg-slate-600'
                        >
                          {query}
                        </Button>
                      ))}
                    </div>
                  )}

                  {selectedCategory !== cat.category && (
                    <p className='text-xs text-slate-400'>
                      Click to view {cat.queries.length} suggestions
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className='flex flex-wrap gap-2 pt-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleSendMessage("Show today's summary")}
              className='border-slate-600 bg-slate-700 text-xs text-white hover:border-slate-500 hover:bg-slate-600'
            >
              <Calendar className='mr-1 h-3 w-3' />
              Today&apos;s Summary
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleSendMessage('Show current Await pallets')}
              className='border-slate-600 bg-slate-700 text-xs text-white hover:border-slate-500 hover:bg-slate-600'
            >
              <Package className='mr-1 h-3 w-3' />
              Await Status
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleSendMessage('Show pending shipments')}
              className='border-slate-600 bg-slate-700 text-xs text-white hover:border-slate-500 hover:bg-slate-600'
            >
              <Truck className='mr-1 h-3 w-3' />
              Pending Shipments
            </Button>

            {/* Anomaly Detection Button - only for authorized users */}
            {hasAnomalyDetectionAccess && (
              <Button
                variant='outline'
                size='sm'
                onClick={runAnomalyDetection}
                disabled={isDetectingAnomalies}
                className='border-orange-600 bg-orange-600/20 text-orange-400 hover:bg-orange-600/30'
              >
                {isDetectingAnomalies ? (
                  <>
                    <Loader2 className='mr-2 h-3 w-3 animate-spin' />
                    Detecting Anomalies...
                  </>
                ) : (
                  <>
                    <AlertTriangle className='mr-2 h-3 w-3' />
                    Run Anomaly Detection
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Anomaly Results Display */}
          {showAnomalies && anomalies && anomalies.length > 0 && (
            <div className='rounded-lg border border-orange-600 bg-orange-900/20 p-4'>
              <div className='mb-3 flex items-center justify-between'>
                <h3 className='flex items-center gap-2 text-sm font-medium text-orange-300'>
                  <AlertTriangle className='h-4 w-4' />
                  Anomalies Detected ({anomalies.length})
                </h3>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setShowAnomalies(false)}
                  className='text-xs text-slate-400 hover:text-white'
                >
                  Hide
                </Button>
              </div>
              <div className='space-y-2'>
                {anomalies.map((anomaly, index) => (
                  <div
                    key={index}
                    className={cn(
                      'rounded-lg border p-3 cursor-pointer transition-all',
                      anomaly.severity === 'critical' && 'border-red-600 bg-red-900/20',
                      anomaly.severity === 'high' && 'border-orange-600 bg-orange-900/20',
                      anomaly.severity === 'medium' && 'border-yellow-600 bg-yellow-900/20',
                      anomaly.severity === 'low' && 'border-blue-600 bg-blue-900/20'
                    )}
                    onClick={() => {
                      let query = '';
                      switch (anomaly.type) {
                        case 'stuck_pallets':
                          query = 'Show all pallets that have not moved for over 30 days';
                          break;
                        case 'inventory_mismatch':
                          query = 'Show products where inventory count does not match system records';
                          break;
                        case 'overdue_orders':
                          query = 'Show all orders that are overdue by more than 7 days';
                          break;
                      }
                      if (query) handleSendMessage(query);
                    }}
                  >
                    <div className='flex items-start justify-between'>
                      <div>
                        <h4 className='font-medium text-white'>{anomaly.title}</h4>
                        <p className='text-xs text-slate-400'>{anomaly.description}</p>
                        <p className='mt-1 text-xs text-slate-500'>
                          Count: {anomaly.count} | {anomaly.suggestedAction}
                        </p>
                      </div>
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        anomaly.severity === 'critical' && 'bg-red-600 text-white',
                        anomaly.severity === 'high' && 'bg-orange-600 text-white',
                        anomaly.severity === 'medium' && 'bg-yellow-600 text-black',
                        anomaly.severity === 'low' && 'bg-blue-600 text-white'
                      )}>
                        {anomaly.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toggle Suggestions for existing conversations */}
      {messages.length > 1 && (
        <div className="mt-2 flex justify-center">
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setShowSuggestions(!showSuggestions)}
            className='text-xs text-slate-400 hover:text-purple-400'
          >
            {showSuggestions ? (
              <>
                <ChevronUp className='mr-1 h-3 w-3' />
                Hide Suggestions
              </>
            ) : (
              <>
                <ChevronDown className='mr-1 h-3 w-3' />
                Show Suggestions
              </>
            )}
          </Button>
        </div>
      )}

      {/* Enhanced Query Suggestions for existing conversations */}
      {showSuggestions && messages.length > 1 && (
        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleSendMessage("Show today's summary")}
              className='border-slate-600 bg-slate-700 text-xs text-white hover:border-slate-500 hover:bg-slate-600'
            >
              <Calendar className='mr-1 h-3 w-3' />
              Today&apos;s Summary
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleSendMessage('Show current Await pallets')}
              className='border-slate-600 bg-slate-700 text-xs text-white hover:border-slate-500 hover:bg-slate-600'
            >
              <Package className='mr-1 h-3 w-3' />
              Await Status
            </Button>
            {hasAnomalyDetectionAccess && (
              <Button
                variant='outline'
                size='sm'
                onClick={runAnomalyDetection}
                disabled={isDetectingAnomalies}
                className='border-orange-600 bg-orange-600/20 text-orange-400 hover:bg-orange-600/30'
              >
                {isDetectingAnomalies ? (
                  <>
                    <Loader2 className='mr-2 h-3 w-3 animate-spin' />
                    Detecting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className='mr-2 h-3 w-3' />
                    Anomaly Detection
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="mt-4 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask a question about your data..."
          disabled={isLoading}
          className="flex-1 rounded-lg bg-slate-800/50 px-4 py-2 text-sm text-white placeholder-slate-400 outline-none transition-colors focus:bg-slate-800/70 disabled:opacity-50"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!input.trim() || isLoading}
          className="rounded-lg bg-purple-500/20 p-2 text-purple-400 transition-colors hover:bg-purple-500/30 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>
    </GlassmorphicCard>
  );
}