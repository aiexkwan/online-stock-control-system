import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Shortcut {
  key: string;
  description: string;
}

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: Shortcut[];
}

/**
 * 鍵盤快捷鍵幫助對話框
 * 顯示所有可用的鍵盤快捷鍵
 */
export const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({
  isOpen,
  onOpenChange,
  shortcuts
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate faster
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
            >
              <kbd className="px-2 py-1 text-sm font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                {shortcut.key}
              </kbd>
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {shortcut.description}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center">
          Press <kbd className="px-1 py-0.5 text-xs font-semibold bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:border-gray-600">?</kbd> anytime to show this help
        </div>
      </DialogContent>
    </Dialog>
  );
};