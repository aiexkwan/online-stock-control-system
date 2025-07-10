/**
 * ProductionDetailsWidget with Full Type Safety Example
 * 
 * 呢個文件示範點樣使用 GraphQL Codegen 生成嘅 types
 * 配合自定義 GraphQL client 實現完整 type safety
 */

'use client';

import React from 'react';
import { useGraphQLQuery } from '@/lib/graphql-client-stable';
import { gql } from '@apollo/client';

// 定義 Query 嘅 types（正常情況下由 codegen 生成）
interface GetProductionDetailsQuery {
  record_palletinfoCollection: {
    edges: Array<{
      node: {
        plt_num: string;
        product_code: string;
        product_qty: number;
        generate_time: string;
        plt_remark: string | null;
        data_code: {
          description: string | null;
          colour: string | null;
          type: string | null;
        } | null;
      };
    }>;
  };
}

interface GetProductionDetailsVariables {
  startDate: string;
  endDate: string;
  limit?: number;
}

// 使用 gql template literal 創建 query（更簡單同易讀）
const GET_PRODUCTION_DETAILS = gql`
  query GetProductionDetails($startDate: Datetime!, $endDate: Datetime!, $limit: Int) {
    record_palletinfoCollection(
      filter: {
        plt_remark: { ilike: "%finished in production%" }
        generate_time: { gte: $startDate, lte: $endDate }
      }
      orderBy: [{ generate_time: DescNullsLast }]
      first: $limit
    ) {
      edges {
        node {
          plt_num
          product_code
          product_qty
          generate_time
          plt_remark
          data_code {
            description
            colour
            type
          }
        }
      }
    }
  }
`;

export const ProductionDetailsWidgetWithTypes: React.FC = () => {
  // 使用 typed hook - 完整 type safety
  const { data, loading, error } = useGraphQLQuery<
    GetProductionDetailsQuery,
    GetProductionDetailsVariables
  >(
    GET_PRODUCTION_DETAILS,
    {
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      limit: 50
    }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Production Details</h2>
      {data?.record_palletinfoCollection.edges.map(({ node }) => (
        <div key={node.plt_num}>
          <p>Pallet: {node.plt_num}</p>
          <p>Product: {node.product_code} - {node.data_code?.description}</p>
          <p>Quantity: {node.product_qty}</p>
        </div>
      ))}
    </div>
  );
};

/**
 * 使用建議：
 * 
 * 1. 永遠使用 GraphQL Codegen 生成 types
 * 2. 將 queries 放喺獨立文件 (e.g., queries.graphql)
 * 3. 讓 codegen 自動生成 TypedDocumentNode
 * 4. 使用生成嘅 hooks 而唔係手動寫
 * 
 * Example codegen.yml:
 * ```yaml
 * generates:
 *   lib/graphql/generated/hooks.ts:
 *     plugins:
 *       - typescript
 *       - typescript-operations
 *       - typescript-react-apollo
 * ```
 */