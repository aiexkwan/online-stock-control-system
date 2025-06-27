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
      <div className="bg-transparent p-4">
        <p className="text-purple-400 text-sm mb-4">
          Please provide the batch number for this slate product
        </p>
        
        {/* Batch Number - Only Required Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-purple-300 mb-2">
            Batch Number
            <span className="text-red-400 ml-1">*</span>
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-purple-600/30 bg-slate-800/50 px-3 py-2 text-purple-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Enter batch number"
            value={slateDetail.batchNumber}
            onChange={(e) => handleFieldChange('batchNumber', e.target.value)}
            disabled={disabled}
            required
          />
        </div>
        
        {/* Required field notice */}
        <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-md">
          <p className="text-sm text-purple-300">
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