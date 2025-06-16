'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';

interface ClockNumberConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (clockNumber: string) => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export const ClockNumberConfirmDialog: React.FC<ClockNumberConfirmDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel,
  title = "Confirm Print Action",
  description = "Please enter your clock number to proceed with printing.",
  isLoading = false
}) => {
  const [clockNumber, setClockNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clockNumberInputRef = useRef<HTMLInputElement>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        clockNumberInputRef.current?.focus();
      }, 100);
      setClockNumber('');
      setError(null);
    }
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        handleCancel();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (!isVerifying && !isLoading && clockNumber.trim()) {
          handleConfirm();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isVerifying, isLoading, clockNumber]);

  const validateClockNumber = async (clockNum: string): Promise<boolean> => {
    try {
      console.log('[ClockNumberConfirmDialog] Validating clock number:', clockNum);
      
      // 使用標準 browser client
      const client = createClient();
      
      // 創建超時 Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Validation timeout')), 10000); // 10 秒超時
      });
      
      // 執行查詢
      const queryPromise = client
        .from('data_id')
        .select('id, name')
        .eq('id', parseInt(clockNum, 10))
        .single();
      
      // 使用 Promise.race 處理超時
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) {
        console.error('[ClockNumberConfirmDialog] Error validating clock number:', error);
        return false;
      }

      console.log('[ClockNumberConfirmDialog] Validation result:', data);
      return !!data;
    } catch (error: any) {
      console.error('[ClockNumberConfirmDialog] Exception during validation:', error);
      if (error.message === 'Validation timeout') {
        toast.error('Validation timeout. Please try again.');
      }
      return false;
    }
  };

  const handleConfirm = async () => {
    if (!clockNumber.trim()) {
      setError('Clock number is required');
      return;
    }

    // Validate clock number format (should be numeric)
    const clockNum = clockNumber.trim();
    if (!/^\d+$/.test(clockNum)) {
      setError('Clock number must be numeric');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const isValid = await validateClockNumber(clockNum);
      
      if (isValid) {
        onConfirm(clockNum);
        setClockNumber('');
        setError(null);
      } else {
        setError('Clock number not found. Please check and try again.');
        toast.error('Invalid clock number');
      }
    } catch (error) {
      console.error('[ClockNumberConfirmDialog] Error during confirmation:', error);
      setError('An error occurred while validating clock number');
      toast.error('Validation error occurred');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    setClockNumber('');
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numeric input
    if (/^\d*$/.test(value)) {
      setClockNumber(value);
      if (error) {
        setError(null);
      }
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          handleCancel();
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-blue-400">{title}</DialogTitle>
          <DialogDescription className="text-gray-300">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="clock-number" className="text-sm font-medium text-gray-300">
              Clock Number
            </label>
            <Input
              id="clock-number"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              ref={clockNumberInputRef}
              value={clockNumber}
              onChange={handleInputChange}
              placeholder="Enter your clock number"
              className={`bg-gray-700 border-gray-600 placeholder-gray-500 text-white focus:ring-blue-500 focus:border-blue-500 ${
                error ? 'border-red-500 focus:ring-red-500' : ''
              }`}
              disabled={isVerifying || isLoading}
            />
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel} 
            disabled={isVerifying || isLoading}
            className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isVerifying || isLoading || !clockNumber.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-500"
          >
            {isVerifying ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClockNumberConfirmDialog; 