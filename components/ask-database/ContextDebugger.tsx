import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Database, Link, Eye } from 'lucide-react';

interface ContextDebuggerProps {
  resolvedQuestion?: string;
  originalQuestion: string;
  references?: any[];
  className?: string;
}

export function ContextDebugger({
  resolvedQuestion,
  originalQuestion,
  references = [],
  className,
}: ContextDebuggerProps) {
  if (!resolvedQuestion || resolvedQuestion === originalQuestion) {
    return null;
  }

  return (
    <Card className={`border-blue-600/50 bg-blue-900/20 p-3 ${className}`}>
      <div className='space-y-2'>
        <div className='flex items-center gap-2 text-sm font-medium text-blue-400'>
          <Link className='h-4 w-4' />
          Context Resolution Applied
        </div>

        <div className='space-y-2 text-xs'>
          <div className='flex items-start gap-2'>
            <MessageSquare className='mt-0.5 h-3 w-3 text-slate-500' />
            <div className='flex-1'>
              <span className='text-slate-400'>Original:</span>
              <p className='text-white'>{originalQuestion}</p>
            </div>
          </div>

          <div className='flex items-start gap-2'>
            <Database className='mt-0.5 h-3 w-3 text-slate-500' />
            <div className='flex-1'>
              <span className='text-slate-400'>Resolved:</span>
              <p className='text-white'>{resolvedQuestion}</p>
            </div>
          </div>

          {references.length > 0 && (
            <div className='mt-2 border-t border-slate-700 pt-2'>
              <div className='mb-1 flex items-center gap-2'>
                <Eye className='h-3 w-3 text-slate-500' />
                <span className='text-slate-400'>References:</span>
              </div>
              <div className='ml-5 space-y-1'>
                {references.map((ref, idx) => (
                  <div key={idx} className='flex items-center gap-2'>
                    <span className='text-orange-400'>&quot;{ref.original}&quot;</span>
                    <span className='text-slate-500'>→</span>
                    <span className='text-green-400'>{ref.resolved}</span>
                    <Badge variant='secondary' className='ml-1 text-xs'>
                      {ref.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
