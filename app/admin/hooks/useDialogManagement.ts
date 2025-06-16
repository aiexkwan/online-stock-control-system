'use client';

import { useState, useCallback } from 'react';

export type DialogType = 
  | 'report'
  | 'upload'
  | 'uploadFilesOnly'
  | 'uploadOrderPDF'
  | 'productSpec'
  | 'void'
  | 'history'
  | 'update'
  | 'askDatabase'
  | 'voidReport'
  | 'loadingReport'
  | 'reprint';

interface DialogState {
  [key: string]: boolean;
}

export function useDialogManagement() {
  const [dialogs, setDialogs] = useState<DialogState>({
    report: false,
    upload: false,
    uploadFilesOnly: false,
    uploadOrderPDF: false,
    productSpec: false,
    void: false,
    history: false,
    update: false,
    askDatabase: false,
    voidReport: false,
    loadingReport: false,
    reprint: false,
  });

  const openDialog = useCallback((type: DialogType) => {
    setDialogs(prev => ({ ...prev, [type]: true }));
  }, []);

  const closeDialog = useCallback((type: DialogType) => {
    setDialogs(prev => ({ ...prev, [type]: false }));
  }, []);

  const toggleDialog = useCallback((type: DialogType) => {
    setDialogs(prev => ({ ...prev, [type]: !prev[type] }));
  }, []);

  const isOpen = useCallback((type: DialogType) => {
    return dialogs[type] || false;
  }, [dialogs]);

  const closeAllDialogs = useCallback(() => {
    setDialogs(Object.keys(dialogs).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {} as DialogState));
  }, [dialogs]);

  return {
    openDialog,
    closeDialog,
    toggleDialog,
    isOpen,
    closeAllDialogs,
    dialogs
  };
}