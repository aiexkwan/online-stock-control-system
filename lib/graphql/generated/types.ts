import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
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
  BigFloat: { input: number; output: number; }
  BigInt: { input: number; output: number; }
  Cursor: { input: string; output: string; }
  Date: { input: string; output: string; }
  Datetime: { input: string; output: string; }
  JSON: { input: Record<string, unknown>; output: Record<string, unknown>; }
  Opaque: { input: unknown; output: unknown; }
  Time: { input: string; output: string; }
  UUID: { input: string; output: string; }
};

export type Api = Node & {
  description?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  uuid: Scalars['UUID']['output'];
  value: Scalars['String']['output'];
};

export type ApiConnection = {
  edges: Array<ApiEdge>;
  pageInfo: PageInfo;
};

export type ApiDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Api>;
};

export type ApiEdge = {
  cursor: Scalars['String']['output'];
  node: Api;
};

export type ApiFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<ApiFilter>>;
  description?: InputMaybe<StringFilter>;
  name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<ApiFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<ApiFilter>>;
  uuid?: InputMaybe<UuidFilter>;
  value?: InputMaybe<StringFilter>;
};

export type ApiInsertInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type ApiInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Api>;
};

export type ApiOrderBy = {
  description?: InputMaybe<OrderByDirection>;
  name?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
  value?: InputMaybe<OrderByDirection>;
};

export type ApiUpdateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type ApiUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Api>;
};

/** Boolean expression comparing fields on type "BigFloat" */
export type BigFloatFilter = {
  eq?: InputMaybe<Scalars['BigFloat']['input']>;
  gt?: InputMaybe<Scalars['BigFloat']['input']>;
  gte?: InputMaybe<Scalars['BigFloat']['input']>;
  in?: InputMaybe<Array<Scalars['BigFloat']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['BigFloat']['input']>;
  lte?: InputMaybe<Scalars['BigFloat']['input']>;
  neq?: InputMaybe<Scalars['BigFloat']['input']>;
};

/** Boolean expression comparing fields on type "BigFloatList" */
export type BigFloatListFilter = {
  containedBy?: InputMaybe<Array<Scalars['BigFloat']['input']>>;
  contains?: InputMaybe<Array<Scalars['BigFloat']['input']>>;
  eq?: InputMaybe<Array<Scalars['BigFloat']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['BigFloat']['input']>>;
};

/** Boolean expression comparing fields on type "BigInt" */
export type BigIntFilter = {
  eq?: InputMaybe<Scalars['BigInt']['input']>;
  gt?: InputMaybe<Scalars['BigInt']['input']>;
  gte?: InputMaybe<Scalars['BigInt']['input']>;
  in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['BigInt']['input']>;
  lte?: InputMaybe<Scalars['BigInt']['input']>;
  neq?: InputMaybe<Scalars['BigInt']['input']>;
};

/** Boolean expression comparing fields on type "BigIntList" */
export type BigIntListFilter = {
  containedBy?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  contains?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  eq?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['BigInt']['input']>>;
};

/** Boolean expression comparing fields on type "Boolean" */
export type BooleanFilter = {
  eq?: InputMaybe<Scalars['Boolean']['input']>;
  is?: InputMaybe<FilterIs>;
};

/** Boolean expression comparing fields on type "BooleanList" */
export type BooleanListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  contains?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  eq?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Boolean']['input']>>;
};

/** Boolean expression comparing fields on type "Date" */
export type DateFilter = {
  eq?: InputMaybe<Scalars['Date']['input']>;
  gt?: InputMaybe<Scalars['Date']['input']>;
  gte?: InputMaybe<Scalars['Date']['input']>;
  in?: InputMaybe<Array<Scalars['Date']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['Date']['input']>;
  lte?: InputMaybe<Scalars['Date']['input']>;
  neq?: InputMaybe<Scalars['Date']['input']>;
};

/** Boolean expression comparing fields on type "DateList" */
export type DateListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Date']['input']>>;
  contains?: InputMaybe<Array<Scalars['Date']['input']>>;
  eq?: InputMaybe<Array<Scalars['Date']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Date']['input']>>;
};

/** Boolean expression comparing fields on type "Datetime" */
export type DatetimeFilter = {
  eq?: InputMaybe<Scalars['Datetime']['input']>;
  gt?: InputMaybe<Scalars['Datetime']['input']>;
  gte?: InputMaybe<Scalars['Datetime']['input']>;
  in?: InputMaybe<Array<Scalars['Datetime']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['Datetime']['input']>;
  lte?: InputMaybe<Scalars['Datetime']['input']>;
  neq?: InputMaybe<Scalars['Datetime']['input']>;
};

/** Boolean expression comparing fields on type "DatetimeList" */
export type DatetimeListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Datetime']['input']>>;
  contains?: InputMaybe<Array<Scalars['Datetime']['input']>>;
  eq?: InputMaybe<Array<Scalars['Datetime']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Datetime']['input']>>;
};

export type FilterIs =
  | 'NOT_NULL'
  | 'NULL'
  | '%future added value';

/** Boolean expression comparing fields on type "Float" */
export type FloatFilter = {
  eq?: InputMaybe<Scalars['Float']['input']>;
  gt?: InputMaybe<Scalars['Float']['input']>;
  gte?: InputMaybe<Scalars['Float']['input']>;
  in?: InputMaybe<Array<Scalars['Float']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['Float']['input']>;
  lte?: InputMaybe<Scalars['Float']['input']>;
  neq?: InputMaybe<Scalars['Float']['input']>;
};

/** Boolean expression comparing fields on type "FloatList" */
export type FloatListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Float']['input']>>;
  contains?: InputMaybe<Array<Scalars['Float']['input']>>;
  eq?: InputMaybe<Array<Scalars['Float']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Float']['input']>>;
};

/** Boolean expression comparing fields on type "ID" */
export type IdFilter = {
  eq?: InputMaybe<Scalars['ID']['input']>;
};

/** Boolean expression comparing fields on type "Int" */
export type IntFilter = {
  eq?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  in?: InputMaybe<Array<Scalars['Int']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  neq?: InputMaybe<Scalars['Int']['input']>;
};

/** Boolean expression comparing fields on type "IntList" */
export type IntListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Int']['input']>>;
  contains?: InputMaybe<Array<Scalars['Int']['input']>>;
  eq?: InputMaybe<Array<Scalars['Int']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Int']['input']>>;
};

/** The root type for creating and mutating data */
export type Mutation = {
  api_cleanup_pallet_buffer?: Maybe<Scalars['JSON']['output']>;
  auto_cleanup_pallet_buffer?: Maybe<Scalars['Opaque']['output']>;
  check_aco_order_completion?: Maybe<Scalars['JSON']['output']>;
  check_pallet_buffer_health?: Maybe<Scalars['JSON']['output']>;
  cleanup_grn_records?: Maybe<Scalars['JSON']['output']>;
  complete_transaction?: Maybe<Scalars['Opaque']['output']>;
  confirm_pallet_usage?: Maybe<Scalars['Boolean']['output']>;
  /** Deletes zero or more records from the `API` collection */
  deleteFromAPICollection: ApiDeleteResponse;
  /** Deletes zero or more records from the `data_code` collection */
  deleteFromdata_codeCollection: Data_CodeDeleteResponse;
  /** Deletes zero or more records from the `data_id` collection */
  deleteFromdata_idCollection: Data_IdDeleteResponse;
  /** Deletes zero or more records from the `data_order` collection */
  deleteFromdata_orderCollection: Data_OrderDeleteResponse;
  /** Deletes zero or more records from the `data_slateinfo` collection */
  deleteFromdata_slateinfoCollection: Data_SlateinfoDeleteResponse;
  /** Deletes zero or more records from the `data_supplier` collection */
  deleteFromdata_supplierCollection: Data_SupplierDeleteResponse;
  /** Deletes zero or more records from the `debug_log` collection */
  deleteFromdebug_logCollection: Debug_LogDeleteResponse;
  /** Deletes zero or more records from the `doc_upload` collection */
  deleteFromdoc_uploadCollection: Doc_UploadDeleteResponse;
  /** Deletes zero or more records from the `feature_flags` collection */
  deleteFromfeature_flagsCollection: Feature_FlagsDeleteResponse;
  /** Deletes zero or more records from the `feature_flags_audit` collection */
  deleteFromfeature_flags_auditCollection: Feature_Flags_AuditDeleteResponse;
  /** Deletes zero or more records from the `feature_flags_stats` collection */
  deleteFromfeature_flags_statsCollection: Feature_Flags_StatsDeleteResponse;
  /** Deletes zero or more records from the `grn_level` collection */
  deleteFromgrn_levelCollection: Grn_LevelDeleteResponse;
  /** Deletes zero or more records from the `mv_refresh_tracking` collection */
  deleteFrommv_refresh_trackingCollection: Mv_Refresh_TrackingDeleteResponse;
  /** Deletes zero or more records from the `order_loading_history` collection */
  deleteFromorder_loading_historyCollection: Order_Loading_HistoryDeleteResponse;
  /** Deletes zero or more records from the `pallet_number_buffer` collection */
  deleteFrompallet_number_bufferCollection: Pallet_Number_BufferDeleteResponse;
  /** Deletes zero or more records from the `print_history` collection */
  deleteFromprint_historyCollection: Print_HistoryDeleteResponse;
  /** Deletes zero or more records from the `query_record` collection */
  deleteFromquery_recordCollection: Query_RecordDeleteResponse;
  /** Deletes zero or more records from the `record_aco` collection */
  deleteFromrecord_acoCollection: Record_AcoDeleteResponse;
  /** Deletes zero or more records from the `record_aco_detail` collection */
  deleteFromrecord_aco_detailCollection: Record_Aco_DetailDeleteResponse;
  /** Deletes zero or more records from the `record_grn` collection */
  deleteFromrecord_grnCollection: Record_GrnDeleteResponse;
  /** Deletes zero or more records from the `record_history` collection */
  deleteFromrecord_historyCollection: Record_HistoryDeleteResponse;
  /** Deletes zero or more records from the `record_inventory` collection */
  deleteFromrecord_inventoryCollection: Record_InventoryDeleteResponse;
  /** Deletes zero or more records from the `record_palletinfo` collection */
  deleteFromrecord_palletinfoCollection: Record_PalletinfoDeleteResponse;
  /** Deletes zero or more records from the `record_slate` collection */
  deleteFromrecord_slateCollection: Record_SlateDeleteResponse;
  /** Deletes zero or more records from the `record_stocktake` collection */
  deleteFromrecord_stocktakeCollection: Record_StocktakeDeleteResponse;
  /** Deletes zero or more records from the `record_transfer` collection */
  deleteFromrecord_transferCollection: Record_TransferDeleteResponse;
  /** Deletes zero or more records from the `report_log` collection */
  deleteFromreport_logCollection: Report_LogDeleteResponse;
  /** Deletes zero or more records from the `report_void` collection */
  deleteFromreport_voidCollection: Report_VoidDeleteResponse;
  /** Deletes zero or more records from the `stock_level` collection */
  deleteFromstock_levelCollection: Stock_LevelDeleteResponse;
  /** Deletes zero or more records from the `stocktake_batch_scan` collection */
  deleteFromstocktake_batch_scanCollection: Stocktake_Batch_ScanDeleteResponse;
  /** Deletes zero or more records from the `stocktake_batch_summary` collection */
  deleteFromstocktake_batch_summaryCollection: Stocktake_Batch_SummaryDeleteResponse;
  /** Deletes zero or more records from the `stocktake_daily_summary` collection */
  deleteFromstocktake_daily_summaryCollection: Stocktake_Daily_SummaryDeleteResponse;
  /** Deletes zero or more records from the `stocktake_report_cache` collection */
  deleteFromstocktake_report_cacheCollection: Stocktake_Report_CacheDeleteResponse;
  /** Deletes zero or more records from the `stocktake_session` collection */
  deleteFromstocktake_sessionCollection: Stocktake_SessionDeleteResponse;
  /** Deletes zero or more records from the `stocktake_validation_rules` collection */
  deleteFromstocktake_validation_rulesCollection: Stocktake_Validation_RulesDeleteResponse;
  /** Deletes zero or more records from the `stocktake_variance_analysis` collection */
  deleteFromstocktake_variance_analysisCollection: Stocktake_Variance_AnalysisDeleteResponse;
  /** Deletes zero or more records from the `stocktake_variance_report` collection */
  deleteFromstocktake_variance_reportCollection: Stocktake_Variance_ReportDeleteResponse;
  /** Deletes zero or more records from the `transaction_log` collection */
  deleteFromtransaction_logCollection: Transaction_LogDeleteResponse;
  /** Deletes zero or more records from the `user_navigation_history` collection */
  deleteFromuser_navigation_historyCollection: User_Navigation_HistoryDeleteResponse;
  /** Deletes zero or more records from the `user_navigation_patterns` collection */
  deleteFromuser_navigation_patternsCollection: User_Navigation_PatternsDeleteResponse;
  /** Deletes zero or more records from the `user_navigation_stats` collection */
  deleteFromuser_navigation_statsCollection: User_Navigation_StatsDeleteResponse;
  /** Deletes zero or more records from the `work_level` collection */
  deleteFromwork_levelCollection: Work_LevelDeleteResponse;
  execute_sql_query?: Maybe<Scalars['JSON']['output']>;
  execute_stock_transfer?: Maybe<Scalars['JSON']['output']>;
  force_sync_pallet_mv?: Maybe<Scalars['String']['output']>;
  get_aco_order_details?: Maybe<Scalars['JSON']['output']>;
  get_rollback_status?: Maybe<Scalars['JSON']['output']>;
  handle_print_label_updates?: Maybe<Scalars['JSON']['output']>;
  increment_navigation_stats?: Maybe<Scalars['Opaque']['output']>;
  /** Adds one or more `API` records to the collection */
  insertIntoAPICollection?: Maybe<ApiInsertResponse>;
  /** Adds one or more `data_code` records to the collection */
  insertIntodata_codeCollection?: Maybe<Data_CodeInsertResponse>;
  /** Adds one or more `data_id` records to the collection */
  insertIntodata_idCollection?: Maybe<Data_IdInsertResponse>;
  /** Adds one or more `data_order` records to the collection */
  insertIntodata_orderCollection?: Maybe<Data_OrderInsertResponse>;
  /** Adds one or more `data_slateinfo` records to the collection */
  insertIntodata_slateinfoCollection?: Maybe<Data_SlateinfoInsertResponse>;
  /** Adds one or more `data_supplier` records to the collection */
  insertIntodata_supplierCollection?: Maybe<Data_SupplierInsertResponse>;
  /** Adds one or more `debug_log` records to the collection */
  insertIntodebug_logCollection?: Maybe<Debug_LogInsertResponse>;
  /** Adds one or more `doc_upload` records to the collection */
  insertIntodoc_uploadCollection?: Maybe<Doc_UploadInsertResponse>;
  /** Adds one or more `feature_flags` records to the collection */
  insertIntofeature_flagsCollection?: Maybe<Feature_FlagsInsertResponse>;
  /** Adds one or more `feature_flags_audit` records to the collection */
  insertIntofeature_flags_auditCollection?: Maybe<Feature_Flags_AuditInsertResponse>;
  /** Adds one or more `feature_flags_stats` records to the collection */
  insertIntofeature_flags_statsCollection?: Maybe<Feature_Flags_StatsInsertResponse>;
  /** Adds one or more `grn_level` records to the collection */
  insertIntogrn_levelCollection?: Maybe<Grn_LevelInsertResponse>;
  /** Adds one or more `mv_refresh_tracking` records to the collection */
  insertIntomv_refresh_trackingCollection?: Maybe<Mv_Refresh_TrackingInsertResponse>;
  /** Adds one or more `order_loading_history` records to the collection */
  insertIntoorder_loading_historyCollection?: Maybe<Order_Loading_HistoryInsertResponse>;
  /** Adds one or more `pallet_number_buffer` records to the collection */
  insertIntopallet_number_bufferCollection?: Maybe<Pallet_Number_BufferInsertResponse>;
  /** Adds one or more `print_history` records to the collection */
  insertIntoprint_historyCollection?: Maybe<Print_HistoryInsertResponse>;
  /** Adds one or more `query_record` records to the collection */
  insertIntoquery_recordCollection?: Maybe<Query_RecordInsertResponse>;
  /** Adds one or more `record_aco` records to the collection */
  insertIntorecord_acoCollection?: Maybe<Record_AcoInsertResponse>;
  /** Adds one or more `record_aco_detail` records to the collection */
  insertIntorecord_aco_detailCollection?: Maybe<Record_Aco_DetailInsertResponse>;
  /** Adds one or more `record_grn` records to the collection */
  insertIntorecord_grnCollection?: Maybe<Record_GrnInsertResponse>;
  /** Adds one or more `record_history` records to the collection */
  insertIntorecord_historyCollection?: Maybe<Record_HistoryInsertResponse>;
  /** Adds one or more `record_inventory` records to the collection */
  insertIntorecord_inventoryCollection?: Maybe<Record_InventoryInsertResponse>;
  /** Adds one or more `record_palletinfo` records to the collection */
  insertIntorecord_palletinfoCollection?: Maybe<Record_PalletinfoInsertResponse>;
  /** Adds one or more `record_slate` records to the collection */
  insertIntorecord_slateCollection?: Maybe<Record_SlateInsertResponse>;
  /** Adds one or more `record_stocktake` records to the collection */
  insertIntorecord_stocktakeCollection?: Maybe<Record_StocktakeInsertResponse>;
  /** Adds one or more `record_transfer` records to the collection */
  insertIntorecord_transferCollection?: Maybe<Record_TransferInsertResponse>;
  /** Adds one or more `report_log` records to the collection */
  insertIntoreport_logCollection?: Maybe<Report_LogInsertResponse>;
  /** Adds one or more `report_void` records to the collection */
  insertIntoreport_voidCollection?: Maybe<Report_VoidInsertResponse>;
  /** Adds one or more `stock_level` records to the collection */
  insertIntostock_levelCollection?: Maybe<Stock_LevelInsertResponse>;
  /** Adds one or more `stocktake_batch_scan` records to the collection */
  insertIntostocktake_batch_scanCollection?: Maybe<Stocktake_Batch_ScanInsertResponse>;
  /** Adds one or more `stocktake_batch_summary` records to the collection */
  insertIntostocktake_batch_summaryCollection?: Maybe<Stocktake_Batch_SummaryInsertResponse>;
  /** Adds one or more `stocktake_daily_summary` records to the collection */
  insertIntostocktake_daily_summaryCollection?: Maybe<Stocktake_Daily_SummaryInsertResponse>;
  /** Adds one or more `stocktake_report_cache` records to the collection */
  insertIntostocktake_report_cacheCollection?: Maybe<Stocktake_Report_CacheInsertResponse>;
  /** Adds one or more `stocktake_session` records to the collection */
  insertIntostocktake_sessionCollection?: Maybe<Stocktake_SessionInsertResponse>;
  /** Adds one or more `stocktake_validation_rules` records to the collection */
  insertIntostocktake_validation_rulesCollection?: Maybe<Stocktake_Validation_RulesInsertResponse>;
  /** Adds one or more `stocktake_variance_analysis` records to the collection */
  insertIntostocktake_variance_analysisCollection?: Maybe<Stocktake_Variance_AnalysisInsertResponse>;
  /** Adds one or more `stocktake_variance_report` records to the collection */
  insertIntostocktake_variance_reportCollection?: Maybe<Stocktake_Variance_ReportInsertResponse>;
  /** Adds one or more `transaction_log` records to the collection */
  insertIntotransaction_logCollection?: Maybe<Transaction_LogInsertResponse>;
  /** Adds one or more `user_navigation_history` records to the collection */
  insertIntouser_navigation_historyCollection?: Maybe<User_Navigation_HistoryInsertResponse>;
  /** Adds one or more `user_navigation_patterns` records to the collection */
  insertIntouser_navigation_patternsCollection?: Maybe<User_Navigation_PatternsInsertResponse>;
  /** Adds one or more `user_navigation_stats` records to the collection */
  insertIntouser_navigation_statsCollection?: Maybe<User_Navigation_StatsInsertResponse>;
  /** Adds one or more `work_level` records to the collection */
  insertIntowork_levelCollection?: Maybe<Work_LevelInsertResponse>;
  log_feature_flag_evaluation?: Maybe<Scalars['Opaque']['output']>;
  process_grn_label_unified?: Maybe<Scalars['JSON']['output']>;
  process_grn_label_with_transaction?: Maybe<Scalars['JSON']['output']>;
  process_qc_label_unified?: Maybe<Scalars['JSON']['output']>;
  record_transaction_error?: Maybe<Scalars['UUID']['output']>;
  record_transaction_step?: Maybe<Scalars['Opaque']['output']>;
  refresh_pallet_location_mv?: Maybe<Scalars['Opaque']['output']>;
  release_pallet_reservation?: Maybe<Scalars['Boolean']['output']>;
  reset_daily_pallet_buffer?: Maybe<Scalars['Opaque']['output']>;
  rollback_transaction?: Maybe<Scalars['JSON']['output']>;
  rpc_create_supplier?: Maybe<Scalars['JSON']['output']>;
  rpc_get_aco_incomplete_orders_dashboard?: Maybe<Scalars['JSON']['output']>;
  rpc_get_aco_order_refs?: Maybe<Scalars['JSON']['output']>;
  rpc_get_aco_order_report?: Maybe<Scalars['JSON']['output']>;
  rpc_get_await_location_count?: Maybe<Scalars['JSON']['output']>;
  rpc_get_await_location_count_by_timeframe?: Maybe<Scalars['JSON']['output']>;
  rpc_get_await_percentage_stats?: Maybe<Scalars['JSON']['output']>;
  rpc_get_grn_material_codes?: Maybe<Scalars['JSON']['output']>;
  rpc_get_grn_references?: Maybe<Scalars['JSON']['output']>;
  rpc_get_grn_report_data?: Maybe<Scalars['JSON']['output']>;
  rpc_get_history_tree?: Maybe<Scalars['JSON']['output']>;
  rpc_get_inventory_ordered_analysis?: Maybe<Scalars['JSON']['output']>;
  rpc_get_order_state_list?: Maybe<Scalars['JSON']['output']>;
  rpc_get_other_files_list?: Maybe<Scalars['JSON']['output']>;
  rpc_get_production_stats?: Maybe<Scalars['Int']['output']>;
  rpc_get_report_references?: Maybe<Scalars['JSON']['output']>;
  rpc_get_stock_distribution?: Maybe<Scalars['JSON']['output']>;
  rpc_get_stock_types?: Maybe<Scalars['JSON']['output']>;
  rpc_get_user_id_by_email?: Maybe<Scalars['Int']['output']>;
  rpc_get_warehouse_work_level?: Maybe<Scalars['JSON']['output']>;
  rpc_load_pallet_to_order?: Maybe<Scalars['JSON']['output']>;
  rpc_search_inventory_with_chart?: Maybe<Scalars['JSON']['output']>;
  rpc_search_supplier?: Maybe<Scalars['JSON']['output']>;
  rpc_transfer_pallet?: Maybe<Scalars['JSON']['output']>;
  rpc_undo_load_pallet?: Maybe<Scalars['JSON']['output']>;
  rpc_update_supplier?: Maybe<Scalars['JSON']['output']>;
  search_pallet_info?: Maybe<Scalars['JSON']['output']>;
  search_product_code?: Maybe<Scalars['JSON']['output']>;
  search_supplier_code?: Maybe<Scalars['JSON']['output']>;
  smart_refresh_mv?: Maybe<Scalars['Opaque']['output']>;
  smart_reset_pallet_buffer?: Maybe<Scalars['JSON']['output']>;
  start_transaction?: Maybe<Scalars['UUID']['output']>;
  track_navigation_transition?: Maybe<Scalars['Opaque']['output']>;
  /** Updates zero or more records in the `API` collection */
  updateAPICollection: ApiUpdateResponse;
  update_aco_order_with_completion_check?: Maybe<Scalars['JSON']['output']>;
  update_stock_level?: Maybe<Scalars['Boolean']['output']>;
  update_stock_level_void?: Maybe<Scalars['String']['output']>;
  update_work_level_move?: Maybe<Scalars['String']['output']>;
  update_work_level_qc?: Maybe<Scalars['JSON']['output']>;
  /** Updates zero or more records in the `data_code` collection */
  updatedata_codeCollection: Data_CodeUpdateResponse;
  /** Updates zero or more records in the `data_id` collection */
  updatedata_idCollection: Data_IdUpdateResponse;
  /** Updates zero or more records in the `data_order` collection */
  updatedata_orderCollection: Data_OrderUpdateResponse;
  /** Updates zero or more records in the `data_slateinfo` collection */
  updatedata_slateinfoCollection: Data_SlateinfoUpdateResponse;
  /** Updates zero or more records in the `data_supplier` collection */
  updatedata_supplierCollection: Data_SupplierUpdateResponse;
  /** Updates zero or more records in the `debug_log` collection */
  updatedebug_logCollection: Debug_LogUpdateResponse;
  /** Updates zero or more records in the `doc_upload` collection */
  updatedoc_uploadCollection: Doc_UploadUpdateResponse;
  /** Updates zero or more records in the `feature_flags` collection */
  updatefeature_flagsCollection: Feature_FlagsUpdateResponse;
  /** Updates zero or more records in the `feature_flags_audit` collection */
  updatefeature_flags_auditCollection: Feature_Flags_AuditUpdateResponse;
  /** Updates zero or more records in the `feature_flags_stats` collection */
  updatefeature_flags_statsCollection: Feature_Flags_StatsUpdateResponse;
  /** Updates zero or more records in the `grn_level` collection */
  updategrn_levelCollection: Grn_LevelUpdateResponse;
  /** Updates zero or more records in the `mv_refresh_tracking` collection */
  updatemv_refresh_trackingCollection: Mv_Refresh_TrackingUpdateResponse;
  /** Updates zero or more records in the `order_loading_history` collection */
  updateorder_loading_historyCollection: Order_Loading_HistoryUpdateResponse;
  /** Updates zero or more records in the `pallet_number_buffer` collection */
  updatepallet_number_bufferCollection: Pallet_Number_BufferUpdateResponse;
  /** Updates zero or more records in the `print_history` collection */
  updateprint_historyCollection: Print_HistoryUpdateResponse;
  /** Updates zero or more records in the `query_record` collection */
  updatequery_recordCollection: Query_RecordUpdateResponse;
  /** Updates zero or more records in the `record_aco` collection */
  updaterecord_acoCollection: Record_AcoUpdateResponse;
  /** Updates zero or more records in the `record_aco_detail` collection */
  updaterecord_aco_detailCollection: Record_Aco_DetailUpdateResponse;
  /** Updates zero or more records in the `record_grn` collection */
  updaterecord_grnCollection: Record_GrnUpdateResponse;
  /** Updates zero or more records in the `record_history` collection */
  updaterecord_historyCollection: Record_HistoryUpdateResponse;
  /** Updates zero or more records in the `record_inventory` collection */
  updaterecord_inventoryCollection: Record_InventoryUpdateResponse;
  /** Updates zero or more records in the `record_palletinfo` collection */
  updaterecord_palletinfoCollection: Record_PalletinfoUpdateResponse;
  /** Updates zero or more records in the `record_slate` collection */
  updaterecord_slateCollection: Record_SlateUpdateResponse;
  /** Updates zero or more records in the `record_stocktake` collection */
  updaterecord_stocktakeCollection: Record_StocktakeUpdateResponse;
  /** Updates zero or more records in the `record_transfer` collection */
  updaterecord_transferCollection: Record_TransferUpdateResponse;
  /** Updates zero or more records in the `report_log` collection */
  updatereport_logCollection: Report_LogUpdateResponse;
  /** Updates zero or more records in the `report_void` collection */
  updatereport_voidCollection: Report_VoidUpdateResponse;
  /** Updates zero or more records in the `stock_level` collection */
  updatestock_levelCollection: Stock_LevelUpdateResponse;
  /** Updates zero or more records in the `stocktake_batch_scan` collection */
  updatestocktake_batch_scanCollection: Stocktake_Batch_ScanUpdateResponse;
  /** Updates zero or more records in the `stocktake_batch_summary` collection */
  updatestocktake_batch_summaryCollection: Stocktake_Batch_SummaryUpdateResponse;
  /** Updates zero or more records in the `stocktake_daily_summary` collection */
  updatestocktake_daily_summaryCollection: Stocktake_Daily_SummaryUpdateResponse;
  /** Updates zero or more records in the `stocktake_report_cache` collection */
  updatestocktake_report_cacheCollection: Stocktake_Report_CacheUpdateResponse;
  /** Updates zero or more records in the `stocktake_session` collection */
  updatestocktake_sessionCollection: Stocktake_SessionUpdateResponse;
  /** Updates zero or more records in the `stocktake_validation_rules` collection */
  updatestocktake_validation_rulesCollection: Stocktake_Validation_RulesUpdateResponse;
  /** Updates zero or more records in the `stocktake_variance_analysis` collection */
  updatestocktake_variance_analysisCollection: Stocktake_Variance_AnalysisUpdateResponse;
  /** Updates zero or more records in the `stocktake_variance_report` collection */
  updatestocktake_variance_reportCollection: Stocktake_Variance_ReportUpdateResponse;
  /** Updates zero or more records in the `transaction_log` collection */
  updatetransaction_logCollection: Transaction_LogUpdateResponse;
  /** Updates zero or more records in the `user_navigation_history` collection */
  updateuser_navigation_historyCollection: User_Navigation_HistoryUpdateResponse;
  /** Updates zero or more records in the `user_navigation_patterns` collection */
  updateuser_navigation_patternsCollection: User_Navigation_PatternsUpdateResponse;
  /** Updates zero or more records in the `user_navigation_stats` collection */
  updateuser_navigation_statsCollection: User_Navigation_StatsUpdateResponse;
  /** Updates zero or more records in the `work_level` collection */
  updatework_levelCollection: Work_LevelUpdateResponse;
  validate_stocktake_count?: Maybe<Scalars['JSON']['output']>;
};


