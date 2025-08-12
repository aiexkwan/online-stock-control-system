'use client';

import React, { useState, useEffect } from 'react';
import { DatabaseRecord } from '@/types/database/tables';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Loader2, Printer, X } from 'lucide-react';
import { PrintOptions, PaperSize, PrintPriority } from '../types';
import { usePrinting } from '../hooks/usePrinting';
import { PrintPreview } from './PrintPreview';

export interface PrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  data: DatabaseRecord[];
  type: string;
  onPrint?: (options: PrintOptions) => Promise<void>;
  defaultOptions?: Partial<PrintOptions>;
}

export function PrintDialog({
  open,
  onOpenChange,
  title,
  description,
  data,
  type,
  onPrint,
  defaultOptions,
}: PrintDialogProps) {
  const { printing } = usePrinting();

  const [options, setOptions] = useState<PrintOptions>({
    copies: defaultOptions?.copies || 1,
    paperSize: defaultOptions?.paperSize || PaperSize.A4,
    orientation: defaultOptions?.orientation || 'portrait',
    margins: defaultOptions?.margins || { top: 10, right: 10, bottom: 10, left: 10 },
    priority: defaultOptions?.priority || PrintPriority.NORMAL,
    duplex: defaultOptions?.duplex || false,
    color: defaultOptions?.color || true,
  });

  const [showPreview, setShowPreview] = useState(true);

  const handlePrint = async () => {
    if (onPrint) {
      await onPrint(options);
      onOpenChange(false);
    }
  };

  const handleCopiesChange = (value: string) => {
    const copies = parseInt(value) || 1;
    setOptions(prev => ({ ...prev, copies: Math.max(1, Math.min(999, copies)) }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-4xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className='grid grid-cols-1 gap-6 py-4 md:grid-cols-2'>
          {/* Print Options */}
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold'>Print Options</h3>

            {/* Copies */}
            <div className='space-y-2'>
              <Label htmlFor='copies'>Copies</Label>
              <Input
                id='copies'
                type='number'
                min='1'
                max='999'
                value={options.copies}
                onChange={e => handleCopiesChange(e.target.value)}
                className='w-full'
              />
            </div>

            {/* Paper Size */}
            <div className='space-y-2'>
              <Label htmlFor='paperSize'>Paper Size</Label>
              <Select
                value={options.paperSize}
                onValueChange={(value: string) =>
                  setOptions(prev => ({ ...prev, paperSize: value as PaperSize }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaperSize.A4}>A4</SelectItem>
                  <SelectItem value={PaperSize.A5}>A5</SelectItem>
                  <SelectItem value={PaperSize.LETTER}>Letter</SelectItem>
                  <SelectItem value={PaperSize.LEGAL}>Legal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Orientation */}
            <div className='space-y-2'>
              <Label>Orientation</Label>
              <RadioGroup
                value={options.orientation}
                onValueChange={value =>
                  setOptions(prev => ({ ...prev, orientation: value as 'portrait' | 'landscape' }))
                }
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='portrait' id='portrait' />
                  <Label htmlFor='portrait'>Portrait</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='landscape' id='landscape' />
                  <Label htmlFor='landscape'>Landscape</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Priority */}
            <div className='space-y-2'>
              <Label>Priority</Label>
              <RadioGroup
                value={options.priority}
                onValueChange={value =>
                  setOptions(prev => ({ ...prev, priority: value as PrintPriority }))
                }
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value={PrintPriority.HIGH} id='high' />
                  <Label htmlFor='high'>High</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value={PrintPriority.NORMAL} id='normal' />
                  <Label htmlFor='normal'>Normal</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value={PrintPriority.LOW} id='low' />
                  <Label htmlFor='low'>Low</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Additional Options */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='duplex'>Double-sided</Label>
                <Switch
                  id='duplex'
                  checked={options.duplex}
                  onCheckedChange={checked => setOptions(prev => ({ ...prev, duplex: checked }))}
                />
              </div>

              <div className='flex items-center justify-between'>
                <Label htmlFor='color'>Color</Label>
                <Switch
                  id='color'
                  checked={options.color}
                  onCheckedChange={checked => setOptions(prev => ({ ...prev, color: checked }))}
                />
              </div>

              <div className='flex items-center justify-between'>
                <Label htmlFor='preview'>Show Preview</Label>
                <Switch id='preview' checked={showPreview} onCheckedChange={setShowPreview} />
              </div>
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className='space-y-2'>
              <h3 className='text-sm font-semibold'>Preview</h3>
              <PrintPreview
                type={type}
                data={data}
                options={options}
                className='rounded-lg border'
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={printing}>
            Cancel
          </Button>
          <Button onClick={handlePrint} disabled={printing}>
            {printing ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Printing...
              </>
            ) : (
              <>
                <Printer className='mr-2 h-4 w-4' />
                Print
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
