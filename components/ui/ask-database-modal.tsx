'use client';

import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAskDatabaseModal } from '@/hooks/useAskDatabaseModal';
import EnhancedChatInterface from '@/app/components/admin/UniversalChatbot/EnhancedChatInterface';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

export function AskDatabaseModal() {
  const { isOpen, close, open } = useAskDatabaseModal();

  // Listen for custom event to open modal
  useEffect(() => {
    const handleOpenEvent = () => {
      open();
    };

    window.addEventListener('openAskDatabase', handleOpenEvent);
    return () => {
      window.removeEventListener('openAskDatabase', handleOpenEvent);
    };
  }, [open]);

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 bg-slate-900 border-slate-700 text-white">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl text-white flex items-center gap-2">
                Ask Database
                <Badge variant="secondary" className="bg-purple-900/50 text-purple-300 border-purple-700">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Enhanced
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-slate-300">
                Ask questions about your data in natural language with smart suggestions and visualizations
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
          <EnhancedChatInterface />
        </div>
      </DialogContent>
    </Dialog>
  );
}