'use client';

import React from 'react';
import { FormCard, FormType } from '../components/dashboard/cards/FormCard';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@/lib/graphql/apollo-client';

export default function TestFormCardMigrationPage() {
  return (
    <ApolloProvider client={apolloClient}>
      <div className='container mx-auto min-h-screen bg-gray-900 p-8'>
        <h1 className='mb-8 text-3xl font-bold text-white'>FormCard Migration Test Page</h1>

        <div className='grid gap-8'>
          {/* Product Edit Form */}
          <div>
            <h2 className='mb-4 text-xl font-semibold text-gray-300'>Product Edit Form</h2>
            <FormCard
              formType={FormType.PRODUCT_EDIT}
              showHeader={true}
              showProgress={true}
              showValidationSummary={true}
              className='max-w-4xl'
              onSubmitSuccess={data => {
                console.log('Form submitted successfully:', data);
              }}
              onSubmitError={error => {
                console.error('Form submission error:', error);
              }}
              onFieldChange={(fieldName, value) => {
                console.log('Field changed:', fieldName, value);
              }}
            />
          </div>

          {/* User Registration Form */}
          <div>
            <h2 className='mb-4 text-xl font-semibold text-gray-300'>User Registration Form</h2>
            <FormCard
              formType={FormType.USER_REGISTRATION}
              showHeader={true}
              showProgress={true}
              className='max-w-4xl'
              onSubmitSuccess={data => {
                console.log('User registered successfully:', data);
              }}
              onSubmitError={error => {
                console.error('Registration error:', error);
              }}
            />
          </div>

          {/* Order Create Form */}
          <div>
            <h2 className='mb-4 text-xl font-semibold text-gray-300'>Order Create Form</h2>
            <FormCard
              formType={FormType.ORDER_CREATE}
              showHeader={true}
              showProgress={false}
              className='max-w-4xl'
              onSubmitSuccess={data => {
                console.log('Order created successfully:', data);
              }}
              onSubmitError={error => {
                console.error('Order creation error:', error);
              }}
            />
          </div>

          {/* Warehouse Transfer Form */}
          <div>
            <h2 className='mb-4 text-xl font-semibold text-gray-300'>Warehouse Transfer Form</h2>
            <FormCard
              formType={FormType.WAREHOUSE_TRANSFER}
              showHeader={true}
              className='max-w-4xl'
              onSubmitSuccess={data => {
                console.log('Transfer completed successfully:', data);
              }}
              onSubmitError={error => {
                console.error('Transfer error:', error);
              }}
            />
          </div>
        </div>
      </div>
    </ApolloProvider>
  );
}
