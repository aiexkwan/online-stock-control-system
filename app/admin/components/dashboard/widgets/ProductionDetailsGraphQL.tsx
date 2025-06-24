/**
 * Production Details Widget - GraphQL Version
 * 顯示生產詳情表格
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useGraphQLQuery } from '@/lib/graphql-client';
import { gql } from '@/lib/graphql-client';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';

interface ProductionDetailsGraphQLProps {
  title: string;
  timeFrame: TimeFrame;
  className?: string;
}

// 綜合查詢 - 獲取生產詳情、QC 記錄和操作員資訊
const GET_PRODUCTION_WITH_QC = gql`
  query GetProductionWithQC($startDate: Datetime!, $endDate: Datetime!) {
    pallets: record_palletinfoCollection(
      filter: {
        plt_remark: { ilike: "%finished in production%" }
        generate_time: { gte: $startDate, lte: $endDate }
      }
      orderBy: [{ generate_time: DescNullsLast }]
      first: 50
    ) {
      edges {
        node {
          plt_num
          product_code
          product_qty
        }
      }
    }
    
    qcRecords: record_historyCollection(
      filter: {
        action: { eq: "Finished QC" }
        time: { gte: $startDate, lte: $endDate }
      }
    ) {
      edges {
        node {
          plt_num
          id
          time
        }
      }
    }
    
    operators: data_idCollection {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

export const ProductionDetailsGraphQL: React.FC<ProductionDetailsGraphQLProps> = ({ 
  title, 
  timeFrame,
  className
}) => {
  const [tableData, setTableData] = React.useState<any[]>([]);

  // 使用綜合 GraphQL 查詢
  const { data, loading, error } = useGraphQLQuery(
    GET_PRODUCTION_WITH_QC,
    {
      startDate: timeFrame.start.toISOString(),
      endDate: timeFrame.end.toISOString()
    }
  );

  // 處理數據
  React.useEffect(() => {
    if (!data) return;

    const pallets = data.pallets?.edges || [];
    const qcRecords = data.qcRecords?.edges || [];
    const operators = data.operators?.edges || [];

    // 創建映射
    const qcMap = new Map<string, number>(); // plt_num -> operator id
    qcRecords.forEach((edge: any) => {
      const record = edge.node;
      qcMap.set(record.plt_num, record.id);
    });

    const operatorMap = new Map<number, string>(); // operator id -> name
    operators.forEach((edge: any) => {
      const operator = edge.node;
      operatorMap.set(operator.id, operator.name);
    });

    // 組合數據
    const processedData = pallets.map((edge: any) => {
      const pallet = edge.node;
      const operatorId = qcMap.get(pallet.plt_num);
      const operatorName = operatorId ? operatorMap.get(operatorId) : undefined;

      return {
        plt_num: pallet.plt_num,
        product_code: pallet.product_code,
        product_qty: Number(pallet.product_qty) || 0,
        qc_by: operatorName || 'N/A'
      };
    });

    setTableData(processedData);
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={`h-full ${className}`}
    >
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 h-full border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 group relative overflow-hidden">
        {/* GraphQL 標識 */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white text-xs rounded-full shadow-lg backdrop-blur-sm">
          GraphQL
        </div>

        {/* 背景裝飾 */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative z-10 h-full flex flex-col">
          <h3 className="text-lg font-medium text-slate-200 mb-4">{title}</h3>
          
          {loading ? (
            <div className="flex-1 overflow-hidden">
              <div className="h-full bg-slate-700/50 rounded animate-pulse" />
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-red-400 text-sm">Error loading data</div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-auto custom-scrollbar">
                <table className="w-full">
                  <thead className="sticky top-0 bg-slate-800/90 backdrop-blur-sm">
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Pallet Num</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Product Code</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase">Qty</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Q.C. By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-400 text-sm">
                          No production data available
                        </td>
                      </tr>
                    ) : (
                      tableData.map((row, index) => (
                        <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                          <td className="py-3 px-4 text-sm text-slate-300">{row.plt_num}</td>
                          <td className="py-3 px-4 text-sm text-slate-300">{row.product_code}</td>
                          <td className="py-3 px-4 text-sm text-slate-300 text-right">{row.product_qty}</td>
                          <td className="py-3 px-4 text-sm text-slate-300">{row.qc_by}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};