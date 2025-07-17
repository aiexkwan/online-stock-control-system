'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface GoogleDriveUploadToastProps {
  files: UploadingFile[];
  onClose: () => void;
  onRemoveFile: (id: string) => void;
}

export const GoogleDriveUploadToast: React.FC<GoogleDriveUploadToastProps> = ({
  files,
  onClose,
  onRemoveFile,
}) => {
  if (files.length === 0) return null;

  const uploadingCount = files.filter((f: any) => (f as { status: string }).status === 'uploading').length;
  const completedCount = files.filter((f: any) => (f as { status: string }).status === 'completed').length;
  const errorCount = files.filter((f: any) => (f as { status: string }).status === 'error').length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className='fixed bottom-8 right-8 z-50 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-2xl'
        style={{ width: '360px' }}
      >
        {/* Header */}
        <div className='flex items-center justify-between border-b border-slate-700 bg-slate-900 px-4 py-3'>
          <div className='flex items-center gap-3'>
            <h3 className='text-sm font-medium text-white'>
              {uploadingCount > 0 ? 'Uploading files' : 'Upload complete'}
            </h3>
            {uploadingCount > 0 && (
              <div className='flex items-center gap-1'>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent' />
                <span className='text-xs text-slate-400'>
                  {uploadingCount} of {files.length}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className='rounded p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white'
          >
            <XMarkIcon className='h-4 w-4' />
          </button>
        </div>

        {/* File List */}
        <div className='max-h-[300px] overflow-y-auto'>
          {files.map((file: any) => (
            <div key={file.id} className='border-b border-slate-700/50 px-4 py-3 last:border-0'>
              <div className='mb-2 flex items-center justify-between'>
                <div className='flex min-w-0 flex-1 items-center gap-2'>
                  {(file as { status: string }).status === 'completed' && (
                    <CheckCircleIcon className='h-4 w-4 flex-shrink-0 text-green-400' />
                  )}
                  {(file as { status: string }).status === 'error' && (
                    <XMarkIcon className='h-4 w-4 flex-shrink-0 text-red-400' />
                  )}
                  <span className='truncate text-sm text-slate-200' title={file.name}>
                    {file.name}
                  </span>
                </div>
                {(file as { status: string }).status !== 'uploading' && (
                  <button
                    onClick={() => onRemoveFile(file.id)}
                    className='ml-2 text-slate-500 transition-colors hover:text-slate-300'
                  >
                    <XMarkIcon className='h-3 w-3' />
                  </button>
                )}
              </div>

              {(file as { status: string }).status === 'uploading' && (
                <div className='relative h-1 w-full overflow-hidden rounded-full bg-slate-700'>
                  <motion.div
                    className='absolute left-0 top-0 h-full bg-blue-500'
                    initial={{ width: 0 }}
                    animate={{ width: `${file.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}

              {(file as { status: string }).status === 'error' && file.error && (
                <p className='mt-1 text-xs text-red-400'>{file.error}</p>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        {uploadingCount === 0 && (
          <div className='bg-slate-900/50 px-4 py-2 text-xs text-slate-400'>
            {completedCount > 0 && (
              <span className='text-green-400'>{completedCount} uploaded</span>
            )}
            {completedCount > 0 && errorCount > 0 && <span> • </span>}
            {errorCount > 0 && <span className='text-red-400'>{errorCount} failed</span>}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default GoogleDriveUploadToast;
