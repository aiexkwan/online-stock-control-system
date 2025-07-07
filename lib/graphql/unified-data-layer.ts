/**
 * 統一數據層業務邏輯層
 * 作為現有 Supabase GraphQL API 與新統一 Schema 之間的橋接
 * 第一週：GraphQL Schema 標準化實施
 */

import { graphqlClient } from '../graphql-client-stable';

// 定義統一的類型接口
export interface Product {
  id: string;
  code: string;
  description: string;
  colour: string;
  standardQty: number;
  type: string;
  remark?: string | null;
}

export interface Pallet {
  id: string;
  palletNumber: string;
  productCode: string;
  series: string;
  generateTime: string;
  quantity: number;
  remark?: string | null;
  pdfUrl?: string | null;
  status: 'ACTIVE' | 'LOADED' | 'DAMAGED' | 'VOID';
}

export interface InventoryRecord {
  id: string;
  productCode: string;
  palletNumber: string;
  injection: number;
  pipeline: number;
  prebook: number;
  await: number;
  fold: number;
  bulk: number;
  backcarpark: number;
  damage: number;
  awaitGrn?: number | null;
  latestUpdate: string;
  totalQuantity: number;
}

export interface Movement {
  id: string;
  palletNumber: string;
  fromLocation: string;
  toLocation: string;
  operatorId: number;
  transferDate: string;
}

export interface ProductFilter {
  code?: string;
  description?: string;
  colour?: string;
  type?: string;
  search?: string;
}

export interface PalletFilter {
  palletNumber?: string;
  productCode?: string;
  status?: 'ACTIVE' | 'LOADED' | 'DAMAGED' | 'VOID';
  location?: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
}

export interface InventoryFilter {
  productCode?: string;
  location?: string;
  minQuantity?: number;
  maxQuantity?: number;
}

export interface MovementFilter {
  palletNumber?: string;
  fromLocation?: string;
  toLocation?: string;
  operatorId?: number;
  dateRange?: {
    from?: string;
    to?: string;
  };
}

export interface PaginationInput {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
}

export interface Connection<T> {
  totalCount: number;
  pageInfo: PageInfo;
  edges: Array<{
    cursor: string;
    node: T;
  }>;
}

/**
 * 統一數據層適配器
 * 將 Supabase 原始數據結構轉換為統一的 GraphQL Schema
 */
export class UnifiedDataLayer {
  
  /**
   * 產品管理
   */
  async getProducts(
    filter?: ProductFilter,
    pagination?: PaginationInput
  ): Promise<Connection<Product>> {
    // 映射過濾條件到 Supabase GraphQL
    const supabaseFilter = this.mapProductFilter(filter);
    
    const query = `
      query GetProducts($filter: data_codeFilter, $first: Int, $after: String) {
        data_codeCollection(
          filter: $filter
          first: $first
          after: $after
          orderBy: [{ code: AscNullsLast }]
        ) {
          edges {
            cursor
            node {
              code
              description
              colour
              standard_qty
              type
              remark
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          totalCount
        }
      }
    `;

    const result = await graphqlClient.query({
      query,
      variables: {
        filter: supabaseFilter,
        first: pagination?.first || 50,
        after: pagination?.after
      }
    });

    // 轉換數據結構
    return this.transformProductConnection(result.data?.data_codeCollection);
  }

  async getProduct(id: string): Promise<Product | null> {
    const query = `
      query GetProduct($code: String!) {
        data_codeCollection(filter: { code: { eq: $code } }) {
          edges {
            node {
              code
              description
              colour
              standard_qty
              type
              remark
            }
          }
        }
      }
    `;

    const result = await graphqlClient.query({
      query,
      variables: { code: id }
    });

    const productData = result.data?.data_codeCollection?.edges?.[0]?.node;
    return productData ? this.transformProduct(productData) : null;
  }

