declare module 'graphql-cost-analysis' {
  import { GraphQLSchema, ValidationContext } from 'graphql';
  
  interface CostAnalysisOptions {
    maximumCost?: number;
    defaultCost?: number;
    variables?: Record<string, any>;
    createError?: (max: number, actual: number) => Error;
    onComplete?: (cost: number) => void;
  }
  
  export function createComplexityAnalyzer(options?: CostAnalysisOptions): (
    context: ValidationContext
  ) => {
    selectionSet?: any;
  };
  
  export default function costAnalysis(options?: CostAnalysisOptions): any;
}