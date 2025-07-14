/**
 * Universal Upload Widget Component
 * 統一的上傳組件，支援配置驅動和插件系統
 */

'use client';

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUniversalUpload } from './useUniversalUpload';
import { getUploadWidgetConfig } from './uploadConfigs';
import type { UniversalUploadWidgetProps, UploadActionType } from './types';
import { getPluginsForConfig } from './plugins';
import GoogleDriveUploadToast from '@/app/admin/components/dashboard/widgets/GoogleDriveUploadToast';
import { useWidgetToast } from '@/app/admin/hooks/useWidgetToast';

/**
 * Universal Upload Widget Component
 */
export const UniversalUploadWidget: React.FC<UniversalUploadWidgetProps> = ({
  widget,
  isEditMode,
  configId,
  configOverrides,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useWidgetToast();
  
  // 獲取配置
  const config = React.useMemo(() => {
    let baseConfig;
    if (configId) {
      baseConfig = getUploadWidgetConfig(configId as any, configOverrides);
    } else {
      // 從 widget.id 推斷 configId
      const inferredConfigId = widget.id.replace('Widget', '') as any;
      baseConfig = getUploadWidgetConfig(inferredConfigId, configOverrides);
    }
    
    // 添加插件
    const plugins = getPluginsForConfig(baseConfig.features);
    return { ...baseConfig, plugins };
  }, [configId, widget.id, configOverrides]);

  // 使用統一的上傳 hook
  const {
    uploadState,
    isDragging,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    reset,
    getAcceptString,
  } = useUniversalUpload(config);

  // 處理文件輸入變化
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // 處理點擊上傳
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 處理插件動作
  const handlePluginAction = (action: string, data?: any) => {
    switch (action) {
      case 'SET_FOLDER':
        // TODO: 需要在 useUniversalUpload 中添加設置文件夾的方法
        console.log('Set folder:', data);
        break;
      case 'SET_PREVIEW':
        // Preview is handled by the hook
        break;
      case 'SET_AI_RESULT':
        // AI result is handled by the hook
        break;
      default:
        console.log('Unknown plugin action:', action, data);
    }
  };

  // 渲染插件 UI
  const renderPlugins = () => {
    if (!config.plugins || config.plugins.length === 0) return null;
    
    return (
      <>
        {config.plugins.map((plugin) => {
          if (!plugin.renderUI) return null;
          
          const PluginUI = plugin.renderUI;
          return (
            <PluginUI
              key={plugin.id}
              config={config}
              file={undefined} // TODO: Track selected file
              uploadState={uploadState}
              onAction={handlePluginAction}
            />
          );
        })}
      </>
    );
  };

  // 編輯模式
  if (isEditMode) {
    return (
      <div className="h-full p-4 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center">
        <div className="text-center">
          {config.icon && <config.icon className="w-8 h-8 mx-auto text-gray-400 mb-2" />}
          <p className="text-sm text-gray-400">{config.title}</p>
          <p className="text-xs text-gray-500 mt-1">Upload Widget</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {config.icon && (
          <div className={cn(
            "p-2 rounded-lg bg-gradient-to-br",
            config.iconColor || "from-gray-500 to-gray-600"
          )}>
            <config.icon className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{config.title}</h3>
          {config.description && (
            <p className="text-sm text-gray-400">{config.description}</p>
          )}
        </div>
        {uploadState.result && (
          <button
            onClick={reset}
            className="p-1 rounded hover:bg-gray-700 transition-colors"
            title="Clear"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Render Plugins Before Upload Area */}
      {renderPlugins()}

      {/* Upload Area */}
      <div className="flex-1 flex flex-col">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "flex-1 border-2 border-dashed rounded-lg transition-all duration-200",
            "flex flex-col items-center justify-center gap-4",
            isDragging ? "border-blue-500 bg-blue-500/10" : "border-gray-600",
            uploadState.error && "border-red-500/50",
            config.appearance?.dropzoneClassName
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInputChange}
            accept={getAcceptString()}
            className="hidden"
            disabled={uploadState.isUploading}
          />

          <AnimatePresence mode="wait">
            {uploadState.isUploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin mb-4" />
                <p className="text-sm text-gray-300">Uploading...</p>
                <div className="mt-4 w-48">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadState.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{uploadState.progress}%</p>
                </div>
              </motion.div>
            ) : uploadState.result ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-sm text-green-400">Upload successful!</p>
                {config.appearance?.showFileInfo && (
                  <p className="text-xs text-gray-400 mt-1">
                    {uploadState.result.fileName}
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-300 mb-2">
                  Drag and drop your file here
                </p>
                <p className="text-xs text-gray-500 mb-4">or</p>
                <button
                  onClick={handleUploadClick}
                  className={cn(
                    "px-4 py-2 rounded-md text-white text-sm font-medium",
                    "transition-colors duration-200",
                    config.appearance?.buttonClassName || "bg-blue-600 hover:bg-blue-700"
                  )}
                >
                  Browse Files
                </button>
                <p className="text-xs text-gray-500 mt-4">
                  Supported: {config.fileTypes.join(', ')}
                </p>
                <p className="text-xs text-gray-500">
                  Max size: {config.maxSize / (1024 * 1024)}MB
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Display */}
          {uploadState.error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-400 text-center"
            >
              {uploadState.error}
            </motion.p>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {uploadState.isUploading && (
        <GoogleDriveUploadToast
          fileName={uploadState.result?.fileName || 'File'}
          uploadProgress={uploadState.progress}
          onCancel={reset}
        />
      )}
    </div>
  );
};