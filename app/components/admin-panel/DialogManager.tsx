/**
 * Dialog Manager Component
 * 集中渲染和管理所有對話框
 */

'use client';

import React from 'react';
import { useDialog, useReprintDialog } from '@/app/contexts/DialogContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';

// Import all dialog components
import UploadFilesDialog from '@/app/components/admin-panel-menu/UploadFilesDialog';
import { UploadFilesOnlyDialog } from '@/app/components/admin-panel-menu/UploadFilesOnlyDialog';
import { UploadOrderPDFDialog } from '@/app/components/admin-panel-menu/UploadOrderPDFDialog';
import VoidPalletDialog from '@/app/components/admin-panel-menu/VoidPalletDialog';
import ViewHistoryDialog from '@/app/components/admin-panel-menu/ViewHistoryDialog';
import DatabaseUpdateDialog from '@/app/components/admin-panel-menu/DatabaseUpdateDialog';
import AskDatabaseDialog from '@/app/components/admin-panel-menu/AskDatabaseDialog';
import { ReprintInfoDialog } from '@/app/void-pallet/components/ReprintInfoDialog';

interface DialogManagerProps {
  // Callbacks for specific dialogs
  onReprintNeeded?: (reprintInfo: any) => void;
  onReprintConfirm?: (reprintInfo: any) => void;
  onReprintCancel?: () => void;
  voidState?: any;
}

export function DialogManager({ 
  onReprintNeeded,
  onReprintConfirm,
  onReprintCancel,
  voidState 
}: DialogManagerProps) {
  const { dialogs, closeDialog, dialogData } = useDialog();
  const { reprintData } = useReprintDialog();

  return (
    <>
      {/* Upload Files Dialog */}
      <UploadFilesDialog
        isOpen={dialogs.uploadFiles}
        onOpenChange={(open) => !open && closeDialog('uploadFiles')}
      />

      {/* Upload Files Only Dialog */}
      <UploadFilesOnlyDialog
        isOpen={dialogs.uploadFilesOnly}
        onOpenChange={(open) => !open && closeDialog('uploadFilesOnly')}
      />

      {/* Upload Order PDF Dialog */}
      <UploadOrderPDFDialog
        isOpen={dialogs.uploadOrderPdf}
        onOpenChange={(open) => !open && closeDialog('uploadOrderPdf')}
      />

      {/* Product Spec Doc Dialog */}
      <Dialog 
        open={dialogs.productSpec} 
        onOpenChange={(open) => !open && closeDialog('productSpec')}
      >
        <DialogContent className={`${dialogStyles.content} max-w-4xl`}>
          <DialogHeader>
            <DialogTitle className={dialogStyles.title}>
              <DocumentTextIcon className={`w-7 h-7 ${iconColors.blue}`} />
              Product Specification Documents
            </DialogTitle>
            <DialogDescription className={dialogStyles.description}>
              Manage product specification documents and related files
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="text-center py-12">
              <DocumentTextIcon className="w-20 h-20 text-slate-600 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-300 mb-3">
                Product Spec Doc Management
              </h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                This feature is under development. It will allow you to upload, manage, and organize product specification documents.
              </p>
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 max-w-lg mx-auto">
                <p className="text-blue-300 text-sm">
                  📋 Coming soon: Upload PDF documents, organize by product codes, search and filter functionality
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-4 pt-6">
            <Button
              onClick={() => closeDialog('productSpec')}
              variant="outline"
              className={dialogStyles.secondaryButton}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Pallet Dialog */}
      <VoidPalletDialog
        isOpen={dialogs.voidPallet}
        onClose={() => closeDialog('voidPallet')}
        onReprintNeeded={onReprintNeeded}
      />

      {/* View History Dialog */}
      <ViewHistoryDialog
        isOpen={dialogs.viewHistory}
        onClose={() => closeDialog('viewHistory')}
      />

      {/* Database Update Dialog */}
      <DatabaseUpdateDialog
        isOpen={dialogs.databaseUpdate}
        onClose={() => closeDialog('databaseUpdate')}
        defaultTab={dialogData?.defaultTab}
      />

      {/* Ask Database Dialog */}
      <AskDatabaseDialog
        isOpen={dialogs.askDatabase}
        onClose={() => closeDialog('askDatabase')}
      />

      {/* Reprint Info Dialog */}
      {dialogs.reprint && reprintData && (
        <ReprintInfoDialog
          isOpen={dialogs.reprint}
          onClose={() => {
            closeDialog('reprint');
            onReprintCancel?.();
          }}
          onConfirm={(info) => {
            onReprintConfirm?.(info);
            closeDialog('reprint');
          }}
          type={reprintData.type}
          palletInfo={reprintData.palletInfo}
          remainingQuantity={reprintData.reprintInfo?.remainingQuantity}
          isProcessing={voidState?.isAutoReprinting || false}
        />
      )}
    </>
  );
}