/** The root type for creating and mutating data */
export type MutationCheck_Aco_Order_CompletionArgs = {
  p_order_ref: Scalars['Int']['input'];
};


/** The root type for creating and mutating data */
export type MutationCleanup_Grn_RecordsArgs = {
  p_pallet_numbers: Array<InputMaybe<Scalars['String']['input']>>;
};


/** The root type for creating and mutating data */
export type MutationComplete_TransactionArgs = {
  p_affected_records?: InputMaybe<Scalars['JSON']['input']>;
  p_post_state?: InputMaybe<Scalars['JSON']['input']>;
  p_transaction_id: Scalars['UUID']['input'];
};


/** The root type for creating and mutating data */
export type MutationConfirm_Pallet_UsageArgs = {
  p_pallet_numbers: Array<InputMaybe<Scalars['String']['input']>>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromApiCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ApiFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromdata_CodeCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Data_CodeFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromdata_IdCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Data_IdFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromdata_OrderCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Data_OrderFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromdata_SlateinfoCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Data_SlateinfoFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromdata_SupplierCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Data_SupplierFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromdebug_LogCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Debug_LogFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromdoc_UploadCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Doc_UploadFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromfeature_FlagsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Feature_FlagsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromfeature_Flags_AuditCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Feature_Flags_AuditFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromfeature_Flags_StatsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Feature_Flags_StatsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromgrn_LevelCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Grn_LevelFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFrommv_Refresh_TrackingCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Mv_Refresh_TrackingFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromorder_Loading_HistoryCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Order_Loading_HistoryFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFrompallet_Number_BufferCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Pallet_Number_BufferFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromprint_HistoryCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Print_HistoryFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromquery_RecordCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Query_RecordFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromrecord_AcoCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Record_AcoFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromrecord_Aco_DetailCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Record_Aco_DetailFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromrecord_GrnCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Record_GrnFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromrecord_HistoryCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Record_HistoryFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromrecord_InventoryCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Record_InventoryFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromrecord_PalletinfoCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Record_PalletinfoFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromrecord_SlateCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Record_SlateFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromrecord_StocktakeCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Record_StocktakeFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromrecord_TransferCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Record_TransferFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromreport_LogCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Report_LogFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromreport_VoidCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Report_VoidFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromstock_LevelCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Stock_LevelFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromstocktake_Batch_ScanCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Stocktake_Batch_ScanFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromstocktake_Batch_SummaryCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Stocktake_Batch_SummaryFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromstocktake_Daily_SummaryCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Stocktake_Daily_SummaryFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromstocktake_Report_CacheCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Stocktake_Report_CacheFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromstocktake_SessionCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Stocktake_SessionFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromstocktake_Validation_RulesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Stocktake_Validation_RulesFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromstocktake_Variance_AnalysisCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Stocktake_Variance_AnalysisFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromstocktake_Variance_ReportCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Stocktake_Variance_ReportFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromtransaction_LogCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Transaction_LogFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromuser_Navigation_HistoryCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<User_Navigation_HistoryFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromuser_Navigation_PatternsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<User_Navigation_PatternsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromuser_Navigation_StatsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<User_Navigation_StatsFilter>;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromwork_LevelCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Work_LevelFilter>;
};


/** The root type for creating and mutating data */
export type MutationExecute_Sql_QueryArgs = {
  query_text: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationExecute_Stock_TransferArgs = {
  p_from_location: Scalars['String']['input'];
  p_operator_id: Scalars['Int']['input'];
  p_plt_num: Scalars['String']['input'];
  p_product_code: Scalars['String']['input'];
  p_product_qty: Scalars['Int']['input'];
  p_to_location: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationGet_Aco_Order_DetailsArgs = {
  p_order_ref?: InputMaybe<Scalars['String']['input']>;
  p_product_code: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationGet_Rollback_StatusArgs = {
  p_transaction_id: Scalars['UUID']['input'];
};


/** The root type for creating and mutating data */
export type MutationHandle_Print_Label_UpdatesArgs = {
  p_description?: InputMaybe<Scalars['String']['input']>;
  p_pallet_count?: InputMaybe<Scalars['Int']['input']>;
  p_product_code: Scalars['String']['input'];
  p_quantity: Scalars['Int']['input'];
  p_user_id: Scalars['Int']['input'];
};


/** The root type for creating and mutating data */
export type MutationIncrement_Navigation_StatsArgs = {
  p_path: Scalars['String']['input'];
  p_time_spent?: InputMaybe<Scalars['Int']['input']>;
  p_user_id: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationInsertIntoApiCollectionArgs = {
  objects: Array<ApiInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntodata_CodeCollectionArgs = {
  objects: Array<Data_CodeInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntodata_IdCollectionArgs = {
  objects: Array<Data_IdInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntodata_OrderCollectionArgs = {
  objects: Array<Data_OrderInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntodata_SlateinfoCollectionArgs = {
  objects: Array<Data_SlateinfoInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntodata_SupplierCollectionArgs = {
  objects: Array<Data_SupplierInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntodebug_LogCollectionArgs = {
  objects: Array<Debug_LogInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntodoc_UploadCollectionArgs = {
  objects: Array<Doc_UploadInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntofeature_FlagsCollectionArgs = {
  objects: Array<Feature_FlagsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntofeature_Flags_AuditCollectionArgs = {
  objects: Array<Feature_Flags_AuditInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntofeature_Flags_StatsCollectionArgs = {
  objects: Array<Feature_Flags_StatsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntogrn_LevelCollectionArgs = {
  objects: Array<Grn_LevelInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntomv_Refresh_TrackingCollectionArgs = {
  objects: Array<Mv_Refresh_TrackingInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoorder_Loading_HistoryCollectionArgs = {
  objects: Array<Order_Loading_HistoryInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntopallet_Number_BufferCollectionArgs = {
  objects: Array<Pallet_Number_BufferInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoprint_HistoryCollectionArgs = {
  objects: Array<Print_HistoryInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoquery_RecordCollectionArgs = {
  objects: Array<Query_RecordInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntorecord_AcoCollectionArgs = {
  objects: Array<Record_AcoInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntorecord_Aco_DetailCollectionArgs = {
  objects: Array<Record_Aco_DetailInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntorecord_GrnCollectionArgs = {
  objects: Array<Record_GrnInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntorecord_HistoryCollectionArgs = {
  objects: Array<Record_HistoryInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntorecord_InventoryCollectionArgs = {
  objects: Array<Record_InventoryInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntorecord_PalletinfoCollectionArgs = {
  objects: Array<Record_PalletinfoInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntorecord_SlateCollectionArgs = {
  objects: Array<Record_SlateInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntorecord_StocktakeCollectionArgs = {
  objects: Array<Record_StocktakeInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntorecord_TransferCollectionArgs = {
  objects: Array<Record_TransferInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoreport_LogCollectionArgs = {
  objects: Array<Report_LogInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoreport_VoidCollectionArgs = {
  objects: Array<Report_VoidInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntostock_LevelCollectionArgs = {
  objects: Array<Stock_LevelInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntostocktake_Batch_ScanCollectionArgs = {
  objects: Array<Stocktake_Batch_ScanInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntostocktake_Batch_SummaryCollectionArgs = {
  objects: Array<Stocktake_Batch_SummaryInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntostocktake_Daily_SummaryCollectionArgs = {
  objects: Array<Stocktake_Daily_SummaryInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntostocktake_Report_CacheCollectionArgs = {
  objects: Array<Stocktake_Report_CacheInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntostocktake_SessionCollectionArgs = {
  objects: Array<Stocktake_SessionInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntostocktake_Validation_RulesCollectionArgs = {
  objects: Array<Stocktake_Validation_RulesInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntostocktake_Variance_AnalysisCollectionArgs = {
  objects: Array<Stocktake_Variance_AnalysisInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntostocktake_Variance_ReportCollectionArgs = {
  objects: Array<Stocktake_Variance_ReportInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntotransaction_LogCollectionArgs = {
  objects: Array<Transaction_LogInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntouser_Navigation_HistoryCollectionArgs = {
  objects: Array<User_Navigation_HistoryInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntouser_Navigation_PatternsCollectionArgs = {
  objects: Array<User_Navigation_PatternsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntouser_Navigation_StatsCollectionArgs = {
  objects: Array<User_Navigation_StatsInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntowork_LevelCollectionArgs = {
  objects: Array<Work_LevelInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationLog_Feature_Flag_EvaluationArgs = {
  p_context?: InputMaybe<Scalars['JSON']['input']>;
  p_enabled: Scalars['Boolean']['input'];
  p_flag_key: Scalars['String']['input'];
  p_variant?: InputMaybe<Scalars['String']['input']>;
};


/** The root type for creating and mutating data */
export type MutationProcess_Grn_Label_UnifiedArgs = {
  p_clock_number: Scalars['String']['input'];
  p_count: Scalars['Int']['input'];
  p_grn_number: Scalars['String']['input'];
  p_gross_weights?: InputMaybe<Array<InputMaybe<Scalars['BigFloat']['input']>>>;
  p_label_mode?: InputMaybe<Scalars['String']['input']>;
  p_material_code: Scalars['String']['input'];
  p_net_weights?: InputMaybe<Array<InputMaybe<Scalars['BigFloat']['input']>>>;
  p_package_count?: InputMaybe<Scalars['Int']['input']>;
  p_package_type?: InputMaybe<Scalars['String']['input']>;
  p_pallet_count?: InputMaybe<Scalars['Int']['input']>;
  p_pallet_type?: InputMaybe<Scalars['String']['input']>;
  p_pdf_urls?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  p_quantities?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  p_session_id?: InputMaybe<Scalars['String']['input']>;
  p_supplier_code: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationProcess_Grn_Label_With_TransactionArgs = {
  p_clock_number: Scalars['String']['input'];
  p_count: Scalars['Int']['input'];
  p_grn_number: Scalars['String']['input'];
  p_gross_weights?: InputMaybe<Array<InputMaybe<Scalars['BigFloat']['input']>>>;
  p_label_mode?: InputMaybe<Scalars['String']['input']>;
  p_material_code: Scalars['String']['input'];
  p_net_weights?: InputMaybe<Array<InputMaybe<Scalars['BigFloat']['input']>>>;
  p_package_count?: InputMaybe<Scalars['Int']['input']>;
  p_package_type?: InputMaybe<Scalars['String']['input']>;
  p_pallet_count?: InputMaybe<Scalars['Int']['input']>;
  p_pallet_type?: InputMaybe<Scalars['String']['input']>;
  p_pdf_urls?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  p_quantities?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  p_session_id?: InputMaybe<Scalars['String']['input']>;
  p_supplier_code: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationProcess_Qc_Label_UnifiedArgs = {
  p_aco_order_ref?: InputMaybe<Scalars['String']['input']>;
  p_aco_quantity_used?: InputMaybe<Scalars['Int']['input']>;
  p_clock_number: Scalars['String']['input'];
  p_count: Scalars['Int']['input'];
  p_pdf_urls?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  p_plt_remark: Scalars['String']['input'];
  p_product_code: Scalars['String']['input'];
  p_product_qty: Scalars['Int']['input'];
  p_session_id?: InputMaybe<Scalars['String']['input']>;
  p_slate_batch_number?: InputMaybe<Scalars['String']['input']>;
};


/** The root type for creating and mutating data */
export type MutationRecord_Transaction_ErrorArgs = {
  p_error_code: Scalars['String']['input'];
  p_error_details?: InputMaybe<Scalars['JSON']['input']>;
  p_error_message: Scalars['String']['input'];
  p_error_stack?: InputMaybe<Scalars['String']['input']>;
  p_transaction_id: Scalars['UUID']['input'];
};


/** The root type for creating and mutating data */
export type MutationRecord_Transaction_StepArgs = {
  p_step_data?: InputMaybe<Scalars['JSON']['input']>;
  p_step_name: Scalars['String']['input'];
  p_step_sequence: Scalars['Int']['input'];
  p_transaction_id: Scalars['UUID']['input'];
};


/** The root type for creating and mutating data */
export type MutationRelease_Pallet_ReservationArgs = {
  p_pallet_numbers: Array<InputMaybe<Scalars['String']['input']>>;
};


/** The root type for creating and mutating data */
export type MutationRollback_TransactionArgs = {
  p_rollback_by: Scalars['String']['input'];
  p_rollback_reason: Scalars['String']['input'];
  p_transaction_id: Scalars['UUID']['input'];
};


/** The root type for creating and mutating data */
export type MutationRpc_Create_SupplierArgs = {
  p_supplier_code: Scalars['String']['input'];
  p_supplier_name: Scalars['String']['input'];
  p_user_id: Scalars['Int']['input'];
};


/** The root type for creating and mutating data */
export type MutationRpc_Get_Aco_Incomplete_Orders_DashboardArgs = {
  p_limit?: InputMaybe<Scalars['Int']['input']>;
  p_offset?: InputMaybe<Scalars['Int']['input']>;
};


/** The root type for creating and mutating data */
export type MutationRpc_Get_Aco_Order_RefsArgs = {
  p_limit?: InputMaybe<Scalars['Int']['input']>;
  p_offset?: InputMaybe<Scalars['Int']['input']>;
};


/** The root type for creating and mutating data */
export type MutationRpc_Get_Aco_Order_ReportArgs = {
  p_limit?: InputMaybe<Scalars['Int']['input']>;
  p_offset?: InputMaybe<Scalars['Int']['input']>;
  p_order_ref: Scalars['Int']['input'];
};


/** The root type for creating and mutating data */
export type MutationRpc_Get_Await_Location_Count_By_TimeframeArgs = {
  p_end_date: Scalars['Datetime']['input'];
  p_start_date: Scalars['Datetime']['input'];
};


/** The root type for creating and mutating data */
export type MutationRpc_Get_Await_Percentage_StatsArgs = {
  p_end_date: Scalars['Datetime']['input'];
  p_start_date: Scalars['Datetime']['input'];
};


/** The root type for creating and mutating data */
export type MutationRpc_Get_Grn_Material_CodesArgs = {
  p_grn_ref: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationRpc_Get_Grn_ReferencesArgs = {
  p_limit?: InputMaybe<Scalars['Int']['input']>;
  p_offset?: InputMaybe<Scalars['Int']['input']>;
};


/** The root type for creating and mutating data */
export type MutationRpc_Get_Grn_Report_DataArgs = {
  p_grn_ref: Scalars['String']['input'];
  p_material_code: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationRpc_Get_History_TreeArgs = {
  p_limit?: InputMaybe<Scalars['Int']['input']>;
  p_offset?: InputMaybe<Scalars['Int']['input']>;
};


/** The root type for creating and mutating data */
export type MutationRpc_Get_Inventory_Ordered_AnalysisArgs = {
  p_product_type?: InputMaybe<Scalars['String']['input']>;
};


/** The root type for creating and mutating data */
export type MutationRpc_Get_Order_State_ListArgs = {
  p_limit?: InputMaybe<Scalars['Int']['input']>;
  p_offset?: InputMaybe<Scalars['Int']['input']>;
};


/** The root type for creating and mutating data */
export type MutationRpc_Get_Other_Files_ListArgs = {
  p_limit?: InputMaybe<Scalars['Int']['input']>;
  p_offset?: InputMaybe<Scalars['Int']['input']>;
};


/** The root type for creating and mutating data */
export type MutationRpc_Get_Production_StatsArgs = {
  p_end_date?: InputMaybe<Scalars['Datetime']['input']>;
  p_metric?: InputMaybe<Scalars['String']['input']>;
  p_start_date?: InputMaybe<Scalars['Datetime']['input']>;
};


/** The root type for creating and mutating data */
export type MutationRpc_Get_Report_ReferencesArgs = {
  p_field_name: Scalars['String']['input'];
  p_limit?: InputMaybe<Scalars['Int']['input']>;
  p_offset?: InputMaybe<Scalars['Int']['input']>;
  p_table_name: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationRpc_Get_Stock_DistributionArgs = {
  p_stock_type?: InputMaybe<Scalars['String']['input']>;
};


/** The root type for creating and mutating data */
export type MutationRpc_Get_User_Id_By_EmailArgs = {
  p_email: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationRpc_Get_Warehouse_Work_LevelArgs = {
  p_department?: InputMaybe<Scalars['String']['input']>;
  p_end_date?: InputMaybe<Scalars['Datetime']['input']>;
  p_start_date?: InputMaybe<Scalars['Datetime']['input']>;
};


/** The root type for creating and mutating data */
export type MutationRpc_Load_Pallet_To_OrderArgs = {
  p_order_ref: Scalars['String']['input'];
  p_pallet_input: Scalars['String']['input'];
  p_user_id?: InputMaybe<Scalars['Int']['input']>;
  p_user_name?: InputMaybe<Scalars['String']['input']>;
};


/** The root type for creating and mutating data */
export type MutationRpc_Search_Inventory_With_ChartArgs = {
  p_include_chart?: InputMaybe<Scalars['Boolean']['input']>;
  p_product_code: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationRpc_Search_SupplierArgs = {
  p_supplier_code: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationRpc_Transfer_PalletArgs = {
  p_pallet_num: Scalars['String']['input'];
  p_to_location: Scalars['String']['input'];
  p_user_id: Scalars['Int']['input'];
  p_user_name: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationRpc_Undo_Load_PalletArgs = {
  p_order_ref: Scalars['String']['input'];
  p_pallet_num: Scalars['String']['input'];
  p_product_code: Scalars['String']['input'];
  p_quantity: Scalars['Int']['input'];
  p_user_id?: InputMaybe<Scalars['Int']['input']>;
  p_user_name?: InputMaybe<Scalars['String']['input']>;
};


/** The root type for creating and mutating data */
export type MutationRpc_Update_SupplierArgs = {
  p_supplier_code: Scalars['String']['input'];
  p_supplier_name: Scalars['String']['input'];
  p_user_id: Scalars['Int']['input'];
};


/** The root type for creating and mutating data */
export type MutationSearch_Pallet_InfoArgs = {
  p_search_type: Scalars['String']['input'];
  p_search_value: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationSearch_Product_CodeArgs = {
  p_code: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationSearch_Supplier_CodeArgs = {
  p_code: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationStart_TransactionArgs = {
  p_metadata?: InputMaybe<Scalars['JSON']['input']>;
  p_operation_type: Scalars['String']['input'];
  p_pre_state?: InputMaybe<Scalars['JSON']['input']>;
  p_session_id?: InputMaybe<Scalars['String']['input']>;
  p_source_action: Scalars['String']['input'];
  p_source_module: Scalars['String']['input'];
  p_source_page: Scalars['String']['input'];
  p_transaction_id: Scalars['UUID']['input'];
  p_user_clock_number?: InputMaybe<Scalars['String']['input']>;
  p_user_id: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationTrack_Navigation_TransitionArgs = {
  p_from_path: Scalars['String']['input'];
  p_to_path: Scalars['String']['input'];
  p_user_id: Scalars['String']['input'];
};


/** The root type for creating and mutating data */
export type MutationUpdateApiCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ApiFilter>;
  set: ApiUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdate_Aco_Order_With_Completion_CheckArgs = {
  p_order_ref: Scalars['Int']['input'];
  p_product_code: Scalars['String']['input'];
  p_quantity_used: Scalars['Int']['input'];
};


/** The root type for creating and mutating data */
export type MutationUpdate_Stock_LevelArgs = {
  p_description?: InputMaybe<Scalars['String']['input']>;
  p_product_code: Scalars['String']['input'];
  p_quantity: Scalars['BigInt']['input'];
};


/** The root type for creating and mutating data */
export type MutationUpdate_Stock_Level_VoidArgs = {
  p_operation?: InputMaybe<Scalars['String']['input']>;
  p_product_code: Scalars['String']['input'];
  p_quantity: Scalars['BigInt']['input'];
};


/** The root type for creating and mutating data */
export type MutationUpdate_Work_Level_MoveArgs = {
  p_move_count?: InputMaybe<Scalars['Int']['input']>;
  p_user_id: Scalars['Int']['input'];
};


/** The root type for creating and mutating data */
export type MutationUpdate_Work_Level_QcArgs = {
  p_pallet_count: Scalars['Int']['input'];
  p_user_id: Scalars['Int']['input'];
};


/** The root type for creating and mutating data */
export type MutationUpdatedata_CodeCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Data_CodeFilter>;
  set: Data_CodeUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatedata_IdCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Data_IdFilter>;
  set: Data_IdUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatedata_OrderCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Data_OrderFilter>;
  set: Data_OrderUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatedata_SlateinfoCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Data_SlateinfoFilter>;
  set: Data_SlateinfoUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatedata_SupplierCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Data_SupplierFilter>;
  set: Data_SupplierUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatedebug_LogCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Debug_LogFilter>;
  set: Debug_LogUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatedoc_UploadCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Doc_UploadFilter>;
  set: Doc_UploadUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatefeature_FlagsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Feature_FlagsFilter>;
  set: Feature_FlagsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatefeature_Flags_AuditCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Feature_Flags_AuditFilter>;
  set: Feature_Flags_AuditUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatefeature_Flags_StatsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Feature_Flags_StatsFilter>;
  set: Feature_Flags_StatsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdategrn_LevelCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Grn_LevelFilter>;
  set: Grn_LevelUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatemv_Refresh_TrackingCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Mv_Refresh_TrackingFilter>;
  set: Mv_Refresh_TrackingUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateorder_Loading_HistoryCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Order_Loading_HistoryFilter>;
  set: Order_Loading_HistoryUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatepallet_Number_BufferCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Pallet_Number_BufferFilter>;
  set: Pallet_Number_BufferUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateprint_HistoryCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Print_HistoryFilter>;
  set: Print_HistoryUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatequery_RecordCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Query_RecordFilter>;
  set: Query_RecordUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdaterecord_AcoCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Record_AcoFilter>;
  set: Record_AcoUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdaterecord_Aco_DetailCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Record_Aco_DetailFilter>;
  set: Record_Aco_DetailUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdaterecord_GrnCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Record_GrnFilter>;
  set: Record_GrnUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdaterecord_HistoryCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Record_HistoryFilter>;
  set: Record_HistoryUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdaterecord_InventoryCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Record_InventoryFilter>;
  set: Record_InventoryUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdaterecord_PalletinfoCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Record_PalletinfoFilter>;
  set: Record_PalletinfoUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdaterecord_SlateCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Record_SlateFilter>;
  set: Record_SlateUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdaterecord_StocktakeCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Record_StocktakeFilter>;
  set: Record_StocktakeUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdaterecord_TransferCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Record_TransferFilter>;
  set: Record_TransferUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatereport_LogCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Report_LogFilter>;
  set: Report_LogUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatereport_VoidCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Report_VoidFilter>;
  set: Report_VoidUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatestock_LevelCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Stock_LevelFilter>;
  set: Stock_LevelUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatestocktake_Batch_ScanCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Stocktake_Batch_ScanFilter>;
  set: Stocktake_Batch_ScanUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatestocktake_Batch_SummaryCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Stocktake_Batch_SummaryFilter>;
  set: Stocktake_Batch_SummaryUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatestocktake_Daily_SummaryCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Stocktake_Daily_SummaryFilter>;
  set: Stocktake_Daily_SummaryUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatestocktake_Report_CacheCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Stocktake_Report_CacheFilter>;
  set: Stocktake_Report_CacheUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatestocktake_SessionCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Stocktake_SessionFilter>;
  set: Stocktake_SessionUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatestocktake_Validation_RulesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Stocktake_Validation_RulesFilter>;
  set: Stocktake_Validation_RulesUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatestocktake_Variance_AnalysisCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Stocktake_Variance_AnalysisFilter>;
  set: Stocktake_Variance_AnalysisUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatestocktake_Variance_ReportCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Stocktake_Variance_ReportFilter>;
  set: Stocktake_Variance_ReportUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatetransaction_LogCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Transaction_LogFilter>;
  set: Transaction_LogUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateuser_Navigation_HistoryCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<User_Navigation_HistoryFilter>;
  set: User_Navigation_HistoryUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateuser_Navigation_PatternsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<User_Navigation_PatternsFilter>;
  set: User_Navigation_PatternsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdateuser_Navigation_StatsCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<User_Navigation_StatsFilter>;
  set: User_Navigation_StatsUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationUpdatework_LevelCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<Work_LevelFilter>;
  set: Work_LevelUpdateInput;
};


/** The root type for creating and mutating data */
export type MutationValidate_Stocktake_CountArgs = {
  p_counted_qty: Scalars['BigInt']['input'];
  p_product_code: Scalars['String']['input'];
};

export type Node = {
  /** Retrieves a record by `ID` */
  nodeId: Scalars['ID']['output'];
};

/** Boolean expression comparing fields on type "Opaque" */
export type OpaqueFilter = {
  eq?: InputMaybe<Scalars['Opaque']['input']>;
  is?: InputMaybe<FilterIs>;
};

/** Defines a per-field sorting order */
export type OrderByDirection =
  /** Ascending order, nulls first */
  | 'AscNullsFirst'
  /** Ascending order, nulls last */
  | 'AscNullsLast'
  /** Descending order, nulls first */
  | 'DescNullsFirst'
  /** Descending order, nulls last */
  | 'DescNullsLast'
  | '%future added value';

export type PageInfo = {
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

/** The root type for querying data */
export type Query = {
  /** A pagable collection of type `API` */
  aPICollection?: Maybe<ApiConnection>;
  /** A pagable collection of type `data_code` */
  data_codeCollection?: Maybe<Data_CodeConnection>;
  /** A pagable collection of type `data_id` */
  data_idCollection?: Maybe<Data_IdConnection>;
  /** A pagable collection of type `data_order` */
  data_orderCollection?: Maybe<Data_OrderConnection>;
  /** A pagable collection of type `data_slateinfo` */
  data_slateinfoCollection?: Maybe<Data_SlateinfoConnection>;
  /** A pagable collection of type `data_supplier` */
  data_supplierCollection?: Maybe<Data_SupplierConnection>;
  /** A pagable collection of type `debug_log` */
  debug_logCollection?: Maybe<Debug_LogConnection>;
  /** A pagable collection of type `doc_upload` */
  doc_uploadCollection?: Maybe<Doc_UploadConnection>;
  /** A pagable collection of type `feature_flags` */
  feature_flagsCollection?: Maybe<Feature_FlagsConnection>;
  /** A pagable collection of type `feature_flags_audit` */
  feature_flags_auditCollection?: Maybe<Feature_Flags_AuditConnection>;
  /** A pagable collection of type `feature_flags_stats` */
  feature_flags_statsCollection?: Maybe<Feature_Flags_StatsConnection>;
  /** A pagable collection of type `grn_level` */
  grn_levelCollection?: Maybe<Grn_LevelConnection>;
  /** A pagable collection of type `mv_refresh_tracking` */
  mv_refresh_trackingCollection?: Maybe<Mv_Refresh_TrackingConnection>;
  /** Retrieve a record by its `ID` */
  node?: Maybe<Node>;
  /** A pagable collection of type `order_loading_history` */
  order_loading_historyCollection?: Maybe<Order_Loading_HistoryConnection>;
  /** A pagable collection of type `pallet_number_buffer` */
  pallet_number_bufferCollection?: Maybe<Pallet_Number_BufferConnection>;
  /** A pagable collection of type `print_history` */
  print_historyCollection?: Maybe<Print_HistoryConnection>;
  /** A pagable collection of type `query_record` */
  query_recordCollection?: Maybe<Query_RecordConnection>;
  /** A pagable collection of type `record_aco` */
  record_acoCollection?: Maybe<Record_AcoConnection>;
  /** A pagable collection of type `record_aco_detail` */
  record_aco_detailCollection?: Maybe<Record_Aco_DetailConnection>;
  /** A pagable collection of type `record_grn` */
  record_grnCollection?: Maybe<Record_GrnConnection>;
  /** A pagable collection of type `record_history` */
  record_historyCollection?: Maybe<Record_HistoryConnection>;
  /** A pagable collection of type `record_inventory` */
  record_inventoryCollection?: Maybe<Record_InventoryConnection>;
  /** A pagable collection of type `record_palletinfo` */
  record_palletinfoCollection?: Maybe<Record_PalletinfoConnection>;
  /** A pagable collection of type `record_slate` */
  record_slateCollection?: Maybe<Record_SlateConnection>;
  /** A pagable collection of type `record_stocktake` */
  record_stocktakeCollection?: Maybe<Record_StocktakeConnection>;
  /** A pagable collection of type `record_transfer` */
  record_transferCollection?: Maybe<Record_TransferConnection>;
  /** A pagable collection of type `report_log` */
  report_logCollection?: Maybe<Report_LogConnection>;
  /** A pagable collection of type `report_void` */
  report_voidCollection?: Maybe<Report_VoidConnection>;
  rpc_get_transfer_time_distribution?: Maybe<Scalars['JSON']['output']>;
  rpc_get_warehouse_work_level_this_month?: Maybe<Scalars['JSON']['output']>;
  rpc_get_warehouse_work_level_this_week?: Maybe<Scalars['JSON']['output']>;
  rpc_get_warehouse_work_level_today?: Maybe<Scalars['JSON']['output']>;
  show_limit?: Maybe<Scalars['Float']['output']>;
  /** A pagable collection of type `stock_level` */
  stock_levelCollection?: Maybe<Stock_LevelConnection>;
  /** A pagable collection of type `stocktake_batch_scan` */
  stocktake_batch_scanCollection?: Maybe<Stocktake_Batch_ScanConnection>;
  /** A pagable collection of type `stocktake_batch_summary` */
  stocktake_batch_summaryCollection?: Maybe<Stocktake_Batch_SummaryConnection>;
  /** A pagable collection of type `stocktake_daily_summary` */
  stocktake_daily_summaryCollection?: Maybe<Stocktake_Daily_SummaryConnection>;
  /** A pagable collection of type `stocktake_report_cache` */
  stocktake_report_cacheCollection?: Maybe<Stocktake_Report_CacheConnection>;
  /** A pagable collection of type `stocktake_session` */
  stocktake_sessionCollection?: Maybe<Stocktake_SessionConnection>;
  /** A pagable collection of type `stocktake_validation_rules` */
  stocktake_validation_rulesCollection?: Maybe<Stocktake_Validation_RulesConnection>;
  /** A pagable collection of type `stocktake_variance_analysis` */
  stocktake_variance_analysisCollection?: Maybe<Stocktake_Variance_AnalysisConnection>;
  /** A pagable collection of type `stocktake_variance_report` */
  stocktake_variance_reportCollection?: Maybe<Stocktake_Variance_ReportConnection>;
  /** A pagable collection of type `transaction_log` */
  transaction_logCollection?: Maybe<Transaction_LogConnection>;
  /** A pagable collection of type `user_navigation_history` */
  user_navigation_historyCollection?: Maybe<User_Navigation_HistoryConnection>;
  /** A pagable collection of type `user_navigation_patterns` */
  user_navigation_patternsCollection?: Maybe<User_Navigation_PatternsConnection>;
  /** A pagable collection of type `user_navigation_stats` */
  user_navigation_statsCollection?: Maybe<User_Navigation_StatsConnection>;
  /** A pagable collection of type `work_level` */
  work_levelCollection?: Maybe<Work_LevelConnection>;
};


/** The root type for querying data */
export type QueryAPiCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ApiFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ApiOrderBy>>;
};


/** The root type for querying data */
export type QueryData_CodeCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Data_CodeFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Data_CodeOrderBy>>;
};


/** The root type for querying data */
export type QueryData_IdCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Data_IdFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Data_IdOrderBy>>;
};


/** The root type for querying data */
export type QueryData_OrderCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Data_OrderFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Data_OrderOrderBy>>;
};


/** The root type for querying data */
export type QueryData_SlateinfoCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Data_SlateinfoFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Data_SlateinfoOrderBy>>;
};


/** The root type for querying data */
export type QueryData_SupplierCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Data_SupplierFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Data_SupplierOrderBy>>;
};


/** The root type for querying data */
export type QueryDebug_LogCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Debug_LogFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Debug_LogOrderBy>>;
};


/** The root type for querying data */
export type QueryDoc_UploadCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Doc_UploadFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Doc_UploadOrderBy>>;
};


/** The root type for querying data */
export type QueryFeature_FlagsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Feature_FlagsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Feature_FlagsOrderBy>>;
};


/** The root type for querying data */
export type QueryFeature_Flags_AuditCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Feature_Flags_AuditFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Feature_Flags_AuditOrderBy>>;
};


/** The root type for querying data */
export type QueryFeature_Flags_StatsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Feature_Flags_StatsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Feature_Flags_StatsOrderBy>>;
};


/** The root type for querying data */
export type QueryGrn_LevelCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Grn_LevelFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Grn_LevelOrderBy>>;
};


/** The root type for querying data */
export type QueryMv_Refresh_TrackingCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Mv_Refresh_TrackingFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Mv_Refresh_TrackingOrderBy>>;
};


/** The root type for querying data */
export type QueryNodeArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root type for querying data */
export type QueryOrder_Loading_HistoryCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Order_Loading_HistoryFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Order_Loading_HistoryOrderBy>>;
};


/** The root type for querying data */
export type QueryPallet_Number_BufferCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Pallet_Number_BufferFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Pallet_Number_BufferOrderBy>>;
};


/** The root type for querying data */
export type QueryPrint_HistoryCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Print_HistoryFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Print_HistoryOrderBy>>;
};


/** The root type for querying data */
export type QueryQuery_RecordCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Query_RecordFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Query_RecordOrderBy>>;
};


/** The root type for querying data */
export type QueryRecord_AcoCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_AcoFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_AcoOrderBy>>;
};


/** The root type for querying data */
export type QueryRecord_Aco_DetailCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_Aco_DetailFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_Aco_DetailOrderBy>>;
};


/** The root type for querying data */
export type QueryRecord_GrnCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_GrnFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_GrnOrderBy>>;
};


/** The root type for querying data */
export type QueryRecord_HistoryCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_HistoryFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_HistoryOrderBy>>;
};


/** The root type for querying data */
export type QueryRecord_InventoryCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_InventoryFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_InventoryOrderBy>>;
};


/** The root type for querying data */
export type QueryRecord_PalletinfoCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_PalletinfoFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_PalletinfoOrderBy>>;
};


/** The root type for querying data */
export type QueryRecord_SlateCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_SlateFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_SlateOrderBy>>;
};


/** The root type for querying data */
export type QueryRecord_StocktakeCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_StocktakeFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_StocktakeOrderBy>>;
};


/** The root type for querying data */
export type QueryRecord_TransferCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_TransferFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_TransferOrderBy>>;
};


/** The root type for querying data */
export type QueryReport_LogCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Report_LogFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Report_LogOrderBy>>;
};


/** The root type for querying data */
export type QueryReport_VoidCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Report_VoidFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Report_VoidOrderBy>>;
};


/** The root type for querying data */
export type QueryRpc_Get_Transfer_Time_DistributionArgs = {
  p_end_date: Scalars['Datetime']['input'];
  p_start_date: Scalars['Datetime']['input'];
  p_time_slots?: InputMaybe<Scalars['Int']['input']>;
};


/** The root type for querying data */
export type QueryStock_LevelCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Stock_LevelFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Stock_LevelOrderBy>>;
};


/** The root type for querying data */
export type QueryStocktake_Batch_ScanCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Stocktake_Batch_ScanFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Stocktake_Batch_ScanOrderBy>>;
};


/** The root type for querying data */
export type QueryStocktake_Batch_SummaryCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Stocktake_Batch_SummaryFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Stocktake_Batch_SummaryOrderBy>>;
};


/** The root type for querying data */
export type QueryStocktake_Daily_SummaryCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Stocktake_Daily_SummaryFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Stocktake_Daily_SummaryOrderBy>>;
};


/** The root type for querying data */
export type QueryStocktake_Report_CacheCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Stocktake_Report_CacheFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Stocktake_Report_CacheOrderBy>>;
};


/** The root type for querying data */
export type QueryStocktake_SessionCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Stocktake_SessionFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Stocktake_SessionOrderBy>>;
};


/** The root type for querying data */
export type QueryStocktake_Validation_RulesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Stocktake_Validation_RulesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Stocktake_Validation_RulesOrderBy>>;
};


/** The root type for querying data */
export type QueryStocktake_Variance_AnalysisCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Stocktake_Variance_AnalysisFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Stocktake_Variance_AnalysisOrderBy>>;
};


/** The root type for querying data */
export type QueryStocktake_Variance_ReportCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Stocktake_Variance_ReportFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Stocktake_Variance_ReportOrderBy>>;
};


/** The root type for querying data */
export type QueryTransaction_LogCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Transaction_LogFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Transaction_LogOrderBy>>;
};


/** The root type for querying data */
export type QueryUser_Navigation_HistoryCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<User_Navigation_HistoryFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<User_Navigation_HistoryOrderBy>>;
};


/** The root type for querying data */
export type QueryUser_Navigation_PatternsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<User_Navigation_PatternsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<User_Navigation_PatternsOrderBy>>;
};


/** The root type for querying data */
export type QueryUser_Navigation_StatsCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<User_Navigation_StatsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<User_Navigation_StatsOrderBy>>;
};


/** The root type for querying data */
export type QueryWork_LevelCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Work_LevelFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Work_LevelOrderBy>>;
};

/** Boolean expression comparing fields on type "String" */
export type StringFilter = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<Scalars['String']['input']>>;
  iregex?: InputMaybe<Scalars['String']['input']>;
  is?: InputMaybe<FilterIs>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  neq?: InputMaybe<Scalars['String']['input']>;
  regex?: InputMaybe<Scalars['String']['input']>;
  startsWith?: InputMaybe<Scalars['String']['input']>;
};

/** Boolean expression comparing fields on type "StringList" */
export type StringListFilter = {
  containedBy?: InputMaybe<Array<Scalars['String']['input']>>;
  contains?: InputMaybe<Array<Scalars['String']['input']>>;
  eq?: InputMaybe<Array<Scalars['String']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['String']['input']>>;
};

/** Boolean expression comparing fields on type "Time" */
export type TimeFilter = {
  eq?: InputMaybe<Scalars['Time']['input']>;
  gt?: InputMaybe<Scalars['Time']['input']>;
  gte?: InputMaybe<Scalars['Time']['input']>;
  in?: InputMaybe<Array<Scalars['Time']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['Time']['input']>;
  lte?: InputMaybe<Scalars['Time']['input']>;
  neq?: InputMaybe<Scalars['Time']['input']>;
};

/** Boolean expression comparing fields on type "TimeList" */
export type TimeListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Time']['input']>>;
  contains?: InputMaybe<Array<Scalars['Time']['input']>>;
  eq?: InputMaybe<Array<Scalars['Time']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Time']['input']>>;
};

/** Boolean expression comparing fields on type "UUID" */
export type UuidFilter = {
  eq?: InputMaybe<Scalars['UUID']['input']>;
  in?: InputMaybe<Array<Scalars['UUID']['input']>>;
  is?: InputMaybe<FilterIs>;
  neq?: InputMaybe<Scalars['UUID']['input']>;
};

/** Boolean expression comparing fields on type "UUIDList" */
export type UuidListFilter = {
  containedBy?: InputMaybe<Array<Scalars['UUID']['input']>>;
  contains?: InputMaybe<Array<Scalars['UUID']['input']>>;
  eq?: InputMaybe<Array<Scalars['UUID']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['UUID']['input']>>;
};

export type Data_Code = Node & {
  code: Scalars['String']['output'];
  colour: Scalars['String']['output'];
  description: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  record_acoCollection?: Maybe<Record_AcoConnection>;
  record_grnCollection?: Maybe<Record_GrnConnection>;
  record_inventoryCollection?: Maybe<Record_InventoryConnection>;
  record_palletinfoCollection?: Maybe<Record_PalletinfoConnection>;
  record_slateCollection?: Maybe<Record_SlateConnection>;
  remark?: Maybe<Scalars['String']['output']>;
  standard_qty: Scalars['Int']['output'];
  stock_levelCollection?: Maybe<Stock_LevelConnection>;
  type: Scalars['String']['output'];
};


export type Data_CodeRecord_AcoCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_AcoFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_AcoOrderBy>>;
};


export type Data_CodeRecord_GrnCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_GrnFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_GrnOrderBy>>;
};


export type Data_CodeRecord_InventoryCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_InventoryFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_InventoryOrderBy>>;
};


export type Data_CodeRecord_PalletinfoCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_PalletinfoFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_PalletinfoOrderBy>>;
};


export type Data_CodeRecord_SlateCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_SlateFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_SlateOrderBy>>;
};


export type Data_CodeStock_LevelCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Stock_LevelFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Stock_LevelOrderBy>>;
};

export type Data_CodeConnection = {
  edges: Array<Data_CodeEdge>;
  pageInfo: PageInfo;
};

export type Data_CodeDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Data_Code>;
};

export type Data_CodeEdge = {
  cursor: Scalars['String']['output'];
  node: Data_Code;
};

export type Data_CodeFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Data_CodeFilter>>;
  code?: InputMaybe<StringFilter>;
  colour?: InputMaybe<StringFilter>;
  description?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Data_CodeFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Data_CodeFilter>>;
  remark?: InputMaybe<StringFilter>;
  standard_qty?: InputMaybe<IntFilter>;
  type?: InputMaybe<StringFilter>;
};

export type Data_CodeInsertInput = {
  code?: InputMaybe<Scalars['String']['input']>;
  colour?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  remark?: InputMaybe<Scalars['String']['input']>;
  standard_qty?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type Data_CodeInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Data_Code>;
};

export type Data_CodeOrderBy = {
  code?: InputMaybe<OrderByDirection>;
  colour?: InputMaybe<OrderByDirection>;
  description?: InputMaybe<OrderByDirection>;
  remark?: InputMaybe<OrderByDirection>;
  standard_qty?: InputMaybe<OrderByDirection>;
  type?: InputMaybe<OrderByDirection>;
};

export type Data_CodeUpdateInput = {
  code?: InputMaybe<Scalars['String']['input']>;
  colour?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  remark?: InputMaybe<Scalars['String']['input']>;
  standard_qty?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type Data_CodeUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Data_Code>;
};

export type Data_Id = Node & {
  department: Scalars['String']['output'];
  email?: Maybe<Scalars['String']['output']>;
  icon_url?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  position: Scalars['String']['output'];
  record_historyCollection?: Maybe<Record_HistoryConnection>;
  record_stocktakeCollection?: Maybe<Record_StocktakeConnection>;
  record_transferCollection?: Maybe<Record_TransferConnection>;
  report_logCollection?: Maybe<Report_LogConnection>;
  stocktake_batch_scanCollection?: Maybe<Stocktake_Batch_ScanConnection>;
  stocktake_sessionCollection?: Maybe<Stocktake_SessionConnection>;
  stocktake_variance_analysisCollection?: Maybe<Stocktake_Variance_AnalysisConnection>;
  uuid: Scalars['UUID']['output'];
  work_levelCollection?: Maybe<Work_LevelConnection>;
};


export type Data_IdRecord_HistoryCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_HistoryFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_HistoryOrderBy>>;
};


export type Data_IdRecord_StocktakeCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_StocktakeFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_StocktakeOrderBy>>;
};


export type Data_IdRecord_TransferCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_TransferFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_TransferOrderBy>>;
};


export type Data_IdReport_LogCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Report_LogFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Report_LogOrderBy>>;
};


export type Data_IdStocktake_Batch_ScanCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Stocktake_Batch_ScanFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Stocktake_Batch_ScanOrderBy>>;
};


export type Data_IdStocktake_SessionCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Stocktake_SessionFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Stocktake_SessionOrderBy>>;
};


export type Data_IdStocktake_Variance_AnalysisCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Stocktake_Variance_AnalysisFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Stocktake_Variance_AnalysisOrderBy>>;
};


