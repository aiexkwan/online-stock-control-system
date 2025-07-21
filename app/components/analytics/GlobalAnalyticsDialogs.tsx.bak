/**
 * Global Analytics Dialogs
 * Manages all analytics dialogs
 */

'use client';

import React, { useState, useEffect } from 'react';
import { FinishedTransferDialog } from './FinishedTransferDialog';
import { OrderTrendDialog } from './OrderTrendDialog';
import { StaffWorkloadDialog } from './StaffWorkloadDialog';

interface AnalyticsDialogState {
  finishedTransfer: boolean;
  orderTrend: boolean;
  staffWorkload: boolean;
}

export function GlobalAnalyticsDialogs() {
  const [dialogStates, setDialogStates] = useState<AnalyticsDialogState>({
    finishedTransfer: false,
    orderTrend: false,
    staffWorkload: false,
  });

  useEffect(() => {
    // Event listeners for analytics dialogs
    const handleOpenFinishedTransfer = () => {
      setDialogStates(prev => ({ ...prev, finishedTransfer: true }));
    };

    const handleOpenOrderTrend = () => {
      setDialogStates(prev => ({ ...prev, orderTrend: true }));
    };

    const handleOpenStaffWorkload = () => {
      setDialogStates(prev => ({ ...prev, staffWorkload: true }));
    };

    // Add event listeners
    window.addEventListener('openFinishedTransfer', handleOpenFinishedTransfer);
    window.addEventListener('openOrderTrend', handleOpenOrderTrend);
    window.addEventListener('openStaffWorkload', handleOpenStaffWorkload);

    // Cleanup
    return () => {
      window.removeEventListener('openFinishedTransfer', handleOpenFinishedTransfer);
      window.removeEventListener('openOrderTrend', handleOpenOrderTrend);
      window.removeEventListener('openStaffWorkload', handleOpenStaffWorkload);
    };
  }, []);

  const closeDialog = (dialogKey: keyof AnalyticsDialogState) => {
    setDialogStates(prev => ({ ...prev, [dialogKey]: false }));
  };

  return (
    <>
      <FinishedTransferDialog
        isOpen={dialogStates.finishedTransfer}
        onClose={() => closeDialog('finishedTransfer')}
      />

      <OrderTrendDialog
        isOpen={dialogStates.orderTrend}
        onClose={() => closeDialog('orderTrend')}
      />

      <StaffWorkloadDialog
        isOpen={dialogStates.staffWorkload}
        onClose={() => closeDialog('staffWorkload')}
      />
    </>
  );
}
