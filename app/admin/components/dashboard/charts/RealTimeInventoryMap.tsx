'use client';

import React, { useMemo } from 'react';
import { gql, useGraphQLQuery } from '@/lib/graphql-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Package } from 'lucide-react';

const GET_INVENTORY_LOCATIONS = gql`
  query GetInventoryLocations {
    record_inventoryCollection {
      edges {
        node {
          product_code
          plt_num
          await
          await_grn
          backcarpark
          bulk
          fold
          injection
          pipeline
          prebook
        }
      }
    }
  }
`;

interface LocationData {
  name: string;
  key: string;
  row: number;
  col: number;
  span?: number;
}

const WAREHOUSE_LOCATIONS: LocationData[] = [
  { name: 'Await Area', key: 'await', row: 1, col: 1 },
  { name: 'Await GRN', key: 'await_grn', row: 1, col: 2 },
  { name: 'Back Car Park', key: 'backcarpark', row: 1, col: 3, span: 2 },
  { name: 'Bulk Area', key: 'bulk', row: 2, col: 1, span: 2 },
  { name: 'Fold Area', key: 'fold', row: 2, col: 3 },
  { name: 'Injection Area', key: 'injection', row: 2, col: 4 },
  { name: 'Pipeline', key: 'pipeline', row: 3, col: 1, span: 2 },
  { name: 'Pre-book Area', key: 'prebook', row: 3, col: 3, span: 2 },
];

interface RealTimeInventoryMapProps {
  timeFrame?: any;
}

export default function RealTimeInventoryMap({ timeFrame }: RealTimeInventoryMapProps) {
  const { data, loading, error } = useGraphQLQuery(GET_INVENTORY_LOCATIONS);

  const locationStats = useMemo(() => {
    if (!data?.record_inventoryCollection?.edges) return new Map();

    const stats = new Map<string, { total: number; products: Set<string> }>();
    
    // Initialize all locations
    WAREHOUSE_LOCATIONS.forEach(loc => {
      stats.set(loc.key, { total: 0, products: new Set() });
    });

    // Calculate totals for each location
    data.record_inventoryCollection.edges.forEach(({ node }: any) => {
      WAREHOUSE_LOCATIONS.forEach(loc => {
        const qty = Number(node[loc.key]) || 0;
        if (qty > 0) {
          const current = stats.get(loc.key)!;
          current.total += qty;
          current.products.add(node.product_code); // Track unique products
        }
      });
    });

    // Convert Set to count for display
    const displayStats = new Map<string, { total: number; products: number }>();
    stats.forEach((value, key) => {
      displayStats.set(key, {
        total: value.total,
        products: value.products.size
      });
    });

    return displayStats;
  }, [data]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="flex-1" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load inventory location data: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  // Calculate max for color scaling
  const maxInventory = Math.max(
    ...Array.from(locationStats.values()).map(s => s.total),
    1
  );

  const getLocationColor = (total: number) => {
    const intensity = total / maxInventory;
    if (intensity === 0) return 'rgba(200, 200, 200, 0.1)';
    if (intensity < 0.2) return 'rgba(34, 197, 94, 0.2)';
    if (intensity < 0.4) return 'rgba(34, 197, 94, 0.4)';
    if (intensity < 0.6) return 'rgba(251, 146, 60, 0.6)';
    if (intensity < 0.8) return 'rgba(239, 68, 68, 0.7)';
    return 'rgba(239, 68, 68, 0.9)';
  };

  const getUtilization = (total: number) => {
    const percentage = (total / maxInventory) * 100;
    return Math.round(percentage);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4">
        <p className="text-sm text-white/60">
          Real-time warehouse inventory distribution by location
        </p>
      </div>
      
      <div className="flex-1 flex flex-col">
        {/* Warehouse Grid */}
        <div className="flex-1 p-4">
          <div className="warehouse-grid h-full grid grid-cols-4 grid-rows-3 gap-4">
            {WAREHOUSE_LOCATIONS.map(location => {
              const stats = locationStats.get(location.key) || { total: 0, products: 0 };
              const utilization = getUtilization(stats.total);
              
              return (
                <div
                  key={location.key}
                  className={`location-block relative rounded-lg border-2 border-border/50 p-4 transition-all hover:scale-105 hover:shadow-lg cursor-pointer ${
                    location.span ? `col-span-${location.span}` : ''
                  }`}
                  style={{
                    backgroundColor: getLocationColor(stats.total),
                    gridRow: location.row,
                    gridColumn: `${location.col} / ${location.col + (location.span || 1)}`
                  }}
                >
                  {/* Location Name */}
                  <h3 className="font-medium text-sm mb-2 text-white">{location.name}</h3>
                  
                  {/* Stats */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-white/50" />
                      <span className="text-xs text-white/70">{stats.products} products</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{stats.total.toLocaleString()}</div>
                    <div className="text-xs text-white/70">items in stock</div>
                  </div>
                  
                  {/* Utilization Bar */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                        style={{ width: `${utilization}%` }}
                      />
                    </div>
                    <div className="text-xs text-white/70 mt-1 text-center">
                      {utilization}% utilization
                    </div>
                  </div>
                  
                  {/* Visual Indicator */}
                  {utilization > 80 && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend and Summary */}
        <div className="border-t pt-4 px-4">
          <div className="flex items-center justify-between">
            {/* Color Legend */}
            <div className="flex items-center gap-4 text-xs">
              <span className="font-medium text-white/70">Density Indicator:</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(200, 200, 200, 0.1)' }} />
                <span className="text-white/60">Empty</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.4)' }} />
                <span className="text-white/60">Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(251, 146, 60, 0.6)' }} />
                <span className="text-white/60">High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.9)' }} />
                <span className="text-white/60">Crowded</span>
              </div>
            </div>

            {/* Total Summary */}
            <div className="text-sm">
              <span className="text-white/60">Total Inventory:</span>
              <span className="font-bold ml-1">
                {Array.from(locationStats.values()).reduce((sum, s) => sum + s.total, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .warehouse-grid {
          min-height: 300px;
        }
        
        .location-block {
          backdrop-filter: blur(8px);
          background-blend-mode: overlay;
        }
        
        @media (max-width: 768px) {
          .warehouse-grid {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(6, 1fr);
          }
        }
      `}</style>
    </div>
  );
}