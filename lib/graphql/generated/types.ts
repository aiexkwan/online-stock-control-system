export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: string; output: string; }
  DateTime: { input: string; output: string; }
  JSON: { input: any; output: any; }
  PositiveInt: { input: any; output: any; }
  Time: { input: string; output: string; }
  UUID: { input: string; output: string; }
};

export type AdjustInventoryResult = InventoryRecord | SystemError | UserError;

export type AlertSeverity =
  | 'CRITICAL'
  | 'ERROR'
  | 'INFO'
  | 'WARNING'
  | '%future added value';

export type AlertType =
  | 'LOW_STOCK'
  | 'ORDER_COMPLETED'
  | 'PALLET_MOVED'
  | 'STOCKTAKE_VARIANCE'
  | 'SYSTEM_ERROR'
  | '%future added value';

export type BaseError = {
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type BulkInventoryResult = BulkInventorySuccess | SystemError | UserError;

export type BulkInventorySuccess = {
  __typename?: 'BulkInventorySuccess';
  failedUpdates: Scalars['Int']['output'];
  message: Scalars['String']['output'];
  successfulUpdates: Scalars['Int']['output'];
};

export type BulkPalletResult = BulkPalletSuccess | SystemError | UserError;

export type BulkPalletSuccess = {
  __typename?: 'BulkPalletSuccess';
  failedCreations: Scalars['Int']['output'];
  message: Scalars['String']['output'];
  successfulCreations: Scalars['Int']['output'];
};

export type Connection = {
  edges: Array<Edge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type CreateGrnInput = {
  grnRef: Scalars['Int']['input'];
  grossWeight: Scalars['Int']['input'];
  materialCode: Scalars['String']['input'];
  netWeight: Scalars['Int']['input'];
  packageCount: Scalars['Float']['input'];
  packageType: Scalars['String']['input'];
  palletCount: Scalars['Float']['input'];
  palletNumber: Scalars['String']['input'];
  palletType: Scalars['String']['input'];
  supplierCode: Scalars['String']['input'];
};

export type CreateOrderInput = {
  orderRef: Scalars['Int']['input'];
  productCode: Scalars['String']['input'];
  requiredQty: Scalars['Int']['input'];
};

export type CreatePalletInput = {
  palletNumber: Scalars['String']['input'];
  productCode: Scalars['String']['input'];
  quantity: Scalars['Int']['input'];
  remark?: InputMaybe<Scalars['String']['input']>;
  series: Scalars['String']['input'];
};

export type CreateProductInput = {
  code: Scalars['String']['input'];
  colour: Scalars['String']['input'];
  description: Scalars['String']['input'];
  remark?: InputMaybe<Scalars['String']['input']>;
  standardQty: Scalars['Int']['input'];
  type: Scalars['String']['input'];
};

export type DateRangeInput = {
  endDate: Scalars['DateTime']['input'];
  startDate: Scalars['DateTime']['input'];
};

export type DeleteResult = DeleteSuccess | SystemError | UserError;

export type DeleteSuccess = {
  __typename?: 'DeleteSuccess';
  id: Scalars['ID']['output'];
  message: Scalars['String']['output'];
};

export type Edge = {
  cursor: Scalars['String']['output'];
  node: Node;
};

export type GrnConnection = Connection & {
  __typename?: 'GRNConnection';
  edges: Array<GrnEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type GrnEdge = Edge & {
  __typename?: 'GRNEdge';
  cursor: Scalars['String']['output'];
  node: GrnRecord;
};

export type GrnFilter = {
  dateRange?: InputMaybe<DateRangeInput>;
  grnRef?: InputMaybe<Scalars['Int']['input']>;
  materialCode?: InputMaybe<Scalars['String']['input']>;
  supplierCode?: InputMaybe<Scalars['String']['input']>;
};

/**
 * GRN 記錄 - 收貨記錄 (Goods Receipt Note)
 * 記錄供應商收貨的詳細資訊，包括重量、包裝等
 */
export type GrnRecord = Node & {
  __typename?: 'GRNRecord';
  createTime: Scalars['DateTime']['output'];
  grnRef: Scalars['Int']['output'];
  grossWeight: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  materialCode: Scalars['String']['output'];
  netWeight: Scalars['Int']['output'];
  packageCount: Scalars['Float']['output'];
  packageType: Scalars['String']['output'];
  pallet: Pallet;
  palletCount: Scalars['Float']['output'];
  palletNumber: Scalars['String']['output'];
  palletType: Scalars['String']['output'];
  product: Product;
  supplier: Supplier;
  supplierCode: Scalars['String']['output'];
};

export type GrnResult = GrnRecord | SystemError | UserError;

export type GenerateGrnLabelInput = {
  grnRef: Scalars['Int']['input'];
  materialCode: Scalars['String']['input'];
  palletNumber: Scalars['String']['input'];
  supplierCode: Scalars['String']['input'];
};

export type GrnLabel = {
  __typename?: 'GrnLabel';
  generatedAt: Scalars['DateTime']['output'];
  grnRef: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  materialCode: Scalars['String']['output'];
  palletNumber: Scalars['String']['output'];
  pdfUrl?: Maybe<Scalars['String']['output']>;
  supplierCode: Scalars['String']['output'];
};

export type GrnLabelResult = GrnLabel | SystemError | UserError;

export type InventoryConnection = Connection & {
  __typename?: 'InventoryConnection';
  edges: Array<InventoryEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type InventoryEdge = Edge & {
  __typename?: 'InventoryEdge';
  cursor: Scalars['String']['output'];
  node: InventoryRecord;
};

export type InventoryFilter = {
  lastUpdated?: InputMaybe<DateRangeInput>;
  location?: InputMaybe<LocationType>;
  maxQuantity?: InputMaybe<Scalars['Int']['input']>;
  minQuantity?: InputMaybe<Scalars['Int']['input']>;
  productCode?: InputMaybe<Scalars['String']['input']>;
};

/**
 * Inventory Record - tracks product quantities at various warehouse locations
 * Tracks real-time inventory across injection, pipeline, prebook, and other locations
 */
export type InventoryRecord = Node & {
  __typename?: 'InventoryRecord';
  await: Scalars['Int']['output'];
  awaitGrn?: Maybe<Scalars['Int']['output']>;
  backcarpark: Scalars['Int']['output'];
  bulk: Scalars['Int']['output'];
  damage: Scalars['Int']['output'];
  fold: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  injection: Scalars['Int']['output'];
  latestUpdate: Scalars['DateTime']['output'];
  pallet: Pallet;
  palletNumber: Scalars['String']['output'];
  pipeline: Scalars['Int']['output'];
  prebook: Scalars['Int']['output'];
  product: Product;
  productCode: Scalars['String']['output'];
  totalQuantity: Scalars['Int']['output'];
};

export type InventoryResult = InventoryRecord | SystemError | UserError;

export type LoadPalletInput = {
  operatorId: Scalars['Int']['input'];
  orderRef: Scalars['Int']['input'];
  palletNumber: Scalars['String']['input'];
};

export type LoadingHistory = Node & {
  __typename?: 'LoadingHistory';
  actionBy: Scalars['String']['output'];
  actionTime: Scalars['DateTime']['output'];
  actionType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  orderRef: Scalars['String']['output'];
  palletNumber: Scalars['String']['output'];
  productCode: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
  remark?: Maybe<Scalars['String']['output']>;
};

export type LoadingHistoryConnection = Connection & {
  __typename?: 'LoadingHistoryConnection';
  edges: Array<LoadingHistoryEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type LoadingHistoryEdge = Edge & {
  __typename?: 'LoadingHistoryEdge';
  cursor: Scalars['String']['output'];
  node: LoadingHistory;
};

export type LoadingHistoryFilter = {
  actionBy?: InputMaybe<Scalars['String']['input']>;
  actionType?: InputMaybe<Scalars['String']['input']>;
  dateRange?: InputMaybe<DateRangeInput>;
  orderRef?: InputMaybe<Scalars['String']['input']>;
  palletNumber?: InputMaybe<Scalars['String']['input']>;
  productCode?: InputMaybe<Scalars['String']['input']>;
};

export type Location = {
  __typename?: 'Location';
  capacity?: Maybe<Scalars['Int']['output']>;
  currentStock: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  occupancyRate: Scalars['Float']['output'];
};

export type LocationType =
  | 'AWAIT'
  | 'AWAIT_GRN'
  | 'BACKCARPARK'
  | 'BULK'
  | 'DAMAGE'
  | 'FOLD'
  | 'INJECTION'
  | 'PIPELINE'
  | 'PREBOOK'
  | '%future added value';

export type LowStockAlert = {
  __typename?: 'LowStockAlert';
  currentQty: Scalars['Int']['output'];
  location: LocationType;
  productCode: Scalars['String']['output'];
  threshold: Scalars['Int']['output'];
  timestamp: Scalars['DateTime']['output'];
};

export type MovePalletInput = {
  fromLocation: Scalars['String']['input'];
  operatorId: Scalars['Int']['input'];
  palletNumber: Scalars['String']['input'];
  remark?: InputMaybe<Scalars['String']['input']>;
  toLocation: Scalars['String']['input'];
};

/**
 * 移動記錄 - 記錄托盤在倉庫間的移動歷史
 * 包含操作員、時間、起點和終點等資訊
 */
export type Movement = Node & {
  __typename?: 'Movement';
  fromLocation: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  operator: User;
  operatorId: Scalars['Int']['output'];
  pallet: Pallet;
  palletNumber: Scalars['String']['output'];
  toLocation: Scalars['String']['output'];
  transferDate: Scalars['DateTime']['output'];
};

export type MovementConnection = Connection & {
  __typename?: 'MovementConnection';
  edges: Array<MovementEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type MovementEdge = Edge & {
  __typename?: 'MovementEdge';
  cursor: Scalars['String']['output'];
  node: Movement;
};

export type MovementFilter = {
  dateRange?: InputMaybe<DateRangeInput>;
  fromLocation?: InputMaybe<Scalars['String']['input']>;
  operatorId?: InputMaybe<Scalars['Int']['input']>;
  palletNumber?: InputMaybe<Scalars['String']['input']>;
  toLocation?: InputMaybe<Scalars['String']['input']>;
};

export type MovementResult = Movement | SystemError | UserError;

/** Mutation root type - provides entry points for all data modification operations */
export type Mutation = {
  __typename?: 'Mutation';
  adjustInventory: AdjustInventoryResult;
  createPallet: PalletResult;
  createProduct: ProductResult;
  deleteProduct: DeleteResult;
  generateGrnLabel: GrnLabelResult;
  processStocktake: StocktakeResult;
  transferStock: TransferResult;
  updatePallet: PalletResult;
  updateProduct: ProductResult;
  voidPallet: VoidResult;
};


/** Mutation root type - provides entry points for all data modification operations */
export type MutationAdjustInventoryArgs = {
  input: StockAdjustmentInput;
};


/** Mutation root type - provides entry points for all data modification operations */
export type MutationCreatePalletArgs = {
  input: CreatePalletInput;
};


/** Mutation root type - provides entry points for all data modification operations */
export type MutationCreateProductArgs = {
  input: CreateProductInput;
};


/** Mutation root type - provides entry points for all data modification operations */
export type MutationDeleteProductArgs = {
  id: Scalars['ID']['input'];
};


/** Mutation root type - provides entry points for all data modification operations */
export type MutationGenerateGrnLabelArgs = {
  input: GenerateGrnLabelInput;
};


/** Mutation root type - provides entry points for all data modification operations */
export type MutationProcessStocktakeArgs = {
  input: ProcessStocktakeInput;
};


/** Mutation root type - provides entry points for all data modification operations */
export type MutationTransferStockArgs = {
  input: TransferStockInput;
};


/** Mutation root type - provides entry points for all data modification operations */
export type MutationUpdatePalletArgs = {
  id: Scalars['ID']['input'];
  input: UpdatePalletInput;
};


/** Mutation root type - provides entry points for all data modification operations */
export type MutationUpdateProductArgs = {
  id: Scalars['ID']['input'];
  input: UpdateProductInput;
};


/** Mutation root type - provides entry points for all data modification operations */
export type MutationVoidPalletArgs = {
  id: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type Node = {
  id: Scalars['ID']['output'];
};

/**
 * 訂單實體 - 代表客戶訂單
 * 追蹤訂單狀態、裝載進度和相關托盤資訊
 */
export type Order = Node & {
  __typename?: 'Order';
  id: Scalars['ID']['output'];
  latestUpdate: Scalars['DateTime']['output'];
  loadingHistory?: Maybe<LoadingHistoryConnection>;
  orderDetails?: Maybe<OrderDetailConnection>;
  orderRef: Scalars['Int']['output'];
  product: Product;
  productCode: Scalars['String']['output'];
  remainQty: Scalars['Int']['output'];
  requiredQty: Scalars['Int']['output'];
  status: OrderStatus;
};


/**
 * 訂單實體 - 代表客戶訂單
 * 追蹤訂單狀態、裝載進度和相關托盤資訊
 */
export type OrderLoadingHistoryArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<LoadingHistoryFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<SortInput>;
};


/**
 * 訂單實體 - 代表客戶訂單
 * 追蹤訂單狀態、裝載進度和相關托盤資訊
 */
export type OrderOrderDetailsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<SortInput>;
};

export type OrderConnection = Connection & {
  __typename?: 'OrderConnection';
  edges: Array<OrderEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type OrderDetail = Node & {
  __typename?: 'OrderDetail';
  createdAt: Scalars['Time']['output'];
  height?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  length?: Maybe<Scalars['Int']['output']>;
  pallet: Pallet;
  palletNumber: Scalars['String']['output'];
  weight?: Maybe<Scalars['Int']['output']>;
  width?: Maybe<Scalars['Int']['output']>;
};

export type OrderDetailConnection = Connection & {
  __typename?: 'OrderDetailConnection';
  edges: Array<OrderDetailEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type OrderDetailEdge = Edge & {
  __typename?: 'OrderDetailEdge';
  cursor: Scalars['String']['output'];
  node: OrderDetail;
};

export type OrderEdge = Edge & {
  __typename?: 'OrderEdge';
  cursor: Scalars['String']['output'];
  node: Order;
};

export type OrderFilter = {
  dateRange?: InputMaybe<DateRangeInput>;
  orderRef?: InputMaybe<Scalars['Int']['input']>;
  productCode?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<OrderStatus>;
};

export type OrderResult = Order | SystemError | UserError;

export type OrderStatus =
  | 'CANCELLED'
  | 'COMPLETED'
  | 'IN_PROGRESS'
  | 'PENDING'
  | '%future added value';

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type PaginationInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/**
 * 托盤實體 - 代表倉庫中的托盤
 * 是庫存管理的基本單位，包含產品、數量和位置資訊
 */
export type Pallet = Node & {
  __typename?: 'Pallet';
  generateTime: Scalars['DateTime']['output'];
  grnRecords?: Maybe<GrnConnection>;
  id: Scalars['ID']['output'];
  inventoryRecords?: Maybe<InventoryConnection>;
  location?: Maybe<Location>;
  movements?: Maybe<MovementConnection>;
  palletNumber: Scalars['String']['output'];
  pdfUrl?: Maybe<Scalars['String']['output']>;
  product: Product;
  productCode: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
  remark?: Maybe<Scalars['String']['output']>;
  series: Scalars['String']['output'];
  status: PalletStatus;
};


/**
 * 托盤實體 - 代表倉庫中的托盤
 * 是庫存管理的基本單位，包含產品、數量和位置資訊
 */
export type PalletGrnRecordsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<SortInput>;
};


/**
 * 托盤實體 - 代表倉庫中的托盤
 * 是庫存管理的基本單位，包含產品、數量和位置資訊
 */
export type PalletInventoryRecordsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<InventoryFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<SortInput>;
};


/**
 * 托盤實體 - 代表倉庫中的托盤
 * 是庫存管理的基本單位，包含產品、數量和位置資訊
 */
export type PalletMovementsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<MovementFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<SortInput>;
};

export type PalletConnection = Connection & {
  __typename?: 'PalletConnection';
  edges: Array<PalletEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type PalletEdge = Edge & {
  __typename?: 'PalletEdge';
  cursor: Scalars['String']['output'];
  node: Pallet;
};

export type PalletFilter = {
  dateRange?: InputMaybe<DateRangeInput>;
  location?: InputMaybe<Scalars['String']['input']>;
  palletNumber?: InputMaybe<Scalars['String']['input']>;
  productCode?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<PalletStatus>;
};

export type PalletResult = Pallet | SystemError | UserError;

export type PalletStatus =
  | 'ACTIVE'
  | 'DAMAGED'
  | 'LOADED'
  | 'VOID'
  | '%future added value';

export type ProcessStocktakeInput = {
  batchId?: InputMaybe<Scalars['String']['input']>;
  countedQty: Scalars['Int']['input'];
  palletNumber?: InputMaybe<Scalars['String']['input']>;
  productCode: Scalars['String']['input'];
  sessionId: Scalars['ID']['input'];
};

/**
 * 產品實體 - 代表系統中的產品資訊
 * 包括產品代碼、描述、颜色、標準數量等
 */
export type Product = Node & {
  __typename?: 'Product';
  code: Scalars['String']['output'];
  colour: Scalars['String']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  inventory?: Maybe<InventoryConnection>;
  movements?: Maybe<MovementConnection>;
  pallets?: Maybe<PalletConnection>;
  remark?: Maybe<Scalars['String']['output']>;
  standardQty: Scalars['Int']['output'];
  type: Scalars['String']['output'];
};


/**
 * 產品實體 - 代表系統中的產品資訊
 * 包括產品代碼、描述、颜色、標準數量等
 */
export type ProductInventoryArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<InventoryFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<SortInput>;
};


/**
 * 產品實體 - 代表系統中的產品資訊
 * 包括產品代碼、描述、颜色、標準數量等
 */
export type ProductMovementsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<MovementFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<SortInput>;
};


/**
 * 產品實體 - 代表系統中的產品資訊
 * 包括產品代碼、描述、颜色、標準數量等
 */
export type ProductPalletsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<PalletFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<SortInput>;
};

export type ProductConnection = Connection & {
  __typename?: 'ProductConnection';
  edges: Array<ProductEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type ProductEdge = Edge & {
  __typename?: 'ProductEdge';
  cursor: Scalars['String']['output'];
  node: Product;
};

export type ProductFilter = {
  code?: InputMaybe<Scalars['String']['input']>;
  colour?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type ProductResult = Product | SystemError | UserError;

export type Query = {
  __typename?: 'Query';
  getActiveTransfers: MovementConnection;
  getLowStockProducts: ProductConnection;
  getPendingOrders: OrderConnection;
  inventories: InventoryConnection;
  inventory?: Maybe<InventoryRecord>;
  movement?: Maybe<Movement>;
  movements: MovementConnection;
  pallet?: Maybe<Pallet>;
  pallets: PalletConnection;
  product?: Maybe<Product>;
  products: ProductConnection;
};


export type QueryGetActiveTransfersArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};


export type QueryGetLowStockProductsArgs = {
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
  threshold?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetPendingOrdersArgs = {
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
  status?: InputMaybe<OrderStatus>;
};


export type QueryInventoriesArgs = {
  filter?: InputMaybe<InventoryFilter>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};


export type QueryInventoryArgs = {
  id: Scalars['ID']['input'];
};


export type QueryMovementArgs = {
  id: Scalars['ID']['input'];
};


export type QueryMovementsArgs = {
  filter?: InputMaybe<MovementFilter>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};


export type QueryPalletArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPalletsArgs = {
  filter?: InputMaybe<PalletFilter>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};


export type QueryProductArgs = {
  id: Scalars['ID']['input'];
};


export type QueryProductsArgs = {
  filter?: InputMaybe<ProductFilter>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type RecordStocktakeInput = {
  batchId?: InputMaybe<Scalars['String']['input']>;
  countedQty: Scalars['Int']['input'];
  palletNumber?: InputMaybe<Scalars['String']['input']>;
  productCode: Scalars['String']['input'];
  sessionId: Scalars['ID']['input'];
};

export type ScanFilter = {
  batchId?: InputMaybe<Scalars['String']['input']>;
  dateRange?: InputMaybe<DateRangeInput>;
  palletNumber?: InputMaybe<Scalars['String']['input']>;
  productCode?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<ScanStatus>;
  userId?: InputMaybe<Scalars['Int']['input']>;
};

export type ScanStatus =
  | 'ERROR'
  | 'PENDING'
  | 'SUCCESS'
  | '%future added value';

export type SortDirection =
  | 'ASC'
  | 'DESC'
  | '%future added value';

export type SortInput = {
  direction: SortDirection;
  field: Scalars['String']['input'];
};

export type StartStocktakeSessionInput = {
  sessionDate?: InputMaybe<Scalars['Date']['input']>;
  userId: Scalars['Int']['input'];
  userName: Scalars['String']['input'];
};

export type StockAdjustmentInput = {
  adjustmentQty: Scalars['Int']['input'];
  location: LocationType;
  operatorId: Scalars['Int']['input'];
  productCode: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};

export type StockTransferInput = {
  fromLocation: LocationType;
  operatorId: Scalars['Int']['input'];
  productCode: Scalars['String']['input'];
  quantity: Scalars['Int']['input'];
  remark?: InputMaybe<Scalars['String']['input']>;
  toLocation: LocationType;
};

export type StocktakeBatchScan = Node & {
  __typename?: 'StocktakeBatchScan';
  batchId: Scalars['String']['output'];
  countedQty: Scalars['Int']['output'];
  errorMessage?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  pallet?: Maybe<Pallet>;
  palletNumber?: Maybe<Scalars['String']['output']>;
  productCode: Scalars['String']['output'];
  productDesc?: Maybe<Scalars['String']['output']>;
  scanTimestamp: Scalars['DateTime']['output'];
  session?: Maybe<StocktakeSession>;
  status: ScanStatus;
  userId?: Maybe<Scalars['Int']['output']>;
  userName?: Maybe<Scalars['String']['output']>;
};

export type StocktakeBatchScanConnection = Connection & {
  __typename?: 'StocktakeBatchScanConnection';
  edges: Array<StocktakeBatchScanEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type StocktakeBatchScanEdge = Edge & {
  __typename?: 'StocktakeBatchScanEdge';
  cursor: Scalars['String']['output'];
  node: StocktakeBatchScan;
};

export type StocktakeConnection = Connection & {
  __typename?: 'StocktakeConnection';
  edges: Array<StocktakeEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type StocktakeEdge = Edge & {
  __typename?: 'StocktakeEdge';
  cursor: Scalars['String']['output'];
  node: StocktakeRecord;
};

export type StocktakeFilter = {
  countedBy?: InputMaybe<Scalars['Int']['input']>;
  productCode?: InputMaybe<Scalars['String']['input']>;
  sessionDate?: InputMaybe<DateRangeInput>;
  status?: InputMaybe<StocktakeSessionStatus>;
};

export type StocktakeRecord = Node & {
  __typename?: 'StocktakeRecord';
  countedBy?: Maybe<User>;
  countedName?: Maybe<Scalars['String']['output']>;
  countedQty: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  palletNumber?: Maybe<Scalars['String']['output']>;
  productCode: Scalars['String']['output'];
  productDesc: Scalars['String']['output'];
  remainQty?: Maybe<Scalars['Int']['output']>;
  variance: Scalars['Int']['output'];
  variancePercentage: Scalars['Float']['output'];
};

export type StocktakeResult = StocktakeRecord | SystemError | UserError;

export type StocktakeSession = Node & {
  __typename?: 'StocktakeSession';
  endTime?: Maybe<Scalars['DateTime']['output']>;
  errorScans: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  scans?: Maybe<StocktakeBatchScanConnection>;
  sessionDate: Scalars['Date']['output'];
  sessionStatus: StocktakeSessionStatus;
  startTime: Scalars['DateTime']['output'];
  successScans: Scalars['Int']['output'];
  totalScans: Scalars['Int']['output'];
  user?: Maybe<User>;
  userId?: Maybe<Scalars['Int']['output']>;
  userName?: Maybe<Scalars['String']['output']>;
};


export type StocktakeSessionScansArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ScanFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<SortInput>;
};

export type StocktakeSessionConnection = Connection & {
  __typename?: 'StocktakeSessionConnection';
  edges: Array<StocktakeSessionEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type StocktakeSessionEdge = Edge & {
  __typename?: 'StocktakeSessionEdge';
  cursor: Scalars['String']['output'];
  node: StocktakeSession;
};

export type StocktakeSessionResult = StocktakeSession | SystemError | UserError;

export type StocktakeSessionStatus =
  | 'ACTIVE'
  | 'CANCELLED'
  | 'COMPLETED'
  | '%future added value';

/** Subscription operations - provides real-time data update functionality using WebSocket connections */
export type Subscription = {
  __typename?: 'Subscription';
  inventoryUpdated: InventoryRecord;
  lowStockAlert: Product;
  orderStatusChanged: Order;
  palletMoved: Movement;
  systemAlert: SystemAlert;
};


/** Subscription operations - provides real-time data update functionality using WebSocket connections */
export type SubscriptionInventoryUpdatedArgs = {
  locationId?: InputMaybe<Scalars['ID']['input']>;
};


/** Subscription operations - provides real-time data update functionality using WebSocket connections */
export type SubscriptionLowStockAlertArgs = {
  threshold?: InputMaybe<Scalars['Int']['input']>;
};


/** Subscription operations - provides real-time data update functionality using WebSocket connections */
export type SubscriptionOrderStatusChangedArgs = {
  orderId?: InputMaybe<Scalars['ID']['input']>;
};


/** Subscription operations - provides real-time data update functionality using WebSocket connections */
export type SubscriptionPalletMovedArgs = {
  warehouseId?: InputMaybe<Scalars['ID']['input']>;
};

export type SubscriptionExtensions = {
  __typename?: 'SubscriptionExtensions';
  inventoryUpdated: InventoryRecord;
  lowStockAlert: LowStockAlert;
  orderCompleted: Order;
  orderStatusChanged: Order;
  palletMoved: Movement;
  palletStatusChanged: Pallet;
  stockLevelChanged: InventoryRecord;
  stocktakeCountRecorded: StocktakeRecord;
  stocktakeSessionStatusChanged: StocktakeSession;
  systemAlert: SystemAlert;
};


export type SubscriptionExtensionsInventoryUpdatedArgs = {
  productCode?: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionExtensionsOrderStatusChangedArgs = {
  orderRef?: InputMaybe<Scalars['Int']['input']>;
};


export type SubscriptionExtensionsPalletStatusChangedArgs = {
  palletNumber?: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionExtensionsStocktakeCountRecordedArgs = {
  sessionId?: InputMaybe<Scalars['ID']['input']>;
};

export type Supplier = Node & {
  __typename?: 'Supplier';
  grnRecords?: Maybe<GrnConnection>;
  id: Scalars['ID']['output'];
  supplierCode: Scalars['String']['output'];
  supplierName: Scalars['String']['output'];
};


export type SupplierGrnRecordsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<GrnFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<SortInput>;
};

export type SystemAlert = {
  __typename?: 'SystemAlert';
  id: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  severity: AlertSeverity;
  timestamp: Scalars['DateTime']['output'];
  type: AlertType;
};

export type SystemError = BaseError & {
  __typename?: 'SystemError';
  code: Scalars['String']['output'];
  details?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
};

export type TransferResult = SystemError | TransferSuccess | UserError;

export type TransferStockInput = {
  fromLocation: LocationType;
  operatorId: Scalars['Int']['input'];
  productCode: Scalars['String']['input'];
  quantity: Scalars['Int']['input'];
  remark?: InputMaybe<Scalars['String']['input']>;
  toLocation: LocationType;
};

export type TransferSuccess = {
  __typename?: 'TransferSuccess';
  message: Scalars['String']['output'];
  transferId: Scalars['ID']['output'];
};

export type UnloadPalletInput = {
  operatorId: Scalars['Int']['input'];
  orderRef: Scalars['Int']['input'];
  palletNumber: Scalars['String']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateGrnInput = {
  grossWeight?: InputMaybe<Scalars['Int']['input']>;
  netWeight?: InputMaybe<Scalars['Int']['input']>;
  packageCount?: InputMaybe<Scalars['Float']['input']>;
  packageType?: InputMaybe<Scalars['String']['input']>;
  palletCount?: InputMaybe<Scalars['Float']['input']>;
  palletType?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateInventoryInput = {
  await?: InputMaybe<Scalars['Int']['input']>;
  awaitGrn?: InputMaybe<Scalars['Int']['input']>;
  backcarpark?: InputMaybe<Scalars['Int']['input']>;
  bulk?: InputMaybe<Scalars['Int']['input']>;
  damage?: InputMaybe<Scalars['Int']['input']>;
  fold?: InputMaybe<Scalars['Int']['input']>;
  injection?: InputMaybe<Scalars['Int']['input']>;
  palletNumber: Scalars['String']['input'];
  pipeline?: InputMaybe<Scalars['Int']['input']>;
  prebook?: InputMaybe<Scalars['Int']['input']>;
  productCode: Scalars['String']['input'];
};

export type UpdateOrderInput = {
  remainQty?: InputMaybe<Scalars['Int']['input']>;
  requiredQty?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdatePalletInput = {
  productCode?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
  remark?: InputMaybe<Scalars['String']['input']>;
  series?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<PalletStatus>;
};

export type UpdateProductInput = {
  colour?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  remark?: InputMaybe<Scalars['String']['input']>;
  standardQty?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type User = Node & {
  __typename?: 'User';
  department: Scalars['String']['output'];
  email?: Maybe<Scalars['String']['output']>;
  iconUrl?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  movements?: Maybe<MovementConnection>;
  name: Scalars['String']['output'];
  position: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
  workLevel?: Maybe<WorkLevel>;
};


export type UserMovementsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<MovementFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<SortInput>;
};

export type UserConnection = Connection & {
  __typename?: 'UserConnection';
  edges: Array<UserEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type UserEdge = Edge & {
  __typename?: 'UserEdge';
  cursor: Scalars['String']['output'];
  node: User;
};

export type UserError = BaseError & {
  __typename?: 'UserError';
  code: Scalars['String']['output'];
  field?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
};

export type UserFilter = {
  department?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type UserResult = SystemError | User | UserError;

export type VoidResult = SystemError | UserError | VoidSuccess;

export type VoidSuccess = {
  __typename?: 'VoidSuccess';
  message: Scalars['String']['output'];
  palletNumber: Scalars['String']['output'];
};

export type WorkLevel = Node & {
  __typename?: 'WorkLevel';
  grnCount: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  latestUpdate: Scalars['DateTime']['output'];
  loadingCount: Scalars['Int']['output'];
  moveCount: Scalars['Int']['output'];
  operatorId: Scalars['Int']['output'];
  qcCount: Scalars['Int']['output'];
  user: User;
};
