/**
 * Supabase 數據庫類型定義 - 統一管理
 * 從 lib/types/supabase-generated.ts 遷移完整的數據庫類型
 */

import { SupabaseClient as BaseSupabaseClient, User } from '@supabase/supabase-js';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.3 (519615d)';
  };
  public: {
    Tables: {
      API: {
        Row: {
          description: string | null;
          name: string;
          uuid: string;
          value: string;
        };
        Insert: {
          description?: string | null;
          name: string;
          uuid?: string;
          value: string;
        };
        Update: {
          description?: string | null;
          name?: string;
          uuid?: string;
          value?: string;
        };
        Relationships: [];
      };
      data_code: {
        Row: {
          code: string;
          colour: string;
          description: string;
          remark: string | null;
          standard_qty: number;
          type: string;
        };
        Insert: {
          code: string;
          colour?: string;
          description: string;
          remark?: string | null;
          standard_qty?: number;
          type?: string;
        };
        Update: {
          code?: string;
          colour?: string;
          description?: string;
          remark?: string | null;
          standard_qty?: number;
          type?: string;
        };
        Relationships: [];
      };
      data_id: {
        Row: {
          department: string;
          email: string | null;
          icon_url: string | null;
          id: number;
          name: string;
          position: string;
          uuid: string;
        };
        Insert: {
          department: string;
          email?: string | null;
          icon_url?: string | null;
          id: number;
          name: string;
          position?: string;
          uuid?: string;
        };
        Update: {
          department?: string;
          email?: string | null;
          icon_url?: string | null;
          id?: number;
          name?: string;
          position?: string;
          uuid?: string;
        };
        Relationships: [];
      };
      data_supplier: {
        Row: {
          supplier_code: string;
          supplier_name: string | null;
        };
        Insert: {
          supplier_code: string;
          supplier_name?: string | null;
        };
        Update: {
          supplier_code?: string;
          supplier_name?: string | null;
        };
        Relationships: [];
      };
      record_palletinfo: {
        Row: {
          generate_time: string;
          pdf_url: string | null;
          plt_num: string;
          plt_remark: string | null;
          product_code: string;
          product_qty: number;
          series: string;
        };
        Insert: {
          generate_time?: string;
          pdf_url?: string | null;
          plt_num: string;
          plt_remark?: string | null;
          product_code: string;
          product_qty?: number;
          series: string;
        };
        Update: {
          generate_time?: string;
          pdf_url?: string | null;
          plt_num?: string;
          plt_remark?: string | null;
          product_code?: string;
          product_qty?: number;
          series?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'record_palletinfo_product_code_fkey';
            columns: ['product_code'];
            isOneToOne: false;
            referencedRelation: 'data_code';
            referencedColumns: ['code'];
          },
        ];
      };
      record_history: {
        Row: {
          action: string;
          id: number | null;
          loc: string | null;
          plt_num: string | null;
          remark: string;
          time: string;
          uuid: string;
        };
        Insert: {
          action: string;
          id?: number | null;
          loc?: string | null;
          plt_num?: string | null;
          remark: string;
          time?: string;
          uuid?: string;
        };
        Update: {
          action?: string;
          id?: number | null;
          loc?: string | null;
          plt_num?: string | null;
          remark?: string;
          time?: string;
          uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'record_history_op_id_fkey';
            columns: ['id'];
            isOneToOne: false;
            referencedRelation: 'data_id';
            referencedColumns: ['id'];
          },
        ];
      };
      record_inventory: {
        Row: {
          await: number;
          await_grn: number | null;
          backcarpark: number;
          bulk: number;
          damage: number;
          fold: number;
          injection: number;
          latest_update: string | null;
          pipeline: number;
          plt_num: string;
          prebook: number;
          product_code: string;
          uuid: string;
        };
        Insert: {
          await?: number;
          await_grn?: number | null;
          backcarpark?: number;
          bulk?: number;
          damage?: number;
          fold?: number;
          injection?: number;
          latest_update?: string | null;
          pipeline?: number;
          plt_num: string;
          prebook?: number;
          product_code?: string;
          uuid?: string;
        };
        Update: {
          await?: number;
          await_grn?: number | null;
          backcarpark?: number;
          bulk?: number;
          damage?: number;
          fold?: number;
          injection?: number;
          latest_update?: string | null;
          pipeline?: number;
          plt_num?: string;
          prebook?: number;
          product_code?: string;
          uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'record_inventory_plt_num_fkey';
            columns: ['plt_num'];
            isOneToOne: false;
            referencedRelation: 'record_palletinfo';
            referencedColumns: ['plt_num'];
          },
          {
            foreignKeyName: 'record_inventory_product_code_fkey';
            columns: ['product_code'];
            isOneToOne: false;
            referencedRelation: 'data_code';
            referencedColumns: ['code'];
          },
        ];
      };
      record_transfer: {
        Row: {
          f_loc: string;
          operator_id: number;
          plt_num: string;
          t_loc: string;
          tran_date: string;
          uuid: string;
        };
        Insert: {
          f_loc: string;
          operator_id: number;
          plt_num: string;
          t_loc: string;
          tran_date?: string;
          uuid?: string;
        };
        Update: {
          f_loc?: string;
          operator_id?: number;
          plt_num?: string;
          t_loc?: string;
          tran_date?: string;
          uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'record_transfer_operator_id_fkey';
            columns: ['operator_id'];
            isOneToOne: false;
            referencedRelation: 'data_id';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'record_transfer_plt_num_fkey';
            columns: ['plt_num'];
            isOneToOne: false;
            referencedRelation: 'record_palletinfo';
            referencedColumns: ['plt_num'];
          },
        ];
      };
      record_aco: {
        Row: {
          code: string;
          finished_qty: number | null;
          latest_update: string;
          order_ref: number;
          required_qty: number;
          uuid: string;
        };
        Insert: {
          code: string;
          finished_qty?: number | null;
          latest_update?: string;
          order_ref: number;
          required_qty: number;
          uuid?: string;
        };
        Update: {
          code?: string;
          finished_qty?: number | null;
          latest_update?: string;
          order_ref?: number;
          required_qty?: number;
          uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'record_aco2_code_fkey';
            columns: ['code'];
            isOneToOne: false;
            referencedRelation: 'data_code';
            referencedColumns: ['code'];
          },
        ];
      };
      record_grn: {
        Row: {
          creat_time: string;
          grn_ref: number;
          gross_weight: number;
          material_code: string;
          net_weight: number;
          package: string;
          package_count: number;
          pallet: string;
          pallet_count: number;
          plt_num: string;
          sup_code: string;
          uuid: string;
        };
        Insert: {
          creat_time?: string;
          grn_ref: number;
          gross_weight: number;
          material_code: string;
          net_weight: number;
          package: string;
          package_count?: number;
          pallet: string;
          pallet_count?: number;
          plt_num: string;
          sup_code: string;
          uuid?: string;
        };
        Update: {
          creat_time?: string;
          grn_ref?: number;
          gross_weight?: number;
          material_code?: string;
          net_weight?: number;
          package?: string;
          package_count?: number;
          pallet?: string;
          pallet_count?: number;
          plt_num?: string;
          sup_code?: string;
          uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'record_grn_material_code_fkey';
            columns: ['material_code'];
            isOneToOne: false;
            referencedRelation: 'data_code';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'record_grn_plt_num_fkey';
            columns: ['plt_num'];
            isOneToOne: false;
            referencedRelation: 'record_palletinfo';
            referencedColumns: ['plt_num'];
          },
          {
            foreignKeyName: 'record_grn_sup_code_fkey';
            columns: ['sup_code'];
            isOneToOne: false;
            referencedRelation: 'data_supplier';
            referencedColumns: ['supplier_code'];
          },
        ];
      };
      // 注：包含所有主要表格的定義
      [table: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: Array<{
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }>;
      };
    };
    Views: {
      mv_pallet_current_location: {
        Row: {
          current_location: string | null;
          last_action: string | null;
          last_update: string | null;
          operator_id: number | null;
          plt_num: string | null;
          plt_remark: string | null;
          product_code: string | null;
          product_qty: number | null;
          series: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'record_history_op_id_fkey';
            columns: ['operator_id'];
            isOneToOne: false;
            referencedRelation: 'data_id';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'record_palletinfo_product_code_fkey';
            columns: ['product_code'];
            isOneToOne: false;
            referencedRelation: 'data_code';
            referencedColumns: ['code'];
          },
        ];
      };
      [view: string]: {
        Row: Record<string, unknown>;
        Relationships: Array<{
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }>;
      };
    };
    Functions: {
      // RPC 函數定義 - 包含主要函數
      get_dashboard_stats: {
        Args: {
          p_use_estimated_count?: boolean;
          p_include_detailed_stats?: boolean;
        };
        Returns: Json;
      };
      search_pallet_optimized: {
        Args: { p_search_type: string; p_search_value: string };
        Returns: {
          plt_num: string;
          product_code: string;
          product_qty: number;
          plt_remark: string;
          series: string;
          current_location: string;
          last_update: string;
        }[];
      };
      execute_stock_transfer: {
        Args: {
          p_plt_num: string;
          p_product_code: string;
          p_product_qty: number;
          p_from_location: string;
          p_to_location: string;
          p_operator_id: number;
        };
        Returns: Json;
      };
      rpc_get_warehouse_work_level: {
        Args: {
          p_start_date?: string;
          p_end_date?: string;
          p_department?: string;
        };
        Returns: Json;
      };
      [function_name: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// 類型別名和輔助類型
type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

// Supabase 客戶端類型
export type SupabaseClient = BaseSupabaseClient<Database>;
export type SupabaseUser = User;

// 常量
export const Constants = {
  public: {
    Enums: {},
  },
} as const;

// Supabase 客戶端相關類型
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export interface SupabaseAuthConfig {
  autoRefreshToken: boolean;
  persistSession: boolean;
  detectSessionInUrl: boolean;
}

// 查詢選項
export interface QueryOptions {
  select?: string;
  eq?: Record<string, unknown>;
  neq?: Record<string, unknown>;
  gt?: Record<string, unknown>;
  gte?: Record<string, unknown>;
  lt?: Record<string, unknown>;
  lte?: Record<string, unknown>;
  like?: Record<string, unknown>;
  ilike?: Record<string, unknown>;
  in?: Record<string, unknown[]>;
  order?: {
    column: string;
    ascending?: boolean;
  }[];
  limit?: number;
  offset?: number;
}

// RPC 函數參數類型
export interface RpcParams {
  [key: string]: unknown;
}

// 實時訂閱配置
export interface RealtimeConfig {
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
  table?: string;
  filter?: string;
}

// 文件上傳相關
export interface FileUploadOptions {
  cacheControl?: string;
  contentType?: string;
  duplex?: string;
  upsert?: boolean;
}

export interface StorageBucket {
  id: string;
  name: string;
  public: boolean;
  file_size_limit?: number;
  allowed_mime_types?: string[];
  created_at: string;
  updated_at: string;
}
