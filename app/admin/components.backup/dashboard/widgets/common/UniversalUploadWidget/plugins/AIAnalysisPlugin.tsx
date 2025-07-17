/**
 * AI Analysis Plugin
 * AI 分析插件用於處理 PDF 訂單
 */

import React, { useState, useEffect } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';
import { UploadPlugin, UploadPluginUIProps, AIAnalysisConfig, UploadResult } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/**
 * AI Analysis Result Dialog Component
 */
const AIAnalysisResultDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: any;
}> = ({ open, onOpenChange, result }) => {
  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-purple-500" />
            AI Analysis Result
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Order Summary */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Order Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">Order Number:</span>
                <span className="ml-2 text-white">{result.orderNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400">Customer:</span>
                <span className="ml-2 text-white">{result.customer || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400">Total Items:</span>
                <span className="ml-2 text-white">{result.totalItems || 0}</span>
              </div>
              <div>
                <span className="text-gray-400">Total Amount:</span>
                <span className="ml-2 text-white">{result.totalAmount || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Line Items */}
          {result.lineItems && result.lineItems.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Line Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">Product</th>
                      <th className="text-center py-2 text-gray-400">Quantity</th>
                      <th className="text-right py-2 text-gray-400">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.lineItems.map((item: any, index: number) => (
                      <tr key={index} className="border-b border-gray-700/50">
                        <td className="py-2 text-white">{item.product}</td>
                        <td className="py-2 text-center text-white">{item.quantity}</td>
                        <td className="py-2 text-right text-white">{item.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Raw Data (for debugging) */}
          <details className="bg-gray-800 rounded-lg p-4">
            <summary className="text-sm font-semibold text-gray-300 cursor-pointer">
              Raw Analysis Data
            </summary>
            <pre className="mt-2 text-xs text-gray-400 overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * AI Analysis Plugin Component
 */
export const AIAnalysisPluginUI: React.FC<UploadPluginUIProps> = ({
  config,
  uploadState,
  onAction,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  
  const aiConfig = config.features.aiAnalysis as AIAnalysisConfig;
  
  if (!aiConfig || !aiConfig.enabled) {
    return null;
  }

  // Show analysis status during upload
  if (uploadState.isUploading && uploadState.progress > 80) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 flex items-center gap-2 text-sm"
      >
        <div className="flex items-center gap-2 text-purple-400">
          <SparklesIcon className="w-4 h-4 animate-pulse" />
          <span>AI analysis will begin after upload...</span>
        </div>
      </motion.div>
    );
  }

  // Show analysis in progress
  if (isAnalyzing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4"
      >
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-purple-300">Analyzing PDF</p>
              <p className="text-xs text-gray-400 mt-1">
                AI is extracting order information...
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Show analysis complete
  if (analysisResult && uploadState.result) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <SparklesIcon className="w-5 h-5 text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-300">Analysis Complete</p>
                <p className="text-xs text-gray-400 mt-1">
                  Successfully extracted order information
                </p>
              </div>
              {aiConfig.showResultDialog && (
                <button
                  onClick={() => setShowResultDialog(true)}
                  className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                >
                  View Results
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {aiConfig.showResultDialog && (
          <AIAnalysisResultDialog
            open={showResultDialog}
            onOpenChange={setShowResultDialog}
            result={analysisResult}
          />
        )}
      </>
    );
  }

  return null;
};

/**
 * AI Analysis Plugin Definition
 */
export const AIAnalysisPlugin: UploadPlugin = {
  id: 'ai-analysis',
  name: 'AI Analysis',
  
  afterUpload: async (result: UploadResult, config) => {
    const aiConfig = config.features.aiAnalysis as AIAnalysisConfig;
    
    if (!aiConfig || !aiConfig.enabled || !result.success) {
      return;
    }

    try {
      // Call AI analysis endpoint
      const endpoint = aiConfig.endpoint || '/api/analyze-order-pdf-new';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: result.fileName,
          fileUrl: result.url,
        }),
      });

      if (!response.ok) {
        throw new Error('AI analysis failed');
      }

      const analysisResult = await response.json();
      
      // Handle result
      if (aiConfig.resultHandler) {
        aiConfig.resultHandler(analysisResult);
      }
      
      // Store result for UI display
      // This would need to be passed to the component somehow
      console.log('AI Analysis Result:', analysisResult);
      
    } catch (error) {
      console.error('AI analysis error:', error);
    }
  },
  
  renderUI: (props) => <AIAnalysisPluginUI {...props} />,
};