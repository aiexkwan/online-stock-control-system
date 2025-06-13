'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VOID_REASONS } from '../types';
import { AlertCircle } from 'lucide-react';

interface BatchVoidFormProps {
  voidReason: string;
  damageQuantity: number;
  password: string;
  onVoidReasonChange: (reason: string) => void;
  onDamageQuantityChange: (quantity: number) => void;
  onPasswordChange: (password: string) => void;
  onExecute: () => void;
  isProcessing: boolean;
  selectedCount: number;
  maxQuantity?: number;
}

export function BatchVoidForm({
  voidReason,
  damageQuantity,
  password,
  onVoidReasonChange,
  onDamageQuantityChange,
  onPasswordChange,
  onExecute,
  isProcessing,
  selectedCount,
  maxQuantity
}: BatchVoidFormProps) {
  const showDamageInput = voidReason === 'Damage';
  const canExecute = voidReason && password && (!showDamageInput || damageQuantity > 0);

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Batch Void Settings</h3>
        
        <div className="space-y-4">
          {/* Void Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Void Reason <span className="text-red-400">*</span>
            </label>
            <select
              value={voidReason}
              onChange={(e) => onVoidReasonChange(e.target.value)}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-red-400 focus:border-red-400"
            >
              <option value="">Select void reason...</option>
              {VOID_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          {/* Damage Quantity */}
          {showDamageInput && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Damage Quantity per Pallet <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={maxQuantity}
                value={damageQuantity || ''}
                onChange={(e) => onDamageQuantityChange(parseInt(e.target.value) || 0)}
                disabled={isProcessing}
                placeholder="Enter damage quantity"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-red-400 focus:border-red-400"
              />
              <p className="text-xs text-gray-400 mt-1">
                This quantity will be applied to each selected pallet
              </p>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              disabled={isProcessing}
              placeholder="Enter your password to confirm"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-red-400 focus:border-red-400"
            />
          </div>

          {/* Warning for ACO pallets */}
          {voidReason === 'Damage' && (
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-400">
                  ACO Order Pallets do not support partial damage. They will be fully voided if selected.
                </p>
              </div>
            </div>
          )}

          {/* Execute Button */}
          <div className="pt-4">
            <Button
              onClick={onExecute}
              disabled={!canExecute || isProcessing || selectedCount === 0}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                `Void ${selectedCount} Selected Pallet${selectedCount !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}