export type Data_IdWork_LevelCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Work_LevelFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Work_LevelOrderBy>>;
};

export type Data_IdConnection = {
  edges: Array<Data_IdEdge>;
  pageInfo: PageInfo;
};

export type Data_IdDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Data_Id>;
};

export type Data_IdEdge = {
  cursor: Scalars['String']['output'];
  node: Data_Id;
};

export type Data_IdFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Data_IdFilter>>;
  department?: InputMaybe<StringFilter>;
  email?: InputMaybe<StringFilter>;
  icon_url?: InputMaybe<StringFilter>;
  id?: InputMaybe<IntFilter>;
  name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Data_IdFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Data_IdFilter>>;
  position?: InputMaybe<StringFilter>;
  uuid?: InputMaybe<UuidFilter>;
};

export type Data_IdInsertInput = {
  department?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  icon_url?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Data_IdInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Data_Id>;
};

export type Data_IdOrderBy = {
  department?: InputMaybe<OrderByDirection>;
  email?: InputMaybe<OrderByDirection>;
  icon_url?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  name?: InputMaybe<OrderByDirection>;
  position?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
};

export type Data_IdUpdateInput = {
  department?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  icon_url?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Data_IdUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Data_Id>;
};

export type Data_Order = Node & {
  account_num: Scalars['String']['output'];
  created_at: Scalars['Datetime']['output'];
  customer_ref?: Maybe<Scalars['String']['output']>;
  delivery_add: Scalars['String']['output'];
  invoice_to: Scalars['String']['output'];
  loaded_qty: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  order_ref: Scalars['String']['output'];
  product_code: Scalars['String']['output'];
  product_desc: Scalars['String']['output'];
  product_qty: Scalars['BigInt']['output'];
  token: Scalars['BigInt']['output'];
  unit_price: Scalars['String']['output'];
  uploaded_by: Scalars['String']['output'];
  uuid: Scalars['UUID']['output'];
  weight?: Maybe<Scalars['BigInt']['output']>;
};

export type Data_OrderConnection = {
  edges: Array<Data_OrderEdge>;
  pageInfo: PageInfo;
};

export type Data_OrderDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Data_Order>;
};

export type Data_OrderEdge = {
  cursor: Scalars['String']['output'];
  node: Data_Order;
};

export type Data_OrderFilter = {
  account_num?: InputMaybe<StringFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Data_OrderFilter>>;
  created_at?: InputMaybe<DatetimeFilter>;
  customer_ref?: InputMaybe<StringFilter>;
  delivery_add?: InputMaybe<StringFilter>;
  invoice_to?: InputMaybe<StringFilter>;
  loaded_qty?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Data_OrderFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Data_OrderFilter>>;
  order_ref?: InputMaybe<StringFilter>;
  product_code?: InputMaybe<StringFilter>;
  product_desc?: InputMaybe<StringFilter>;
  product_qty?: InputMaybe<BigIntFilter>;
  token?: InputMaybe<BigIntFilter>;
  unit_price?: InputMaybe<StringFilter>;
  uploaded_by?: InputMaybe<StringFilter>;
  uuid?: InputMaybe<UuidFilter>;
  weight?: InputMaybe<BigIntFilter>;
};

export type Data_OrderInsertInput = {
  account_num?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  customer_ref?: InputMaybe<Scalars['String']['input']>;
  delivery_add?: InputMaybe<Scalars['String']['input']>;
  invoice_to?: InputMaybe<Scalars['String']['input']>;
  loaded_qty?: InputMaybe<Scalars['String']['input']>;
  order_ref?: InputMaybe<Scalars['String']['input']>;
  product_code?: InputMaybe<Scalars['String']['input']>;
  product_desc?: InputMaybe<Scalars['String']['input']>;
  product_qty?: InputMaybe<Scalars['BigInt']['input']>;
  token?: InputMaybe<Scalars['BigInt']['input']>;
  unit_price?: InputMaybe<Scalars['String']['input']>;
  uploaded_by?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
  weight?: InputMaybe<Scalars['BigInt']['input']>;
};

export type Data_OrderInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Data_Order>;
};

export type Data_OrderOrderBy = {
  account_num?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  customer_ref?: InputMaybe<OrderByDirection>;
  delivery_add?: InputMaybe<OrderByDirection>;
  invoice_to?: InputMaybe<OrderByDirection>;
  loaded_qty?: InputMaybe<OrderByDirection>;
  order_ref?: InputMaybe<OrderByDirection>;
  product_code?: InputMaybe<OrderByDirection>;
  product_desc?: InputMaybe<OrderByDirection>;
  product_qty?: InputMaybe<OrderByDirection>;
  token?: InputMaybe<OrderByDirection>;
  unit_price?: InputMaybe<OrderByDirection>;
  uploaded_by?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
  weight?: InputMaybe<OrderByDirection>;
};

export type Data_OrderUpdateInput = {
  account_num?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  customer_ref?: InputMaybe<Scalars['String']['input']>;
  delivery_add?: InputMaybe<Scalars['String']['input']>;
  invoice_to?: InputMaybe<Scalars['String']['input']>;
  loaded_qty?: InputMaybe<Scalars['String']['input']>;
  order_ref?: InputMaybe<Scalars['String']['input']>;
  product_code?: InputMaybe<Scalars['String']['input']>;
  product_desc?: InputMaybe<Scalars['String']['input']>;
  product_qty?: InputMaybe<Scalars['BigInt']['input']>;
  token?: InputMaybe<Scalars['BigInt']['input']>;
  unit_price?: InputMaybe<Scalars['String']['input']>;
  uploaded_by?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
  weight?: InputMaybe<Scalars['BigInt']['input']>;
};

export type Data_OrderUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Data_Order>;
};

export type Data_Slateinfo = Node & {
  colour?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  hole_to_bottom?: Maybe<Scalars['String']['output']>;
  length?: Maybe<Scalars['String']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  product_code: Scalars['String']['output'];
  shapes?: Maybe<Scalars['String']['output']>;
  thickness_bottom?: Maybe<Scalars['String']['output']>;
  thickness_top?: Maybe<Scalars['String']['output']>;
  tool_num?: Maybe<Scalars['String']['output']>;
  uuid: Scalars['UUID']['output'];
  weight?: Maybe<Scalars['String']['output']>;
  width?: Maybe<Scalars['String']['output']>;
};

export type Data_SlateinfoConnection = {
  edges: Array<Data_SlateinfoEdge>;
  pageInfo: PageInfo;
};

export type Data_SlateinfoDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Data_Slateinfo>;
};

export type Data_SlateinfoEdge = {
  cursor: Scalars['String']['output'];
  node: Data_Slateinfo;
};

export type Data_SlateinfoFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Data_SlateinfoFilter>>;
  colour?: InputMaybe<StringFilter>;
  description?: InputMaybe<StringFilter>;
  hole_to_bottom?: InputMaybe<StringFilter>;
  length?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Data_SlateinfoFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Data_SlateinfoFilter>>;
  product_code?: InputMaybe<StringFilter>;
  shapes?: InputMaybe<StringFilter>;
  thickness_bottom?: InputMaybe<StringFilter>;
  thickness_top?: InputMaybe<StringFilter>;
  tool_num?: InputMaybe<StringFilter>;
  uuid?: InputMaybe<UuidFilter>;
  weight?: InputMaybe<StringFilter>;
  width?: InputMaybe<StringFilter>;
};

export type Data_SlateinfoInsertInput = {
  colour?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  hole_to_bottom?: InputMaybe<Scalars['String']['input']>;
  length?: InputMaybe<Scalars['String']['input']>;
  product_code?: InputMaybe<Scalars['String']['input']>;
  shapes?: InputMaybe<Scalars['String']['input']>;
  thickness_bottom?: InputMaybe<Scalars['String']['input']>;
  thickness_top?: InputMaybe<Scalars['String']['input']>;
  tool_num?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
  weight?: InputMaybe<Scalars['String']['input']>;
  width?: InputMaybe<Scalars['String']['input']>;
};

export type Data_SlateinfoInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Data_Slateinfo>;
};

export type Data_SlateinfoOrderBy = {
  colour?: InputMaybe<OrderByDirection>;
  description?: InputMaybe<OrderByDirection>;
  hole_to_bottom?: InputMaybe<OrderByDirection>;
  length?: InputMaybe<OrderByDirection>;
  product_code?: InputMaybe<OrderByDirection>;
  shapes?: InputMaybe<OrderByDirection>;
  thickness_bottom?: InputMaybe<OrderByDirection>;
  thickness_top?: InputMaybe<OrderByDirection>;
  tool_num?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
  weight?: InputMaybe<OrderByDirection>;
  width?: InputMaybe<OrderByDirection>;
};

export type Data_SlateinfoUpdateInput = {
  colour?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  hole_to_bottom?: InputMaybe<Scalars['String']['input']>;
  length?: InputMaybe<Scalars['String']['input']>;
  product_code?: InputMaybe<Scalars['String']['input']>;
  shapes?: InputMaybe<Scalars['String']['input']>;
  thickness_bottom?: InputMaybe<Scalars['String']['input']>;
  thickness_top?: InputMaybe<Scalars['String']['input']>;
  tool_num?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
  weight?: InputMaybe<Scalars['String']['input']>;
  width?: InputMaybe<Scalars['String']['input']>;
};

export type Data_SlateinfoUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Data_Slateinfo>;
};

export type Data_Supplier = Node & {
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  record_grnCollection?: Maybe<Record_GrnConnection>;
  supplier_code: Scalars['String']['output'];
  supplier_name?: Maybe<Scalars['String']['output']>;
};


export type Data_SupplierRecord_GrnCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_GrnFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_GrnOrderBy>>;
};

export type Data_SupplierConnection = {
  edges: Array<Data_SupplierEdge>;
  pageInfo: PageInfo;
};

export type Data_SupplierDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Data_Supplier>;
};

export type Data_SupplierEdge = {
  cursor: Scalars['String']['output'];
  node: Data_Supplier;
};

export type Data_SupplierFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Data_SupplierFilter>>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Data_SupplierFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Data_SupplierFilter>>;
  supplier_code?: InputMaybe<StringFilter>;
  supplier_name?: InputMaybe<StringFilter>;
};

export type Data_SupplierInsertInput = {
  supplier_code?: InputMaybe<Scalars['String']['input']>;
  supplier_name?: InputMaybe<Scalars['String']['input']>;
};

export type Data_SupplierInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Data_Supplier>;
};

export type Data_SupplierOrderBy = {
  supplier_code?: InputMaybe<OrderByDirection>;
  supplier_name?: InputMaybe<OrderByDirection>;
};

export type Data_SupplierUpdateInput = {
  supplier_code?: InputMaybe<Scalars['String']['input']>;
  supplier_name?: InputMaybe<Scalars['String']['input']>;
};

export type Data_SupplierUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Data_Supplier>;
};

export type Debug_Log = Node & {
  UUID: Scalars['UUID']['output'];
  msg: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  ts: Scalars['Datetime']['output'];
};

export type Debug_LogConnection = {
  edges: Array<Debug_LogEdge>;
  pageInfo: PageInfo;
};

export type Debug_LogDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Debug_Log>;
};

export type Debug_LogEdge = {
  cursor: Scalars['String']['output'];
  node: Debug_Log;
};

export type Debug_LogFilter = {
  UUID?: InputMaybe<UuidFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Debug_LogFilter>>;
  msg?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Debug_LogFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Debug_LogFilter>>;
  ts?: InputMaybe<DatetimeFilter>;
};

export type Debug_LogInsertInput = {
  UUID?: InputMaybe<Scalars['UUID']['input']>;
  msg?: InputMaybe<Scalars['String']['input']>;
  ts?: InputMaybe<Scalars['Datetime']['input']>;
};

export type Debug_LogInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Debug_Log>;
};

export type Debug_LogOrderBy = {
  UUID?: InputMaybe<OrderByDirection>;
  msg?: InputMaybe<OrderByDirection>;
  ts?: InputMaybe<OrderByDirection>;
};

export type Debug_LogUpdateInput = {
  UUID?: InputMaybe<Scalars['UUID']['input']>;
  msg?: InputMaybe<Scalars['String']['input']>;
  ts?: InputMaybe<Scalars['Datetime']['input']>;
};

export type Debug_LogUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Debug_Log>;
};

export type Doc_Upload = Node & {
  created_at: Scalars['Datetime']['output'];
  doc_name: Scalars['String']['output'];
  doc_type?: Maybe<Scalars['String']['output']>;
  doc_url?: Maybe<Scalars['String']['output']>;
  file_size?: Maybe<Scalars['BigInt']['output']>;
  folder?: Maybe<Scalars['String']['output']>;
  json_txt?: Maybe<Scalars['String']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  upload_by: Scalars['Int']['output'];
  uuid: Scalars['UUID']['output'];
};

export type Doc_UploadConnection = {
  edges: Array<Doc_UploadEdge>;
  pageInfo: PageInfo;
};

export type Doc_UploadDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Doc_Upload>;
};

export type Doc_UploadEdge = {
  cursor: Scalars['String']['output'];
  node: Doc_Upload;
};

export type Doc_UploadFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Doc_UploadFilter>>;
  created_at?: InputMaybe<DatetimeFilter>;
  doc_name?: InputMaybe<StringFilter>;
  doc_type?: InputMaybe<StringFilter>;
  doc_url?: InputMaybe<StringFilter>;
  file_size?: InputMaybe<BigIntFilter>;
  folder?: InputMaybe<StringFilter>;
  json_txt?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Doc_UploadFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Doc_UploadFilter>>;
  upload_by?: InputMaybe<IntFilter>;
  uuid?: InputMaybe<UuidFilter>;
};

export type Doc_UploadInsertInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  doc_name?: InputMaybe<Scalars['String']['input']>;
  doc_type?: InputMaybe<Scalars['String']['input']>;
  doc_url?: InputMaybe<Scalars['String']['input']>;
  file_size?: InputMaybe<Scalars['BigInt']['input']>;
  folder?: InputMaybe<Scalars['String']['input']>;
  json_txt?: InputMaybe<Scalars['String']['input']>;
  upload_by?: InputMaybe<Scalars['Int']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Doc_UploadInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Doc_Upload>;
};

export type Doc_UploadOrderBy = {
  created_at?: InputMaybe<OrderByDirection>;
  doc_name?: InputMaybe<OrderByDirection>;
  doc_type?: InputMaybe<OrderByDirection>;
  doc_url?: InputMaybe<OrderByDirection>;
  file_size?: InputMaybe<OrderByDirection>;
  folder?: InputMaybe<OrderByDirection>;
  json_txt?: InputMaybe<OrderByDirection>;
  upload_by?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
};

