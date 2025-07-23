/**
 * UploadCard Test Page
 * 測試 GraphQL 整合的 UploadCard 組件
 */

'use client';

import React, { useState } from 'react';
import { UploadCard } from '@/app/(app)/admin/components/dashboard/cards/UploadCard';
import { 
  UploadType,
  UploadFolder,
  SupportedFileType,
  SingleUploadResult,
  OrderAnalysisResult 
} from '@/types/generated/graphql';
import { toast } from 'sonner';

export default function TestUploadCardPage() {
  const [selectedUploadType, setSelectedUploadType] = useState<UploadType>(UploadType.GeneralFiles);
  const [selectedFolder, setSelectedFolder] = useState<UploadFolder | undefined>(UploadFolder.StockPic);
  const [uploadResults, setUploadResults] = useState<SingleUploadResult[]>([]);
  const [analysisResults, setAnalysisResults] = useState<OrderAnalysisResult[]>([]);

  // 上傳類型配置
  const uploadTypes = [
    {
      id: UploadType.GeneralFiles,
      name: 'General Files',
      description: 'Upload general files with folder selection (Pictures/Documents)',
      icon: '📁',
    },
    {
      id: UploadType.OrderPdf,
      name: 'Order PDF',
      description: 'Upload order PDFs with AI analysis',
      icon: '📋',
    },
    {
      id: UploadType.Photos,
      name: 'Photos',
      description: 'Upload photos with preview functionality',
      icon: '📷',
    },
    {
      id: UploadType.ProductSpec,
      name: 'Product Specifications',
      description: 'Upload product specification documents',
      icon: '📄',
    },
  ];

  // 處理上傳完成
  const handleUploadComplete = (result: SingleUploadResult) => {
    console.log('Upload completed:', result);
    setUploadResults(prev => [...prev, result]);
    toast.success(`Upload completed: ${result.fileName}`);
  };

  // 處理上傳錯誤
  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    toast.error(`Upload error: ${error}`);
  };

  // 處理分析完成
  const handleAnalysisComplete = (result: OrderAnalysisResult) => {
    console.log('Analysis completed:', result);
    setAnalysisResults(prev => [...prev, result]);
    toast.success(`Analysis completed: ${result.recordCount} orders extracted`);
  };

  // 處理文件選擇
  const handleFileSelect = (files: File[]) => {
    console.log('Files selected:', files);
  };

  // 清空結果
  const clearResults = () => {
    setUploadResults([]);
    setAnalysisResults([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">UploadCard GraphQL Test Page</h1>
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          Clear Results
        </button>
      </div>

      {/* 上傳類型選擇 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Select Upload Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {uploadTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setSelectedUploadType(type.id);
                // Reset folder for non-general file types
                if (type.id !== UploadType.GeneralFiles) {
                  setSelectedFolder(undefined);
                }
              }}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedUploadType === type.id
                  ? 'border-blue-500 bg-blue-100 text-blue-900'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-1">{type.icon}</div>
              <div className="font-medium text-sm">{type.name}</div>
              <div className="text-xs text-gray-600 mt-1">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 當前配置信息 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">Current Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Upload Type:</span>
            <span className="ml-2">{selectedUploadType}</span>
          </div>
          {selectedFolder && (
            <div>
              <span className="font-medium">Target Folder:</span>
              <span className="ml-2">{selectedFolder}</span>
            </div>
          )}
          <div>
            <span className="font-medium">Features:</span>
            <span className="ml-2">
              {selectedUploadType === UploadType.OrderPdf && 'AI Analysis, '}
              {selectedUploadType === UploadType.Photos && 'Image Preview, '}
              Drag & Drop
            </span>
          </div>
        </div>
      </div>

      {/* 基本上傳測試 - 標準尺寸 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Standard Upload Card</h2>
        <UploadCard
          uploadType={selectedUploadType}
          folder={selectedFolder}
          showRecentUploads={true}
          showStatistics={false}
          showProgress={true}
          height={400}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          onAnalysisComplete={handleAnalysisComplete}
          onFileSelect={handleFileSelect}
        />
      </section>

      {/* 帶統計的上傳卡片 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Upload Card with Statistics</h2>
        <UploadCard
          uploadType={selectedUploadType}
          folder={selectedFolder}
          showRecentUploads={true}
          showStatistics={true}
          showProgress={true}
          height={500}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          onAnalysisComplete={handleAnalysisComplete}
          onFileSelect={handleFileSelect}
        />
      </section>

      {/* 緊湊模式上傳卡片 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Compact Upload Card</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UploadCard
            uploadType={selectedUploadType}
            folder={selectedFolder}
            showRecentUploads={false}
            showStatistics={false}
            showProgress={true}
            height={250}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            onAnalysisComplete={handleAnalysisComplete}
            className="bg-gray-50"
          />
          <UploadCard
            uploadType={UploadType.Photos}
            showRecentUploads={true}
            showStatistics={false}
            showProgress={false}
            height={250}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            className="bg-blue-50"
          />
        </div>
      </section>

      {/* 編輯模式測試 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Edit Mode (Disabled Upload)</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 text-sm">
            <strong>Edit Mode:</strong> This card is in edit mode and upload functionality is disabled.
            The configuration is still loaded but interactions are blocked.
          </p>
        </div>
        <UploadCard
          uploadType={selectedUploadType}
          folder={selectedFolder}
          showRecentUploads={true}
          showStatistics={true}
          showProgress={false}
          height={350}
          isEditMode={true}
        />
      </section>

      {/* 上傳結果顯示 */}
      {uploadResults.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Upload Results</h2>
          <div className="bg-white rounded-lg border p-4">
            <div className="space-y-3">
              {uploadResults.slice(-5).map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`font-medium ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.success ? '✅' : '❌'} {result.fileName}
                      </span>
                      {result.fileInfo && (
                        <div className="text-sm text-gray-600 mt-1">
                          Size: {Math.round(result.fileInfo.size / 1024)} KB | 
                          Type: {result.fileInfo.extension} | 
                          Folder: {result.fileInfo.folder}
                        </div>
                      )}
                      {result.error && (
                        <div className="text-sm text-red-600 mt-1">
                          Error: {result.error}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AI 分析結果顯示 */}
      {analysisResults.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">AI Analysis Results</h2>
          <div className="bg-white rounded-lg border p-4">
            <div className="space-y-4">
              {analysisResults.slice(-3).map((result, index) => (
                <div key={index} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-purple-800">
                      🤖 Analysis Result #{index + 1}
                    </span>
                    <div className="text-sm text-purple-600">
                      {result.recordCount} orders • {result.processingTime}ms • 
                      {Math.round((result.confidence || 0) * 100)}% confidence
                    </div>
                  </div>
                  {result.extractedData && result.extractedData.length > 0 && (
                    <div className="mt-3">
                      <h4 className="font-medium text-sm text-purple-800 mb-2">Extracted Orders:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {result.extractedData.slice(0, 4).map((order, orderIndex) => (
                          <div key={orderIndex} className="text-xs bg-white p-2 rounded border">
                            <div className="font-medium">{order.orderNumber}</div>
                            {order.customerName && (
                              <div className="text-gray-600">{order.customerName}</div>
                            )}
                            {order.totalAmount && (
                              <div className="text-green-600">
                                ${order.totalAmount} {order.currency || 'USD'}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 功能測試指南 */}
      <section className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Testing Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Upload Types</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>📁 <strong>General Files:</strong> Folder selection (Pictures/Documents)</li>
              <li>📋 <strong>Order PDF:</strong> AI analysis with order extraction</li>
              <li>📷 <strong>Photos:</strong> Image preview and multi-upload</li>
              <li>📄 <strong>Product Spec:</strong> Document upload for specifications</li>
            </ul>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Features to Test</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Drag and drop functionality</li>
              <li>✅ File type validation</li>
              <li>✅ Upload progress tracking</li>
              <li>✅ Image preview (Photos type)</li>
              <li>✅ AI analysis (Order PDF type)</li>
              <li>✅ Recent uploads display</li>
              <li>✅ Statistics and metrics</li>
              <li>✅ Error handling</li>
            </ul>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Test Instructions</h3>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Select different upload types above</li>
              <li>2. Test drag & drop vs click upload</li>
              <li>3. Try different file types and sizes</li>
              <li>4. Upload order PDFs to test AI analysis</li>
              <li>5. Upload images to test preview</li>
              <li>6. Check progress and results</li>
              <li>7. Test error scenarios (wrong file types)</li>
              <li>8. Verify recent uploads and statistics</li>
            </ol>
          </div>
        </div>
      </section>

      {/* 開發信息 */}
      <section className="bg-gray-900 text-white rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Development Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">Component Architecture</h3>
            <ul className="space-y-1 text-gray-300">
              <li>• Unified UploadCard component</li>
              <li>• GraphQL-powered upload processing</li>
              <li>• Dynamic configuration by upload type</li>
              <li>• Real-time progress tracking</li>
              <li>• AI analysis integration</li>
              <li>• Image preview functionality</li>
              <li>• Comprehensive error handling</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Replaced Widgets</h3>
            <ul className="space-y-1 text-gray-300">
              <li>• UploadFilesWidget (general files)</li>
              <li>• UploadOrdersWidget (PDF + AI analysis)</li>
              <li>• UploadPhotoWidget (images with preview)</li>
              <li>• UploadProductSpecWidget (documents)</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-800 rounded">
          <p className="text-green-400 font-semibold">
            🎯 UploadCard successfully consolidates 4 widgets into 1 unified component
          </p>
          <p className="text-gray-300 mt-1">
            Achieving ~75% code reduction while adding GraphQL integration and enhanced functionality
          </p>
        </div>
      </section>
    </div>
  );
}