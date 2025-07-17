/**
 * Folder Selector Plugin
 * 文件夾選擇插件
 */

import React from 'react';
import { FolderIcon } from '@heroicons/react/24/outline';
import { UploadPlugin, UploadPluginUIProps, FolderSelectorConfig } from '../types';
import { cn } from '@/lib/utils';

/**
 * Folder Selector Plugin Component
 */
export const FolderSelectorPluginUI: React.FC<UploadPluginUIProps> = ({
  config,
  uploadState,
  onAction,
}) => {
  const folderConfig = config.features.folderSelector as FolderSelectorConfig;
  
  if (!folderConfig || !folderConfig.enabled) {
    return null;
  }

  const handleFolderChange = (folder: string) => {
    if (onAction) {
      onAction('SET_FOLDER', folder);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        <FolderIcon className="w-4 h-4 inline mr-1" />
        Select Folder {folderConfig.required && <span className="text-red-400">*</span>}
      </label>
      <div className="grid grid-cols-2 gap-2">
        {folderConfig.options.map((folder) => (
          <button
            key={folder}
            onClick={() => handleFolderChange(folder)}
            disabled={uploadState.isUploading}
            className={cn(
              "px-3 py-2 rounded-md text-sm font-medium transition-colors",
              "border border-gray-600",
              uploadState.selectedFolder === folder
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700",
              uploadState.isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            {folder === 'stockPic' && '📷 Stock Pictures'}
            {folder === 'productSpec' && '📄 Product Specs'}
            {folder === 'photos' && '🖼️ Photos'}
            {!['stockPic', 'productSpec', 'photos'].includes(folder) && folder}
          </button>
        ))}
      </div>
      {folderConfig.required && !uploadState.selectedFolder && (
        <p className="text-xs text-yellow-400 mt-1">
          Please select a folder before uploading
        </p>
      )}
    </div>
  );
};

/**
 * Folder Selector Plugin Definition
 */
export const FolderSelectorPlugin: UploadPlugin = {
  id: 'folder-selector',
  name: 'Folder Selector',
  
  beforeValidate: async (file, config) => {
    const folderConfig = config.features.folderSelector as FolderSelectorConfig;
    
    if (folderConfig && folderConfig.enabled && folderConfig.required) {
      // Check if folder is selected (this would need to be passed from component state)
      // For now, we'll assume it's validated in the component
      return true;
    }
    
    return true;
  },
  
  renderUI: (props) => <FolderSelectorPluginUI {...props} />,
};