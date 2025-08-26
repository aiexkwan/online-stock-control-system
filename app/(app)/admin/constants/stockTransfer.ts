/**
 * Stock Transfer Card Constants
 * Centralized configuration for stock transfer operations
 */

import { Package2, Factory, Truck } from 'lucide-react';

// Transfer destination configurations
export const LOCATION_DESTINATIONS: Record<string, string[]> = {
  Await: ['Fold Mill', 'Production', 'PipeLine'],
  Await_grn: ['Fold Mill', 'Production', 'PipeLine'],
  'Fold Mill': ['Production', 'PipeLine'],
  PipeLine: ['Production', 'Fold Mill'],
  Production: ['Fold Mill', 'PipeLine'],
  Damage: [],
  Voided: [],
};

export const DESTINATION_CONFIG = {
  'Fold Mill': {
    icon: Package2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-700',
    description: 'Transfer to Fold Mill warehouse',
  },
  Production: {
    icon: Factory,
    color: 'text-green-400',
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-700',
    description: 'Transfer to Production area',
  },
  PipeLine: {
    icon: Truck,
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20',
    borderColor: 'border-purple-700',
    description: 'Transfer to Pipeline storage',
  },
};
