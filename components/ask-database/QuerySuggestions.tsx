import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  ClipboardList, 
  TrendingUp, 
  AlertCircle,
  Search,
  Calendar,
  Truck,
  Database
} from 'lucide-react';
import { AnomalyDetectionButton } from './AnomalyDetectionButton';

interface QuerySuggestionsProps {
  onSelect: (query: string) => void;
  currentContext?: string;
  recentQueries?: string[];
}

interface SuggestionCategory {
  category: string;
  icon: React.ReactNode;
  queries: string[];
}

export function QuerySuggestions({ 
  onSelect, 
  currentContext,
  recentQueries = []
}: QuerySuggestionsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // 基於實際業務嘅常用查詢
  const suggestions: SuggestionCategory[] = [
    {
      category: 'Real-time Inventory',
      icon: <Package className="w-4 h-4" />,
      queries: [
        'Show all pallets in Await location',
        'What is the total stock for product code MH001?',
        'How many pallets arrived today?',
        'Which warehouse has the most available space?',
        'Show products with stock below 100 units',
        'List all pallets that have been in Await for more than 7 days'
      ]
    },
    {
      category: 'Order Status',
      icon: <ClipboardList className="w-4 h-4" />,
      queries: [
        'Show all pending orders',
        'How many items need to be shipped today?',
        'What is the status of order REF001?',
        'Show all unprocessed ACO orders',
        'List orders that are overdue',
        'Which orders are partially loaded?'
      ]
    },
    {
      category: 'Efficiency Analysis',
      icon: <TrendingUp className="w-4 h-4" />,
      queries: [
        'How many pallets were produced today?',
        'Show monthly shipping statistics',
        'What is the average transfer time?',
        'Show work level by department today',
        'Compare this week vs last week production',
        'Show most active products today'
      ]
    },
    {
      category: 'Anomaly Detection',
      icon: <AlertCircle className="w-4 h-4" />,
      queries: [
        'Show pallets that have not moved for 30 days',
        'Find duplicate pallet numbers',
        'Show products with inventory discrepancies',
        'List any errors recorded today',
        'Show pallets with missing information',
        'Find orders without customer details'
      ]
    }
  ];

  // 基於上下文嘅動態建議
  const contextualSuggestions = useMemo(() => {
    if (!currentContext) return [];
    
    const suggestions: string[] = [];
    
    // 分析上下文並生成相關建議
    if (currentContext.toLowerCase().includes('stock') || 
        currentContext.toLowerCase().includes('inventory')) {
      suggestions.push(
        'Show stock movement history for this product',
        'Compare current stock with last month',
        'Show location distribution for this product'
      );
    }
    
    if (currentContext.toLowerCase().includes('order')) {
      suggestions.push(
        'Show all items in this order',
        'Check loading progress for this order',
        'Show similar orders from the same customer'
      );
    }
    
    if (currentContext.toLowerCase().includes('pallet')) {
      suggestions.push(
        'Show movement history for this pallet',
        'Find pallets with the same product',
        'Check QC status for this pallet'
      );
    }
    
    return suggestions;
  }, [currentContext]);

  // 最近查詢（去重）
  const uniqueRecentQueries = useMemo(() => {
    return Array.from(new Set(recentQueries)).slice(0, 5);
  }, [recentQueries]);

  return (
    <div className="space-y-4">
      {/* 最近查詢 */}
      {uniqueRecentQueries.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Recent Queries
          </h3>
          <div className="space-y-1">
            {uniqueRecentQueries.map((query, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => onSelect(query)}
                className="w-full justify-start text-left text-white bg-slate-700 hover:bg-slate-600 rounded border border-slate-600 transition-all"
              >
                <Search className="w-3 h-3 mr-2 opacity-50" />
                {query}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 上下文建議 */}
      {contextualSuggestions.length > 0 && (
        <div className="bg-blue-900/50 border border-blue-600 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-300 mb-3 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Related Queries
          </h3>
          <div className="space-y-1">
            {contextualSuggestions.map((query, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => onSelect(query)}
                className="w-full justify-start text-left text-white bg-blue-700 hover:bg-blue-600 rounded border border-blue-600 transition-all"
              >
                {query}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 分類建議 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestions.map((cat) => (
          <Card 
            key={cat.category} 
            className="bg-slate-800 border border-slate-600 hover:border-purple-500/50 transition-all cursor-pointer"
            onClick={() => setSelectedCategory(
              selectedCategory === cat.category ? null : cat.category
            )}
          >
            <div className="p-3">
              <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                {cat.icon}
                {cat.category}
              </h3>
              
              {selectedCategory === cat.category && (
                <div className="space-y-1 mt-3">
                  {cat.queries.map((query, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(query);
                      }}
                      className="w-full justify-start text-left text-sm text-white bg-slate-700 hover:bg-slate-600 py-2 px-3 rounded border border-slate-600 transition-all"
                    >
                      {query}
                    </Button>
                  ))}
                </div>
              )}
              
              {selectedCategory !== cat.category && (
                <p className="text-xs text-slate-400">
                  Click to view {cat.queries.length} suggestions
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* 快速操作 */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelect("Show today's summary")}
          className="text-xs bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500"
        >
          <Calendar className="w-3 h-3 mr-1" />
          Today&apos;s Summary
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelect('Show current Await pallets')}
          className="text-xs bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500"
        >
          <Package className="w-3 h-3 mr-1" />
          Await Status
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelect('Show pending shipments')}
          className="text-xs bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500"
        >
          <Truck className="w-3 h-3 mr-1" />
          Pending Shipments
        </Button>
      </div>
      
      {/* 異常檢測 */}
      <div className="mt-4">
        <AnomalyDetectionButton className="w-full" />
      </div>
    </div>
  );
}