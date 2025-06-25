import React from 'react';
import { InfoDialog } from '@/components/ui/notification-dialogs';
import { Keyboard } from 'lucide-react';

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
  const details = (
    <div className="space-y-3">
      {shortcuts.map((shortcut, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50"
        >
          <kbd className="px-3 py-1.5 text-sm font-semibold text-slate-200 bg-slate-700 border border-slate-600 rounded-lg shadow-sm">
            {shortcut.key}
          </kbd>
          <span className="text-sm text-slate-300">
            {shortcut.description}
          </span>
        </div>
      ))}
      
      <div className="mt-4 text-xs text-slate-400 text-center pt-2 border-t border-slate-700">
        按 <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-slate-700 border border-slate-600 rounded">?</kbd> 隨時顯示此幫助
      </div>
    </div>
  );

  return (
    <InfoDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="鍵盤快捷鍵"
      message="使用這些快捷鍵以更快地導航"
      details={details}
    />
  );
};