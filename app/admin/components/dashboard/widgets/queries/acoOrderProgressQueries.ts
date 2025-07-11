import { gql } from '@apollo/client';

export const GET_ACO_INCOMPLETE_ORDERS = gql`
  query GetAcoIncompleteOrders($limit: Int = 50, $offset: Int = 0) {
    incompleteOrders: record_acoCollection(
      filter: { 
        order_state: { neq: "COMPLETE" }
      }
      orderBy: [{ latest_update: DescNullsLast }]
      first: $limit
      offset: $offset
    ) {
      edges {
        node {
          order_ref
          latest_update
          order_state
          product_code
          required_qty
          finished_qty
        }
      }
      totalCount
    }
  }
`;

export const GET_ACO_ORDER_PROGRESS = gql`
  query GetAcoOrderProgress($orderRef: BigInt!) {
    orderProgress: record_acoCollection(
      filter: { order_ref: { eq: $orderRef } }
    ) {
      edges {
        node {
          product_code
          required_qty
          finished_qty
          order_ref
          order_state
        }
      }
    }
  }
`;

// GraphQL queries types (manually created)
export interface AcoOrderNode {
  order_ref: number;
  latest_update: string;
  order_state: string;
  product_code: string;
  required_qty: number;
  finished_qty: number;
}

export interface GetAcoIncompleteOrdersData {
  incompleteOrders: {
    edges: Array<{
      node: AcoOrderNode;
    }>;
    totalCount: number;
  };
}

export interface GetAcoOrderProgressData {
  orderProgress: {
    edges: Array<{
      node: AcoOrderNode;
    }>;
  };
}

export interface GetAcoIncompleteOrdersVariables {
  limit?: number;
  offset?: number;
}

export interface GetAcoOrderProgressVariables {
  orderRef: number;
}