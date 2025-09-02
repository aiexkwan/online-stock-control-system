/**
 * Unified Report Dialog Component
 * Base dialog component for all report types
 */

'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { dialogStyles, iconColors } from '../../../utils/dialogStyles';

interface UnifiedReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  formats: ('pdf' | 'excel')[];
  onGenerate: (format: 'pdf' | 'excel') => Promise<void>;
  loading?: boolean;
  children?: React.ReactNode;
}

export function UnifiedReportDialog({
  isOpen,
  onClose,
  title,
  description,
  formats,
  onGenerate,
  loading = false,
  children,
}: UnifiedReportDialogProps) {
  const [selectedFormat, setSelectedFormat] = React.useState<'pdf' | 'excel'>(formats[0]);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate(selectedFormat);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${dialogStyles.content} max-w-lg`}>
        <DialogHeader>
          <DialogTitle className={dialogStyles.title}>
            <FileText className={`h-5 w-5 ${iconColors.blue}`} />
            {title}
          </DialogTitle>
          <DialogDescription className={dialogStyles.description}>{description}</DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {children}

          {formats.length > 1 && (
            <div className='space-y-2'>
              <label className='text-sm font-medium text-slate-200'>Export Format</label>
              <div className='flex gap-2'>
                {formats.map(format => (
                  <Button
                    key={format}
                    variant={selectedFormat === format ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setSelectedFormat(format)}
                    className={
                      selectedFormat === format
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }
                  >
                    {format === 'pdf' ? 'PDF' : 'Excel'}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={onClose}
            disabled={isGenerating || loading}
            className={dialogStyles.secondaryButton}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || loading}
            className={dialogStyles.primaryButton}
          >
            {isGenerating || loading ? (
              <>
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                Generating...
              </>
            ) : (
              <>
                <Download className='mr-2 h-4 w-4' />
                Generate Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
