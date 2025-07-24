/**
 * FormCard Demo Page
 * 展示 FormCard 組件的使用方式和功能
 */

'use client';

import React, { useState } from 'react';
import { 
  FormCard, 
  FormType,
  SubmitSuccessData,
  FormSubmitError,
  FormValue 
} from './FormCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const FormCardDemo: React.FC = () => {
  const [selectedFormType, setSelectedFormType] = useState<FormType>(FormType.PRODUCT_EDIT);
  const [showEditMode, setShowEditMode] = useState(false);
  const [showProgress, setShowProgress] = useState(true);
  const [showValidationSummary, setShowValidationSummary] = useState(true);

  const formTypes = [
    { type: FormType.PRODUCT_EDIT, label: 'Product Edit', description: 'Edit product information' },
    { type: FormType.USER_REGISTRATION, label: 'User Registration', description: 'Register new user' },
    { type: FormType.ORDER_CREATE, label: 'Create Order', description: 'Create new order' },
    { type: FormType.WAREHOUSE_TRANSFER, label: 'Warehouse Transfer', description: 'Transfer between warehouses' },
  ];

  const handleSubmitSuccess = (data: SubmitSuccessData) => {
    console.log('Form submitted successfully:', data);
    alert('Form submitted successfully!');
  };

  const handleSubmitError = (error: FormSubmitError) => {
    console.error('Form submission error:', error);
    alert('Form submission failed!');
  };

  const handleCancel = () => {
    console.log('Form cancelled');
    alert('Form cancelled!');
  };

  const handleFieldChange = (fieldName: string, value: FormValue) => {
    console.log(`Field ${fieldName} changed to:`, value);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">FormCard Component Demo</h1>
        <p className="text-gray-400">統一的表單卡片組件展示</p>
      </div>

      {/* 控制面板 */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Demo Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 表單類型選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Form Type
            </label>
            <div className="flex flex-wrap gap-2">
              {formTypes.map((form) => (
                <Button
                  key={form.type}
                  variant={selectedFormType === form.type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFormType(form.type)}
                  className={selectedFormType === form.type ? "bg-blue-600" : ""}
                >
                  {form.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 顯示選項 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Display Options
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={showEditMode ? "default" : "outline"}
                size="sm"
                onClick={() => setShowEditMode(!showEditMode)}
                className={showEditMode ? "bg-green-600" : ""}
              >
                Edit Mode
              </Button>
              <Button
                variant={showProgress ? "default" : "outline"}
                size="sm"
                onClick={() => setShowProgress(!showProgress)}
                className={showProgress ? "bg-green-600" : ""}
              >
                Show Progress
              </Button>
              <Button
                variant={showValidationSummary ? "default" : "outline"}
                size="sm"
                onClick={() => setShowValidationSummary(!showValidationSummary)}
                className={showValidationSummary ? "bg-green-600" : ""}
              >
                Validation Summary
              </Button>
            </div>
          </div>

          {/* 當前配置 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Current Configuration
            </label>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {formTypes.find(f => f.type === selectedFormType)?.label}
              </Badge>
              {showEditMode && <Badge variant="outline">Edit Mode</Badge>}
              {showProgress && <Badge variant="outline">Progress Bar</Badge>}
              {showValidationSummary && <Badge variant="outline">Validation Summary</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FormCard 展示 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 主要表單 */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Main Form</h2>
          <FormCard
            formType={selectedFormType}
            isEditMode={showEditMode}
            showProgress={showProgress}
            showValidationSummary={showValidationSummary}
            onSubmitSuccess={handleSubmitSuccess}
            onSubmitError={handleSubmitError}
            onCancel={handleCancel}
            onFieldChange={handleFieldChange}
            className="h-full"
          />
        </div>

        {/* 預填數據表單 */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">With Prefilled Data</h2>
          <FormCard
            formType={FormType.PRODUCT_EDIT}
            prefilledData={{
              code: 'DEMO-001',
              description: 'Demo Product with Prefilled Data',
              colour: 'BLUE',
              standard_qty: 100,
              type: 'FINISHED_GOODS',
            }}
            entityId="demo-product-001"
            isEditMode={showEditMode}
            showProgress={showProgress}
            showValidationSummary={showValidationSummary}
            onSubmitSuccess={handleSubmitSuccess}
            onSubmitError={handleSubmitError}
            className="h-full"
          />
        </div>
      </div>

      {/* 功能說明 */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">FormCard Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="text-gray-300">
              <h4 className="font-medium text-white mb-2">🎯 動態配置</h4>
              <ul className="space-y-1">
                <li>• GraphQL 動態表單配置</li>
                <li>• 22種字段類型支援</li>
                <li>• 條件式字段顯示</li>
                <li>• 響應式佈局系統</li>
              </ul>
            </div>
            <div className="text-gray-300">
              <h4 className="font-medium text-white mb-2">✅ 驗證引擎</h4>
              <ul className="space-y-1">
                <li>• 前端實時驗證</li>
                <li>• 自定義驗證規則</li>
                <li>• 統一錯誤處理</li>
                <li>• 驗證摘要顯示</li>
              </ul>
            </div>
            <div className="text-gray-300">
              <h4 className="font-medium text-white mb-2">🚀 用戶體驗</h4>
              <ul className="space-y-1">
                <li>• 表單完成進度</li>
                <li>• 動畫過渡效果</li>
                <li>• 無障礙支援</li>
                <li>• 移動端優化</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 支援的字段類型 */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Supported Field Types (22種)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {[
              'TEXT', 'NUMBER', 'EMAIL', 'PASSWORD', 'SELECT', 'MULTISELECT',
              'CHECKBOX', 'RADIO', 'DATE', 'DATETIME', 'TEXTAREA', 'FILE_UPLOAD',
              'IMAGE_UPLOAD', 'RANGE', 'COLOR', 'URL', 'PHONE', 'CURRENCY',
              'PERCENTAGE', 'JSON_EDITOR', 'RICH_TEXT', 'CODE_EDITOR'
            ].map((type) => (
              <Badge key={type} variant="outline" className="text-xs">
                {type}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};