export type Doc_UploadUpdateInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  doc_name?: InputMaybe<Scalars['String']['input']>;
  doc_type?: InputMaybe<Scalars['String']['input']>;
  doc_url?: InputMaybe<Scalars['String']['input']>;
  file_size?: InputMaybe<Scalars['BigInt']['input']>;
  folder?: InputMaybe<Scalars['String']['input']>;
  json_txt?: InputMaybe<Scalars['String']['input']>;
  upload_by?: InputMaybe<Scalars['Int']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Doc_UploadUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Doc_Upload>;
};

export type Feature_Flags = Node & {
  created_at?: Maybe<Scalars['Datetime']['output']>;
  created_by?: Maybe<Scalars['UUID']['output']>;
  default_value: Scalars['JSON']['output'];
  description?: Maybe<Scalars['String']['output']>;
  end_date?: Maybe<Scalars['Datetime']['output']>;
  feature_flags_auditCollection?: Maybe<Feature_Flags_AuditConnection>;
  id: Scalars['UUID']['output'];
  key: Scalars['String']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  name: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  rollout_percentage?: Maybe<Scalars['Int']['output']>;
  rules?: Maybe<Scalars['JSON']['output']>;
  start_date?: Maybe<Scalars['Datetime']['output']>;
  status: Scalars['String']['output'];
  tags?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  type: Scalars['String']['output'];
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  updated_by?: Maybe<Scalars['UUID']['output']>;
  variants?: Maybe<Scalars['JSON']['output']>;
};


export type Feature_FlagsFeature_Flags_AuditCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Feature_Flags_AuditFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Feature_Flags_AuditOrderBy>>;
};

export type Feature_FlagsConnection = {
  edges: Array<Feature_FlagsEdge>;
  pageInfo: PageInfo;
};

export type Feature_FlagsDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Feature_Flags>;
};

export type Feature_FlagsEdge = {
  cursor: Scalars['String']['output'];
  node: Feature_Flags;
};

export type Feature_FlagsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Feature_FlagsFilter>>;
  created_at?: InputMaybe<DatetimeFilter>;
  created_by?: InputMaybe<UuidFilter>;
  description?: InputMaybe<StringFilter>;
  end_date?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  key?: InputMaybe<StringFilter>;
  name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Feature_FlagsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Feature_FlagsFilter>>;
  rollout_percentage?: InputMaybe<IntFilter>;
  start_date?: InputMaybe<DatetimeFilter>;
  status?: InputMaybe<StringFilter>;
  tags?: InputMaybe<StringListFilter>;
  type?: InputMaybe<StringFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  updated_by?: InputMaybe<UuidFilter>;
};

export type Feature_FlagsInsertInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_by?: InputMaybe<Scalars['UUID']['input']>;
  default_value?: InputMaybe<Scalars['JSON']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  end_date?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  rollout_percentage?: InputMaybe<Scalars['Int']['input']>;
  rules?: InputMaybe<Scalars['JSON']['input']>;
  start_date?: InputMaybe<Scalars['Datetime']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  type?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  updated_by?: InputMaybe<Scalars['UUID']['input']>;
  variants?: InputMaybe<Scalars['JSON']['input']>;
};

export type Feature_FlagsInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Feature_Flags>;
};

export type Feature_FlagsOrderBy = {
  created_at?: InputMaybe<OrderByDirection>;
  created_by?: InputMaybe<OrderByDirection>;
  description?: InputMaybe<OrderByDirection>;
  end_date?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  key?: InputMaybe<OrderByDirection>;
  name?: InputMaybe<OrderByDirection>;
  rollout_percentage?: InputMaybe<OrderByDirection>;
  start_date?: InputMaybe<OrderByDirection>;
  status?: InputMaybe<OrderByDirection>;
  type?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  updated_by?: InputMaybe<OrderByDirection>;
};

export type Feature_FlagsUpdateInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_by?: InputMaybe<Scalars['UUID']['input']>;
  default_value?: InputMaybe<Scalars['JSON']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  end_date?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  rollout_percentage?: InputMaybe<Scalars['Int']['input']>;
  rules?: InputMaybe<Scalars['JSON']['input']>;
  start_date?: InputMaybe<Scalars['Datetime']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  type?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  updated_by?: InputMaybe<Scalars['UUID']['input']>;
  variants?: InputMaybe<Scalars['JSON']['input']>;
};

export type Feature_FlagsUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Feature_Flags>;
};

export type Feature_Flags_Audit = Node & {
  action: Scalars['String']['output'];
  context?: Maybe<Scalars['JSON']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  feature_flags?: Maybe<Feature_Flags>;
  flag_id?: Maybe<Scalars['UUID']['output']>;
  flag_key: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  new_value?: Maybe<Scalars['JSON']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  old_value?: Maybe<Scalars['JSON']['output']>;
  user_id?: Maybe<Scalars['UUID']['output']>;
};

export type Feature_Flags_AuditConnection = {
  edges: Array<Feature_Flags_AuditEdge>;
  pageInfo: PageInfo;
};

export type Feature_Flags_AuditDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Feature_Flags_Audit>;
};

export type Feature_Flags_AuditEdge = {
  cursor: Scalars['String']['output'];
  node: Feature_Flags_Audit;
};

export type Feature_Flags_AuditFilter = {
  action?: InputMaybe<StringFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Feature_Flags_AuditFilter>>;
  created_at?: InputMaybe<DatetimeFilter>;
  flag_id?: InputMaybe<UuidFilter>;
  flag_key?: InputMaybe<StringFilter>;
  id?: InputMaybe<UuidFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Feature_Flags_AuditFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Feature_Flags_AuditFilter>>;
  user_id?: InputMaybe<UuidFilter>;
};

export type Feature_Flags_AuditInsertInput = {
  action?: InputMaybe<Scalars['String']['input']>;
  context?: InputMaybe<Scalars['JSON']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  flag_id?: InputMaybe<Scalars['UUID']['input']>;
  flag_key?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  new_value?: InputMaybe<Scalars['JSON']['input']>;
  old_value?: InputMaybe<Scalars['JSON']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Feature_Flags_AuditInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Feature_Flags_Audit>;
};

export type Feature_Flags_AuditOrderBy = {
  action?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  flag_id?: InputMaybe<OrderByDirection>;
  flag_key?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type Feature_Flags_AuditUpdateInput = {
  action?: InputMaybe<Scalars['String']['input']>;
  context?: InputMaybe<Scalars['JSON']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  flag_id?: InputMaybe<Scalars['UUID']['input']>;
  flag_key?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  new_value?: InputMaybe<Scalars['JSON']['input']>;
  old_value?: InputMaybe<Scalars['JSON']['input']>;
  user_id?: InputMaybe<Scalars['UUID']['input']>;
};

export type Feature_Flags_AuditUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Feature_Flags_Audit>;
};

export type Feature_Flags_Stats = Node & {
  created_at?: Maybe<Scalars['Datetime']['output']>;
  date: Scalars['Date']['output'];
  disabled_count?: Maybe<Scalars['Int']['output']>;
  enabled_count?: Maybe<Scalars['Int']['output']>;
  evaluations?: Maybe<Scalars['Int']['output']>;
  flag_key: Scalars['String']['output'];
  hour: Scalars['Int']['output'];
  id: Scalars['UUID']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  unique_users?: Maybe<Scalars['Int']['output']>;
  variant_distribution?: Maybe<Scalars['JSON']['output']>;
};

export type Feature_Flags_StatsConnection = {
  edges: Array<Feature_Flags_StatsEdge>;
  pageInfo: PageInfo;
};

export type Feature_Flags_StatsDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Feature_Flags_Stats>;
};

export type Feature_Flags_StatsEdge = {
  cursor: Scalars['String']['output'];
  node: Feature_Flags_Stats;
};

export type Feature_Flags_StatsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Feature_Flags_StatsFilter>>;
  created_at?: InputMaybe<DatetimeFilter>;
  date?: InputMaybe<DateFilter>;
  disabled_count?: InputMaybe<IntFilter>;
  enabled_count?: InputMaybe<IntFilter>;
  evaluations?: InputMaybe<IntFilter>;
  flag_key?: InputMaybe<StringFilter>;
  hour?: InputMaybe<IntFilter>;
  id?: InputMaybe<UuidFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Feature_Flags_StatsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Feature_Flags_StatsFilter>>;
  unique_users?: InputMaybe<IntFilter>;
};

export type Feature_Flags_StatsInsertInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  date?: InputMaybe<Scalars['Date']['input']>;
  disabled_count?: InputMaybe<Scalars['Int']['input']>;
  enabled_count?: InputMaybe<Scalars['Int']['input']>;
  evaluations?: InputMaybe<Scalars['Int']['input']>;
  flag_key?: InputMaybe<Scalars['String']['input']>;
  hour?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  unique_users?: InputMaybe<Scalars['Int']['input']>;
  variant_distribution?: InputMaybe<Scalars['JSON']['input']>;
};

export type Feature_Flags_StatsInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Feature_Flags_Stats>;
};

export type Feature_Flags_StatsOrderBy = {
  created_at?: InputMaybe<OrderByDirection>;
  date?: InputMaybe<OrderByDirection>;
  disabled_count?: InputMaybe<OrderByDirection>;
  enabled_count?: InputMaybe<OrderByDirection>;
  evaluations?: InputMaybe<OrderByDirection>;
  flag_key?: InputMaybe<OrderByDirection>;
  hour?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  unique_users?: InputMaybe<OrderByDirection>;
};

export type Feature_Flags_StatsUpdateInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  date?: InputMaybe<Scalars['Date']['input']>;
  disabled_count?: InputMaybe<Scalars['Int']['input']>;
  enabled_count?: InputMaybe<Scalars['Int']['input']>;
  evaluations?: InputMaybe<Scalars['Int']['input']>;
  flag_key?: InputMaybe<Scalars['String']['input']>;
  hour?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  unique_users?: InputMaybe<Scalars['Int']['input']>;
  variant_distribution?: InputMaybe<Scalars['JSON']['input']>;
};

export type Feature_Flags_StatsUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Feature_Flags_Stats>;
};

export type Grn_Level = Node & {
  grn_ref?: Maybe<Scalars['BigInt']['output']>;
  latest_update: Scalars['Datetime']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  total_gross: Scalars['BigInt']['output'];
  total_net?: Maybe<Scalars['BigInt']['output']>;
  total_unit: Scalars['BigInt']['output'];
  uuid: Scalars['UUID']['output'];
};

export type Grn_LevelConnection = {
  edges: Array<Grn_LevelEdge>;
  pageInfo: PageInfo;
};

export type Grn_LevelDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Grn_Level>;
};

export type Grn_LevelEdge = {
  cursor: Scalars['String']['output'];
  node: Grn_Level;
};

export type Grn_LevelFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Grn_LevelFilter>>;
  grn_ref?: InputMaybe<BigIntFilter>;
  latest_update?: InputMaybe<DatetimeFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Grn_LevelFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Grn_LevelFilter>>;
  total_gross?: InputMaybe<BigIntFilter>;
  total_net?: InputMaybe<BigIntFilter>;
  total_unit?: InputMaybe<BigIntFilter>;
  uuid?: InputMaybe<UuidFilter>;
};

export type Grn_LevelInsertInput = {
  grn_ref?: InputMaybe<Scalars['BigInt']['input']>;
  latest_update?: InputMaybe<Scalars['Datetime']['input']>;
  total_gross?: InputMaybe<Scalars['BigInt']['input']>;
  total_net?: InputMaybe<Scalars['BigInt']['input']>;
  total_unit?: InputMaybe<Scalars['BigInt']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Grn_LevelInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Grn_Level>;
};

export type Grn_LevelOrderBy = {
  grn_ref?: InputMaybe<OrderByDirection>;
  latest_update?: InputMaybe<OrderByDirection>;
  total_gross?: InputMaybe<OrderByDirection>;
  total_net?: InputMaybe<OrderByDirection>;
  total_unit?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
};

export type Grn_LevelUpdateInput = {
  grn_ref?: InputMaybe<Scalars['BigInt']['input']>;
  latest_update?: InputMaybe<Scalars['Datetime']['input']>;
  total_gross?: InputMaybe<Scalars['BigInt']['input']>;
  total_net?: InputMaybe<Scalars['BigInt']['input']>;
  total_unit?: InputMaybe<Scalars['BigInt']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Grn_LevelUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Grn_Level>;
};

export type Mv_Refresh_Tracking = Node & {
  last_refresh?: Maybe<Scalars['Datetime']['output']>;
  mv_name: Scalars['String']['output'];
  needs_refresh?: Maybe<Scalars['Boolean']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
};

export type Mv_Refresh_TrackingConnection = {
  edges: Array<Mv_Refresh_TrackingEdge>;
  pageInfo: PageInfo;
};

export type Mv_Refresh_TrackingDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Mv_Refresh_Tracking>;
};

export type Mv_Refresh_TrackingEdge = {
  cursor: Scalars['String']['output'];
  node: Mv_Refresh_Tracking;
};

export type Mv_Refresh_TrackingFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Mv_Refresh_TrackingFilter>>;
  last_refresh?: InputMaybe<DatetimeFilter>;
  mv_name?: InputMaybe<StringFilter>;
  needs_refresh?: InputMaybe<BooleanFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Mv_Refresh_TrackingFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Mv_Refresh_TrackingFilter>>;
};

export type Mv_Refresh_TrackingInsertInput = {
  last_refresh?: InputMaybe<Scalars['Datetime']['input']>;
  mv_name?: InputMaybe<Scalars['String']['input']>;
  needs_refresh?: InputMaybe<Scalars['Boolean']['input']>;
};

export type Mv_Refresh_TrackingInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Mv_Refresh_Tracking>;
};

export type Mv_Refresh_TrackingOrderBy = {
  last_refresh?: InputMaybe<OrderByDirection>;
  mv_name?: InputMaybe<OrderByDirection>;
  needs_refresh?: InputMaybe<OrderByDirection>;
};

export type Mv_Refresh_TrackingUpdateInput = {
  last_refresh?: InputMaybe<Scalars['Datetime']['input']>;
  mv_name?: InputMaybe<Scalars['String']['input']>;
  needs_refresh?: InputMaybe<Scalars['Boolean']['input']>;
};

export type Mv_Refresh_TrackingUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Mv_Refresh_Tracking>;
};

export type Order_Loading_History = Node & {
  action_by: Scalars['String']['output'];
  action_time?: Maybe<Scalars['Datetime']['output']>;
  action_type: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  order_ref: Scalars['String']['output'];
  pallet_num: Scalars['String']['output'];
  product_code: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
  remark?: Maybe<Scalars['String']['output']>;
  uuid: Scalars['UUID']['output'];
};

export type Order_Loading_HistoryConnection = {
  edges: Array<Order_Loading_HistoryEdge>;
  pageInfo: PageInfo;
};

export type Order_Loading_HistoryDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Order_Loading_History>;
};

export type Order_Loading_HistoryEdge = {
  cursor: Scalars['String']['output'];
  node: Order_Loading_History;
};

export type Order_Loading_HistoryFilter = {
  action_by?: InputMaybe<StringFilter>;
  action_time?: InputMaybe<DatetimeFilter>;
  action_type?: InputMaybe<StringFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Order_Loading_HistoryFilter>>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Order_Loading_HistoryFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Order_Loading_HistoryFilter>>;
  order_ref?: InputMaybe<StringFilter>;
  pallet_num?: InputMaybe<StringFilter>;
  product_code?: InputMaybe<StringFilter>;
  quantity?: InputMaybe<IntFilter>;
  remark?: InputMaybe<StringFilter>;
  uuid?: InputMaybe<UuidFilter>;
};

export type Order_Loading_HistoryInsertInput = {
  action_by?: InputMaybe<Scalars['String']['input']>;
  action_time?: InputMaybe<Scalars['Datetime']['input']>;
  action_type?: InputMaybe<Scalars['String']['input']>;
  order_ref?: InputMaybe<Scalars['String']['input']>;
  pallet_num?: InputMaybe<Scalars['String']['input']>;
  product_code?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
  remark?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Order_Loading_HistoryInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Order_Loading_History>;
};

export type Order_Loading_HistoryOrderBy = {
  action_by?: InputMaybe<OrderByDirection>;
  action_time?: InputMaybe<OrderByDirection>;
  action_type?: InputMaybe<OrderByDirection>;
  order_ref?: InputMaybe<OrderByDirection>;
  pallet_num?: InputMaybe<OrderByDirection>;
  product_code?: InputMaybe<OrderByDirection>;
  quantity?: InputMaybe<OrderByDirection>;
  remark?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
};

export type Order_Loading_HistoryUpdateInput = {
  action_by?: InputMaybe<Scalars['String']['input']>;
  action_time?: InputMaybe<Scalars['Datetime']['input']>;
  action_type?: InputMaybe<Scalars['String']['input']>;
  order_ref?: InputMaybe<Scalars['String']['input']>;
  pallet_num?: InputMaybe<Scalars['String']['input']>;
  product_code?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
  remark?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Order_Loading_HistoryUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Order_Loading_History>;
};

export type Pallet_Number_Buffer = Node & {
  date_str: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  pallet_number: Scalars['String']['output'];
  series: Scalars['String']['output'];
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  used: Scalars['String']['output'];
};

export type Pallet_Number_BufferConnection = {
  edges: Array<Pallet_Number_BufferEdge>;
  pageInfo: PageInfo;
};

export type Pallet_Number_BufferDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Pallet_Number_Buffer>;
};

export type Pallet_Number_BufferEdge = {
  cursor: Scalars['String']['output'];
  node: Pallet_Number_Buffer;
};

export type Pallet_Number_BufferFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Pallet_Number_BufferFilter>>;
  date_str?: InputMaybe<StringFilter>;
  id?: InputMaybe<IntFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Pallet_Number_BufferFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Pallet_Number_BufferFilter>>;
  pallet_number?: InputMaybe<StringFilter>;
  series?: InputMaybe<StringFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  used?: InputMaybe<StringFilter>;
};

export type Pallet_Number_BufferInsertInput = {
  date_str?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['Int']['input']>;
  pallet_number?: InputMaybe<Scalars['String']['input']>;
  series?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  used?: InputMaybe<Scalars['String']['input']>;
};

export type Pallet_Number_BufferInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Pallet_Number_Buffer>;
};

export type Pallet_Number_BufferOrderBy = {
  date_str?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  pallet_number?: InputMaybe<OrderByDirection>;
  series?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  used?: InputMaybe<OrderByDirection>;
};

export type Pallet_Number_BufferUpdateInput = {
  date_str?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['Int']['input']>;
  pallet_number?: InputMaybe<Scalars['String']['input']>;
  series?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  used?: InputMaybe<Scalars['String']['input']>;
};

export type Pallet_Number_BufferUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Pallet_Number_Buffer>;
};

export type Print_History = Node & {
  created_at?: Maybe<Scalars['Datetime']['output']>;
  data?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['UUID']['output'];
  job_id: Scalars['String']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  options?: Maybe<Scalars['JSON']['output']>;
  result?: Maybe<Scalars['JSON']['output']>;
  type: Scalars['String']['output'];
};

export type Print_HistoryConnection = {
  edges: Array<Print_HistoryEdge>;
  pageInfo: PageInfo;
};

export type Print_HistoryDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Print_History>;
};

export type Print_HistoryEdge = {
  cursor: Scalars['String']['output'];
  node: Print_History;
};

export type Print_HistoryFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Print_HistoryFilter>>;
  created_at?: InputMaybe<DatetimeFilter>;
  id?: InputMaybe<UuidFilter>;
  job_id?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Print_HistoryFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Print_HistoryFilter>>;
  type?: InputMaybe<StringFilter>;
};

export type Print_HistoryInsertInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  data?: InputMaybe<Scalars['JSON']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  job_id?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  options?: InputMaybe<Scalars['JSON']['input']>;
  result?: InputMaybe<Scalars['JSON']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type Print_HistoryInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Print_History>;
};

export type Print_HistoryOrderBy = {
  created_at?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  job_id?: InputMaybe<OrderByDirection>;
  type?: InputMaybe<OrderByDirection>;
};

export type Print_HistoryUpdateInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  data?: InputMaybe<Scalars['JSON']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  job_id?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  options?: InputMaybe<Scalars['JSON']['input']>;
  result?: InputMaybe<Scalars['JSON']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type Print_HistoryUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Print_History>;
};

export type Query_Record = Node & {
  answer: Scalars['String']['output'];
  complexity?: Maybe<Scalars['String']['output']>;
  created_at: Scalars['Datetime']['output'];
  execution_time?: Maybe<Scalars['Int']['output']>;
  expired_at?: Maybe<Scalars['Datetime']['output']>;
  expired_reason?: Maybe<Scalars['String']['output']>;
  fuzzy_hash?: Maybe<Scalars['String']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  query: Scalars['String']['output'];
  query_hash?: Maybe<Scalars['String']['output']>;
  result_json?: Maybe<Scalars['JSON']['output']>;
  row_count?: Maybe<Scalars['Int']['output']>;
  session_id?: Maybe<Scalars['String']['output']>;
  sql_query: Scalars['String']['output'];
  token: Scalars['BigInt']['output'];
  user: Scalars['String']['output'];
  uuid: Scalars['UUID']['output'];
};

export type Query_RecordConnection = {
  edges: Array<Query_RecordEdge>;
  pageInfo: PageInfo;
};

export type Query_RecordDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Query_Record>;
};

export type Query_RecordEdge = {
  cursor: Scalars['String']['output'];
  node: Query_Record;
};

export type Query_RecordFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Query_RecordFilter>>;
  answer?: InputMaybe<StringFilter>;
  complexity?: InputMaybe<StringFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  execution_time?: InputMaybe<IntFilter>;
  expired_at?: InputMaybe<DatetimeFilter>;
  expired_reason?: InputMaybe<StringFilter>;
  fuzzy_hash?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Query_RecordFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Query_RecordFilter>>;
  query?: InputMaybe<StringFilter>;
  query_hash?: InputMaybe<StringFilter>;
  row_count?: InputMaybe<IntFilter>;
  session_id?: InputMaybe<StringFilter>;
  sql_query?: InputMaybe<StringFilter>;
  token?: InputMaybe<BigIntFilter>;
  user?: InputMaybe<StringFilter>;
  uuid?: InputMaybe<UuidFilter>;
};

export type Query_RecordInsertInput = {
  answer?: InputMaybe<Scalars['String']['input']>;
  complexity?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  execution_time?: InputMaybe<Scalars['Int']['input']>;
  expired_at?: InputMaybe<Scalars['Datetime']['input']>;
  expired_reason?: InputMaybe<Scalars['String']['input']>;
  fuzzy_hash?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  query_hash?: InputMaybe<Scalars['String']['input']>;
  result_json?: InputMaybe<Scalars['JSON']['input']>;
  row_count?: InputMaybe<Scalars['Int']['input']>;
  session_id?: InputMaybe<Scalars['String']['input']>;
  sql_query?: InputMaybe<Scalars['String']['input']>;
  token?: InputMaybe<Scalars['BigInt']['input']>;
  user?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Query_RecordInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Query_Record>;
};

export type Query_RecordOrderBy = {
  answer?: InputMaybe<OrderByDirection>;
  complexity?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  execution_time?: InputMaybe<OrderByDirection>;
  expired_at?: InputMaybe<OrderByDirection>;
  expired_reason?: InputMaybe<OrderByDirection>;
  fuzzy_hash?: InputMaybe<OrderByDirection>;
  query?: InputMaybe<OrderByDirection>;
  query_hash?: InputMaybe<OrderByDirection>;
  row_count?: InputMaybe<OrderByDirection>;
  session_id?: InputMaybe<OrderByDirection>;
  sql_query?: InputMaybe<OrderByDirection>;
  token?: InputMaybe<OrderByDirection>;
  user?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
};

export type Query_RecordUpdateInput = {
  answer?: InputMaybe<Scalars['String']['input']>;
  complexity?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  execution_time?: InputMaybe<Scalars['Int']['input']>;
  expired_at?: InputMaybe<Scalars['Datetime']['input']>;
  expired_reason?: InputMaybe<Scalars['String']['input']>;
  fuzzy_hash?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  query_hash?: InputMaybe<Scalars['String']['input']>;
  result_json?: InputMaybe<Scalars['JSON']['input']>;
  row_count?: InputMaybe<Scalars['Int']['input']>;
  session_id?: InputMaybe<Scalars['String']['input']>;
  sql_query?: InputMaybe<Scalars['String']['input']>;
  token?: InputMaybe<Scalars['BigInt']['input']>;
  user?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Query_RecordUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Query_Record>;
};

export type Record_Aco = Node & {
  code: Scalars['String']['output'];
  data_code?: Maybe<Data_Code>;
  finished_qty?: Maybe<Scalars['BigInt']['output']>;
  latest_update: Scalars['Datetime']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  order_ref: Scalars['BigInt']['output'];
  required_qty: Scalars['BigInt']['output'];
  uuid: Scalars['UUID']['output'];
};

export type Record_AcoConnection = {
  edges: Array<Record_AcoEdge>;
  pageInfo: PageInfo;
};

export type Record_AcoDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Aco>;
};

export type Record_AcoEdge = {
  cursor: Scalars['String']['output'];
  node: Record_Aco;
};

export type Record_AcoFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Record_AcoFilter>>;
  code?: InputMaybe<StringFilter>;
  finished_qty?: InputMaybe<BigIntFilter>;
  latest_update?: InputMaybe<DatetimeFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Record_AcoFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Record_AcoFilter>>;
  order_ref?: InputMaybe<BigIntFilter>;
  required_qty?: InputMaybe<BigIntFilter>;
  uuid?: InputMaybe<UuidFilter>;
};

export type Record_AcoInsertInput = {
  code?: InputMaybe<Scalars['String']['input']>;
  finished_qty?: InputMaybe<Scalars['BigInt']['input']>;
  latest_update?: InputMaybe<Scalars['Datetime']['input']>;
  order_ref?: InputMaybe<Scalars['BigInt']['input']>;
  required_qty?: InputMaybe<Scalars['BigInt']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Record_AcoInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Aco>;
};

export type Record_AcoOrderBy = {
  code?: InputMaybe<OrderByDirection>;
  finished_qty?: InputMaybe<OrderByDirection>;
  latest_update?: InputMaybe<OrderByDirection>;
  order_ref?: InputMaybe<OrderByDirection>;
  required_qty?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
};

export type Record_AcoUpdateInput = {
  code?: InputMaybe<Scalars['String']['input']>;
  finished_qty?: InputMaybe<Scalars['BigInt']['input']>;
  latest_update?: InputMaybe<Scalars['Datetime']['input']>;
  order_ref?: InputMaybe<Scalars['BigInt']['input']>;
  required_qty?: InputMaybe<Scalars['BigInt']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Record_AcoUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Aco>;
};

export type Record_Aco_Detail = Node & {
  created_at?: Maybe<Scalars['Time']['output']>;
  height?: Maybe<Scalars['Int']['output']>;
  length?: Maybe<Scalars['Int']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  plt_num: Scalars['String']['output'];
  record_palletinfo?: Maybe<Record_Palletinfo>;
  uuid: Scalars['UUID']['output'];
  weight?: Maybe<Scalars['Int']['output']>;
  width?: Maybe<Scalars['Int']['output']>;
};

export type Record_Aco_DetailConnection = {
  edges: Array<Record_Aco_DetailEdge>;
  pageInfo: PageInfo;
};

export type Record_Aco_DetailDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Aco_Detail>;
};

export type Record_Aco_DetailEdge = {
  cursor: Scalars['String']['output'];
  node: Record_Aco_Detail;
};

export type Record_Aco_DetailFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Record_Aco_DetailFilter>>;
  created_at?: InputMaybe<TimeFilter>;
  height?: InputMaybe<IntFilter>;
  length?: InputMaybe<IntFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Record_Aco_DetailFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Record_Aco_DetailFilter>>;
  plt_num?: InputMaybe<StringFilter>;
  uuid?: InputMaybe<UuidFilter>;
  weight?: InputMaybe<IntFilter>;
  width?: InputMaybe<IntFilter>;
};

export type Record_Aco_DetailInsertInput = {
  created_at?: InputMaybe<Scalars['Time']['input']>;
  height?: InputMaybe<Scalars['Int']['input']>;
  length?: InputMaybe<Scalars['Int']['input']>;
  plt_num?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
  weight?: InputMaybe<Scalars['Int']['input']>;
  width?: InputMaybe<Scalars['Int']['input']>;
};

export type Record_Aco_DetailInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Aco_Detail>;
};

export type Record_Aco_DetailOrderBy = {
  created_at?: InputMaybe<OrderByDirection>;
  height?: InputMaybe<OrderByDirection>;
  length?: InputMaybe<OrderByDirection>;
  plt_num?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
  weight?: InputMaybe<OrderByDirection>;
  width?: InputMaybe<OrderByDirection>;
};

export type Record_Aco_DetailUpdateInput = {
  created_at?: InputMaybe<Scalars['Time']['input']>;
  height?: InputMaybe<Scalars['Int']['input']>;
  length?: InputMaybe<Scalars['Int']['input']>;
  plt_num?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
  weight?: InputMaybe<Scalars['Int']['input']>;
  width?: InputMaybe<Scalars['Int']['input']>;
};

export type Record_Aco_DetailUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Aco_Detail>;
};

export type Record_Grn = Node & {
  creat_time: Scalars['Datetime']['output'];
  data_code?: Maybe<Data_Code>;
  data_supplier?: Maybe<Data_Supplier>;
  grn_ref: Scalars['Int']['output'];
  gross_weight: Scalars['BigInt']['output'];
  material_code: Scalars['String']['output'];
  net_weight: Scalars['BigInt']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  package: Scalars['String']['output'];
  package_count: Scalars['BigFloat']['output'];
  pallet: Scalars['String']['output'];
  pallet_count: Scalars['BigFloat']['output'];
  plt_num: Scalars['String']['output'];
  record_palletinfo?: Maybe<Record_Palletinfo>;
  sup_code: Scalars['String']['output'];
  uuid: Scalars['UUID']['output'];
};

