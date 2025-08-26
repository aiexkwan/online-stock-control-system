/**
 * Transfer Schema - GraphQL type definitions for Transfer History
 */

export const transferSchema = `
# Transfer History Types for vertical timeline display

# Input for transfer time flow query
input TransferTimeFlowInput {
  limit: Int = 50
  offset: Int = 0
  dateRange: DateRangeInput
}

# Individual transfer timeline item
type TransferTimeFlowItem {
  id: ID!
  timestamp: DateTime!
  operator: String!
  action: String!
  palletNumber: String!
  fromLocation: String!
  toLocation: String!
  formattedDate: String!
  formattedTime: String!
}

# Transfer time flow data response
type TransferTimeFlowData {
  items: [TransferTimeFlowItem!]!
  totalCount: Int!
  dateRange: DateRange!
}

# Extend Query type with transfer queries
extend type Query {
  # Get transfer time flow data for vertical timeline
  transferTimeFlow(input: TransferTimeFlowInput!): TransferTimeFlowData!
}
`;

export default transferSchema;
