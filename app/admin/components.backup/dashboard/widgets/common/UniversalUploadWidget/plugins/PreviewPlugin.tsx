/**
 * Preview Plugin
 * 圖片預覽插件
 */

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { UploadPlugin, UploadPluginUIProps, PreviewConfig } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Preview Plugin Component
 */
export const PreviewPluginUI: React.FC<UploadPluginUIProps> = ({
  config,
  file,
  uploadState,
  onAction,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const previewConfig = config.features.preview as PreviewConfig;

  useEffect(() => {
    if (!previewConfig || !previewConfig.enabled) {
      return;
    }
    if (file && file.type.startsWith('image/')) {
      // Check file size for preview
      const maxSize = previewConfig.maxPreviewSize || 5 * 1024 * 1024; // 5MB default
      
      if (file.size <= maxSize) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          setPreviewUrl(url);
          setShowPreview(true);
          if (onAction) {
            onAction('SET_PREVIEW', url);
          }
        };
        reader.readAsDataURL(file);
      }
    }
    
    return () => {
      // Cleanup preview URL
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file, previewConfig, onAction, previewUrl]);

  if (!previewConfig || !previewConfig.enabled || !previewUrl || uploadState.isUploading) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPreview && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="mt-4"
        >
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <PhotoIcon className="w-4 h-4" />
                <span>Preview</span>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 rounded hover:bg-gray-700 transition-colors"
                title="Close preview"
              >
                <XMarkIcon className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            <div className="relative overflow-hidden rounded-lg bg-gray-800 border border-gray-700">
              <Image
                src={previewUrl}
                alt="File preview"
                className="w-full h-48 object-contain"
                width={400}
                height={192}
              />
              
              {/* File Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <p className="text-xs text-white truncate">{file?.name}</p>
                <p className="text-xs text-gray-300">
                  {file && `${(file.size / 1024).toFixed(1)} KB`}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Preview Plugin Definition
 */
export const PreviewPlugin: UploadPlugin = {
  id: 'preview',
  name: 'Image Preview',
  
  beforeValidate: async (file, config) => {
    const previewConfig = config.features.preview as PreviewConfig;
    
    if (previewConfig && previewConfig.enabled) {
      // Check if file type is supported for preview
      const supportedTypes = previewConfig.previewTypes || ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      
      if (!supportedTypes.includes(fileExtension)) {
        // Not a preview error, just skip preview
        return true;
      }
      
      // Check file size
      const maxSize = previewConfig.maxPreviewSize || 5 * 1024 * 1024;
      if (file.size > maxSize) {
        console.warn(`File too large for preview: ${file.size} bytes`);
      }
    }
    
    return true;
  },
  
  renderUI: (props) => <PreviewPluginUI {...props} />,
};