export type Record_GrnConnection = {
  edges: Array<Record_GrnEdge>;
  pageInfo: PageInfo;
};

export type Record_GrnDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Grn>;
};

export type Record_GrnEdge = {
  cursor: Scalars['String']['output'];
  node: Record_Grn;
};

export type Record_GrnFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Record_GrnFilter>>;
  creat_time?: InputMaybe<DatetimeFilter>;
  grn_ref?: InputMaybe<IntFilter>;
  gross_weight?: InputMaybe<BigIntFilter>;
  material_code?: InputMaybe<StringFilter>;
  net_weight?: InputMaybe<BigIntFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Record_GrnFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Record_GrnFilter>>;
  package?: InputMaybe<StringFilter>;
  package_count?: InputMaybe<BigFloatFilter>;
  pallet?: InputMaybe<StringFilter>;
  pallet_count?: InputMaybe<BigFloatFilter>;
  plt_num?: InputMaybe<StringFilter>;
  sup_code?: InputMaybe<StringFilter>;
  uuid?: InputMaybe<UuidFilter>;
};

export type Record_GrnInsertInput = {
  creat_time?: InputMaybe<Scalars['Datetime']['input']>;
  grn_ref?: InputMaybe<Scalars['Int']['input']>;
  gross_weight?: InputMaybe<Scalars['BigInt']['input']>;
  material_code?: InputMaybe<Scalars['String']['input']>;
  net_weight?: InputMaybe<Scalars['BigInt']['input']>;
  package?: InputMaybe<Scalars['String']['input']>;
  package_count?: InputMaybe<Scalars['BigFloat']['input']>;
  pallet?: InputMaybe<Scalars['String']['input']>;
  pallet_count?: InputMaybe<Scalars['BigFloat']['input']>;
  plt_num?: InputMaybe<Scalars['String']['input']>;
  sup_code?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Record_GrnInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Grn>;
};

export type Record_GrnOrderBy = {
  creat_time?: InputMaybe<OrderByDirection>;
  grn_ref?: InputMaybe<OrderByDirection>;
  gross_weight?: InputMaybe<OrderByDirection>;
  material_code?: InputMaybe<OrderByDirection>;
  net_weight?: InputMaybe<OrderByDirection>;
  package?: InputMaybe<OrderByDirection>;
  package_count?: InputMaybe<OrderByDirection>;
  pallet?: InputMaybe<OrderByDirection>;
  pallet_count?: InputMaybe<OrderByDirection>;
  plt_num?: InputMaybe<OrderByDirection>;
  sup_code?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
};

export type Record_GrnUpdateInput = {
  creat_time?: InputMaybe<Scalars['Datetime']['input']>;
  grn_ref?: InputMaybe<Scalars['Int']['input']>;
  gross_weight?: InputMaybe<Scalars['BigInt']['input']>;
  material_code?: InputMaybe<Scalars['String']['input']>;
  net_weight?: InputMaybe<Scalars['BigInt']['input']>;
  package?: InputMaybe<Scalars['String']['input']>;
  package_count?: InputMaybe<Scalars['BigFloat']['input']>;
  pallet?: InputMaybe<Scalars['String']['input']>;
  pallet_count?: InputMaybe<Scalars['BigFloat']['input']>;
  plt_num?: InputMaybe<Scalars['String']['input']>;
  sup_code?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Record_GrnUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Grn>;
};

export type Record_History = Node & {
  action: Scalars['String']['output'];
  data_id?: Maybe<Data_Id>;
  id?: Maybe<Scalars['Int']['output']>;
  loc?: Maybe<Scalars['String']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  plt_num?: Maybe<Scalars['String']['output']>;
  record_palletinfo?: Maybe<Record_Palletinfo>;
  remark: Scalars['String']['output'];
  time: Scalars['Datetime']['output'];
  uuid: Scalars['UUID']['output'];
};

export type Record_HistoryConnection = {
  edges: Array<Record_HistoryEdge>;
  pageInfo: PageInfo;
};

export type Record_HistoryDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_History>;
};

export type Record_HistoryEdge = {
  cursor: Scalars['String']['output'];
  node: Record_History;
};

export type Record_HistoryFilter = {
  action?: InputMaybe<StringFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Record_HistoryFilter>>;
  id?: InputMaybe<IntFilter>;
  loc?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Record_HistoryFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Record_HistoryFilter>>;
  plt_num?: InputMaybe<StringFilter>;
  remark?: InputMaybe<StringFilter>;
  time?: InputMaybe<DatetimeFilter>;
  uuid?: InputMaybe<UuidFilter>;
};

export type Record_HistoryInsertInput = {
  action?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['Int']['input']>;
  loc?: InputMaybe<Scalars['String']['input']>;
  plt_num?: InputMaybe<Scalars['String']['input']>;
  remark?: InputMaybe<Scalars['String']['input']>;
  time?: InputMaybe<Scalars['Datetime']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Record_HistoryInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_History>;
};

export type Record_HistoryOrderBy = {
  action?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  loc?: InputMaybe<OrderByDirection>;
  plt_num?: InputMaybe<OrderByDirection>;
  remark?: InputMaybe<OrderByDirection>;
  time?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
};

export type Record_HistoryUpdateInput = {
  action?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['Int']['input']>;
  loc?: InputMaybe<Scalars['String']['input']>;
  plt_num?: InputMaybe<Scalars['String']['input']>;
  remark?: InputMaybe<Scalars['String']['input']>;
  time?: InputMaybe<Scalars['Datetime']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Record_HistoryUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_History>;
};

export type Record_Inventory = Node & {
  await: Scalars['BigInt']['output'];
  await_grn?: Maybe<Scalars['BigInt']['output']>;
  backcarpark: Scalars['BigInt']['output'];
  bulk: Scalars['BigInt']['output'];
  damage: Scalars['BigInt']['output'];
  data_code?: Maybe<Data_Code>;
  fold: Scalars['BigInt']['output'];
  injection: Scalars['BigInt']['output'];
  latest_update: Scalars['Datetime']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  pipeline: Scalars['BigInt']['output'];
  plt_num: Scalars['String']['output'];
  prebook: Scalars['BigInt']['output'];
  product_code: Scalars['String']['output'];
  record_palletinfo?: Maybe<Record_Palletinfo>;
  uuid: Scalars['UUID']['output'];
};

export type Record_InventoryConnection = {
  edges: Array<Record_InventoryEdge>;
  pageInfo: PageInfo;
};

export type Record_InventoryDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Inventory>;
};

export type Record_InventoryEdge = {
  cursor: Scalars['String']['output'];
  node: Record_Inventory;
};

export type Record_InventoryFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Record_InventoryFilter>>;
  await?: InputMaybe<BigIntFilter>;
  await_grn?: InputMaybe<BigIntFilter>;
  backcarpark?: InputMaybe<BigIntFilter>;
  bulk?: InputMaybe<BigIntFilter>;
  damage?: InputMaybe<BigIntFilter>;
  fold?: InputMaybe<BigIntFilter>;
  injection?: InputMaybe<BigIntFilter>;
  latest_update?: InputMaybe<DatetimeFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Record_InventoryFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Record_InventoryFilter>>;
  pipeline?: InputMaybe<BigIntFilter>;
  plt_num?: InputMaybe<StringFilter>;
  prebook?: InputMaybe<BigIntFilter>;
  product_code?: InputMaybe<StringFilter>;
  uuid?: InputMaybe<UuidFilter>;
};

export type Record_InventoryInsertInput = {
  await?: InputMaybe<Scalars['BigInt']['input']>;
  await_grn?: InputMaybe<Scalars['BigInt']['input']>;
  backcarpark?: InputMaybe<Scalars['BigInt']['input']>;
  bulk?: InputMaybe<Scalars['BigInt']['input']>;
  damage?: InputMaybe<Scalars['BigInt']['input']>;
  fold?: InputMaybe<Scalars['BigInt']['input']>;
  injection?: InputMaybe<Scalars['BigInt']['input']>;
  latest_update?: InputMaybe<Scalars['Datetime']['input']>;
  pipeline?: InputMaybe<Scalars['BigInt']['input']>;
  plt_num?: InputMaybe<Scalars['String']['input']>;
  prebook?: InputMaybe<Scalars['BigInt']['input']>;
  product_code?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Record_InventoryInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Inventory>;
};

export type Record_InventoryOrderBy = {
  await?: InputMaybe<OrderByDirection>;
  await_grn?: InputMaybe<OrderByDirection>;
  backcarpark?: InputMaybe<OrderByDirection>;
  bulk?: InputMaybe<OrderByDirection>;
  damage?: InputMaybe<OrderByDirection>;
  fold?: InputMaybe<OrderByDirection>;
  injection?: InputMaybe<OrderByDirection>;
  latest_update?: InputMaybe<OrderByDirection>;
  pipeline?: InputMaybe<OrderByDirection>;
  plt_num?: InputMaybe<OrderByDirection>;
  prebook?: InputMaybe<OrderByDirection>;
  product_code?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
};

export type Record_InventoryUpdateInput = {
  await?: InputMaybe<Scalars['BigInt']['input']>;
  await_grn?: InputMaybe<Scalars['BigInt']['input']>;
  backcarpark?: InputMaybe<Scalars['BigInt']['input']>;
  bulk?: InputMaybe<Scalars['BigInt']['input']>;
  damage?: InputMaybe<Scalars['BigInt']['input']>;
  fold?: InputMaybe<Scalars['BigInt']['input']>;
  injection?: InputMaybe<Scalars['BigInt']['input']>;
  latest_update?: InputMaybe<Scalars['Datetime']['input']>;
  pipeline?: InputMaybe<Scalars['BigInt']['input']>;
  plt_num?: InputMaybe<Scalars['String']['input']>;
  prebook?: InputMaybe<Scalars['BigInt']['input']>;
  product_code?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Record_InventoryUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Inventory>;
};

export type Record_Palletinfo = Node & {
  data_code?: Maybe<Data_Code>;
  generate_time: Scalars['Datetime']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  pdf_url?: Maybe<Scalars['String']['output']>;
  plt_num: Scalars['String']['output'];
  plt_remark?: Maybe<Scalars['String']['output']>;
  product_code: Scalars['String']['output'];
  product_qty: Scalars['BigInt']['output'];
  record_aco_detail?: Maybe<Record_Aco_Detail>;
  record_grnCollection?: Maybe<Record_GrnConnection>;
  record_historyCollection?: Maybe<Record_HistoryConnection>;
  record_inventoryCollection?: Maybe<Record_InventoryConnection>;
  record_slateCollection?: Maybe<Record_SlateConnection>;
  record_stocktakeCollection?: Maybe<Record_StocktakeConnection>;
  record_transferCollection?: Maybe<Record_TransferConnection>;
  report_voidCollection?: Maybe<Report_VoidConnection>;
  series: Scalars['String']['output'];
  stocktake_batch_scanCollection?: Maybe<Stocktake_Batch_ScanConnection>;
};


export type Record_PalletinfoRecord_GrnCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_GrnFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_GrnOrderBy>>;
};


export type Record_PalletinfoRecord_HistoryCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_HistoryFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_HistoryOrderBy>>;
};


export type Record_PalletinfoRecord_InventoryCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_InventoryFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_InventoryOrderBy>>;
};


export type Record_PalletinfoRecord_SlateCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_SlateFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_SlateOrderBy>>;
};


export type Record_PalletinfoRecord_StocktakeCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_StocktakeFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_StocktakeOrderBy>>;
};


export type Record_PalletinfoRecord_TransferCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Record_TransferFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Record_TransferOrderBy>>;
};


export type Record_PalletinfoReport_VoidCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Report_VoidFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Report_VoidOrderBy>>;
};


export type Record_PalletinfoStocktake_Batch_ScanCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Stocktake_Batch_ScanFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Stocktake_Batch_ScanOrderBy>>;
};

export type Record_PalletinfoConnection = {
  edges: Array<Record_PalletinfoEdge>;
  pageInfo: PageInfo;
};

export type Record_PalletinfoDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Palletinfo>;
};

export type Record_PalletinfoEdge = {
  cursor: Scalars['String']['output'];
  node: Record_Palletinfo;
};

export type Record_PalletinfoFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Record_PalletinfoFilter>>;
  generate_time?: InputMaybe<DatetimeFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Record_PalletinfoFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Record_PalletinfoFilter>>;
  pdf_url?: InputMaybe<StringFilter>;
  plt_num?: InputMaybe<StringFilter>;
  plt_remark?: InputMaybe<StringFilter>;
  product_code?: InputMaybe<StringFilter>;
  product_qty?: InputMaybe<BigIntFilter>;
  series?: InputMaybe<StringFilter>;
};

export type Record_PalletinfoInsertInput = {
  generate_time?: InputMaybe<Scalars['Datetime']['input']>;
  pdf_url?: InputMaybe<Scalars['String']['input']>;
  plt_num?: InputMaybe<Scalars['String']['input']>;
  plt_remark?: InputMaybe<Scalars['String']['input']>;
  product_code?: InputMaybe<Scalars['String']['input']>;
  product_qty?: InputMaybe<Scalars['BigInt']['input']>;
  series?: InputMaybe<Scalars['String']['input']>;
};

export type Record_PalletinfoInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Palletinfo>;
};

export type Record_PalletinfoOrderBy = {
  generate_time?: InputMaybe<OrderByDirection>;
  pdf_url?: InputMaybe<OrderByDirection>;
  plt_num?: InputMaybe<OrderByDirection>;
  plt_remark?: InputMaybe<OrderByDirection>;
  product_code?: InputMaybe<OrderByDirection>;
  product_qty?: InputMaybe<OrderByDirection>;
  series?: InputMaybe<OrderByDirection>;
};

export type Record_PalletinfoUpdateInput = {
  generate_time?: InputMaybe<Scalars['Datetime']['input']>;
  pdf_url?: InputMaybe<Scalars['String']['input']>;
  plt_num?: InputMaybe<Scalars['String']['input']>;
  plt_remark?: InputMaybe<Scalars['String']['input']>;
  product_code?: InputMaybe<Scalars['String']['input']>;
  product_qty?: InputMaybe<Scalars['BigInt']['input']>;
  series?: InputMaybe<Scalars['String']['input']>;
};

export type Record_PalletinfoUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Palletinfo>;
};

export type Record_Slate = Node & {
  b_thick: Scalars['Int']['output'];
  batch_num: Scalars['String']['output'];
  centre_hole: Scalars['Int']['output'];
  code: Scalars['String']['output'];
  colour: Scalars['String']['output'];
  data_code?: Maybe<Data_Code>;
  first_off?: Maybe<Scalars['Date']['output']>;
  flame_test: Scalars['Int']['output'];
  length: Scalars['Int']['output'];
  mach_num: Scalars['String']['output'];
  material: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  plt_num: Scalars['String']['output'];
  record_palletinfo?: Maybe<Record_Palletinfo>;
  remark?: Maybe<Scalars['String']['output']>;
  setter: Scalars['String']['output'];
  shape: Scalars['String']['output'];
  t_thick: Scalars['Int']['output'];
  uuid: Scalars['UUID']['output'];
  weight: Scalars['Int']['output'];
  width: Scalars['Int']['output'];
};

export type Record_SlateConnection = {
  edges: Array<Record_SlateEdge>;
  pageInfo: PageInfo;
};

export type Record_SlateDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Slate>;
};

export type Record_SlateEdge = {
  cursor: Scalars['String']['output'];
  node: Record_Slate;
};

export type Record_SlateFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Record_SlateFilter>>;
  b_thick?: InputMaybe<IntFilter>;
  batch_num?: InputMaybe<StringFilter>;
  centre_hole?: InputMaybe<IntFilter>;
  code?: InputMaybe<StringFilter>;
  colour?: InputMaybe<StringFilter>;
  first_off?: InputMaybe<DateFilter>;
  flame_test?: InputMaybe<IntFilter>;
  length?: InputMaybe<IntFilter>;
  mach_num?: InputMaybe<StringFilter>;
  material?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Record_SlateFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Record_SlateFilter>>;
  plt_num?: InputMaybe<StringFilter>;
  remark?: InputMaybe<StringFilter>;
  setter?: InputMaybe<StringFilter>;
  shape?: InputMaybe<StringFilter>;
  t_thick?: InputMaybe<IntFilter>;
  uuid?: InputMaybe<UuidFilter>;
  weight?: InputMaybe<IntFilter>;
  width?: InputMaybe<IntFilter>;
};

export type Record_SlateInsertInput = {
  b_thick?: InputMaybe<Scalars['Int']['input']>;
  batch_num?: InputMaybe<Scalars['String']['input']>;
  centre_hole?: InputMaybe<Scalars['Int']['input']>;
  code?: InputMaybe<Scalars['String']['input']>;
  colour?: InputMaybe<Scalars['String']['input']>;
  first_off?: InputMaybe<Scalars['Date']['input']>;
  flame_test?: InputMaybe<Scalars['Int']['input']>;
  length?: InputMaybe<Scalars['Int']['input']>;
  mach_num?: InputMaybe<Scalars['String']['input']>;
  material?: InputMaybe<Scalars['String']['input']>;
  plt_num?: InputMaybe<Scalars['String']['input']>;
  remark?: InputMaybe<Scalars['String']['input']>;
  setter?: InputMaybe<Scalars['String']['input']>;
  shape?: InputMaybe<Scalars['String']['input']>;
  t_thick?: InputMaybe<Scalars['Int']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
  weight?: InputMaybe<Scalars['Int']['input']>;
  width?: InputMaybe<Scalars['Int']['input']>;
};

export type Record_SlateInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Slate>;
};

export type Record_SlateOrderBy = {
  b_thick?: InputMaybe<OrderByDirection>;
  batch_num?: InputMaybe<OrderByDirection>;
  centre_hole?: InputMaybe<OrderByDirection>;
  code?: InputMaybe<OrderByDirection>;
  colour?: InputMaybe<OrderByDirection>;
  first_off?: InputMaybe<OrderByDirection>;
  flame_test?: InputMaybe<OrderByDirection>;
  length?: InputMaybe<OrderByDirection>;
  mach_num?: InputMaybe<OrderByDirection>;
  material?: InputMaybe<OrderByDirection>;
  plt_num?: InputMaybe<OrderByDirection>;
  remark?: InputMaybe<OrderByDirection>;
  setter?: InputMaybe<OrderByDirection>;
  shape?: InputMaybe<OrderByDirection>;
  t_thick?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
  weight?: InputMaybe<OrderByDirection>;
  width?: InputMaybe<OrderByDirection>;
};

export type Record_SlateUpdateInput = {
  b_thick?: InputMaybe<Scalars['Int']['input']>;
  batch_num?: InputMaybe<Scalars['String']['input']>;
  centre_hole?: InputMaybe<Scalars['Int']['input']>;
  code?: InputMaybe<Scalars['String']['input']>;
  colour?: InputMaybe<Scalars['String']['input']>;
  first_off?: InputMaybe<Scalars['Date']['input']>;
  flame_test?: InputMaybe<Scalars['Int']['input']>;
  length?: InputMaybe<Scalars['Int']['input']>;
  mach_num?: InputMaybe<Scalars['String']['input']>;
  material?: InputMaybe<Scalars['String']['input']>;
  plt_num?: InputMaybe<Scalars['String']['input']>;
  remark?: InputMaybe<Scalars['String']['input']>;
  setter?: InputMaybe<Scalars['String']['input']>;
  shape?: InputMaybe<Scalars['String']['input']>;
  t_thick?: InputMaybe<Scalars['Int']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
  weight?: InputMaybe<Scalars['Int']['input']>;
  width?: InputMaybe<Scalars['Int']['input']>;
};

export type Record_SlateUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Slate>;
};

export type Record_Stocktake = Node & {
  counted_id?: Maybe<Scalars['Int']['output']>;
  counted_name?: Maybe<Scalars['String']['output']>;
  counted_qty?: Maybe<Scalars['BigInt']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  data_id?: Maybe<Data_Id>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  plt_num?: Maybe<Scalars['String']['output']>;
  product_code: Scalars['String']['output'];
  product_desc: Scalars['String']['output'];
  record_palletinfo?: Maybe<Record_Palletinfo>;
  remain_qty?: Maybe<Scalars['BigInt']['output']>;
  uuid: Scalars['UUID']['output'];
};

export type Record_StocktakeConnection = {
  edges: Array<Record_StocktakeEdge>;
  pageInfo: PageInfo;
};

export type Record_StocktakeDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Stocktake>;
};

export type Record_StocktakeEdge = {
  cursor: Scalars['String']['output'];
  node: Record_Stocktake;
};

export type Record_StocktakeFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Record_StocktakeFilter>>;
  counted_id?: InputMaybe<IntFilter>;
  counted_name?: InputMaybe<StringFilter>;
  counted_qty?: InputMaybe<BigIntFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Record_StocktakeFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Record_StocktakeFilter>>;
  plt_num?: InputMaybe<StringFilter>;
  product_code?: InputMaybe<StringFilter>;
  product_desc?: InputMaybe<StringFilter>;
  remain_qty?: InputMaybe<BigIntFilter>;
  uuid?: InputMaybe<UuidFilter>;
};

export type Record_StocktakeInsertInput = {
  counted_id?: InputMaybe<Scalars['Int']['input']>;
  counted_name?: InputMaybe<Scalars['String']['input']>;
  counted_qty?: InputMaybe<Scalars['BigInt']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  plt_num?: InputMaybe<Scalars['String']['input']>;
  product_code?: InputMaybe<Scalars['String']['input']>;
  product_desc?: InputMaybe<Scalars['String']['input']>;
  remain_qty?: InputMaybe<Scalars['BigInt']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Record_StocktakeInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Stocktake>;
};

export type Record_StocktakeOrderBy = {
  counted_id?: InputMaybe<OrderByDirection>;
  counted_name?: InputMaybe<OrderByDirection>;
  counted_qty?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  plt_num?: InputMaybe<OrderByDirection>;
  product_code?: InputMaybe<OrderByDirection>;
  product_desc?: InputMaybe<OrderByDirection>;
  remain_qty?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
};

export type Record_StocktakeUpdateInput = {
  counted_id?: InputMaybe<Scalars['Int']['input']>;
  counted_name?: InputMaybe<Scalars['String']['input']>;
  counted_qty?: InputMaybe<Scalars['BigInt']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  plt_num?: InputMaybe<Scalars['String']['input']>;
  product_code?: InputMaybe<Scalars['String']['input']>;
  product_desc?: InputMaybe<Scalars['String']['input']>;
  remain_qty?: InputMaybe<Scalars['BigInt']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Record_StocktakeUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Stocktake>;
};

export type Record_Transfer = Node & {
  data_id?: Maybe<Data_Id>;
  f_loc: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  operator_id: Scalars['Int']['output'];
  plt_num: Scalars['String']['output'];
  record_palletinfo?: Maybe<Record_Palletinfo>;
  t_loc: Scalars['String']['output'];
  tran_date: Scalars['Datetime']['output'];
  uuid: Scalars['UUID']['output'];
};

export type Record_TransferConnection = {
  edges: Array<Record_TransferEdge>;
  pageInfo: PageInfo;
};

export type Record_TransferDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Transfer>;
};

export type Record_TransferEdge = {
  cursor: Scalars['String']['output'];
  node: Record_Transfer;
};

export type Record_TransferFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Record_TransferFilter>>;
  f_loc?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Record_TransferFilter>;
  operator_id?: InputMaybe<IntFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Record_TransferFilter>>;
  plt_num?: InputMaybe<StringFilter>;
  t_loc?: InputMaybe<StringFilter>;
  tran_date?: InputMaybe<DatetimeFilter>;
  uuid?: InputMaybe<UuidFilter>;
};

export type Record_TransferInsertInput = {
  f_loc?: InputMaybe<Scalars['String']['input']>;
  operator_id?: InputMaybe<Scalars['Int']['input']>;
  plt_num?: InputMaybe<Scalars['String']['input']>;
  t_loc?: InputMaybe<Scalars['String']['input']>;
  tran_date?: InputMaybe<Scalars['Datetime']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Record_TransferInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Transfer>;
};

export type Record_TransferOrderBy = {
  f_loc?: InputMaybe<OrderByDirection>;
  operator_id?: InputMaybe<OrderByDirection>;
  plt_num?: InputMaybe<OrderByDirection>;
  t_loc?: InputMaybe<OrderByDirection>;
  tran_date?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
};

export type Record_TransferUpdateInput = {
  f_loc?: InputMaybe<Scalars['String']['input']>;
  operator_id?: InputMaybe<Scalars['Int']['input']>;
  plt_num?: InputMaybe<Scalars['String']['input']>;
  t_loc?: InputMaybe<Scalars['String']['input']>;
  tran_date?: InputMaybe<Scalars['Datetime']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Record_TransferUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Record_Transfer>;
};

export type Report_Log = Node & {
  data_id?: Maybe<Data_Id>;
  error: Scalars['String']['output'];
  error_info: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  state: Scalars['Boolean']['output'];
  time: Scalars['Datetime']['output'];
  transaction_logCollection?: Maybe<Transaction_LogConnection>;
  user_id: Scalars['Int']['output'];
  uuid: Scalars['UUID']['output'];
};


export type Report_LogTransaction_LogCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<Transaction_LogFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<Transaction_LogOrderBy>>;
};

export type Report_LogConnection = {
  edges: Array<Report_LogEdge>;
  pageInfo: PageInfo;
};

export type Report_LogDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Report_Log>;
};

export type Report_LogEdge = {
  cursor: Scalars['String']['output'];
  node: Report_Log;
};

export type Report_LogFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Report_LogFilter>>;
  error?: InputMaybe<StringFilter>;
  error_info?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Report_LogFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Report_LogFilter>>;
  state?: InputMaybe<BooleanFilter>;
  time?: InputMaybe<DatetimeFilter>;
  user_id?: InputMaybe<IntFilter>;
  uuid?: InputMaybe<UuidFilter>;
};

export type Report_LogInsertInput = {
  error?: InputMaybe<Scalars['String']['input']>;
  error_info?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['Boolean']['input']>;
  time?: InputMaybe<Scalars['Datetime']['input']>;
  user_id?: InputMaybe<Scalars['Int']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Report_LogInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Report_Log>;
};

export type Report_LogOrderBy = {
  error?: InputMaybe<OrderByDirection>;
  error_info?: InputMaybe<OrderByDirection>;
  state?: InputMaybe<OrderByDirection>;
  time?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
};

export type Report_LogUpdateInput = {
  error?: InputMaybe<Scalars['String']['input']>;
  error_info?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['Boolean']['input']>;
  time?: InputMaybe<Scalars['Datetime']['input']>;
  user_id?: InputMaybe<Scalars['Int']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Report_LogUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Report_Log>;
};

export type Report_Void = Node & {
  damage_qty: Scalars['Int']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  plt_num: Scalars['String']['output'];
  reason: Scalars['String']['output'];
  record_palletinfo?: Maybe<Record_Palletinfo>;
  time: Scalars['Datetime']['output'];
  uuid: Scalars['UUID']['output'];
};

export type Report_VoidConnection = {
  edges: Array<Report_VoidEdge>;
  pageInfo: PageInfo;
};

export type Report_VoidDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Report_Void>;
};

export type Report_VoidEdge = {
  cursor: Scalars['String']['output'];
  node: Report_Void;
};

export type Report_VoidFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Report_VoidFilter>>;
  damage_qty?: InputMaybe<IntFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Report_VoidFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Report_VoidFilter>>;
  plt_num?: InputMaybe<StringFilter>;
  reason?: InputMaybe<StringFilter>;
  time?: InputMaybe<DatetimeFilter>;
  uuid?: InputMaybe<UuidFilter>;
};

export type Report_VoidInsertInput = {
  damage_qty?: InputMaybe<Scalars['Int']['input']>;
  plt_num?: InputMaybe<Scalars['String']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  time?: InputMaybe<Scalars['Datetime']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Report_VoidInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Report_Void>;
};

export type Report_VoidOrderBy = {
  damage_qty?: InputMaybe<OrderByDirection>;
  plt_num?: InputMaybe<OrderByDirection>;
  reason?: InputMaybe<OrderByDirection>;
  time?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
};

export type Report_VoidUpdateInput = {
  damage_qty?: InputMaybe<Scalars['Int']['input']>;
  plt_num?: InputMaybe<Scalars['String']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  time?: InputMaybe<Scalars['Datetime']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Report_VoidUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Report_Void>;
};

export type Stock_Level = Node & {
  data_code?: Maybe<Data_Code>;
  description: Scalars['String']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  stock: Scalars['String']['output'];
  stock_level: Scalars['BigInt']['output'];
  update_time: Scalars['Datetime']['output'];
  uuid: Scalars['UUID']['output'];
};

export type Stock_LevelConnection = {
  edges: Array<Stock_LevelEdge>;
  pageInfo: PageInfo;
};

export type Stock_LevelDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stock_Level>;
};

export type Stock_LevelEdge = {
  cursor: Scalars['String']['output'];
  node: Stock_Level;
};

export type Stock_LevelFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Stock_LevelFilter>>;
  description?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Stock_LevelFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Stock_LevelFilter>>;
  stock?: InputMaybe<StringFilter>;
  stock_level?: InputMaybe<BigIntFilter>;
  update_time?: InputMaybe<DatetimeFilter>;
  uuid?: InputMaybe<UuidFilter>;
};

