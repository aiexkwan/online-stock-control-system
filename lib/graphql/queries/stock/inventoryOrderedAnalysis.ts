import { gql } from '@apollo/client';

export const GET_INVENTORY_ORDERED_ANALYSIS_WIDGET = gql`
  query GetInventoryOrderedAnalysisWidget($productType: String) {
    # Get inventory summary
    record_inventoryCollection(
      filter: {
        or: [
          { product_code: { neq: "" } }
          { product_code: { is: null } }
        ]
      }
    ) {
      edges {
        node {
          product_code
          injection
          pipeline
          prebook
          await
          fold
          bulk
          backcarpark
          damage
          await_grn
          latest_update
        }
      }
    }
    
    # Get outstanding orders
    data_orderCollection(
      filter: {
        or: [
          { product_code: { neq: "" } }
          { product_code: { is: null } }
        ]
      }
    ) {
      edges {
        node {
          product_code
          product_qty
          loaded_qty
        }
      }
    }
    
    # Get product master data
    data_codeCollection(
      filter: {
        type: { eq: $productType }
      }
    ) {
      edges {
        node {
          code
          description
          type
          standard_qty
        }
      }
    }
  }
`;