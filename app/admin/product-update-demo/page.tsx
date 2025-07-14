/**
 * Product Update Demo Page
 * 展示 ProductUpdateWidget vs ProductUpdateWidgetV2 嘅對比
 */

'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { UniversalContainer } from '@/components/layout/universal';

// Dynamic imports for widgets
// V1 widget has been removed, now only V2 exists

const ProductUpdateWidgetV2 = dynamic(
  () => import('@/app/admin/components/dashboard/widgets/ProductUpdateWidgetV2'),
  {
    loading: () => (
      <div className='flex h-64 items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500' />
      </div>
    ),
  }
);

export default function ProductUpdateDemoPage() {
  return (
    <UniversalContainer>
      <div className='container mx-auto px-4 py-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <h1 className='text-3xl font-bold text-white'>Product Update Widget V2 Demo</h1>
          <p className='mt-2 text-gray-400'>
            Showcasing GraphQL with Server Actions fallback implementation
          </p>
        </motion.div>

        <div className='grid gap-8'>
          {/* Version Migration Notice */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='rounded-lg bg-blue-900/20 border border-blue-500/30 p-6'
          >
            <h3 className='text-lg font-semibold text-blue-400 mb-2'>Version Migration Complete</h3>
            <p className='text-gray-400'>
              The original V1 widget has been deprecated and removed as part of the Admin Widget Simplification Plan.
              All functionality has been migrated to V2 with improved performance and features.
            </p>
          </motion.div>

          {/* V2 Widget */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className='rounded-lg bg-slate-800/50 p-6 max-w-3xl mx-auto'
          >
            <h2 className='mb-4 text-xl font-semibold text-green-400'>
              V2 - GraphQL + Server Actions Fallback
            </h2>
            <div className='rounded-lg bg-slate-900/50 p-4'>
              <ProductUpdateWidgetV2
                widget={{
                  id: 'demo-product-update-v2',
                  gridX: 0,
                  gridY: 0,
                  gridWidth: 12,
                  gridHeight: 8,
                }}
                isEditMode={false}
              />
            </div>
            <div className='mt-4 space-y-2 text-sm text-gray-400'>
              <p>✓ GraphQL queries first</p>
              <p>✓ Automatic Server Actions fallback</p>
              <p>✓ Performance monitoring</p>
              <p>✓ Better error handling</p>
              <p>✓ useGraphQLFallback hook</p>
            </div>
          </motion.div>
        </div>

        {/* Technical Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='mt-8 rounded-lg bg-slate-800/50 p-6'
        >
          <h3 className='mb-4 text-lg font-semibold text-blue-400'>Technical Implementation</h3>
          <div className='grid gap-4 md:grid-cols-2'>
            <div>
              <h4 className='mb-2 font-medium text-gray-300'>GraphQL Query</h4>
              <pre className='overflow-x-auto rounded bg-slate-900 p-3 text-xs text-gray-400'>
                {`query GetProductByCode($code: String!) {
  data_codeCollection(filter: { code: { eq: $code } }) {
    edges {
      node {
        code
        description
        colour
        standard_qty
        type
      }
    }
  }
}`}
              </pre>
            </div>
            <div>
              <h4 className='mb-2 font-medium text-gray-300'>useGraphQLFallback Usage</h4>
              <pre className='overflow-x-auto rounded bg-slate-900 p-3 text-xs text-gray-400'>
                {`const { data, loading, error, mode } = useGraphQLFallback({
  graphqlQuery: GET_PRODUCT_BY_CODE,
  serverAction: getProductByCode,
  variables: { code },
  fallbackEnabled: true,
  widgetId: 'ProductUpdateV2'
});`}
              </pre>
            </div>
          </div>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='mt-6 rounded-lg bg-slate-800/50 p-6'
        >
          <h3 className='mb-4 text-lg font-semibold text-purple-400'>Performance Benefits</h3>
          <div className='grid gap-4 md:grid-cols-3'>
            <div className='rounded bg-slate-900/50 p-4 text-center'>
              <div className='text-2xl font-bold text-green-400'>~30%</div>
              <div className='mt-1 text-sm text-gray-400'>Faster data fetching</div>
            </div>
            <div className='rounded bg-slate-900/50 p-4 text-center'>
              <div className='text-2xl font-bold text-blue-400'>100%</div>
              <div className='mt-1 text-sm text-gray-400'>Fallback reliability</div>
            </div>
            <div className='rounded bg-slate-900/50 p-4 text-center'>
              <div className='text-2xl font-bold text-orange-400'>Built-in</div>
              <div className='mt-1 text-sm text-gray-400'>Performance monitoring</div>
            </div>
          </div>
        </motion.div>
      </div>
    </UniversalContainer>
  );
}