export type Stock_LevelInsertInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  stock?: InputMaybe<Scalars['String']['input']>;
  stock_level?: InputMaybe<Scalars['BigInt']['input']>;
  update_time?: InputMaybe<Scalars['Datetime']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Stock_LevelInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stock_Level>;
};

export type Stock_LevelOrderBy = {
  description?: InputMaybe<OrderByDirection>;
  stock?: InputMaybe<OrderByDirection>;
  stock_level?: InputMaybe<OrderByDirection>;
  update_time?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
};

export type Stock_LevelUpdateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  stock?: InputMaybe<Scalars['String']['input']>;
  stock_level?: InputMaybe<Scalars['BigInt']['input']>;
  update_time?: InputMaybe<Scalars['Datetime']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Stock_LevelUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stock_Level>;
};

export type Stocktake_Batch_Scan = Node & {
  batch_id: Scalars['UUID']['output'];
  counted_qty?: Maybe<Scalars['BigInt']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  data_id?: Maybe<Data_Id>;
  error_message?: Maybe<Scalars['String']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  plt_num?: Maybe<Scalars['String']['output']>;
  product_code: Scalars['String']['output'];
  product_desc?: Maybe<Scalars['String']['output']>;
  record_palletinfo?: Maybe<Record_Palletinfo>;
  scan_timestamp?: Maybe<Scalars['Datetime']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  user_id?: Maybe<Scalars['Int']['output']>;
  user_name?: Maybe<Scalars['String']['output']>;
  uuid: Scalars['UUID']['output'];
};

export type Stocktake_Batch_ScanConnection = {
  edges: Array<Stocktake_Batch_ScanEdge>;
  pageInfo: PageInfo;
};

export type Stocktake_Batch_ScanDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Batch_Scan>;
};

export type Stocktake_Batch_ScanEdge = {
  cursor: Scalars['String']['output'];
  node: Stocktake_Batch_Scan;
};

export type Stocktake_Batch_ScanFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Stocktake_Batch_ScanFilter>>;
  batch_id?: InputMaybe<UuidFilter>;
  counted_qty?: InputMaybe<BigIntFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  error_message?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Stocktake_Batch_ScanFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Stocktake_Batch_ScanFilter>>;
  plt_num?: InputMaybe<StringFilter>;
  product_code?: InputMaybe<StringFilter>;
  product_desc?: InputMaybe<StringFilter>;
  scan_timestamp?: InputMaybe<DatetimeFilter>;
  status?: InputMaybe<StringFilter>;
  user_id?: InputMaybe<IntFilter>;
  user_name?: InputMaybe<StringFilter>;
  uuid?: InputMaybe<UuidFilter>;
};

export type Stocktake_Batch_ScanInsertInput = {
  batch_id?: InputMaybe<Scalars['UUID']['input']>;
  counted_qty?: InputMaybe<Scalars['BigInt']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  error_message?: InputMaybe<Scalars['String']['input']>;
  plt_num?: InputMaybe<Scalars['String']['input']>;
  product_code?: InputMaybe<Scalars['String']['input']>;
  product_desc?: InputMaybe<Scalars['String']['input']>;
  scan_timestamp?: InputMaybe<Scalars['Datetime']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['Int']['input']>;
  user_name?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Stocktake_Batch_ScanInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Batch_Scan>;
};

export type Stocktake_Batch_ScanOrderBy = {
  batch_id?: InputMaybe<OrderByDirection>;
  counted_qty?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  error_message?: InputMaybe<OrderByDirection>;
  plt_num?: InputMaybe<OrderByDirection>;
  product_code?: InputMaybe<OrderByDirection>;
  product_desc?: InputMaybe<OrderByDirection>;
  scan_timestamp?: InputMaybe<OrderByDirection>;
  status?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
  user_name?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
};

export type Stocktake_Batch_ScanUpdateInput = {
  batch_id?: InputMaybe<Scalars['UUID']['input']>;
  counted_qty?: InputMaybe<Scalars['BigInt']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  error_message?: InputMaybe<Scalars['String']['input']>;
  plt_num?: InputMaybe<Scalars['String']['input']>;
  product_code?: InputMaybe<Scalars['String']['input']>;
  product_desc?: InputMaybe<Scalars['String']['input']>;
  scan_timestamp?: InputMaybe<Scalars['Datetime']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['Int']['input']>;
  user_name?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Stocktake_Batch_ScanUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Batch_Scan>;
};

export type Stocktake_Batch_Summary = Node & {
  batch_time: Scalars['Datetime']['output'];
  counted_id?: Maybe<Scalars['Int']['output']>;
  counted_name?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  end_time?: Maybe<Scalars['Datetime']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  product_count?: Maybe<Scalars['Int']['output']>;
  scan_count?: Maybe<Scalars['Int']['output']>;
  start_time?: Maybe<Scalars['Datetime']['output']>;
  total_counted?: Maybe<Scalars['BigInt']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  uuid: Scalars['UUID']['output'];
};

export type Stocktake_Batch_SummaryConnection = {
  edges: Array<Stocktake_Batch_SummaryEdge>;
  pageInfo: PageInfo;
};

export type Stocktake_Batch_SummaryDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Batch_Summary>;
};

export type Stocktake_Batch_SummaryEdge = {
  cursor: Scalars['String']['output'];
  node: Stocktake_Batch_Summary;
};

export type Stocktake_Batch_SummaryFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Stocktake_Batch_SummaryFilter>>;
  batch_time?: InputMaybe<DatetimeFilter>;
  counted_id?: InputMaybe<IntFilter>;
  counted_name?: InputMaybe<StringFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  end_time?: InputMaybe<DatetimeFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Stocktake_Batch_SummaryFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Stocktake_Batch_SummaryFilter>>;
  product_count?: InputMaybe<IntFilter>;
  scan_count?: InputMaybe<IntFilter>;
  start_time?: InputMaybe<DatetimeFilter>;
  total_counted?: InputMaybe<BigIntFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  uuid?: InputMaybe<UuidFilter>;
};

export type Stocktake_Batch_SummaryInsertInput = {
  batch_time?: InputMaybe<Scalars['Datetime']['input']>;
  counted_id?: InputMaybe<Scalars['Int']['input']>;
  counted_name?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  end_time?: InputMaybe<Scalars['Datetime']['input']>;
  product_count?: InputMaybe<Scalars['Int']['input']>;
  scan_count?: InputMaybe<Scalars['Int']['input']>;
  start_time?: InputMaybe<Scalars['Datetime']['input']>;
  total_counted?: InputMaybe<Scalars['BigInt']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Stocktake_Batch_SummaryInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Batch_Summary>;
};

export type Stocktake_Batch_SummaryOrderBy = {
  batch_time?: InputMaybe<OrderByDirection>;
  counted_id?: InputMaybe<OrderByDirection>;
  counted_name?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  end_time?: InputMaybe<OrderByDirection>;
  product_count?: InputMaybe<OrderByDirection>;
  scan_count?: InputMaybe<OrderByDirection>;
  start_time?: InputMaybe<OrderByDirection>;
  total_counted?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
};

export type Stocktake_Batch_SummaryUpdateInput = {
  batch_time?: InputMaybe<Scalars['Datetime']['input']>;
  counted_id?: InputMaybe<Scalars['Int']['input']>;
  counted_name?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  end_time?: InputMaybe<Scalars['Datetime']['input']>;
  product_count?: InputMaybe<Scalars['Int']['input']>;
  scan_count?: InputMaybe<Scalars['Int']['input']>;
  start_time?: InputMaybe<Scalars['Datetime']['input']>;
  total_counted?: InputMaybe<Scalars['BigInt']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Stocktake_Batch_SummaryUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Batch_Summary>;
};

export type Stocktake_Daily_Summary = Node & {
  count_date: Scalars['Date']['output'];
  created_at?: Maybe<Scalars['Datetime']['output']>;
  final_remain_qty?: Maybe<Scalars['BigInt']['output']>;
  last_count_time?: Maybe<Scalars['Datetime']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  pallet_count?: Maybe<Scalars['Int']['output']>;
  product_code: Scalars['String']['output'];
  product_desc?: Maybe<Scalars['String']['output']>;
  total_counted?: Maybe<Scalars['BigInt']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  uuid: Scalars['UUID']['output'];
};

export type Stocktake_Daily_SummaryConnection = {
  edges: Array<Stocktake_Daily_SummaryEdge>;
  pageInfo: PageInfo;
};

export type Stocktake_Daily_SummaryDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Daily_Summary>;
};

export type Stocktake_Daily_SummaryEdge = {
  cursor: Scalars['String']['output'];
  node: Stocktake_Daily_Summary;
};

export type Stocktake_Daily_SummaryFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Stocktake_Daily_SummaryFilter>>;
  count_date?: InputMaybe<DateFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  final_remain_qty?: InputMaybe<BigIntFilter>;
  last_count_time?: InputMaybe<DatetimeFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Stocktake_Daily_SummaryFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Stocktake_Daily_SummaryFilter>>;
  pallet_count?: InputMaybe<IntFilter>;
  product_code?: InputMaybe<StringFilter>;
  product_desc?: InputMaybe<StringFilter>;
  total_counted?: InputMaybe<BigIntFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  uuid?: InputMaybe<UuidFilter>;
};

export type Stocktake_Daily_SummaryInsertInput = {
  count_date?: InputMaybe<Scalars['Date']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  final_remain_qty?: InputMaybe<Scalars['BigInt']['input']>;
  last_count_time?: InputMaybe<Scalars['Datetime']['input']>;
  pallet_count?: InputMaybe<Scalars['Int']['input']>;
  product_code?: InputMaybe<Scalars['String']['input']>;
  product_desc?: InputMaybe<Scalars['String']['input']>;
  total_counted?: InputMaybe<Scalars['BigInt']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Stocktake_Daily_SummaryInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Daily_Summary>;
};

export type Stocktake_Daily_SummaryOrderBy = {
  count_date?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  final_remain_qty?: InputMaybe<OrderByDirection>;
  last_count_time?: InputMaybe<OrderByDirection>;
  pallet_count?: InputMaybe<OrderByDirection>;
  product_code?: InputMaybe<OrderByDirection>;
  product_desc?: InputMaybe<OrderByDirection>;
  total_counted?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
};

export type Stocktake_Daily_SummaryUpdateInput = {
  count_date?: InputMaybe<Scalars['Date']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  final_remain_qty?: InputMaybe<Scalars['BigInt']['input']>;
  last_count_time?: InputMaybe<Scalars['Datetime']['input']>;
  pallet_count?: InputMaybe<Scalars['Int']['input']>;
  product_code?: InputMaybe<Scalars['String']['input']>;
  product_desc?: InputMaybe<Scalars['String']['input']>;
  total_counted?: InputMaybe<Scalars['BigInt']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Stocktake_Daily_SummaryUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Daily_Summary>;
};

export type Stocktake_Report_Cache = Node & {
  cache_data?: Maybe<Scalars['JSON']['output']>;
  expires_at?: Maybe<Scalars['Datetime']['output']>;
  generated_at?: Maybe<Scalars['Datetime']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  report_date: Scalars['Date']['output'];
  report_type?: Maybe<Scalars['String']['output']>;
  uuid: Scalars['UUID']['output'];
};

export type Stocktake_Report_CacheConnection = {
  edges: Array<Stocktake_Report_CacheEdge>;
  pageInfo: PageInfo;
};

export type Stocktake_Report_CacheDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Report_Cache>;
};

export type Stocktake_Report_CacheEdge = {
  cursor: Scalars['String']['output'];
  node: Stocktake_Report_Cache;
};

export type Stocktake_Report_CacheFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Stocktake_Report_CacheFilter>>;
  expires_at?: InputMaybe<DatetimeFilter>;
  generated_at?: InputMaybe<DatetimeFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Stocktake_Report_CacheFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Stocktake_Report_CacheFilter>>;
  report_date?: InputMaybe<DateFilter>;
  report_type?: InputMaybe<StringFilter>;
  uuid?: InputMaybe<UuidFilter>;
};

export type Stocktake_Report_CacheInsertInput = {
  cache_data?: InputMaybe<Scalars['JSON']['input']>;
  expires_at?: InputMaybe<Scalars['Datetime']['input']>;
  generated_at?: InputMaybe<Scalars['Datetime']['input']>;
  report_date?: InputMaybe<Scalars['Date']['input']>;
  report_type?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Stocktake_Report_CacheInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Report_Cache>;
};

export type Stocktake_Report_CacheOrderBy = {
  expires_at?: InputMaybe<OrderByDirection>;
  generated_at?: InputMaybe<OrderByDirection>;
  report_date?: InputMaybe<OrderByDirection>;
  report_type?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
};

export type Stocktake_Report_CacheUpdateInput = {
  cache_data?: InputMaybe<Scalars['JSON']['input']>;
  expires_at?: InputMaybe<Scalars['Datetime']['input']>;
  generated_at?: InputMaybe<Scalars['Datetime']['input']>;
  report_date?: InputMaybe<Scalars['Date']['input']>;
  report_type?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Stocktake_Report_CacheUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Report_Cache>;
};

export type Stocktake_Session = Node & {
  created_at?: Maybe<Scalars['Datetime']['output']>;
  data_id?: Maybe<Data_Id>;
  end_time?: Maybe<Scalars['Datetime']['output']>;
  error_scans?: Maybe<Scalars['Int']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  session_date?: Maybe<Scalars['Date']['output']>;
  session_status?: Maybe<Scalars['String']['output']>;
  start_time?: Maybe<Scalars['Datetime']['output']>;
  success_scans?: Maybe<Scalars['Int']['output']>;
  total_scans?: Maybe<Scalars['Int']['output']>;
  user_id?: Maybe<Scalars['Int']['output']>;
  user_name?: Maybe<Scalars['String']['output']>;
  uuid: Scalars['UUID']['output'];
};

export type Stocktake_SessionConnection = {
  edges: Array<Stocktake_SessionEdge>;
  pageInfo: PageInfo;
};

export type Stocktake_SessionDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Session>;
};

export type Stocktake_SessionEdge = {
  cursor: Scalars['String']['output'];
  node: Stocktake_Session;
};

export type Stocktake_SessionFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Stocktake_SessionFilter>>;
  created_at?: InputMaybe<DatetimeFilter>;
  end_time?: InputMaybe<DatetimeFilter>;
  error_scans?: InputMaybe<IntFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Stocktake_SessionFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Stocktake_SessionFilter>>;
  session_date?: InputMaybe<DateFilter>;
  session_status?: InputMaybe<StringFilter>;
  start_time?: InputMaybe<DatetimeFilter>;
  success_scans?: InputMaybe<IntFilter>;
  total_scans?: InputMaybe<IntFilter>;
  user_id?: InputMaybe<IntFilter>;
  user_name?: InputMaybe<StringFilter>;
  uuid?: InputMaybe<UuidFilter>;
};

export type Stocktake_SessionInsertInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  end_time?: InputMaybe<Scalars['Datetime']['input']>;
  error_scans?: InputMaybe<Scalars['Int']['input']>;
  session_date?: InputMaybe<Scalars['Date']['input']>;
  session_status?: InputMaybe<Scalars['String']['input']>;
  start_time?: InputMaybe<Scalars['Datetime']['input']>;
  success_scans?: InputMaybe<Scalars['Int']['input']>;
  total_scans?: InputMaybe<Scalars['Int']['input']>;
  user_id?: InputMaybe<Scalars['Int']['input']>;
  user_name?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Stocktake_SessionInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Session>;
};

export type Stocktake_SessionOrderBy = {
  created_at?: InputMaybe<OrderByDirection>;
  end_time?: InputMaybe<OrderByDirection>;
  error_scans?: InputMaybe<OrderByDirection>;
  session_date?: InputMaybe<OrderByDirection>;
  session_status?: InputMaybe<OrderByDirection>;
  start_time?: InputMaybe<OrderByDirection>;
  success_scans?: InputMaybe<OrderByDirection>;
  total_scans?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
  user_name?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
};

export type Stocktake_SessionUpdateInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  end_time?: InputMaybe<Scalars['Datetime']['input']>;
  error_scans?: InputMaybe<Scalars['Int']['input']>;
  session_date?: InputMaybe<Scalars['Date']['input']>;
  session_status?: InputMaybe<Scalars['String']['input']>;
  start_time?: InputMaybe<Scalars['Datetime']['input']>;
  success_scans?: InputMaybe<Scalars['Int']['input']>;
  total_scans?: InputMaybe<Scalars['Int']['input']>;
  user_id?: InputMaybe<Scalars['Int']['input']>;
  user_name?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Stocktake_SessionUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Session>;
};

export type Stocktake_Validation_Rules = Node & {
  created_at?: Maybe<Scalars['Datetime']['output']>;
  error_threshold?: Maybe<Scalars['BigFloat']['output']>;
  is_active?: Maybe<Scalars['Boolean']['output']>;
  max_value?: Maybe<Scalars['BigFloat']['output']>;
  min_value?: Maybe<Scalars['BigFloat']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  require_approval?: Maybe<Scalars['Boolean']['output']>;
  rule_name: Scalars['String']['output'];
  rule_type?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  uuid: Scalars['UUID']['output'];
  warning_threshold?: Maybe<Scalars['BigFloat']['output']>;
};

export type Stocktake_Validation_RulesConnection = {
  edges: Array<Stocktake_Validation_RulesEdge>;
  pageInfo: PageInfo;
};

export type Stocktake_Validation_RulesDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Validation_Rules>;
};

export type Stocktake_Validation_RulesEdge = {
  cursor: Scalars['String']['output'];
  node: Stocktake_Validation_Rules;
};

export type Stocktake_Validation_RulesFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Stocktake_Validation_RulesFilter>>;
  created_at?: InputMaybe<DatetimeFilter>;
  error_threshold?: InputMaybe<BigFloatFilter>;
  is_active?: InputMaybe<BooleanFilter>;
  max_value?: InputMaybe<BigFloatFilter>;
  min_value?: InputMaybe<BigFloatFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Stocktake_Validation_RulesFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Stocktake_Validation_RulesFilter>>;
  require_approval?: InputMaybe<BooleanFilter>;
  rule_name?: InputMaybe<StringFilter>;
  rule_type?: InputMaybe<StringFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  uuid?: InputMaybe<UuidFilter>;
  warning_threshold?: InputMaybe<BigFloatFilter>;
};

export type Stocktake_Validation_RulesInsertInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  error_threshold?: InputMaybe<Scalars['BigFloat']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  max_value?: InputMaybe<Scalars['BigFloat']['input']>;
  min_value?: InputMaybe<Scalars['BigFloat']['input']>;
  require_approval?: InputMaybe<Scalars['Boolean']['input']>;
  rule_name?: InputMaybe<Scalars['String']['input']>;
  rule_type?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
  warning_threshold?: InputMaybe<Scalars['BigFloat']['input']>;
};

export type Stocktake_Validation_RulesInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Validation_Rules>;
};

export type Stocktake_Validation_RulesOrderBy = {
  created_at?: InputMaybe<OrderByDirection>;
  error_threshold?: InputMaybe<OrderByDirection>;
  is_active?: InputMaybe<OrderByDirection>;
  max_value?: InputMaybe<OrderByDirection>;
  min_value?: InputMaybe<OrderByDirection>;
  require_approval?: InputMaybe<OrderByDirection>;
  rule_name?: InputMaybe<OrderByDirection>;
  rule_type?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
  warning_threshold?: InputMaybe<OrderByDirection>;
};

export type Stocktake_Validation_RulesUpdateInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  error_threshold?: InputMaybe<Scalars['BigFloat']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  max_value?: InputMaybe<Scalars['BigFloat']['input']>;
  min_value?: InputMaybe<Scalars['BigFloat']['input']>;
  require_approval?: InputMaybe<Scalars['Boolean']['input']>;
  rule_name?: InputMaybe<Scalars['String']['input']>;
  rule_type?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
  warning_threshold?: InputMaybe<Scalars['BigFloat']['input']>;
};

export type Stocktake_Validation_RulesUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Validation_Rules>;
};

export type Stocktake_Variance_Analysis = Node & {
  analysis_date?: Maybe<Scalars['Date']['output']>;
  approved_at?: Maybe<Scalars['Datetime']['output']>;
  approved_by?: Maybe<Scalars['Int']['output']>;
  counted_qty?: Maybe<Scalars['BigInt']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  data_id?: Maybe<Data_Id>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  product_code: Scalars['String']['output'];
  product_desc?: Maybe<Scalars['String']['output']>;
  system_qty?: Maybe<Scalars['BigInt']['output']>;
  uuid: Scalars['UUID']['output'];
  variance_percentage?: Maybe<Scalars['BigFloat']['output']>;
  variance_qty?: Maybe<Scalars['BigInt']['output']>;
  variance_reason?: Maybe<Scalars['String']['output']>;
  variance_value?: Maybe<Scalars['BigFloat']['output']>;
};

export type Stocktake_Variance_AnalysisConnection = {
  edges: Array<Stocktake_Variance_AnalysisEdge>;
  pageInfo: PageInfo;
};

export type Stocktake_Variance_AnalysisDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Variance_Analysis>;
};

export type Stocktake_Variance_AnalysisEdge = {
  cursor: Scalars['String']['output'];
  node: Stocktake_Variance_Analysis;
};

export type Stocktake_Variance_AnalysisFilter = {
  analysis_date?: InputMaybe<DateFilter>;
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Stocktake_Variance_AnalysisFilter>>;
  approved_at?: InputMaybe<DatetimeFilter>;
  approved_by?: InputMaybe<IntFilter>;
  counted_qty?: InputMaybe<BigIntFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Stocktake_Variance_AnalysisFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Stocktake_Variance_AnalysisFilter>>;
  product_code?: InputMaybe<StringFilter>;
  product_desc?: InputMaybe<StringFilter>;
  system_qty?: InputMaybe<BigIntFilter>;
  uuid?: InputMaybe<UuidFilter>;
  variance_percentage?: InputMaybe<BigFloatFilter>;
  variance_qty?: InputMaybe<BigIntFilter>;
  variance_reason?: InputMaybe<StringFilter>;
  variance_value?: InputMaybe<BigFloatFilter>;
};

export type Stocktake_Variance_AnalysisInsertInput = {
  analysis_date?: InputMaybe<Scalars['Date']['input']>;
  approved_at?: InputMaybe<Scalars['Datetime']['input']>;
  approved_by?: InputMaybe<Scalars['Int']['input']>;
  counted_qty?: InputMaybe<Scalars['BigInt']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  product_code?: InputMaybe<Scalars['String']['input']>;
  product_desc?: InputMaybe<Scalars['String']['input']>;
  system_qty?: InputMaybe<Scalars['BigInt']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
  variance_percentage?: InputMaybe<Scalars['BigFloat']['input']>;
  variance_qty?: InputMaybe<Scalars['BigInt']['input']>;
  variance_reason?: InputMaybe<Scalars['String']['input']>;
  variance_value?: InputMaybe<Scalars['BigFloat']['input']>;
};

export type Stocktake_Variance_AnalysisInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Variance_Analysis>;
};

export type Stocktake_Variance_AnalysisOrderBy = {
  analysis_date?: InputMaybe<OrderByDirection>;
  approved_at?: InputMaybe<OrderByDirection>;
  approved_by?: InputMaybe<OrderByDirection>;
  counted_qty?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  product_code?: InputMaybe<OrderByDirection>;
  product_desc?: InputMaybe<OrderByDirection>;
  system_qty?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
  variance_percentage?: InputMaybe<OrderByDirection>;
  variance_qty?: InputMaybe<OrderByDirection>;
  variance_reason?: InputMaybe<OrderByDirection>;
  variance_value?: InputMaybe<OrderByDirection>;
};

export type Stocktake_Variance_AnalysisUpdateInput = {
  analysis_date?: InputMaybe<Scalars['Date']['input']>;
  approved_at?: InputMaybe<Scalars['Datetime']['input']>;
  approved_by?: InputMaybe<Scalars['Int']['input']>;
  counted_qty?: InputMaybe<Scalars['BigInt']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  product_code?: InputMaybe<Scalars['String']['input']>;
  product_desc?: InputMaybe<Scalars['String']['input']>;
  system_qty?: InputMaybe<Scalars['BigInt']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
  variance_percentage?: InputMaybe<Scalars['BigFloat']['input']>;
  variance_qty?: InputMaybe<Scalars['BigInt']['input']>;
  variance_reason?: InputMaybe<Scalars['String']['input']>;
  variance_value?: InputMaybe<Scalars['BigFloat']['input']>;
};

export type Stocktake_Variance_AnalysisUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Variance_Analysis>;
};

export type Stocktake_Variance_Report = Node & {
  count_date: Scalars['Date']['output'];
  counted_stock?: Maybe<Scalars['BigInt']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  product_code: Scalars['String']['output'];
  product_desc?: Maybe<Scalars['String']['output']>;
  system_stock?: Maybe<Scalars['BigInt']['output']>;
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  uuid: Scalars['UUID']['output'];
  variance?: Maybe<Scalars['BigInt']['output']>;
  variance_percentage?: Maybe<Scalars['BigFloat']['output']>;
};

export type Stocktake_Variance_ReportConnection = {
  edges: Array<Stocktake_Variance_ReportEdge>;
  pageInfo: PageInfo;
};

export type Stocktake_Variance_ReportDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Variance_Report>;
};

export type Stocktake_Variance_ReportEdge = {
  cursor: Scalars['String']['output'];
  node: Stocktake_Variance_Report;
};

export type Stocktake_Variance_ReportFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Stocktake_Variance_ReportFilter>>;
  count_date?: InputMaybe<DateFilter>;
  counted_stock?: InputMaybe<BigIntFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Stocktake_Variance_ReportFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Stocktake_Variance_ReportFilter>>;
  product_code?: InputMaybe<StringFilter>;
  product_desc?: InputMaybe<StringFilter>;
  system_stock?: InputMaybe<BigIntFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  uuid?: InputMaybe<UuidFilter>;
  variance?: InputMaybe<BigIntFilter>;
  variance_percentage?: InputMaybe<BigFloatFilter>;
};

export type Stocktake_Variance_ReportInsertInput = {
  count_date?: InputMaybe<Scalars['Date']['input']>;
  counted_stock?: InputMaybe<Scalars['BigInt']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  product_code?: InputMaybe<Scalars['String']['input']>;
  product_desc?: InputMaybe<Scalars['String']['input']>;
  system_stock?: InputMaybe<Scalars['BigInt']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
  variance?: InputMaybe<Scalars['BigInt']['input']>;
  variance_percentage?: InputMaybe<Scalars['BigFloat']['input']>;
};

export type Stocktake_Variance_ReportInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Variance_Report>;
};

export type Stocktake_Variance_ReportOrderBy = {
  count_date?: InputMaybe<OrderByDirection>;
  counted_stock?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  product_code?: InputMaybe<OrderByDirection>;
  product_desc?: InputMaybe<OrderByDirection>;
  system_stock?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
  variance?: InputMaybe<OrderByDirection>;
  variance_percentage?: InputMaybe<OrderByDirection>;
};

export type Stocktake_Variance_ReportUpdateInput = {
  count_date?: InputMaybe<Scalars['Date']['input']>;
  counted_stock?: InputMaybe<Scalars['BigInt']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  product_code?: InputMaybe<Scalars['String']['input']>;
  product_desc?: InputMaybe<Scalars['String']['input']>;
  system_stock?: InputMaybe<Scalars['BigInt']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
  variance?: InputMaybe<Scalars['BigInt']['input']>;
  variance_percentage?: InputMaybe<Scalars['BigFloat']['input']>;
};

export type Stocktake_Variance_ReportUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Stocktake_Variance_Report>;
};

export type Transaction_Log = Node & {
  affected_records?: Maybe<Scalars['JSON']['output']>;
  compensation_actions?: Maybe<Scalars['JSON']['output']>;
  compensation_required?: Maybe<Scalars['Boolean']['output']>;
  completed_at?: Maybe<Scalars['Datetime']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  error_code?: Maybe<Scalars['String']['output']>;
  error_details?: Maybe<Scalars['JSON']['output']>;
  error_message?: Maybe<Scalars['String']['output']>;
  error_stack?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  operation_type: Scalars['String']['output'];
  parent_transaction_id?: Maybe<Scalars['UUID']['output']>;
  post_state?: Maybe<Scalars['JSON']['output']>;
  pre_state?: Maybe<Scalars['JSON']['output']>;
  related_transactions?: Maybe<Array<Maybe<Scalars['UUID']['output']>>>;
  report_log?: Maybe<Report_Log>;
  report_log_id?: Maybe<Scalars['UUID']['output']>;
  rollback_attempted?: Maybe<Scalars['Boolean']['output']>;
  rollback_by?: Maybe<Scalars['String']['output']>;
  rollback_reason?: Maybe<Scalars['String']['output']>;
  rollback_successful?: Maybe<Scalars['Boolean']['output']>;
  rollback_timestamp?: Maybe<Scalars['Datetime']['output']>;
  session_id?: Maybe<Scalars['String']['output']>;
  source_action: Scalars['String']['output'];
  source_module: Scalars['String']['output'];
  source_page: Scalars['String']['output'];
  status?: Maybe<Scalars['String']['output']>;
  step_name?: Maybe<Scalars['String']['output']>;
  step_sequence?: Maybe<Scalars['Int']['output']>;
  transaction_id: Scalars['UUID']['output'];
  updated_at?: Maybe<Scalars['Datetime']['output']>;
  user_clock_number?: Maybe<Scalars['String']['output']>;
  user_id: Scalars['String']['output'];
};

export type Transaction_LogConnection = {
  edges: Array<Transaction_LogEdge>;
  pageInfo: PageInfo;
};

