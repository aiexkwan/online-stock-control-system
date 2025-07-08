import { gql } from './client';

// 測試查詢
export const TEST_QUERY = gql`
  query TestQuery {
    record_palletinfoCollection(first: 1) {
      edges {
        node {
          plt_num
          product_code
          product_qty
          generate_time
        }
      }
    }
  }
`;
