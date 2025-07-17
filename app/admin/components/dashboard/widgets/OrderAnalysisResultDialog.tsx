/**
 * Order Analysis Result Dialog
 * 顯示 OpenAI 分析訂單 PDF 的結果
 */

'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

// Define proper types for the order data
interface OrderItem {
  productCode?: string;
  product_code?: string;
  quantity?: number;
  product_qty?: number;
  unitPrice?: number;
  unit_price?: string;
}

interface ExtractedOrder {
  order_ref?: string;
  account_num?: string;
  delivery_add?: string;
  invoice_to?: string;
  customer_ref?: string;
  product_code?: string;
  product_desc?: string;
  product_qty?: number;
  weight?: number;
  unit_price?: string;
  items?: OrderItem[];
  totalAmount?: number;
}

interface AnalysisResult {
  extractedData: ExtractedOrder | ExtractedOrder[];
  success?: boolean;
  recordCount?: number;
  processingTime?: number;
  extractedCount?: number;
}

interface OrderAnalysisResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: AnalysisResult | null;
}

export const OrderAnalysisResultDialog = React.memo<OrderAnalysisResultDialogProps>(
  ({ isOpen, onClose, data }) => {
  if (!data || !data.extractedData) return null;

  const orders: ExtractedOrder[] = Array.isArray(data.extractedData) 
    ? data.extractedData 
    : [data.extractedData];

  // Debug log in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('[OrderAnalysisResultDialog as string] Orders:', orders);
    if (orders.length > 0) {
      console.log('[OrderAnalysisResultDialog as string] First order:', orders[0]);
    }
  }

  // Extract common info from first order (since only one order upload is allowed)
  const accountNumber = orders[0]?.account_num || null;
  const deliveryAddress = orders[0]?.delivery_add || null;
  const orderRef = orders[0]?.order_ref || null;
  const invoiceTo = orders[0]?.invoice_to || null;
  const customerRef = orders[0]?.customer_ref || null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-h-[90vh] max-w-4xl border border-white/10 bg-black/90 backdrop-blur-xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-3 text-xl font-semibold text-white'>
            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-emerald-500'>
              <CheckCircleIcon className='h-6 w-6 text-white' />
            </div>
            Order Analysis Complete
          </DialogTitle>
        </DialogHeader>

        <div className='h-[60vh] overflow-y-auto pr-4'>
          <div className='space-y-4'>
            <div className='text-sm text-slate-400'>Order details from PDF analysis</div>

            {/* Display order info once at the top */}
            {(orderRef || accountNumber || deliveryAddress) && (
              <div className='rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md'>
                {orderRef && (
                  <div className='mb-4'>
                    <h3 className='text-lg font-medium text-white'>Order #{orderRef}</h3>
                  </div>
                )}
                <div className='grid grid-cols-2 gap-4'>
                  {accountNumber && (
                    <div>
                      <span className='text-xs uppercase tracking-wider text-slate-500'>
                        Account Number
                      </span>
                      <p className='mt-1 text-sm text-white'>{accountNumber}</p>
                    </div>
                  )}
                  {customerRef && (
                    <div>
                      <span className='text-xs uppercase tracking-wider text-slate-500'>
                        Customer Reference
                      </span>
                      <p className='mt-1 text-sm text-white'>{customerRef}</p>
                    </div>
                  )}
                  {deliveryAddress && (
                    <div className='col-span-2'>
                      <span className='text-xs uppercase tracking-wider text-slate-500'>
                        Delivery Address
                      </span>
                      <p className='mt-1 text-sm text-white'>{deliveryAddress}</p>
                    </div>
                  )}
                  {invoiceTo && invoiceTo !== '-' && (
                    <div className='col-span-2'>
                      <span className='text-xs uppercase tracking-wider text-slate-500'>
                        Invoice To
                      </span>
                      <p className='mt-1 text-sm text-white'>{invoiceTo}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className='space-y-4 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md'>
              <h4 className='text-sm font-medium uppercase tracking-wider text-white'>
                Order Items
              </h4>

              {orders.map((order, index) => (
                <div key={index} className='space-y-3'>
                  {/* Single item display for simplified orders */}
                  {order.product_code && (
                    <div className='rounded-lg bg-black/20 p-4 backdrop-blur-sm'>
                      <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                        <div>
                          <span className='text-xs uppercase tracking-wider text-slate-500'>
                            Product Code
                          </span>
                          <p className='mt-1 font-medium text-white'>{order.product_code}</p>
                        </div>
                        <div>
                          <span className='text-xs uppercase tracking-wider text-slate-500'>
                            Quantity
                          </span>
                          <p className='mt-1 font-medium text-white'>{order.product_qty || 0}</p>
                        </div>
                        <div>
                          <span className='text-xs uppercase tracking-wider text-slate-500'>
                            Weight
                          </span>
                          <p className='mt-1 font-medium text-white'>
                            {order.weight ? `${order.weight} kg` : '-'}
                          </p>
                        </div>
                        <div>
                          <span className='text-xs uppercase tracking-wider text-slate-500'>
                            Unit Price
                          </span>
                          <p className='mt-1 font-medium text-white'>
                            {order.unit_price && order.unit_price !== '-'
                              ? `£${order.unit_price}`
                              : '-'}
                          </p>
                        </div>
                        <div className='col-span-2 md:col-span-4'>
                          <span className='text-xs uppercase tracking-wider text-slate-500'>
                            Description
                          </span>
                          <p className='mt-1 text-sm text-white'>{order.product_desc || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Multiple items display */}
                  {order.items && order.items.length > 0 && (
                    <div className='space-y-2'>
                      {order.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className='grid grid-cols-3 gap-2 rounded-lg bg-black/20 p-3 text-sm backdrop-blur-sm'
                        >
                          <div>
                            <span className='text-xs text-slate-500'>Product</span>
                            <p className='mt-1 text-white'>
                              {item.productCode || item.product_code || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className='text-xs text-slate-500'>Quantity</span>
                            <p className='mt-1 text-white'>
                              {item.quantity || item.product_qty || 0}
                            </p>
                          </div>
                          <div>
                            <span className='text-xs text-slate-500'>Unit Price</span>
                            <p className='mt-1 text-white'>${item.unitPrice || 0}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Total Amount */}
              {orders[0]?.totalAmount && (
                <div className='border-t border-white/10 pt-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-slate-400'>Total Amount</span>
                    <span className='text-lg font-semibold text-white'>
                      ${orders[0].totalAmount}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className='flex justify-end gap-3 border-t border-white/10 pt-4'>
          <button
            onClick={onClose}
            className='rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20'
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

OrderAnalysisResultDialog.displayName = 'OrderAnalysisResultDialog';

export default OrderAnalysisResultDialog;