export type Transaction_LogDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Transaction_Log>;
};

export type Transaction_LogEdge = {
  cursor: Scalars['String']['output'];
  node: Transaction_Log;
};

export type Transaction_LogFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Transaction_LogFilter>>;
  compensation_required?: InputMaybe<BooleanFilter>;
  completed_at?: InputMaybe<DatetimeFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  error_code?: InputMaybe<StringFilter>;
  error_message?: InputMaybe<StringFilter>;
  error_stack?: InputMaybe<StringFilter>;
  id?: InputMaybe<IntFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Transaction_LogFilter>;
  operation_type?: InputMaybe<StringFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Transaction_LogFilter>>;
  parent_transaction_id?: InputMaybe<UuidFilter>;
  related_transactions?: InputMaybe<UuidListFilter>;
  report_log_id?: InputMaybe<UuidFilter>;
  rollback_attempted?: InputMaybe<BooleanFilter>;
  rollback_by?: InputMaybe<StringFilter>;
  rollback_reason?: InputMaybe<StringFilter>;
  rollback_successful?: InputMaybe<BooleanFilter>;
  rollback_timestamp?: InputMaybe<DatetimeFilter>;
  session_id?: InputMaybe<StringFilter>;
  source_action?: InputMaybe<StringFilter>;
  source_module?: InputMaybe<StringFilter>;
  source_page?: InputMaybe<StringFilter>;
  status?: InputMaybe<StringFilter>;
  step_name?: InputMaybe<StringFilter>;
  step_sequence?: InputMaybe<IntFilter>;
  transaction_id?: InputMaybe<UuidFilter>;
  updated_at?: InputMaybe<DatetimeFilter>;
  user_clock_number?: InputMaybe<StringFilter>;
  user_id?: InputMaybe<StringFilter>;
};

export type Transaction_LogInsertInput = {
  affected_records?: InputMaybe<Scalars['JSON']['input']>;
  compensation_actions?: InputMaybe<Scalars['JSON']['input']>;
  compensation_required?: InputMaybe<Scalars['Boolean']['input']>;
  completed_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  error_code?: InputMaybe<Scalars['String']['input']>;
  error_details?: InputMaybe<Scalars['JSON']['input']>;
  error_message?: InputMaybe<Scalars['String']['input']>;
  error_stack?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  operation_type?: InputMaybe<Scalars['String']['input']>;
  parent_transaction_id?: InputMaybe<Scalars['UUID']['input']>;
  post_state?: InputMaybe<Scalars['JSON']['input']>;
  pre_state?: InputMaybe<Scalars['JSON']['input']>;
  related_transactions?: InputMaybe<Array<InputMaybe<Scalars['UUID']['input']>>>;
  report_log_id?: InputMaybe<Scalars['UUID']['input']>;
  rollback_attempted?: InputMaybe<Scalars['Boolean']['input']>;
  rollback_by?: InputMaybe<Scalars['String']['input']>;
  rollback_reason?: InputMaybe<Scalars['String']['input']>;
  rollback_successful?: InputMaybe<Scalars['Boolean']['input']>;
  rollback_timestamp?: InputMaybe<Scalars['Datetime']['input']>;
  session_id?: InputMaybe<Scalars['String']['input']>;
  source_action?: InputMaybe<Scalars['String']['input']>;
  source_module?: InputMaybe<Scalars['String']['input']>;
  source_page?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  step_name?: InputMaybe<Scalars['String']['input']>;
  step_sequence?: InputMaybe<Scalars['Int']['input']>;
  transaction_id?: InputMaybe<Scalars['UUID']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  user_clock_number?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['String']['input']>;
};

export type Transaction_LogInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Transaction_Log>;
};

export type Transaction_LogOrderBy = {
  compensation_required?: InputMaybe<OrderByDirection>;
  completed_at?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  error_code?: InputMaybe<OrderByDirection>;
  error_message?: InputMaybe<OrderByDirection>;
  error_stack?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  operation_type?: InputMaybe<OrderByDirection>;
  parent_transaction_id?: InputMaybe<OrderByDirection>;
  report_log_id?: InputMaybe<OrderByDirection>;
  rollback_attempted?: InputMaybe<OrderByDirection>;
  rollback_by?: InputMaybe<OrderByDirection>;
  rollback_reason?: InputMaybe<OrderByDirection>;
  rollback_successful?: InputMaybe<OrderByDirection>;
  rollback_timestamp?: InputMaybe<OrderByDirection>;
  session_id?: InputMaybe<OrderByDirection>;
  source_action?: InputMaybe<OrderByDirection>;
  source_module?: InputMaybe<OrderByDirection>;
  source_page?: InputMaybe<OrderByDirection>;
  status?: InputMaybe<OrderByDirection>;
  step_name?: InputMaybe<OrderByDirection>;
  step_sequence?: InputMaybe<OrderByDirection>;
  transaction_id?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
  user_clock_number?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type Transaction_LogUpdateInput = {
  affected_records?: InputMaybe<Scalars['JSON']['input']>;
  compensation_actions?: InputMaybe<Scalars['JSON']['input']>;
  compensation_required?: InputMaybe<Scalars['Boolean']['input']>;
  completed_at?: InputMaybe<Scalars['Datetime']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  error_code?: InputMaybe<Scalars['String']['input']>;
  error_details?: InputMaybe<Scalars['JSON']['input']>;
  error_message?: InputMaybe<Scalars['String']['input']>;
  error_stack?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  operation_type?: InputMaybe<Scalars['String']['input']>;
  parent_transaction_id?: InputMaybe<Scalars['UUID']['input']>;
  post_state?: InputMaybe<Scalars['JSON']['input']>;
  pre_state?: InputMaybe<Scalars['JSON']['input']>;
  related_transactions?: InputMaybe<Array<InputMaybe<Scalars['UUID']['input']>>>;
  report_log_id?: InputMaybe<Scalars['UUID']['input']>;
  rollback_attempted?: InputMaybe<Scalars['Boolean']['input']>;
  rollback_by?: InputMaybe<Scalars['String']['input']>;
  rollback_reason?: InputMaybe<Scalars['String']['input']>;
  rollback_successful?: InputMaybe<Scalars['Boolean']['input']>;
  rollback_timestamp?: InputMaybe<Scalars['Datetime']['input']>;
  session_id?: InputMaybe<Scalars['String']['input']>;
  source_action?: InputMaybe<Scalars['String']['input']>;
  source_module?: InputMaybe<Scalars['String']['input']>;
  source_page?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  step_name?: InputMaybe<Scalars['String']['input']>;
  step_sequence?: InputMaybe<Scalars['Int']['input']>;
  transaction_id?: InputMaybe<Scalars['UUID']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
  user_clock_number?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['String']['input']>;
};

export type Transaction_LogUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Transaction_Log>;
};

export type User_Navigation_History = Node & {
  created_at?: Maybe<Scalars['Datetime']['output']>;
  device_type?: Maybe<Scalars['String']['output']>;
  id: Scalars['UUID']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  path: Scalars['String']['output'];
  session_id?: Maybe<Scalars['String']['output']>;
  user_id: Scalars['String']['output'];
  visited_at?: Maybe<Scalars['Datetime']['output']>;
};

export type User_Navigation_HistoryConnection = {
  edges: Array<User_Navigation_HistoryEdge>;
  pageInfo: PageInfo;
};

export type User_Navigation_HistoryDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<User_Navigation_History>;
};

export type User_Navigation_HistoryEdge = {
  cursor: Scalars['String']['output'];
  node: User_Navigation_History;
};

export type User_Navigation_HistoryFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<User_Navigation_HistoryFilter>>;
  created_at?: InputMaybe<DatetimeFilter>;
  device_type?: InputMaybe<StringFilter>;
  id?: InputMaybe<UuidFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<User_Navigation_HistoryFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<User_Navigation_HistoryFilter>>;
  path?: InputMaybe<StringFilter>;
  session_id?: InputMaybe<StringFilter>;
  user_id?: InputMaybe<StringFilter>;
  visited_at?: InputMaybe<DatetimeFilter>;
};

export type User_Navigation_HistoryInsertInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  device_type?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  path?: InputMaybe<Scalars['String']['input']>;
  session_id?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['String']['input']>;
  visited_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type User_Navigation_HistoryInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<User_Navigation_History>;
};

export type User_Navigation_HistoryOrderBy = {
  created_at?: InputMaybe<OrderByDirection>;
  device_type?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  path?: InputMaybe<OrderByDirection>;
  session_id?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
  visited_at?: InputMaybe<OrderByDirection>;
};

export type User_Navigation_HistoryUpdateInput = {
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  device_type?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  path?: InputMaybe<Scalars['String']['input']>;
  session_id?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['String']['input']>;
  visited_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type User_Navigation_HistoryUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<User_Navigation_History>;
};

export type User_Navigation_Patterns = Node & {
  from_path: Scalars['String']['output'];
  last_transition?: Maybe<Scalars['Datetime']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  to_path: Scalars['String']['output'];
  transition_count?: Maybe<Scalars['Int']['output']>;
  user_id: Scalars['String']['output'];
};

export type User_Navigation_PatternsConnection = {
  edges: Array<User_Navigation_PatternsEdge>;
  pageInfo: PageInfo;
};

export type User_Navigation_PatternsDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<User_Navigation_Patterns>;
};

export type User_Navigation_PatternsEdge = {
  cursor: Scalars['String']['output'];
  node: User_Navigation_Patterns;
};

export type User_Navigation_PatternsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<User_Navigation_PatternsFilter>>;
  from_path?: InputMaybe<StringFilter>;
  last_transition?: InputMaybe<DatetimeFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<User_Navigation_PatternsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<User_Navigation_PatternsFilter>>;
  to_path?: InputMaybe<StringFilter>;
  transition_count?: InputMaybe<IntFilter>;
  user_id?: InputMaybe<StringFilter>;
};

export type User_Navigation_PatternsInsertInput = {
  from_path?: InputMaybe<Scalars['String']['input']>;
  last_transition?: InputMaybe<Scalars['Datetime']['input']>;
  to_path?: InputMaybe<Scalars['String']['input']>;
  transition_count?: InputMaybe<Scalars['Int']['input']>;
  user_id?: InputMaybe<Scalars['String']['input']>;
};

export type User_Navigation_PatternsInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<User_Navigation_Patterns>;
};

export type User_Navigation_PatternsOrderBy = {
  from_path?: InputMaybe<OrderByDirection>;
  last_transition?: InputMaybe<OrderByDirection>;
  to_path?: InputMaybe<OrderByDirection>;
  transition_count?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
};

export type User_Navigation_PatternsUpdateInput = {
  from_path?: InputMaybe<Scalars['String']['input']>;
  last_transition?: InputMaybe<Scalars['Datetime']['input']>;
  to_path?: InputMaybe<Scalars['String']['input']>;
  transition_count?: InputMaybe<Scalars['Int']['input']>;
  user_id?: InputMaybe<Scalars['String']['input']>;
};

export type User_Navigation_PatternsUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<User_Navigation_Patterns>;
};

export type User_Navigation_Stats = Node & {
  avg_time_spent?: Maybe<Scalars['Int']['output']>;
  first_visited?: Maybe<Scalars['Datetime']['output']>;
  last_visited?: Maybe<Scalars['Datetime']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  path: Scalars['String']['output'];
  user_id: Scalars['String']['output'];
  visit_count?: Maybe<Scalars['Int']['output']>;
};

export type User_Navigation_StatsConnection = {
  edges: Array<User_Navigation_StatsEdge>;
  pageInfo: PageInfo;
};

export type User_Navigation_StatsDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<User_Navigation_Stats>;
};

export type User_Navigation_StatsEdge = {
  cursor: Scalars['String']['output'];
  node: User_Navigation_Stats;
};

export type User_Navigation_StatsFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<User_Navigation_StatsFilter>>;
  avg_time_spent?: InputMaybe<IntFilter>;
  first_visited?: InputMaybe<DatetimeFilter>;
  last_visited?: InputMaybe<DatetimeFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<User_Navigation_StatsFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<User_Navigation_StatsFilter>>;
  path?: InputMaybe<StringFilter>;
  user_id?: InputMaybe<StringFilter>;
  visit_count?: InputMaybe<IntFilter>;
};

export type User_Navigation_StatsInsertInput = {
  avg_time_spent?: InputMaybe<Scalars['Int']['input']>;
  first_visited?: InputMaybe<Scalars['Datetime']['input']>;
  last_visited?: InputMaybe<Scalars['Datetime']['input']>;
  path?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['String']['input']>;
  visit_count?: InputMaybe<Scalars['Int']['input']>;
};

export type User_Navigation_StatsInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<User_Navigation_Stats>;
};

export type User_Navigation_StatsOrderBy = {
  avg_time_spent?: InputMaybe<OrderByDirection>;
  first_visited?: InputMaybe<OrderByDirection>;
  last_visited?: InputMaybe<OrderByDirection>;
  path?: InputMaybe<OrderByDirection>;
  user_id?: InputMaybe<OrderByDirection>;
  visit_count?: InputMaybe<OrderByDirection>;
};

export type User_Navigation_StatsUpdateInput = {
  avg_time_spent?: InputMaybe<Scalars['Int']['input']>;
  first_visited?: InputMaybe<Scalars['Datetime']['input']>;
  last_visited?: InputMaybe<Scalars['Datetime']['input']>;
  path?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['String']['input']>;
  visit_count?: InputMaybe<Scalars['Int']['input']>;
};

export type User_Navigation_StatsUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<User_Navigation_Stats>;
};

export type Work_Level = Node & {
  data_id?: Maybe<Data_Id>;
  grn: Scalars['BigInt']['output'];
  id: Scalars['Int']['output'];
  latest_update: Scalars['Datetime']['output'];
  loading: Scalars['BigInt']['output'];
  move: Scalars['BigInt']['output'];
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  qc: Scalars['BigInt']['output'];
  uuid: Scalars['UUID']['output'];
};

export type Work_LevelConnection = {
  edges: Array<Work_LevelEdge>;
  pageInfo: PageInfo;
};

export type Work_LevelDeleteResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Work_Level>;
};

export type Work_LevelEdge = {
  cursor: Scalars['String']['output'];
  node: Work_Level;
};

export type Work_LevelFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<Work_LevelFilter>>;
  grn?: InputMaybe<BigIntFilter>;
  id?: InputMaybe<IntFilter>;
  latest_update?: InputMaybe<DatetimeFilter>;
  loading?: InputMaybe<BigIntFilter>;
  move?: InputMaybe<BigIntFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<Work_LevelFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<Work_LevelFilter>>;
  qc?: InputMaybe<BigIntFilter>;
  uuid?: InputMaybe<UuidFilter>;
};

export type Work_LevelInsertInput = {
  grn?: InputMaybe<Scalars['BigInt']['input']>;
  id?: InputMaybe<Scalars['Int']['input']>;
  latest_update?: InputMaybe<Scalars['Datetime']['input']>;
  loading?: InputMaybe<Scalars['BigInt']['input']>;
  move?: InputMaybe<Scalars['BigInt']['input']>;
  qc?: InputMaybe<Scalars['BigInt']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Work_LevelInsertResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Work_Level>;
};

export type Work_LevelOrderBy = {
  grn?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  latest_update?: InputMaybe<OrderByDirection>;
  loading?: InputMaybe<OrderByDirection>;
  move?: InputMaybe<OrderByDirection>;
  qc?: InputMaybe<OrderByDirection>;
  uuid?: InputMaybe<OrderByDirection>;
};

export type Work_LevelUpdateInput = {
  grn?: InputMaybe<Scalars['BigInt']['input']>;
  id?: InputMaybe<Scalars['Int']['input']>;
  latest_update?: InputMaybe<Scalars['Datetime']['input']>;
  loading?: InputMaybe<Scalars['BigInt']['input']>;
  move?: InputMaybe<Scalars['BigInt']['input']>;
  qc?: InputMaybe<Scalars['BigInt']['input']>;
  uuid?: InputMaybe<Scalars['UUID']['input']>;
};

export type Work_LevelUpdateResponse = {
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Work_Level>;
};

