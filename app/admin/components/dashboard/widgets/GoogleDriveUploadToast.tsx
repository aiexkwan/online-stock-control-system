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

  const uploadingCount = files.filter(f => f.status === 'uploading').length;
  const completedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-8 right-8 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-50"
        style={{ width: '360px' }}
      >
        {/* Header */}
        <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium text-white">
              {uploadingCount > 0 ? 'Uploading files' : 'Upload complete'}
            </h3>
            {uploadingCount > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400">{uploadingCount} of {files.length}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* File List */}
        <div className="max-h-[300px] overflow-y-auto">
          {files.map((file) => (
            <div key={file.id} className="px-4 py-3 border-b border-slate-700/50 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {file.status === 'completed' && (
                    <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                  )}
                  {file.status === 'error' && (
                    <XMarkIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                  <span className="text-sm text-slate-200 truncate" title={file.name}>
                    {file.name}
                  </span>
                </div>
                {file.status !== 'uploading' && (
                  <button
                    onClick={() => onRemoveFile(file.id)}
                    className="text-slate-500 hover:text-slate-300 transition-colors ml-2"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              {file.status === 'uploading' && (
                <div className="relative w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute left-0 top-0 h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${file.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
              
              {file.status === 'error' && file.error && (
                <p className="text-xs text-red-400 mt-1">{file.error}</p>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        {uploadingCount === 0 && (
          <div className="px-4 py-2 bg-slate-900/50 text-xs text-slate-400">
            {completedCount > 0 && (
              <span className="text-green-400">{completedCount} uploaded</span>
            )}
            {completedCount > 0 && errorCount > 0 && <span> • </span>}
            {errorCount > 0 && (
              <span className="text-red-400">{errorCount} failed</span>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};