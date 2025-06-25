'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Database, Clock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';

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

interface AskDatabaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AskDatabaseDialog({ isOpen, onClose }: AskDatabaseDialogProps) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<QueryResult[]>([]);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    const currentQuestion = question;
    setQuestion('');

    try {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[AskDatabaseDialog] Submitting question:', currentQuestion);
      
      const response = await fetch('/api/ask-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: currentQuestion,
          sessionId 
        }),
      });

      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[AskDatabaseDialog] Response status:', response.status);
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[AskDatabaseDialog] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[AskDatabaseDialog] Error response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: QueryResult = await response.json();
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[AskDatabaseDialog] Success result:', result);
      setConversation(prev => [...prev, result]);
    } catch (error: any) {
      console.error('[AskDatabaseDialog] Request failed:', error);
      
      // 添加錯誤消息到對話中
      const errorResult: QueryResult = {
        question: currentQuestion,
        sql: '',
        result: { data: [], rowCount: 0, executionTime: 0 },
        answer: `查詢失敗：${error.message}${error.details ? `\n\n詳細信息：${error.details}` : ''}`,
        complexity: 'simple',
        tokensUsed: 0,
        cached: false,
        timestamp: new Date().toISOString(),
      };
      setConversation(prev => [...prev, errorResult]);
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
    "今天生成了多少個托盤？",
    "顯示庫存最多的前5個產品",
    "本週的轉移記錄有哪些？",
    "哪些產品的庫存低於100？",
    "最近的GRN收貨記錄",
  ];

  const testApiStatus = async () => {
    try {
      const response = await fetch('/api/ask-database', {
        method: 'GET',
      });
      const status = await response.json();
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[AskDatabaseDialog] API Status:', status);
      
      // 顯示狀態信息
      const statusMessage = `
API 狀態檢查：
- OpenAI: ${status.openai?.configured ? '✅ 已配置' : '❌ 未配置'} ${status.openai?.accessible ? '✅ 可訪問' : '❌ 不可訪問'}
- 數據庫: ${status.database?.connected ? '✅ 已連接' : '❌ 未連接'} ${status.database?.tablesAccessible ? '✅ 表格可訪問' : '❌ 表格不可訪問'}
- 用戶: ${status.user?.authenticated ? '✅ 已認證' : '❌ 未認證'} ${status.user?.hasPermission ? '✅ 有權限' : '❌ 無權限'}
- 環境變數: ${status.environment?.openaiApiKey ? '✅' : '❌'} OpenAI, ${status.environment?.supabaseUrl ? '✅' : '❌'} Supabase
      `;
      
      alert(statusMessage);
    } catch (error: any) {
      console.error('[AskDatabaseDialog] Status check failed:', error);
      alert(`狀態檢查失敗：${error.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${dialogStyles.content} max-w-6xl !border-purple-500/30`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className={`${dialogStyles.title} !from-purple-300 !via-indigo-300 !to-cyan-300`}>
              <Database className={`h-6 w-6 ${iconColors.purple}`} />
              Ask Database
            </DialogTitle>
            <button
              onClick={testApiStatus}
              className="px-3 py-1 text-xs bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-all duration-300 border border-slate-600/30"
            >
              測試狀態
            </button>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-[calc(90vh-120px)]">
          {/* 對話區域 */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            {conversation.length === 0 ? (
              <div className="text-center py-12">
                <Database className="h-16 w-16 text-purple-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">開始與數據庫對話</h3>
                <p className="text-slate-400 mb-6">使用自然語言查詢您的數據庫資訊</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {exampleQuestions.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setQuestion(example)}
                      className="p-3 text-left bg-slate-700/50 hover:bg-slate-700/70 rounded-lg border border-slate-600/50 hover:border-purple-500/50 transition-all duration-200 text-slate-300 hover:text-white"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence>
                {conversation.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* 用戶問題 */}
                    <div className="flex justify-end">
                      <div className="max-w-2xl bg-purple-600/20 border border-purple-500/30 rounded-2xl p-4">
                        <p className="text-white">{item.question}</p>
                      </div>
                    </div>

                    {/* AI 回應 */}
                    <div className="flex justify-start">
                      <div className="max-w-4xl space-y-4">
                        {/* 自然語言回答 */}
                        <Card className="bg-slate-800/50 border-slate-700/50">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg text-slate-200">回答</CardTitle>
                              <div className="flex items-center gap-2">
                                {item.cached && (
                                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                    <Zap className="h-3 w-3 mr-1" />
                                    緩存
                                  </Badge>
                                )}
                                <Badge className={getComplexityColor(item.complexity)}>
                                  {item.complexity}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-slate-300 leading-relaxed">{item.answer}</p>
                          </CardContent>
                        </Card>

                        {/* SQL 查詢 */}
                        {item.sql && (
                          <Card className="bg-slate-800/50 border-slate-700/50">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg text-slate-200">生成的 SQL</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <pre className="bg-slate-900/50 p-4 rounded-lg overflow-x-auto text-sm text-slate-300 border border-slate-700/50">
                                <code>{item.sql}</code>
                              </pre>
                            </CardContent>
                          </Card>
                        )}

                        {/* 查詢結果 */}
                        {item.result.data.length > 0 && (
                          <Card className="bg-slate-800/50 border-slate-700/50">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg text-slate-200">查詢結果</CardTitle>
                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <Database className="h-4 w-4" />
                                    {item.result.rowCount} 筆記錄
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {formatExecutionTime(item.result.executionTime)}
                                  </span>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="overflow-x-auto">
                                <table className="min-w-full border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-700">
                                      {Object.keys(item.result.data[0] || {}).map((key) => (
                                        <th key={key} className="text-left p-2 text-slate-300 font-medium">
                                          {key}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.result.data.slice(0, 10).map((row, rowIndex) => (
                                      <tr key={rowIndex} className="border-b border-slate-800/50">
                                        {Object.values(row).map((value, colIndex) => (
                                          <td key={colIndex} className="p-2 text-slate-400 text-sm">
                                            {String(value)}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {item.result.data.length > 10 && (
                                  <p className="text-slate-500 text-sm mt-2 text-center">
                                    顯示前 10 筆，共 {item.result.rowCount} 筆記錄
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* 統計資訊 */}
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Tokens: {item.tokensUsed}</span>
                          <span>時間: {new Date(item.timestamp).toLocaleString('zh-TW')}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                    <span className="text-slate-300">正在處理您的查詢...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* 輸入區域 */}
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="flex gap-3">
              <textarea
                ref={textareaRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="請用自然語言描述您想查詢的數據..."
                className="flex-1 min-h-[60px] bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-400 resize-none rounded-lg p-3"
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const form = e.currentTarget.form;
                    if (form) {
                      const formEvent = new Event('submit', { bubbles: true, cancelable: true });
                      form.dispatchEvent(formEvent);
                    }
                  }
                }}
              />
              <Button
                type="submit"
                disabled={!question.trim() || loading}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-6"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 