export type GetDashboardBatchDataQueryVariables = Exact<{
  dateFrom: Scalars['Datetime']['input'];
  dateTo: Scalars['Datetime']['input'];
  todayStart: Scalars['Datetime']['input'];
  productType?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetDashboardBatchDataQuery = { __typename: 'Query', allPallets?: { __typename: 'record_palletinfoConnection', edges: Array<{ __typename: 'record_palletinfoEdge', node: { __typename: 'record_palletinfo', plt_num: string, generate_time: string } }> } | null, todayPallets?: { __typename: 'record_palletinfoConnection', edges: Array<{ __typename: 'record_palletinfoEdge', node: { __typename: 'record_palletinfo', plt_num: string } }> } | null, inventoryData?: { __typename: 'record_inventoryConnection', edges: Array<{ __typename: 'record_inventoryEdge', node: { __typename: 'record_inventory', product_code: string, injection: number, pipeline: number, prebook: number, await: number, fold: number, bulk: number, backcarpark: number, damage: number, await_grn?: number | null } }> } | null, awaitLocationData?: { __typename: 'record_inventoryConnection', edges: Array<{ __typename: 'record_inventoryEdge', node: { __typename: 'record_inventory', product_code: string, await: number } }> } | null, recentOrders?: { __typename: 'data_orderConnection', edges: Array<{ __typename: 'data_orderEdge', node: { __typename: 'data_order', order_ref: string, loaded_qty: string } }> } | null, acoOrders?: { __typename: 'record_acoConnection', edges: Array<{ __typename: 'record_acoEdge', node: { __typename: 'record_aco', uuid: string, order_ref: number, latest_update: string, finished_qty?: number | null } }> } | null, transferRecords?: { __typename: 'record_transferConnection', edges: Array<{ __typename: 'record_transferEdge', node: { __typename: 'record_transfer', uuid: string, tran_date: string, f_loc: string, t_loc: string, plt_num: string } }> } | null, yesterdayTransfers?: { __typename: 'record_transferConnection', edges: Array<{ __typename: 'record_transferEdge', node: { __typename: 'record_transfer', uuid: string } }> } | null, productTypes?: { __typename: 'data_codeConnection', edges: Array<{ __typename: 'data_codeEdge', node: { __typename: 'data_code', code: string, description: string, type: string, standard_qty: number } }> } | null, historyRecords?: { __typename: 'record_historyConnection', edges: Array<{ __typename: 'record_historyEdge', node: { __typename: 'record_history', uuid: string, time: string, action: string, data_id?: { __typename: 'data_id', id: number, name: string } | null } }> } | null };

export type GetAcoOrdersForCardsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAcoOrdersForCardsQuery = { __typename: 'Query', record_acoCollection?: { __typename: 'record_acoConnection', edges: Array<{ __typename: 'record_acoEdge', node: { __typename: 'record_aco', uuid: string, order_ref: number, code: string, required_qty: number, finished_qty?: number | null, latest_update: string } }> } | null };

export type GetAcoOrdersForChartQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAcoOrdersForChartQuery = { __typename: 'Query', record_acoCollection?: { __typename: 'record_acoConnection', edges: Array<{ __typename: 'record_acoEdge', node: { __typename: 'record_aco', uuid: string, order_ref: number, code: string, required_qty: number, finished_qty?: number | null, latest_update: string } }> } | null };

export type GetInventoryTurnoverQueryVariables = Exact<{ [key: string]: never; }>;


export type GetInventoryTurnoverQuery = { __typename: 'Query', record_inventoryCollection?: { __typename: 'record_inventoryConnection', edges: Array<{ __typename: 'record_inventoryEdge', node: { __typename: 'record_inventory', uuid: string, product_code: string, injection: number, pipeline: number, prebook: number, await: number, fold: number, bulk: number, backcarpark: number, await_grn?: number | null, damage: number, latest_update: string } }> } | null, data_orderCollection?: { __typename: 'data_orderConnection', edges: Array<{ __typename: 'data_orderEdge', node: { __typename: 'data_order', uuid: string, product_code: string, product_qty: number, loaded_qty: string, created_at: string } }> } | null };

export type GetInventoryLocationsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetInventoryLocationsQuery = { __typename: 'Query', record_inventoryCollection?: { __typename: 'record_inventoryConnection', edges: Array<{ __typename: 'record_inventoryEdge', node: { __typename: 'record_inventory', uuid: string, product_code: string, injection: number, pipeline: number, prebook: number, await: number, fold: number, bulk: number, backcarpark: number, await_grn?: number | null, damage: number, latest_update: string } }> } | null };

export type GetStocktakeAccuracyQueryVariables = Exact<{ [key: string]: never; }>;


export type GetStocktakeAccuracyQuery = { __typename: 'Query', stocktake_daily_summaryCollection?: { __typename: 'stocktake_daily_summaryConnection', edges: Array<{ __typename: 'stocktake_daily_summaryEdge', node: { __typename: 'stocktake_daily_summary', uuid: string, count_date: string, product_code: string, product_desc?: string | null, pallet_count?: number | null, total_counted?: number | null, final_remain_qty?: number | null, last_count_time?: string | null, created_at?: string | null, updated_at?: string | null } }> } | null };

export type GetTopProductsInventoryQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTopProductsInventoryQuery = { __typename: 'Query', record_inventoryCollection?: { __typename: 'record_inventoryConnection', edges: Array<{ __typename: 'record_inventoryEdge', node: { __typename: 'record_inventory', uuid: string, product_code: string, injection: number, pipeline: number, prebook: number, await: number, fold: number, bulk: number, backcarpark: number, await_grn?: number | null, damage: number, latest_update: string, data_code?: { __typename: 'data_code', description: string, colour: string } | null } }> } | null };

export type GetUserActivityQueryVariables = Exact<{
  startDate: Scalars['Datetime']['input'];
  endDate: Scalars['Datetime']['input'];
}>;


export type GetUserActivityQuery = { __typename: 'Query', record_historyCollection?: { __typename: 'record_historyConnection', edges: Array<{ __typename: 'record_historyEdge', node: { __typename: 'record_history', uuid: string, action: string, time: string, remark: string, plt_num?: string | null, loc?: string | null, data_id?: { __typename: 'data_id', id: number, name: string, department: string } | null } }> } | null };

export type GetVoidRecordsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetVoidRecordsQuery = { __typename: 'Query', report_voidCollection?: { __typename: 'report_voidConnection', edges: Array<{ __typename: 'report_voidEdge', node: { __typename: 'report_void', uuid: string, plt_num: string, reason: string, time: string, damage_qty: number } }> } | null };

export type GetProductionDetailsQueryVariables = Exact<{
  startDate: Scalars['Datetime']['input'];
  endDate: Scalars['Datetime']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetProductionDetailsQuery = { __typename: 'Query', record_palletinfoCollection?: { __typename: 'record_palletinfoConnection', edges: Array<{ __typename: 'record_palletinfoEdge', node: { __typename: 'record_palletinfo', plt_num: string, product_code: string, product_qty: number, generate_time: string, plt_remark?: string | null, series: string, pdf_url?: string | null } }> } | null };

export type GetInjectionProductionStatsQueryVariables = Exact<{
  startDate: Scalars['Datetime']['input'];
  endDate: Scalars['Datetime']['input'];
}>;


export type GetInjectionProductionStatsQuery = { __typename: 'Query', record_palletinfoCollection?: { __typename: 'record_palletinfoConnection', edges: Array<{ __typename: 'record_palletinfoEdge', node: { __typename: 'record_palletinfo', plt_num: string, product_qty: number, product_code: string, generate_time: string } }> } | null };

export type GetStaffWorkloadQueryVariables = Exact<{
  startDate: Scalars['Datetime']['input'];
  endDate: Scalars['Datetime']['input'];
}>;


export type GetStaffWorkloadQuery = { __typename: 'Query', record_historyCollection?: { __typename: 'record_historyConnection', edges: Array<{ __typename: 'record_historyEdge', node: { __typename: 'record_history', id?: number | null, time: string, action: string, plt_num?: string | null, loc?: string | null, remark: string, uuid: string } }> } | null };

export type GetTopProductsByQuantityQueryVariables = Exact<{
  startDate: Scalars['Datetime']['input'];
  endDate: Scalars['Datetime']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetTopProductsByQuantityQuery = { __typename: 'Query', record_palletinfoCollection?: { __typename: 'record_palletinfoConnection', edges: Array<{ __typename: 'record_palletinfoEdge', node: { __typename: 'record_palletinfo', product_code: string, product_qty: number, data_code?: { __typename: 'data_code', description: string, colour: string, type: string } | null } }> } | null };

export type GetTopProductsDetailedQueryVariables = Exact<{
  startDate: Scalars['Datetime']['input'];
  endDate: Scalars['Datetime']['input'];
}>;


export type GetTopProductsDetailedQuery = { __typename: 'Query', record_palletinfoCollection?: { __typename: 'record_palletinfoConnection', edges: Array<{ __typename: 'record_palletinfoEdge', node: { __typename: 'record_palletinfo', plt_num: string, product_code: string, product_qty: number, generate_time: string, series: string, data_code?: { __typename: 'data_code', description: string, colour: string, type: string, standard_qty: number } | null } }> } | null };

export type GetProductByCodeQueryVariables = Exact<{
  code: Scalars['String']['input'];
}>;


export type GetProductByCodeQuery = { __typename: 'Query', data_codeCollection?: { __typename: 'data_codeConnection', edges: Array<{ __typename: 'data_codeEdge', node: { __typename: 'data_code', code: string, description: string, colour: string, standard_qty: number, type: string, remark?: string | null } }> } | null };

export type GetProductsQueryVariables = Exact<{
  codeFilter?: InputMaybe<Scalars['String']['input']>;
  descriptionFilter?: InputMaybe<Scalars['String']['input']>;
  typeFilter?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetProductsQuery = { __typename: 'Query', data_codeCollection?: { __typename: 'data_codeConnection', edges: Array<{ __typename: 'data_codeEdge', node: { __typename: 'data_code', code: string, description: string, colour: string, standard_qty: number, type: string, remark?: string | null } }> } | null };

export type GetHistoryTreeQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetHistoryTreeQuery = { __typename: 'Query', record_historyCollection?: { __typename: 'record_historyConnection', edges: Array<{ __typename: 'record_historyEdge', node: { __typename: 'record_history', id?: number | null, time: string, action: string, plt_num?: string | null, loc?: string | null, remark: string, uuid: string } }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean } } | null };

export type GetInventoryOrderedAnalysisWidgetQueryVariables = Exact<{
  productType?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetInventoryOrderedAnalysisWidgetQuery = { __typename: 'Query', record_inventoryCollection?: { __typename: 'record_inventoryConnection', edges: Array<{ __typename: 'record_inventoryEdge', node: { __typename: 'record_inventory', product_code: string, injection: number, pipeline: number, prebook: number, await: number, fold: number, bulk: number, backcarpark: number, damage: number, await_grn?: number | null, latest_update: string } }> } | null, data_orderCollection?: { __typename: 'data_orderConnection', edges: Array<{ __typename: 'data_orderEdge', node: { __typename: 'data_order', product_code: string, product_qty: number, loaded_qty: string } }> } | null, data_codeCollection?: { __typename: 'data_codeConnection', edges: Array<{ __typename: 'data_codeEdge', node: { __typename: 'data_code', code: string, description: string, type: string, standard_qty: number } }> } | null };

export type GetTotalPalletsCountQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTotalPalletsCountQuery = { __typename: 'Query', record_palletinfoCollection?: { __typename: 'record_palletinfoConnection', edges: Array<{ __typename: 'record_palletinfoEdge', node: { __typename: 'record_palletinfo', plt_num: string } }> } | null };

export type GetTodayTransfersCountQueryVariables = Exact<{
  todayStart: Scalars['Datetime']['input'];
}>;


export type GetTodayTransfersCountQuery = { __typename: 'Query', record_transferCollection?: { __typename: 'record_transferConnection', edges: Array<{ __typename: 'record_transferEdge', node: { __typename: 'record_transfer', uuid: string } }> } | null };

export type GetActiveProductsCountQueryVariables = Exact<{ [key: string]: never; }>;


export type GetActiveProductsCountQuery = { __typename: 'Query', data_codeCollection?: { __typename: 'data_codeConnection', edges: Array<{ __typename: 'data_codeEdge', node: { __typename: 'data_code', code: string, description: string, type: string } }> } | null };

export type GetPendingOrdersCountQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPendingOrdersCountQuery = { __typename: 'Query', data_orderCollection?: { __typename: 'data_orderConnection', edges: Array<{ __typename: 'data_orderEdge', node: { __typename: 'data_order', order_ref: string, loaded_qty: string } }> } | null };

export type GetTransferCountQueryVariables = Exact<{
  startDate: Scalars['Datetime']['input'];
  endDate: Scalars['Datetime']['input'];
}>;


export type GetTransferCountQuery = { __typename: 'Query', record_transferCollection?: { __typename: 'record_transferConnection', edges: Array<{ __typename: 'record_transferEdge', node: { __typename: 'record_transfer', uuid: string, tran_date: string } }> } | null };

export type GetInventoryStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetInventoryStatsQuery = { __typename: 'Query', record_inventoryCollection?: { __typename: 'record_inventoryConnection', edges: Array<{ __typename: 'record_inventoryEdge', node: { __typename: 'record_inventory', product_code: string, injection: number, pipeline: number, prebook: number, await: number, fold: number, bulk: number, backcarpark: number, damage: number, await_grn?: number | null } }> } | null };

export type GetSimpleRecordsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSimpleRecordsQuery = { __typename: 'Query', record_palletinfoCollection?: { __typename: 'record_palletinfoConnection', edges: Array<{ __typename: 'record_palletinfoEdge', node: { __typename: 'record_palletinfo', nodeId: string, plt_num: string, product_code: string, product_qty: number, generate_time: string, series: string } }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } | null };

export type GetDataCodesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDataCodesQuery = { __typename: 'Query', data_codeCollection?: { __typename: 'data_codeConnection', edges: Array<{ __typename: 'data_codeEdge', node: { __typename: 'data_code', nodeId: string, code: string, description: string, type: string, standard_qty: number, colour: string } }> } | null };

export type GetInventoryWithAwaitQueryVariables = Exact<{ [key: string]: never; }>;


export type GetInventoryWithAwaitQuery = { __typename: 'Query', record_inventoryCollection?: { __typename: 'record_inventoryConnection', edges: Array<{ __typename: 'record_inventoryEdge', node: { __typename: 'record_inventory', nodeId: string, plt_num: string, product_code: string, await: number, latest_update: string } }> } | null };

export type GetOrdersListQueryVariables = Exact<{
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetOrdersListQuery = { __typename: 'Query', record_historyCollection?: { __typename: 'record_historyConnection', edges: Array<{ __typename: 'record_historyEdge', node: { __typename: 'record_history', uuid: string, time: string, id?: number | null, action: string, plt_num?: string | null, loc?: string | null, remark: string, data_id?: { __typename: 'data_id', id: number, name: string } | null } }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean } } | null };

export type GetOtherFilesListQueryVariables = Exact<{
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetOtherFilesListQuery = { __typename: 'Query', doc_uploadCollection?: { __typename: 'doc_uploadConnection', edges: Array<{ __typename: 'doc_uploadEdge', node: { __typename: 'doc_upload', uuid: string, doc_name: string, doc_type?: string | null, upload_by: number, created_at: string } }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean } } | null };

export type GetAwaitLocationQtyQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAwaitLocationQtyQuery = { __typename: 'Query', record_inventoryCollection?: { __typename: 'record_inventoryConnection', edges: Array<{ __typename: 'record_inventoryEdge', node: { __typename: 'record_inventory', nodeId: string, await: number, product_code: string } }> } | null };

export type GetOrderStateListQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetOrderStateListQuery = { __typename: 'Query', data_orderCollection?: { __typename: 'data_orderConnection', edges: Array<{ __typename: 'data_orderEdge', node: { __typename: 'data_order', uuid: string, order_ref: string, account_num: string, product_code: string, product_desc: string, product_qty: number, loaded_qty: string, created_at: string, customer_ref?: string | null, invoice_to: string, delivery_add: string } }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean } } | null };

export type GetStillInAwaitQueryVariables = Exact<{
  startDate: Scalars['Datetime']['input'];
  endDate: Scalars['Datetime']['input'];
}>;


export type GetStillInAwaitQuery = { __typename: 'Query', record_palletinfoCollection?: { __typename: 'record_palletinfoConnection', edges: Array<{ __typename: 'record_palletinfoEdge', node: { __typename: 'record_palletinfo', plt_num: string, generate_time: string, record_inventoryCollection?: { __typename: 'record_inventoryConnection', edges: Array<{ __typename: 'record_inventoryEdge', node: { __typename: 'record_inventory', await: number, plt_num: string } }> } | null } }> } | null };

export type GetStillInAwaitOptimizedQueryVariables = Exact<{
  startDate: Scalars['Datetime']['input'];
  endDate: Scalars['Datetime']['input'];
}>;


export type GetStillInAwaitOptimizedQuery = { __typename: 'Query', record_palletinfoCollection?: { __typename: 'record_palletinfoConnection', edges: Array<{ __typename: 'record_palletinfoEdge', node: { __typename: 'record_palletinfo', nodeId: string, plt_num: string, generate_time: string, product_code: string, record_inventoryCollection?: { __typename: 'record_inventoryConnection', edges: Array<{ __typename: 'record_inventoryEdge', node: { __typename: 'record_inventory', nodeId: string, plt_num: string, await: number, latest_update: string } }> } | null } }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, endCursor?: string | null } } | null };

export type GetTransferTimeDistributionQueryVariables = Exact<{
  startDate: Scalars['Datetime']['input'];
  endDate: Scalars['Datetime']['input'];
}>;


export type GetTransferTimeDistributionQuery = { __typename: 'Query', record_transferCollection?: { __typename: 'record_transferConnection', edges: Array<{ __typename: 'record_transferEdge', node: { __typename: 'record_transfer', uuid: string, tran_date: string, f_loc: string, t_loc: string, plt_num: string } }> } | null };

export type GetTransferTimeDistributionOptimizedQueryVariables = Exact<{
  startDate: Scalars['Datetime']['input'];
  endDate: Scalars['Datetime']['input'];
}>;


export type GetTransferTimeDistributionOptimizedQuery = { __typename: 'Query', record_transferCollection?: { __typename: 'record_transferConnection', edges: Array<{ __typename: 'record_transferEdge', node: { __typename: 'record_transfer', nodeId: string, uuid: string, tran_date: string, f_loc: string, t_loc: string, plt_num: string, operator_id: number } }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, endCursor?: string | null } } | null };

export type GetWarehouseTransferListQueryVariables = Exact<{
  startDate: Scalars['Datetime']['input'];
  endDate: Scalars['Datetime']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetWarehouseTransferListQuery = { __typename: 'Query', record_transferCollection?: { __typename: 'record_transferConnection', edges: Array<{ __typename: 'record_transferEdge', node: { __typename: 'record_transfer', uuid: string, tran_date: string, f_loc: string, t_loc: string, plt_num: string, operator_id: number } }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean } } | null };

export type GetWarehouseWorkLevelQueryVariables = Exact<{
  startDate: Scalars['Datetime']['input'];
  endDate: Scalars['Datetime']['input'];
}>;


export type GetWarehouseWorkLevelQuery = { __typename: 'Query', work_levelCollection?: { __typename: 'work_levelConnection', edges: Array<{ __typename: 'work_levelEdge', node: { __typename: 'work_level', uuid: string, id: number, qc: number, move: number, grn: number, loading: number, latest_update: string } }> } | null };


export const GetDashboardBatchDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDashboardBatchData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dateFrom"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dateTo"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"todayStart"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"productType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"allPallets"},"name":{"kind":"Name","value":"record_palletinfoCollection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"plt_num"}},{"kind":"Field","name":{"kind":"Name","value":"generate_time"}}]}}]}}]}},{"kind":"Field","alias":{"kind":"Name","value":"todayPallets"},"name":{"kind":"Name","value":"record_palletinfoCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"generate_time"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"todayStart"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"plt_num"}}]}}]}}]}},{"kind":"Field","alias":{"kind":"Name","value":"inventoryData"},"name":{"kind":"Name","value":"record_inventoryCollection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"product_code"}},{"kind":"Field","name":{"kind":"Name","value":"injection"}},{"kind":"Field","name":{"kind":"Name","value":"pipeline"}},{"kind":"Field","name":{"kind":"Name","value":"prebook"}},{"kind":"Field","name":{"kind":"Name","value":"await"}},{"kind":"Field","name":{"kind":"Name","value":"fold"}},{"kind":"Field","name":{"kind":"Name","value":"bulk"}},{"kind":"Field","name":{"kind":"Name","value":"backcarpark"}},{"kind":"Field","name":{"kind":"Name","value":"damage"}},{"kind":"Field","name":{"kind":"Name","value":"await_grn"}}]}}]}}]}},{"kind":"Field","alias":{"kind":"Name","value":"awaitLocationData"},"name":{"kind":"Name","value":"record_inventoryCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"await"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gt"},"value":{"kind":"IntValue","value":"0"}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"product_code"}},{"kind":"Field","name":{"kind":"Name","value":"await"}}]}}]}}]}},{"kind":"Field","alias":{"kind":"Name","value":"recentOrders"},"name":{"kind":"Name","value":"data_orderCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"order_ref"},"value":{"kind":"EnumValue","value":"DescNullsLast"}}]}]}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"order_ref"}},{"kind":"Field","name":{"kind":"Name","value":"loaded_qty"}}]}}]}}]}},{"kind":"Field","alias":{"kind":"Name","value":"acoOrders"},"name":{"kind":"Name","value":"record_acoCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"latest_update"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dateFrom"}}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"latest_update"},"value":{"kind":"EnumValue","value":"DescNullsLast"}}]}]}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"order_ref"}},{"kind":"Field","name":{"kind":"Name","value":"latest_update"}},{"kind":"Field","name":{"kind":"Name","value":"finished_qty"}}]}}]}}]}},{"kind":"Field","alias":{"kind":"Name","value":"transferRecords"},"name":{"kind":"Name","value":"record_transferCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"tran_date"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dateFrom"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dateTo"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"tran_date"}},{"kind":"Field","name":{"kind":"Name","value":"f_loc"}},{"kind":"Field","name":{"kind":"Name","value":"t_loc"}},{"kind":"Field","name":{"kind":"Name","value":"plt_num"}}]}}]}}]}},{"kind":"Field","alias":{"kind":"Name","value":"yesterdayTransfers"},"name":{"kind":"Name","value":"record_transferCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"tran_date"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dateFrom"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"todayStart"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}}]}}]}}]}},{"kind":"Field","alias":{"kind":"Name","value":"productTypes"},"name":{"kind":"Name","value":"data_codeCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"type"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"productType"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"standard_qty"}}]}}]}}]}},{"kind":"Field","alias":{"kind":"Name","value":"historyRecords"},"name":{"kind":"Name","value":"record_historyCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"time"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dateFrom"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dateTo"}}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"time"},"value":{"kind":"EnumValue","value":"DescNullsLast"}}]}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"data_id"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetDashboardBatchDataQuery, GetDashboardBatchDataQueryVariables>;
export const GetAcoOrdersForCardsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAcoOrdersForCards"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_acoCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"order_ref"},"value":{"kind":"EnumValue","value":"DescNullsLast"}}]}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"order_ref"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"required_qty"}},{"kind":"Field","name":{"kind":"Name","value":"finished_qty"}},{"kind":"Field","name":{"kind":"Name","value":"latest_update"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetAcoOrdersForCardsQuery, GetAcoOrdersForCardsQueryVariables>;
export const GetAcoOrdersForChartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAcoOrdersForChart"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_acoCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"order_ref"},"value":{"kind":"EnumValue","value":"AscNullsLast"}}]}]}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"20"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"order_ref"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"required_qty"}},{"kind":"Field","name":{"kind":"Name","value":"finished_qty"}},{"kind":"Field","name":{"kind":"Name","value":"latest_update"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetAcoOrdersForChartQuery, GetAcoOrdersForChartQueryVariables>;
export const GetInventoryTurnoverDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetInventoryTurnover"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_inventoryCollection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"product_code"}},{"kind":"Field","name":{"kind":"Name","value":"injection"}},{"kind":"Field","name":{"kind":"Name","value":"pipeline"}},{"kind":"Field","name":{"kind":"Name","value":"prebook"}},{"kind":"Field","name":{"kind":"Name","value":"await"}},{"kind":"Field","name":{"kind":"Name","value":"fold"}},{"kind":"Field","name":{"kind":"Name","value":"bulk"}},{"kind":"Field","name":{"kind":"Name","value":"backcarpark"}},{"kind":"Field","name":{"kind":"Name","value":"await_grn"}},{"kind":"Field","name":{"kind":"Name","value":"damage"}},{"kind":"Field","name":{"kind":"Name","value":"latest_update"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"data_orderCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"created_at"},"value":{"kind":"EnumValue","value":"DescNullsLast"}}]}]}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"200"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"product_code"}},{"kind":"Field","name":{"kind":"Name","value":"product_qty"}},{"kind":"Field","name":{"kind":"Name","value":"loaded_qty"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetInventoryTurnoverQuery, GetInventoryTurnoverQueryVariables>;
export const GetInventoryLocationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetInventoryLocations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_inventoryCollection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"product_code"}},{"kind":"Field","name":{"kind":"Name","value":"injection"}},{"kind":"Field","name":{"kind":"Name","value":"pipeline"}},{"kind":"Field","name":{"kind":"Name","value":"prebook"}},{"kind":"Field","name":{"kind":"Name","value":"await"}},{"kind":"Field","name":{"kind":"Name","value":"fold"}},{"kind":"Field","name":{"kind":"Name","value":"bulk"}},{"kind":"Field","name":{"kind":"Name","value":"backcarpark"}},{"kind":"Field","name":{"kind":"Name","value":"await_grn"}},{"kind":"Field","name":{"kind":"Name","value":"damage"}},{"kind":"Field","name":{"kind":"Name","value":"latest_update"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetInventoryLocationsQuery, GetInventoryLocationsQueryVariables>;
export const GetStocktakeAccuracyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetStocktakeAccuracy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stocktake_daily_summaryCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"count_date"},"value":{"kind":"EnumValue","value":"DescNullsLast"}}]}]}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"30"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"count_date"}},{"kind":"Field","name":{"kind":"Name","value":"product_code"}},{"kind":"Field","name":{"kind":"Name","value":"product_desc"}},{"kind":"Field","name":{"kind":"Name","value":"pallet_count"}},{"kind":"Field","name":{"kind":"Name","value":"total_counted"}},{"kind":"Field","name":{"kind":"Name","value":"final_remain_qty"}},{"kind":"Field","name":{"kind":"Name","value":"last_count_time"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetStocktakeAccuracyQuery, GetStocktakeAccuracyQueryVariables>;
export const GetTopProductsInventoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTopProductsInventory"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_inventoryCollection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"product_code"}},{"kind":"Field","name":{"kind":"Name","value":"injection"}},{"kind":"Field","name":{"kind":"Name","value":"pipeline"}},{"kind":"Field","name":{"kind":"Name","value":"prebook"}},{"kind":"Field","name":{"kind":"Name","value":"await"}},{"kind":"Field","name":{"kind":"Name","value":"fold"}},{"kind":"Field","name":{"kind":"Name","value":"bulk"}},{"kind":"Field","name":{"kind":"Name","value":"backcarpark"}},{"kind":"Field","name":{"kind":"Name","value":"await_grn"}},{"kind":"Field","name":{"kind":"Name","value":"damage"}},{"kind":"Field","name":{"kind":"Name","value":"latest_update"}},{"kind":"Field","name":{"kind":"Name","value":"data_code"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"colour"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetTopProductsInventoryQuery, GetTopProductsInventoryQueryVariables>;
export const GetUserActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_historyCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"time"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"time"},"value":{"kind":"EnumValue","value":"DescNullsLast"}}]}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"remark"}},{"kind":"Field","name":{"kind":"Name","value":"plt_num"}},{"kind":"Field","name":{"kind":"Name","value":"loc"}},{"kind":"Field","name":{"kind":"Name","value":"data_id"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"department"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetUserActivityQuery, GetUserActivityQueryVariables>;
export const GetVoidRecordsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetVoidRecords"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"report_voidCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"time"},"value":{"kind":"EnumValue","value":"DescNullsLast"}}]}]}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"100"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"plt_num"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"damage_qty"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetVoidRecordsQuery, GetVoidRecordsQueryVariables>;
export const GetProductionDetailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProductionDetails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"50"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_palletinfoCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"plt_remark"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"ilike"},"value":{"kind":"StringValue","value":"%finished in production%","block":false}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"generate_time"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"generate_time"},"value":{"kind":"EnumValue","value":"DescNullsLast"}}]}]}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"plt_num"}},{"kind":"Field","name":{"kind":"Name","value":"product_code"}},{"kind":"Field","name":{"kind":"Name","value":"product_qty"}},{"kind":"Field","name":{"kind":"Name","value":"generate_time"}},{"kind":"Field","name":{"kind":"Name","value":"plt_remark"}},{"kind":"Field","name":{"kind":"Name","value":"series"}},{"kind":"Field","name":{"kind":"Name","value":"pdf_url"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetProductionDetailsQuery, GetProductionDetailsQueryVariables>;
export const GetInjectionProductionStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetInjectionProductionStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_palletinfoCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"generate_time"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"plt_num"}},{"kind":"Field","name":{"kind":"Name","value":"product_qty"}},{"kind":"Field","name":{"kind":"Name","value":"product_code"}},{"kind":"Field","name":{"kind":"Name","value":"generate_time"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetInjectionProductionStatsQuery, GetInjectionProductionStatsQueryVariables>;
export const GetStaffWorkloadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetStaffWorkload"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_historyCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"time"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"action"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"ilike"},"value":{"kind":"StringValue","value":"%QC passed%","block":false}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"time"},"value":{"kind":"EnumValue","value":"AscNullsLast"}}]}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"plt_num"}},{"kind":"Field","name":{"kind":"Name","value":"loc"}},{"kind":"Field","name":{"kind":"Name","value":"remark"}},{"kind":"Field","name":{"kind":"Name","value":"uuid"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetStaffWorkloadQuery, GetStaffWorkloadQueryVariables>;
export const GetTopProductsByQuantityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTopProductsByQuantity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_palletinfoCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"generate_time"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"product_code"}},{"kind":"Field","name":{"kind":"Name","value":"product_qty"}},{"kind":"Field","name":{"kind":"Name","value":"data_code"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"colour"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetTopProductsByQuantityQuery, GetTopProductsByQuantityQueryVariables>;
export const GetTopProductsDetailedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTopProductsDetailed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_palletinfoCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"generate_time"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"generate_time"},"value":{"kind":"EnumValue","value":"DescNullsLast"}}]}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"plt_num"}},{"kind":"Field","name":{"kind":"Name","value":"product_code"}},{"kind":"Field","name":{"kind":"Name","value":"product_qty"}},{"kind":"Field","name":{"kind":"Name","value":"generate_time"}},{"kind":"Field","name":{"kind":"Name","value":"series"}},{"kind":"Field","name":{"kind":"Name","value":"data_code"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"colour"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"standard_qty"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetTopProductsDetailedQuery, GetTopProductsDetailedQueryVariables>;
export const GetProductByCodeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProductByCode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data_codeCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"code"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"colour"}},{"kind":"Field","name":{"kind":"Name","value":"standard_qty"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"remark"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetProductByCodeQuery, GetProductByCodeQueryVariables>;
export const GetProductsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProducts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"codeFilter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"descriptionFilter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"typeFilter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"50"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data_codeCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"code"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"codeFilter"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"description"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"descriptionFilter"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"type"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"typeFilter"}}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"code"},"value":{"kind":"EnumValue","value":"AscNullsLast"}}]}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"colour"}},{"kind":"Field","name":{"kind":"Name","value":"standard_qty"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"remark"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetProductsQuery, GetProductsQueryVariables>;
export const GetHistoryTreeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetHistoryTree"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"50"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_historyCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"time"},"value":{"kind":"EnumValue","value":"DescNullsLast"}}]}]}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"plt_num"}},{"kind":"Field","name":{"kind":"Name","value":"loc"}},{"kind":"Field","name":{"kind":"Name","value":"remark"}},{"kind":"Field","name":{"kind":"Name","value":"uuid"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}}]}}]}}]}}]} as unknown as DocumentNode<GetHistoryTreeQuery, GetHistoryTreeQueryVariables>;
export const GetInventoryOrderedAnalysisWidgetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetInventoryOrderedAnalysisWidget"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"productType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_inventoryCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"or"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"product_code"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"neq"},"value":{"kind":"StringValue","value":"","block":false}}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"product_code"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"is"},"value":{"kind":"NullValue"}}]}}]}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"product_code"}},{"kind":"Field","name":{"kind":"Name","value":"injection"}},{"kind":"Field","name":{"kind":"Name","value":"pipeline"}},{"kind":"Field","name":{"kind":"Name","value":"prebook"}},{"kind":"Field","name":{"kind":"Name","value":"await"}},{"kind":"Field","name":{"kind":"Name","value":"fold"}},{"kind":"Field","name":{"kind":"Name","value":"bulk"}},{"kind":"Field","name":{"kind":"Name","value":"backcarpark"}},{"kind":"Field","name":{"kind":"Name","value":"damage"}},{"kind":"Field","name":{"kind":"Name","value":"await_grn"}},{"kind":"Field","name":{"kind":"Name","value":"latest_update"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"data_orderCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"or"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"product_code"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"neq"},"value":{"kind":"StringValue","value":"","block":false}}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"product_code"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"is"},"value":{"kind":"NullValue"}}]}}]}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"product_code"}},{"kind":"Field","name":{"kind":"Name","value":"product_qty"}},{"kind":"Field","name":{"kind":"Name","value":"loaded_qty"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"data_codeCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"type"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"productType"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"standard_qty"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetInventoryOrderedAnalysisWidgetQuery, GetInventoryOrderedAnalysisWidgetQueryVariables>;
export const GetTotalPalletsCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTotalPalletsCount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_palletinfoCollection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"plt_num"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetTotalPalletsCountQuery, GetTotalPalletsCountQueryVariables>;
export const GetTodayTransfersCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTodayTransfersCount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"todayStart"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_transferCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"tran_date"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"todayStart"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetTodayTransfersCountQuery, GetTodayTransfersCountQueryVariables>;
export const GetActiveProductsCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActiveProductsCount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data_codeCollection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetActiveProductsCountQuery, GetActiveProductsCountQueryVariables>;
export const GetPendingOrdersCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPendingOrdersCount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data_orderCollection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"order_ref"}},{"kind":"Field","name":{"kind":"Name","value":"loaded_qty"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetPendingOrdersCountQuery, GetPendingOrdersCountQueryVariables>;
export const GetTransferCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTransferCount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_transferCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"tran_date"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"tran_date"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetTransferCountQuery, GetTransferCountQueryVariables>;
export const GetInventoryStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetInventoryStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_inventoryCollection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"product_code"}},{"kind":"Field","name":{"kind":"Name","value":"injection"}},{"kind":"Field","name":{"kind":"Name","value":"pipeline"}},{"kind":"Field","name":{"kind":"Name","value":"prebook"}},{"kind":"Field","name":{"kind":"Name","value":"await"}},{"kind":"Field","name":{"kind":"Name","value":"fold"}},{"kind":"Field","name":{"kind":"Name","value":"bulk"}},{"kind":"Field","name":{"kind":"Name","value":"backcarpark"}},{"kind":"Field","name":{"kind":"Name","value":"damage"}},{"kind":"Field","name":{"kind":"Name","value":"await_grn"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetInventoryStatsQuery, GetInventoryStatsQueryVariables>;
export const GetSimpleRecordsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSimpleRecords"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_palletinfoCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodeId"}},{"kind":"Field","name":{"kind":"Name","value":"plt_num"}},{"kind":"Field","name":{"kind":"Name","value":"product_code"}},{"kind":"Field","name":{"kind":"Name","value":"product_qty"}},{"kind":"Field","name":{"kind":"Name","value":"generate_time"}},{"kind":"Field","name":{"kind":"Name","value":"series"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"startCursor"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<GetSimpleRecordsQuery, GetSimpleRecordsQueryVariables>;
export const GetDataCodesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDataCodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data_codeCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodeId"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"standard_qty"}},{"kind":"Field","name":{"kind":"Name","value":"colour"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetDataCodesQuery, GetDataCodesQueryVariables>;
export const GetInventoryWithAwaitDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetInventoryWithAwait"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_inventoryCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"await"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gt"},"value":{"kind":"IntValue","value":"0"}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodeId"}},{"kind":"Field","name":{"kind":"Name","value":"plt_num"}},{"kind":"Field","name":{"kind":"Name","value":"product_code"}},{"kind":"Field","name":{"kind":"Name","value":"await"}},{"kind":"Field","name":{"kind":"Name","value":"latest_update"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetInventoryWithAwaitQuery, GetInventoryWithAwaitQueryVariables>;
export const GetOrdersListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrdersList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_historyCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"action"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"StringValue","value":"Order Upload","block":false}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"time"},"value":{"kind":"EnumValue","value":"DescNullsLast"}}]}]}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"plt_num"}},{"kind":"Field","name":{"kind":"Name","value":"loc"}},{"kind":"Field","name":{"kind":"Name","value":"remark"}},{"kind":"Field","name":{"kind":"Name","value":"data_id"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}}]}}]}}]}}]} as unknown as DocumentNode<GetOrdersListQuery, GetOrdersListQueryVariables>;
export const GetOtherFilesListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOtherFilesList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"doc_uploadCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"not"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"doc_type"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"StringValue","value":"order","block":false}}]}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"created_at"},"value":{"kind":"EnumValue","value":"DescNullsLast"}}]}]}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"doc_name"}},{"kind":"Field","name":{"kind":"Name","value":"doc_type"}},{"kind":"Field","name":{"kind":"Name","value":"upload_by"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}}]}}]}}]}}]} as unknown as DocumentNode<GetOtherFilesListQuery, GetOtherFilesListQueryVariables>;
export const GetAwaitLocationQtyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAwaitLocationQty"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_inventoryCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"await"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gt"},"value":{"kind":"IntValue","value":"0"}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodeId"}},{"kind":"Field","name":{"kind":"Name","value":"await"}},{"kind":"Field","name":{"kind":"Name","value":"product_code"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetAwaitLocationQtyQuery, GetAwaitLocationQtyQueryVariables>;
export const GetOrderStateListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrderStateList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"50"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data_orderCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"or"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"loaded_qty"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"is"},"value":{"kind":"NullValue"}}]}}]}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"created_at"},"value":{"kind":"EnumValue","value":"DescNullsLast"}}]}]}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"order_ref"}},{"kind":"Field","name":{"kind":"Name","value":"account_num"}},{"kind":"Field","name":{"kind":"Name","value":"product_code"}},{"kind":"Field","name":{"kind":"Name","value":"product_desc"}},{"kind":"Field","name":{"kind":"Name","value":"product_qty"}},{"kind":"Field","name":{"kind":"Name","value":"loaded_qty"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"customer_ref"}},{"kind":"Field","name":{"kind":"Name","value":"invoice_to"}},{"kind":"Field","name":{"kind":"Name","value":"delivery_add"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}}]}}]}}]}}]} as unknown as DocumentNode<GetOrderStateListQuery, GetOrderStateListQueryVariables>;
export const GetStillInAwaitDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetStillInAwait"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_palletinfoCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"generate_time"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"plt_num"}},{"kind":"Field","name":{"kind":"Name","value":"generate_time"}},{"kind":"Field","name":{"kind":"Name","value":"record_inventoryCollection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"await"}},{"kind":"Field","name":{"kind":"Name","value":"plt_num"}}]}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetStillInAwaitQuery, GetStillInAwaitQueryVariables>;
export const GetStillInAwaitOptimizedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetStillInAwaitOptimized"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_palletinfoCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"generate_time"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodeId"}},{"kind":"Field","name":{"kind":"Name","value":"plt_num"}},{"kind":"Field","name":{"kind":"Name","value":"generate_time"}},{"kind":"Field","name":{"kind":"Name","value":"product_code"}},{"kind":"Field","name":{"kind":"Name","value":"record_inventoryCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"await"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gt"},"value":{"kind":"IntValue","value":"0"}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodeId"}},{"kind":"Field","name":{"kind":"Name","value":"plt_num"}},{"kind":"Field","name":{"kind":"Name","value":"await"}},{"kind":"Field","name":{"kind":"Name","value":"latest_update"}}]}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<GetStillInAwaitOptimizedQuery, GetStillInAwaitOptimizedQueryVariables>;
export const GetTransferTimeDistributionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTransferTimeDistribution"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_transferCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"tran_date"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"tran_date"},"value":{"kind":"EnumValue","value":"AscNullsLast"}}]}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"tran_date"}},{"kind":"Field","name":{"kind":"Name","value":"f_loc"}},{"kind":"Field","name":{"kind":"Name","value":"t_loc"}},{"kind":"Field","name":{"kind":"Name","value":"plt_num"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetTransferTimeDistributionQuery, GetTransferTimeDistributionQueryVariables>;
export const GetTransferTimeDistributionOptimizedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTransferTimeDistributionOptimized"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_transferCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"tran_date"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"tran_date"},"value":{"kind":"EnumValue","value":"AscNullsLast"}}]}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodeId"}},{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"tran_date"}},{"kind":"Field","name":{"kind":"Name","value":"f_loc"}},{"kind":"Field","name":{"kind":"Name","value":"t_loc"}},{"kind":"Field","name":{"kind":"Name","value":"plt_num"}},{"kind":"Field","name":{"kind":"Name","value":"operator_id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<GetTransferTimeDistributionOptimizedQuery, GetTransferTimeDistributionOptimizedQueryVariables>;
export const GetWarehouseTransferListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWarehouseTransferList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"50"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"record_transferCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"tran_date"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"tran_date"},"value":{"kind":"EnumValue","value":"DescNullsLast"}}]}]}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"tran_date"}},{"kind":"Field","name":{"kind":"Name","value":"f_loc"}},{"kind":"Field","name":{"kind":"Name","value":"t_loc"}},{"kind":"Field","name":{"kind":"Name","value":"plt_num"}},{"kind":"Field","name":{"kind":"Name","value":"operator_id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}}]}}]}}]}}]} as unknown as DocumentNode<GetWarehouseTransferListQuery, GetWarehouseTransferListQueryVariables>;
export const GetWarehouseWorkLevelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWarehouseWorkLevel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"work_levelCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"latest_update"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"gte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lte"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"latest_update"},"value":{"kind":"EnumValue","value":"AscNullsLast"}}]}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"qc"}},{"kind":"Field","name":{"kind":"Name","value":"move"}},{"kind":"Field","name":{"kind":"Name","value":"grn"}},{"kind":"Field","name":{"kind":"Name","value":"loading"}},{"kind":"Field","name":{"kind":"Name","value":"latest_update"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetWarehouseWorkLevelQuery, GetWarehouseWorkLevelQueryVariables>;