export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never;
};
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  DateTime: { input: any; output: any };
  JSON: { input: any; output: any };
};

export type DateRangeInput = {
  end?: InputMaybe<Scalars['DateTime']['input']>;
  start?: InputMaybe<Scalars['DateTime']['input']>;
};

export type InventorySearchResult = {
  __typename?: 'InventorySearchResult';
  id: Scalars['ID']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  pltNum?: Maybe<Scalars['String']['output']>;
  productCode: Scalars['String']['output'];
  totalStock: Scalars['Float']['output'];
};

export enum LocationType {
  Await = 'AWAIT',
  AwaitGrn = 'AWAIT_GRN',
  Backcarpark = 'BACKCARPARK',
  Bulk = 'BULK',
  Damage = 'DAMAGE',
  Fold = 'FOLD',
  Injection = 'INJECTION',
  Pipeline = 'PIPELINE',
  Prebook = 'PREBOOK',
}

export enum OrderStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Pending = 'PENDING',
  Processing = 'PROCESSING',
}

export type PageInfo = {
  __typename?: 'PageInfo';
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  totalCount: Scalars['Int']['output'];
};

export type PaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type PalletSearchResult = {
  __typename?: 'PalletSearchResult';
  generateTime: Scalars['DateTime']['output'];
  isAvailable: Scalars['Boolean']['output'];
  pltNum: Scalars['String']['output'];
  productCode: Scalars['String']['output'];
  productQty: Scalars['Float']['output'];
  series?: Maybe<Scalars['String']['output']>;
};

export type ProductSearchResult = {
  __typename?: 'ProductSearchResult';
  code: Scalars['String']['output'];
  colour?: Maybe<Scalars['String']['output']>;
  description: Scalars['String']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  totalPallets: Scalars['Int']['output'];
  totalStock: Scalars['Float']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  searchCard: SearchCardData;
  searchSuggestions: Array<SearchSuggestion>;
};

export type QuerySearchCardArgs = {
  input: SearchCardInput;
};

export type QuerySearchSuggestionsArgs = {
  entity?: InputMaybe<SearchableEntity>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};

export type SearchCardData = {
  __typename?: 'SearchCardData';
  results: SearchResultCollection;
  searchMeta: SearchMetadata;
  suggestions: Array<SearchSuggestion>;
};

export type SearchCardInput = {
  entities?: InputMaybe<Array<SearchableEntity>>;
  mode: SearchMode;
  pagination?: InputMaybe<PaginationInput>;
  query: Scalars['String']['input'];
  type?: InputMaybe<SearchType>;
};

export type SearchMetadata = {
  __typename?: 'SearchMetadata';
  entities: Array<SearchableEntity>;
  hasMore: Scalars['Boolean']['output'];
  processedQuery: Scalars['String']['output'];
  query: Scalars['String']['output'];
  searchMode: SearchMode;
  searchTime: Scalars['Float']['output'];
  searchType: SearchType;
  totalResults: Scalars['Int']['output'];
};

export enum SearchMode {
  Entity = 'ENTITY',
  Global = 'GLOBAL',
  Mixed = 'MIXED',
  Suggestion = 'SUGGESTION',
}

export type SearchResultAction = {
  __typename?: 'SearchResultAction';
  action: Scalars['String']['output'];
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  requiresAuth: Scalars['Boolean']['output'];
  url?: Maybe<Scalars['String']['output']>;
};

export type SearchResultCollection = {
  __typename?: 'SearchResultCollection';
  items: Array<SearchResultItem>;
  pageInfo: PageInfo;
};

export type SearchResultData = InventorySearchResult | PalletSearchResult | ProductSearchResult;

export type SearchResultItem = {
  __typename?: 'SearchResultItem';
  actions: Array<SearchResultAction>;
  data: SearchResultData;
  description?: Maybe<Scalars['String']['output']>;
  entity: SearchableEntity;
  id: Scalars['ID']['output'];
  matchedFields: Array<Scalars['String']['output']>;
  relevanceScore: Scalars['Float']['output'];
  subtitle?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type SearchSuggestion = {
  __typename?: 'SearchSuggestion';
  count?: Maybe<Scalars['Int']['output']>;
  entity?: Maybe<SearchableEntity>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  score: Scalars['Float']['output'];
  text: Scalars['String']['output'];
  type: SuggestionType;
};

export enum SearchType {
  Advanced = 'ADVANCED',
  Barcode = 'BARCODE',
  Code = 'CODE',
  Exact = 'EXACT',
  Fuzzy = 'FUZZY',
  Text = 'TEXT',
}

export enum SearchableEntity {
  File = 'FILE',
  Grn = 'GRN',
  History = 'HISTORY',
  Inventory = 'INVENTORY',
  Order = 'ORDER',
  Pallet = 'PALLET',
  Product = 'PRODUCT',
  Supplier = 'SUPPLIER',
  Transfer = 'TRANSFER',
  User = 'USER',
}

export enum SortDirection {
  Asc = 'ASC',
  Desc = 'DESC',
}

export enum SuggestionType {
  Autocomplete = 'AUTOCOMPLETE',
  PopularSearch = 'POPULAR_SEARCH',
  RecentSearch = 'RECENT_SEARCH',
  RelatedSearch = 'RELATED_SEARCH',
  SpellingCorrection = 'SPELLING_CORRECTION',
}

export type SimpleSearchCardQueryVariables = Exact<{
  input: SearchCardInput;
}>;

export type SimpleSearchCardQuery = {
  __typename?: 'Query';
  searchCard: {
    __typename?: 'SearchCardData';
    searchMeta: {
      __typename?: 'SearchMetadata';
      query: string;
      totalResults: number;
      searchTime: number;
    };
  };
};
