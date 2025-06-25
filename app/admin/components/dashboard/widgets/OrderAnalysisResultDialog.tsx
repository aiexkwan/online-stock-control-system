/**
 * Order Analysis Result Dialog
 * 顯示 OpenAI 分析訂單 PDF 的結果
 */

'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface OrderAnalysisResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export const OrderAnalysisResultDialog: React.FC<OrderAnalysisResultDialogProps> = ({ 
  isOpen, 
  onClose, 
  data 
}) => {
  if (!data || !data.extractedData) return null;

  const orders = Array.isArray(data.extractedData) ? data.extractedData : [data.extractedData];
  
  // Debug log
  process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[OrderAnalysisResultDialog] Orders:', orders);
  if (orders.length > 0) {
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[OrderAnalysisResultDialog] First order:', orders[0]);
  }

  // Extract common info from first order (since only one order upload is allowed)
  const accountNumber = orders[0]?.account_num || null;
  const deliveryAddress = orders[0]?.delivery_add || null;
  const orderRef = orders[0]?.order_ref || null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-black/90 backdrop-blur-xl border border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
            Order Analysis Complete
          </DialogTitle>
        </DialogHeader>
        
        <div className="h-[60vh] overflow-y-auto pr-4">
          <div className="space-y-4">
            <div className="text-sm text-slate-400">
              Order details from PDF analysis
            </div>
            
            {/* Display order info once at the top */}
            {(orderRef || accountNumber || deliveryAddress) && (
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10">
                {orderRef && (
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-white">Order #{orderRef}</h3>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {accountNumber && (
                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-wider">Account Number</span>
                      <p className="text-sm text-white mt-1">{accountNumber}</p>
                    </div>
                  )}
                  {deliveryAddress && (
                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-wider">Delivery Address</span>
                      <p className="text-sm text-white mt-1">{deliveryAddress}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Order Items */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-5 space-y-4 border border-white/10">
              <h4 className="text-sm font-medium text-white uppercase tracking-wider">Order Items</h4>
              
              {orders.map((order: any, index: number) => (
                <div key={index} className="space-y-3">
                  {/* Single item display for simplified orders */}
                  {order.product_code && (
                    <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <span className="text-xs text-slate-500 uppercase tracking-wider">Product Code</span>
                          <p className="text-white mt-1 font-medium">{order.product_code}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 uppercase tracking-wider">Quantity</span>
                          <p className="text-white mt-1 font-medium">{order.product_qty || 0}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 uppercase tracking-wider">Description</span>
                          <p className="text-white mt-1 text-sm">{order.product_desc || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                
                  {/* Multiple items display */}
                  {order.items && order.items.length > 0 && (
                    <div className="space-y-2">
                      {order.items.map((item: any, itemIndex: number) => (
                        <div key={itemIndex} className="bg-black/20 backdrop-blur-sm rounded-lg p-3 grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-xs text-slate-500">Product</span>
                            <p className="text-white mt-1">{item.productCode || item.product_code || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500">Quantity</span>
                            <p className="text-white mt-1">{item.quantity || item.product_qty || 0}</p>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500">Unit Price</span>
                            <p className="text-white mt-1">${item.unitPrice || 0}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                
                </div>
              ))}
              
              {/* Total Amount */}
              {orders[0]?.totalAmount && (
                <div className="pt-3 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Total Amount</span>
                    <span className="text-lg font-semibold text-white">
                      ${orders[0].totalAmount}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/10"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};