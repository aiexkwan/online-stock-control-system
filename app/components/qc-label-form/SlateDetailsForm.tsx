'use client';

import React from 'react';
import { SlateDetail } from './types';

interface SlateDetailsFormProps {
  slateDetail: SlateDetail;
  onSlateDetailChange: (field: keyof SlateDetail, value: string) => void;
  disabled?: boolean;
}

export const SlateDetailsForm: React.FC<SlateDetailsFormProps> = React.memo(({
  slateDetail,
  onSlateDetailChange,
  disabled = false
}) => {
  const handleFieldChange = (field: keyof SlateDetail, value: string) => {
    onSlateDetailChange(field, value);
  };

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800 mb-2">Slate Product Details</h3>
        <p className="text-green-600 text-sm mb-4">
          Please provide the batch number for this slate product
        </p>
        
        {/* Batch Number - Only Required Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-green-700 mb-2">
            Batch Number
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-green-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ring-1 ring-green-200"
            placeholder="Enter batch number"
            value={slateDetail.batchNumber}
            onChange={(e) => handleFieldChange('batchNumber', e.target.value)}
            disabled={disabled}
            required
          />
        </div>
        
        {/* Required field notice */}
        <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">
            <span className="font-medium">Note:</span> Batch Number is required and will be recorded in the pallet remark.
          </p>
        </div>
      </div>
    </div>
  );
});

// Set display name for debugging
SlateDetailsForm.displayName = 'SlateDetailsForm';

export default SlateDetailsForm; 