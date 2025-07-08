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
    <Card className='border border-red-500/50 bg-red-900/20'>
      <div className='space-y-3 p-4'>
        {/* 錯誤標題 */}
        <div className='flex items-start gap-3'>
          <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-400' />
          <div className='flex-1'>
            <h4 className='font-medium text-red-400'>{error.message}</h4>

            {error.details && <p className='mt-1 text-sm text-slate-400'>{error.details}</p>}
          </div>
        </div>

        {/* 建議的替代方案 */}
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

        {/* 建議 */}
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

        {/* 操作按鈕 */}
        <div className='flex flex-wrap gap-2 pt-2'>
          <Button onClick={onRetry} size='sm' variant='outline' className='text-xs'>
            <RefreshCw className='mr-1 h-3 w-3' />
            Retry Query
          </Button>

          {error.showSchema && onShowSchema && (
            <Button onClick={onShowSchema} size='sm' variant='outline' className='text-xs'>
              <Database className='mr-1 h-3 w-3' />
              View Schema
            </Button>
          )}

          {error.showExamples && onShowExamples && (
            <Button onClick={onShowExamples} size='sm' variant='outline' className='text-xs'>
              <HelpCircle className='mr-1 h-3 w-3' />
              Show Examples
            </Button>
          )}

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
    </Card>
  );
}