  /**
   * 托盤管理
   */
  async getPallets(
    filter?: PalletFilter,
    pagination?: PaginationInput
  ): Promise<Connection<Pallet>> {
    const supabaseFilter = this.mapPalletFilter(filter);
    
    const query = `
      query GetPallets($filter: record_palletinfoFilter, $first: Int, $after: String) {
        record_palletinfoCollection(
          filter: $filter
          first: $first
          after: $after
          orderBy: [{ generate_time: DescNullsLast }]
        ) {
          edges {
            cursor
            node {
              plt_num
              product_code
              series
              generate_time
              product_qty
              remark
              pdf_url
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          totalCount
        }
      }
    `;

    const result = await graphqlClient.query({
      query,
      variables: {
        filter: supabaseFilter,
        first: pagination?.first || 50,
        after: pagination?.after
      }
    });

    return this.transformPalletConnection(result.data?.record_palletinfoCollection);
  }

  /**
   * 庫存管理
   */
  async getInventory(
    filter?: InventoryFilter,
    pagination?: PaginationInput
  ): Promise<Connection<InventoryRecord>> {
    const supabaseFilter = this.mapInventoryFilter(filter);
    
    const query = `
      query GetInventory($filter: record_inventoryFilter, $first: Int, $after: String) {
        record_inventoryCollection(
          filter: $filter
          first: $first
          after: $after
          orderBy: [{ latest_update: DescNullsLast }]
        ) {
          edges {
            cursor
            node {
              uuid
              product_code
              plt_num
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
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          totalCount
        }
      }
    `;

    const result = await graphqlClient.query({
      query,
      variables: {
        filter: supabaseFilter,
        first: pagination?.first || 50,
        after: pagination?.after
      }
    });

    return this.transformInventoryConnection(result.data?.record_inventoryCollection);
  }

  /**
   * 移動記錄管理
   */
  async getMovements(
    filter?: MovementFilter,
    pagination?: PaginationInput
  ): Promise<Connection<Movement>> {
    const supabaseFilter = this.mapMovementFilter(filter);
    
    const query = `
      query GetMovements($filter: record_transferFilter, $first: Int, $after: String) {
        record_transferCollection(
          filter: $filter
          first: $first
          after: $after
          orderBy: [{ transfer_date: DescNullsLast }]
        ) {
          edges {
            cursor
            node {
              uuid
              plt_num
              from_location
              to_location
              operator_id
              transfer_date
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          totalCount
        }
      }
    `;

    const result = await graphqlClient.query({
      query,
      variables: {
        filter: supabaseFilter,
        first: pagination?.first || 50,
        after: pagination?.after
      }
    });

    return this.transformMovementConnection(result.data?.record_transferCollection);
  }

  /**
   * 業務邏輯查詢
   */
  async getLowStockProducts(
    threshold: number = 10,
    pagination?: PaginationInput
  ): Promise<Connection<Product>> {
    const query = `
      query GetLowStockProducts($threshold: Int!, $first: Int, $after: String) {
        record_inventoryCollection(
          filter: {
            and: [
              { injection: { lt: $threshold } },
              { pipeline: { lt: $threshold } },
              { prebook: { lt: $threshold } }
            ]
          }
          first: $first
          after: $after
        ) {
          edges {
            cursor
            node {
              product_code
              data_code {
                code
                description
                colour
                standard_qty
                type
                remark
              }
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          totalCount
        }
      }
    `;

    const result = await graphqlClient.query({
      query,
      variables: { 
        threshold,
        first: pagination?.first || 50,
        after: pagination?.after
      }
    });

    // Transform the low stock products to Product connection
    const edges = (result.data?.record_inventoryCollection?.edges || [])
      .filter((edge: any) => edge.node?.data_code)
      .map((edge: any) => ({
        cursor: edge.cursor,
        node: this.transformProduct(edge.node.data_code)
      }));

    return {
      totalCount: result.data?.record_inventoryCollection?.totalCount || 0,
      pageInfo: result.data?.record_inventoryCollection?.pageInfo || {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null
      },
      edges
    };
  }

