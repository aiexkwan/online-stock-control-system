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
import ChatInterface from '@/app/components/admin/UniversalChatbot/ChatInterface';

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
      <DialogContent className="max-w-4xl w-[90vw] h-[85vh] flex flex-col p-0 gap-0 bg-slate-900 border-slate-700 text-white">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-700 bg-slate-800/50">
          <DialogTitle className="text-xl text-white">Ask Database</DialogTitle>
          <DialogDescription className="text-slate-300">
            Ask questions about your data in natural language
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden bg-slate-900">
          <ChatInterface />
        </div>
      </DialogContent>
    </Dialog>
  );
}