/**
 * Upload Widget Plugins Export
 */

export { FolderSelectorPlugin } from './FolderSelectorPlugin';
export { PreviewPlugin } from './PreviewPlugin';
export { AIAnalysisPlugin } from './AIAnalysisPlugin';

// Plugin Registry
import { UploadPlugin } from '../types';
import { FolderSelectorPlugin } from './FolderSelectorPlugin';
import { PreviewPlugin } from './PreviewPlugin';
import { AIAnalysisPlugin } from './AIAnalysisPlugin';

/**
 * Default plugins collection
 */
export const DEFAULT_UPLOAD_PLUGINS: UploadPlugin[] = [
  FolderSelectorPlugin,
  PreviewPlugin,
  AIAnalysisPlugin,
];

/**
 * Plugin registry for easy lookup
 */
export const UPLOAD_PLUGIN_REGISTRY = new Map<string, UploadPlugin>([
  ['folder-selector', FolderSelectorPlugin],
  ['preview', PreviewPlugin],
  ['ai-analysis', AIAnalysisPlugin],
]);

/**
 * Get plugin by ID
 */
export function getUploadPlugin(pluginId: string): UploadPlugin | undefined {
  return UPLOAD_PLUGIN_REGISTRY.get(pluginId);
}

/**
 * Get plugins based on feature configuration
 */
export function getPluginsForConfig(features: any): UploadPlugin[] {
  const plugins: UploadPlugin[] = [];
  
  if (features.folderSelector) {
    plugins.push(FolderSelectorPlugin);
  }
  
  if (features.preview) {
    plugins.push(PreviewPlugin);
  }
  
  if (features.aiAnalysis) {
    plugins.push(AIAnalysisPlugin);
  }
  
  return plugins;
}