  async getStockLevels(): Promise<InventoryRecord[]> {
    const query = `
      query GetStockLevels {
        record_inventoryCollection(
          orderBy: [{ latest_update: DescNullsLast }]
        ) {
          edges {
            node {
              uuid
              product_code
              plt_num
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
      }
    `;

    const result = await graphqlClient.query({ query });
    return this.transformStockLevels(result.data?.record_inventoryCollection?.edges || []);
  }

  /**
   * 數據轉換方法
   */
  private transformProductConnection(data: any): Connection<Product> {
    return {
      totalCount: data?.totalCount || 0,
      pageInfo: data?.pageInfo || {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null
      },
      edges: (data?.edges || []).map((edge: any) => ({
        cursor: edge.cursor,
        node: this.transformProduct(edge.node)
      }))
    };
  }

  private transformProduct(data: any): Product {
    return {
      id: data.code,
      code: data.code,
      description: data.description || '',
      colour: data.colour || '',
      standardQty: data.standard_qty || 0,
      type: data.type || '',
      remark: data.remark || null
    };
  }

  private transformPalletConnection(data: any): Connection<Pallet> {
    return {
      totalCount: data?.totalCount || 0,
      pageInfo: data?.pageInfo || {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null
      },
      edges: (data?.edges || []).map((edge: any) => ({
        cursor: edge.cursor,
        node: this.transformPallet(edge.node)
      }))
    };
  }

  private transformPallet(data: any): Pallet {
    return {
      id: data.plt_num,
      palletNumber: data.plt_num,
      productCode: data.product_code,
      series: data.series || '',
      generateTime: data.generate_time,
      quantity: data.product_qty || 0,
      remark: data.remark || null,
      pdfUrl: data.pdf_url || null,
      status: this.determinePalletStatus(data)
    };
  }

  private transformInventoryConnection(data: any): Connection<InventoryRecord> {
    return {
      totalCount: data?.totalCount || 0,
      pageInfo: data?.pageInfo || {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null
      },
      edges: (data?.edges || []).map((edge: any) => ({
        cursor: edge.cursor,
        node: this.transformInventoryRecord(edge.node)
      }))
    };
  }

  private transformInventoryRecord(data: any): InventoryRecord {
    const totalQuantity = (data.injection || 0) + (data.pipeline || 0) + 
                         (data.prebook || 0) + (data.await || 0) + 
                         (data.fold || 0) + (data.bulk || 0) + 
                         (data.backcarpark || 0) + (data.damage || 0) + 
                         (data.await_grn || 0);

    return {
      id: data.uuid,
      productCode: data.product_code,
      palletNumber: data.plt_num,
      injection: data.injection || 0,
      pipeline: data.pipeline || 0,
      prebook: data.prebook || 0,
      await: data.await || 0,
      fold: data.fold || 0,
      bulk: data.bulk || 0,
      backcarpark: data.backcarpark || 0,
      damage: data.damage || 0,
      awaitGrn: data.await_grn || 0,
      latestUpdate: data.latest_update,
      totalQuantity
    };
  }

  private transformMovementConnection(data: any): Connection<Movement> {
    return {
      totalCount: data?.totalCount || 0,
      pageInfo: data?.pageInfo || {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null
      },
      edges: (data?.edges || []).map((edge: any) => ({
        cursor: edge.cursor,
        node: this.transformMovement(edge.node)
      }))
    };
  }

  private transformMovement(data: any): Movement {
    return {
      id: data.uuid,
      palletNumber: data.plt_num,
      fromLocation: data.from_location,
      toLocation: data.to_location,
      operatorId: data.operator_id,
      transferDate: data.transfer_date
    };
  }

  /**
   * 過濾條件映射方法
   */
  private mapProductFilter(filter?: ProductFilter): any {
    if (!filter) return undefined;

    const conditions: any = {};
    
    if (filter.code) {
      conditions.code = { ilike: `%${filter.code}%` };
    }
    
    if (filter.description) {
      conditions.description = { ilike: `%${filter.description}%` };
    }
    
    if (filter.colour) {
      conditions.colour = { eq: filter.colour };
    }
    
    if (filter.type) {
      conditions.type = { eq: filter.type };
    }
    
    if (filter.search) {
      conditions.or = [
        { code: { ilike: `%${filter.search}%` } },
        { description: { ilike: `%${filter.search}%` } }
      ];
    }

    return Object.keys(conditions).length > 0 ? conditions : undefined;
  }

