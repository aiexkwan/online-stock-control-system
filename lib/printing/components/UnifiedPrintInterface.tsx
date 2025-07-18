'use client';

import React, { useReducer, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Printer, FileText, History, Settings } from 'lucide-react';
import { PrintType, PrintRequest, PrintOptions, PrintData } from '../types';
import { usePrinting } from '../hooks/usePrinting';
import { PrintDialog } from './PrintDialog';
import { PrintQueueMonitor } from './PrintQueueMonitor';
import { cn } from '@/lib/utils';

export interface PrintInterfaceConfig {
  type: PrintType;
  title: string;
  description?: string;
  FormComponent: React.ComponentType<{
    data: PrintData;
    onDataChange: (data: PrintData) => void;
    onValidationChange: (isValid: boolean, errors: Record<string, string>) => void;
  }>;
  defaultOptions?: Partial<PrintOptions>;
}

export interface UnifiedPrintInterfaceProps {
  config: PrintInterfaceConfig;
  className?: string;
}

interface PrintFormState {
  data: PrintData;
  isValid: boolean;
  errors: Record<string, string>;
}

type PrintFormAction =
  | { type: 'UPDATE_FIELD'; field: string; value: unknown }
  | { type: 'SET_ERRORS'; errors: Record<string, string> }
  | { type: 'RESET_FORM' }
  | { type: 'SET_VALID'; isValid: boolean };

function printFormReducer(state: PrintFormState, action: PrintFormAction): PrintFormState {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        data: { ...state.data, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: '' },
      };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors, isValid: false };
    case 'SET_VALID':
      return { ...state, isValid: action.isValid };
    case 'RESET_FORM':
      return { data: {}, isValid: false, errors: {} };
    default:
      return state;
  }
}

export function UnifiedPrintInterface({ config, className }: UnifiedPrintInterfaceProps) {
  const { print, printing, error } = usePrinting();
  const [formState, dispatch] = useReducer(printFormReducer, {
    data: {},
    isValid: false,
    errors: {},
  });
  const [showPrintDialog, setShowPrintDialog] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('form');

  const handleFieldChange = useCallback((field: string, value: unknown) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  }, []);

  const handleValidationChange = useCallback(
    (isValid: boolean, errors?: Record<string, string>) => {
      dispatch({ type: 'SET_VALID', isValid });
      if (errors) {
        dispatch({ type: 'SET_ERRORS', errors });
      }
    },
    []
  );

  const handlePrint = useCallback(
    async (options: PrintOptions) => {
      const request: PrintRequest = {
        type: config.type,
        data: formState.data,
        options,
        metadata: {
          userId: 'current-user', // TODO: Get from auth context
          timestamp: new Date().toISOString(),
        },
      };

      try {
        const result = await print(request);
        if (result.success) {
          // Reset form after successful print
          dispatch({ type: 'RESET_FORM' });
          setShowPrintDialog(false);
        }
      } catch (err) {
        console.error('Print failed:', err);
      }
    },
    [config.type, formState.data, print]
  );

  const FormComponent = config.FormComponent;

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Printer className='h-5 w-5' />
            {config.title}
          </CardTitle>
          {config.description && (
            <p className='mt-1 text-sm text-muted-foreground'>{config.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='form' className='flex items-center gap-2'>
                <FileText className='h-4 w-4' />
                Form
              </TabsTrigger>
              <TabsTrigger value='queue' className='flex items-center gap-2'>
                <Settings className='h-4 w-4' />
                Queue
              </TabsTrigger>
              <TabsTrigger value='history' className='flex items-center gap-2'>
                <History className='h-4 w-4' />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value='form' className='mt-4'>
              {error && (
                <Alert variant='destructive' className='mb-4'>
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              )}

              <FormComponent
                data={formState.data}
                errors={formState.errors}
                onChange={handleFieldChange}
                onValidationChange={handleValidationChange}
              />

              <div className='mt-6 flex justify-end'>
                <Button
                  onClick={() => setShowPrintDialog(true)}
                  disabled={!formState.isValid || printing}
                >
                  <Printer className='mr-2 h-4 w-4' />
                  Print {config.title}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value='queue' className='mt-4'>
              <PrintQueueMonitor />
            </TabsContent>

            <TabsContent value='history' className='mt-4'>
              <div className='py-8 text-center text-muted-foreground'>
                <History className='mx-auto mb-4 h-12 w-12 opacity-20' />
                <p>Print history will be displayed here</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <PrintDialog
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
        title={`Print ${config.title}`}
        description={`Configure print options for ${config.title.toLowerCase()}`}
        data={formState.data}
        type={config.type}
        onPrint={handlePrint}
        defaultOptions={config.defaultOptions}
      />
    </div>
  );
}
