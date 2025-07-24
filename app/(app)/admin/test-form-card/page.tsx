'use client';

import React from 'react';
import { FormCard, FormType } from '../components/dashboard/cards/FormCard';

export default function TestFormCardPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          FormCard Test Page
        </h1>
        <p className="text-gray-600">
          Testing the FormCard component with different form types
        </p>
      </div>

      {/* Test 1: Product Edit Form */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Test 1: Product Edit Form
        </h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <FormCard
            formType={FormType.PRODUCT_EDIT}
            entityId="test-product-123"
            prefilledData={{
              name: 'Test Product',
              sku: 'TEST-123',
              quantity: 100
            }}
            showHeader={true}
            showProgress={true}
            showValidationSummary={true}
            isEditMode={false}
            onSubmitSuccess={(data) => {
              console.log('Product form submitted:', data);
            }}
            onSubmitError={(error) => {
              console.error('Product form error:', error);
            }}
            onCancel={() => {
              console.log('Product form cancelled');
            }}
          />
        </div>
      </div>

      {/* Test 2: Order Create Form */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Test 2: Order Create Form
        </h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <FormCard
            formType={FormType.ORDER_CREATE}
            showHeader={true}
            showProgress={true}
            showValidationSummary={false}
            isEditMode={false}
            onSubmitSuccess={(data) => {
              console.log('Order form submitted:', data);
            }}
            onSubmitError={(error) => {
              console.error('Order form error:', error);
            }}
          />
        </div>
      </div>

      {/* Test 3: Warehouse Transfer Form */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Test 3: Warehouse Transfer Form
        </h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <FormCard
            formType={FormType.WAREHOUSE_TRANSFER}
            prefilledData={{
              fromWarehouse: 'Main Warehouse',
              toWarehouse: 'Secondary Warehouse'
            }}
            showHeader={true}
            showProgress={false}
            showValidationSummary={true}
            isEditMode={false}
            onSubmitSuccess={(data) => {
              console.log('Transfer form submitted:', data);
            }}
            onFieldChange={(fieldName, value) => {
              console.log('Field changed:', fieldName, value);
            }}
          />
        </div>
      </div>

      {/* Test 4: Quality Check Form */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Test 4: Quality Check Form
        </h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <FormCard
            formType={FormType.QUALITY_CHECK}
            entityId="batch-456"
            showHeader={true}
            showProgress={true}
            showValidationSummary={true}
            isEditMode={false}
            onSubmitSuccess={(data) => {
              console.log('QC form submitted:', data);
            }}
          />
        </div>
      </div>

      {/* Test 5: Edit Mode */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Test 5: Edit Mode
        </h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <FormCard
            formType={FormType.PRODUCT_EDIT}
            showHeader={true}
            showProgress={true}
            showValidationSummary={false}
            isEditMode={true}
            onSubmitSuccess={(data) => {
              console.log('Edit mode form submitted:', data);
            }}
          />
        </div>
      </div>

      {/* Test 6: Minimal Configuration */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Test 6: Minimal Configuration
        </h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <FormCard
            formType={FormType.INVENTORY_ADJUST}
            showHeader={false}
            showProgress={false}
            showValidationSummary={false}
            isEditMode={false}
          />
        </div>
      </div>

      {/* Debug Information */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Debug Information
        </h2>
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="space-y-2 text-sm">
            <div>
              <strong>Available Form Types:</strong> 
              <ul className="list-disc list-inside mt-1">
                <li>PRODUCT_EDIT - Edit product details</li>
                <li>USER_REGISTRATION - Register new users</li>
                <li>ORDER_CREATE - Create new orders</li>
                <li>WAREHOUSE_TRANSFER - Transfer between warehouses</li>
                <li>QUALITY_CHECK - Quality control forms</li>
                <li>INVENTORY_ADJUST - Adjust inventory levels</li>
              </ul>
            </div>
            <div>
              <strong>Test Instructions:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Verify form fields render correctly</li>
                <li>Test validation on required fields</li>
                <li>Check submit functionality</li>
                <li>Test cancel button behavior</li>
                <li>Verify prefilled data displays</li>
                <li>Test field change callbacks</li>
                <li>Check progress indicator if shown</li>
                <li>Verify validation summary works</li>
                <li>Test edit mode functionality</li>
              </ul>
            </div>
            <div>
              <strong>Callbacks:</strong>
              <ul className="list-disc list-inside mt-1">
                <li>onSubmitSuccess - Check console for success logs</li>
                <li>onSubmitError - Check console for error logs</li>
                <li>onCancel - Check console for cancel logs</li>
                <li>onFieldChange - Check console for field change logs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}