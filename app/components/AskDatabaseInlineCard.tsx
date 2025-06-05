'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Clock, Zap, Database, Brain } from 'lucide-react';
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

export default function AskDatabaseInlineCard() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<QueryResult | null>(null);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    const currentQuestion = question;
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
      setLastResult(result);
    } catch (error: any) {
      console.error('[AskDatabaseInlineCard] Request failed:', error);
      
      // Add error message to result
      const errorResult: QueryResult = {
        question: currentQuestion,
        sql: '',
        result: { data: [], rowCount: 0, executionTime: 0 },
        answer: `Query failed: ${error.message}`,
        complexity: 'simple',
        tokensUsed: 0,
        cached: false,
        timestamp: new Date().toISOString(),
      };
      setLastResult(errorResult);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Ask Me Anything</h3>
        </div>
        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
          Trained On Going...
        </Badge>
      </div>

      {/* Query Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your question, e.g. How many pallets were generated today?"
            className="min-h-[80px] bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 resize-none focus:border-purple-500/50 focus:ring-purple-500/20"
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={!question.trim() || loading}
            className="absolute bottom-3 right-3 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Example Questions */}
      {!lastResult && (
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
      )}

      {/* Query Result */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Question Display */}
            <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-4">
              <p className="text-white font-medium">Question: {lastResult.question}</p>
            </div>

            {/* Answer Display */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                    <Database className="h-5 w-5 text-purple-400" />
                    Query Result
                  </h4>
                  <div className="flex items-center gap-2">
                    {lastResult.cached && (
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                        <Zap className="h-3 w-3 mr-1" />
                        Cached
                      </Badge>
                    )}
                    <Badge className={getComplexityColor(lastResult.complexity)}>
                      {lastResult.complexity}
                    </Badge>
                    <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600/50">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatExecutionTime(lastResult.result.executionTime)}
                    </Badge>
                    {lastResult.tokensUsed > 0 && (
                      <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        <Brain className="h-3 w-3 mr-1" />
                        {lastResult.tokensUsed} tokens
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {lastResult.answer}
                  </p>
                </div>

                {/* Data Preview */}
                {lastResult.result.data && lastResult.result.data.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-slate-300 mb-2">
                      Data Preview ({lastResult.result.rowCount} rows)
                    </h5>
                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 max-h-40 overflow-auto">
                      <pre className="text-xs text-slate-300">
                        {JSON.stringify(lastResult.result.data.slice(0, 3), null, 2)}
                        {lastResult.result.data.length > 3 && '\n...'}
                      </pre>
                    </div>
                  </div>
                )}

                {/* SQL Query Display */}
                {lastResult.sql && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-slate-300 mb-2">Generated SQL Query:</h5>
                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                      <code className="text-xs text-green-300 font-mono">
                        {lastResult.sql}
                      </code>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Clear Result Button */}
            <div className="flex justify-center">
              <Button
                onClick={() => setLastResult(null)}
                variant="outline"
                className="bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-600/50 hover:text-white"
              >
                Clear Result
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 