'use client';

import React from 'react';
import { 
  ValidationForm, 
  ValidationInput,
  NumericInput,
  required,
  minLength,
  email,
  range,
  productCode,
  clockNumber,
  when,
  combine
} from '@/app/components/shared/validation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Example of using unified validation components
 * 使用統一驗證組件的示例
 */
export function ValidationExample() {
  const handleSubmit = async (data: any) => {
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('Form submitted:', data);
    // Handle form submission
  };
  
  const validationRules = {
    productCode: combine(
      required('Product code is required'),
      productCode('Invalid product code format')
    ),
    quantity: combine(
      required('Quantity is required'),
      range(1, 999, 'Quantity must be between 1 and 999')
    ),
    clockNumber: combine(
      required('Clock number is required'),
      clockNumber('Must be a valid clock number')
    ),
    email: combine(
      required('Email is required'),
      email('Invalid email format')
    ),
    // Conditional validation example
    acoOrderRef: [
      when(
        (formData) => formData.productType === 'ACO',
        combine(
          required('ACO order reference is required'),
          minLength(6, 'Minimum 6 characters')
        )
      )
    ]
  };
  
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Validation Example Form</CardTitle>
      </CardHeader>
      <CardContent>
        <ValidationForm
          validationRules={validationRules}
          onSubmit={handleSubmit}
          validateOnSubmit
          showToastOnError
        >
          {({ errors, touched }) => (
            <div className="space-y-4">
              <ValidationInput
                name="productCode"
                label="Product Code"
                required
                placeholder="Enter product code"
                error={errors.productCode}
              />
              
              <NumericInput
                name="quantity"
                label="Quantity"
                required
                min={1}
                max={999}
                suffix=" pcs"
                placeholder="Enter quantity"
                error={errors.quantity}
              />
              
              <ValidationInput
                name="clockNumber"
                label="Clock Number"
                required
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter clock number"
                error={errors.clockNumber}
              />
              
              <ValidationInput
                name="email"
                label="Email"
                required
                type="email"
                placeholder="user@pennineindustries.com"
                error={errors.email}
              />
              
              <div>
                <label className="text-sm font-medium">Product Type</label>
                <select name="productType" className="w-full mt-1 p-2 border rounded">
                  <option value="">Select type</option>
                  <option value="ACO">ACO</option>
                  <option value="MTO">MTO</option>
                  <option value="SLATE">SLATE</option>
                </select>
              </div>
              
              <ValidationInput
                name="acoOrderRef"
                label="ACO Order Reference"
                placeholder="Enter ACO order reference"
                error={errors.acoOrderRef}
                helperText="Required only for ACO products"
              />
              
              <Button type="submit" className="w-full">
                Submit Form
              </Button>
            </div>
          )}
        </ValidationForm>
      </CardContent>
    </Card>
  );
}