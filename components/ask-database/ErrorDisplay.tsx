import React from 'react';
import { AlertCircle, RefreshCw, HelpCircle, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorDisplayProps {
  error: {
    message: string;
    details?: string;
    suggestions?: string[];
    alternatives?: string[];
    showSchema?: boolean;
    showExamples?: boolean;
    showHelp?: boolean;
  };
  onRetry: () => void;
  onShowSchema?: () => void;
  onShowExamples?: () => void;
}

export function ErrorDisplay({ error, onRetry, onShowSchema, onShowExamples }: ErrorDisplayProps) {
  return (
    <Card className="bg-red-900/20 border border-red-500/50">
      <div className="p-4 space-y-3">
        {/* 錯誤標題 */}
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-red-400 font-medium">
              {error.message}
            </h4>
            
            {error.details && (
              <p className="text-sm text-slate-400 mt-1">
                {error.details}
              </p>
            )}
          </div>
        </div>

        {/* 建議的替代方案 */}
        {error.alternatives && error.alternatives.length > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-sm text-slate-300 mb-2">Did you mean:</p>
            <div className="flex flex-wrap gap-2">
              {error.alternatives.map((alt, i) => (
                <code key={i} className="text-xs bg-slate-700 px-2 py-1 rounded text-purple-300">
                  {alt}
                </code>
              ))}
            </div>
          </div>
        )}

        {/* 建議 */}
        {error.suggestions && error.suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-slate-300">Suggestions:</p>
            <ul className="space-y-1">
              {error.suggestions.map((suggestion, i) => (
                <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                  <span className="text-slate-500 mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            onClick={onRetry}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry Query
          </Button>
          
          {error.showSchema && onShowSchema && (
            <Button
              onClick={onShowSchema}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              <Database className="w-3 h-3 mr-1" />
              View Schema
            </Button>
          )}
          
          {error.showExamples && onShowExamples && (
            <Button
              onClick={onShowExamples}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              <HelpCircle className="w-3 h-3 mr-1" />
              Show Examples
            </Button>
          )}
          
          {error.showHelp && (
            <Button
              onClick={() => window.open('/help/ask-database', '_blank')}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              <HelpCircle className="w-3 h-3 mr-1" />
              View Help
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}