  private mapPalletFilter(filter?: PalletFilter): any {
    if (!filter) return undefined;

    const conditions: any = {};
    
    if (filter.palletNumber) {
      conditions.plt_num = { ilike: `%${filter.palletNumber}%` };
    }
    
    if (filter.productCode) {
      conditions.product_code = { eq: filter.productCode };
    }
    
    if (filter.dateRange?.from) {
      conditions.generate_time = { gte: filter.dateRange.from };
    }
    
    if (filter.dateRange?.to) {
      conditions.generate_time = { 
        ...conditions.generate_time,
        lte: filter.dateRange.to 
      };
    }

    return Object.keys(conditions).length > 0 ? conditions : undefined;
  }

  private mapInventoryFilter(filter?: InventoryFilter): any {
    if (!filter) return undefined;

    const conditions: any = {};
    
    if (filter.productCode) {
      conditions.product_code = { eq: filter.productCode };
    }
    
    if (filter.minQuantity !== undefined) {
      // 需要組合多個欄位的最小值檢查
      conditions.or = [
        { injection: { gte: filter.minQuantity } },
        { pipeline: { gte: filter.minQuantity } },
        { prebook: { gte: filter.minQuantity } }
      ];
    }

    return Object.keys(conditions).length > 0 ? conditions : undefined;
  }

  private mapMovementFilter(filter?: MovementFilter): any {
    if (!filter) return undefined;

    const conditions: any = {};
    
    if (filter.palletNumber) {
      conditions.plt_num = { eq: filter.palletNumber };
    }
    
    if (filter.fromLocation) {
      conditions.from_location = { eq: filter.fromLocation };
    }
    
    if (filter.toLocation) {
      conditions.to_location = { eq: filter.toLocation };
    }
    
    if (filter.operatorId) {
      conditions.operator_id = { eq: filter.operatorId };
    }

    return Object.keys(conditions).length > 0 ? conditions : undefined;
  }

  /**
   * 輔助方法
   */
  private determinePalletStatus(data: any): 'ACTIVE' | 'LOADED' | 'DAMAGED' | 'VOID' {
    // 根據業務邏輯判斷托盤狀態
    // 這裡需要根據實際業務規則實施
    return 'ACTIVE';
  }

  private transformLowStockProducts(edges: any[]): Product[] {
    return edges.map(edge => this.transformProduct(edge.node.data_code));
  }

  private transformStockLevels(edges: any[]): InventoryRecord[] {
    return edges.map(edge => this.transformInventoryRecord(edge.node));
  }
}

// 導出單例
export const unifiedDataLayer = new UnifiedDataLayer();

/**
 * 統一數據層 Hook 工廠
 * 為 React 組件提供統一的數據訪問接口
 */
export const createUnifiedDataHooks = () => {
  return {
    useProducts: (filter?: ProductFilter, pagination?: PaginationInput) => {
      // 實現 React Hook 邏輯
      // 這裡會在第二週實施
    },
    
    usePallets: (filter?: PalletFilter, pagination?: PaginationInput) => {
      // 實現 React Hook 邏輯
    },
    
    useInventory: (filter?: InventoryFilter, pagination?: PaginationInput) => {
      // 實現 React Hook 邏輯
    },
    
    useMovements: (filter?: MovementFilter, pagination?: PaginationInput) => {
      // 實現 React Hook 邏輯
    },
    
    // 業務邏輯 Hooks
    useLowStockProducts: (threshold?: number) => {
      // 實現低庫存產品監控
    },
    
    useStockLevels: () => {
      // 實現庫存水平監控
    },
    
    useRealtimeInventory: (productCode?: string) => {
      // 實現實時庫存監控 (第三週 Subscription)
    }
  };
};

export default unifiedDataLayer; 