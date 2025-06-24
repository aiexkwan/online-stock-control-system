'use client';

import React, { useState, useRef } from 'react';
import { Send, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  onClearChat?: () => void;
}

export default function ChatInput({ onSendMessage, disabled, onClearChat }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;
    
    onSendMessage(message);
    setMessage('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-slate-700/50 p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your database..."
            className={cn(
              "min-h-[80px] max-h-[120px] resize-none",
              "bg-slate-800/50 border-slate-700/50",
              "text-white placeholder-slate-400",
              "focus:border-purple-500/50 focus:ring-purple-500/20",
              "pr-12"
            )}
            disabled={disabled}
          />
          
          {/* 發送按鈕 */}
          <Button
            type="submit"
            disabled={!message.trim() || disabled}
            className={cn(
              "absolute bottom-2 right-2",
              "bg-purple-500 hover:bg-purple-600",
              "text-white p-2 rounded-lg",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
            size="sm"
          >
            {disabled ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* 操作按鈕 */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Press <kbd className="px-1.5 py-0.5 bg-slate-700/50 rounded text-slate-300">Enter</kbd> to send, 
            <kbd className="px-1.5 py-0.5 bg-slate-700/50 rounded text-slate-300 ml-1">Shift+Enter</kbd> for new line
          </div>
          
          {onClearChat && (
            <Button
              type="button"
              onClick={onClearChat}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-800/50"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}