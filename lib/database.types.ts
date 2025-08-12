export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      API: {
        Row: {
          description: string | null
          name: string
          uuid: string
          value: string
        }
        Insert: {
          description?: string | null
          name: string
          uuid?: string
          value: string
        }
        Update: {
          description?: string | null
          name?: string
          uuid?: string
          value?: string
        }
        Relationships: []
      }
      data_code: {
        Row: {
          code: string
          colour: string
          description: string
          remark: string | null
          standard_qty: number
          type: string
        }
        Insert: {
          code: string
          colour?: string
          description: string
          remark?: string | null
          standard_qty?: number
          type?: string
        }
        Update: {
          code?: string
          colour?: string
          description?: string
          remark?: string | null
          standard_qty?: number
          type?: string
        }
        Relationships: []
      }
      data_id: {
        Row: {
          department: string
          email: string | null
          icon_url: string | null
          id: number
          name: string
          position: string
          uuid: string
        }
        Insert: {
          department: string
          email?: string | null
          icon_url?: string | null
          id: number
          name: string
          position?: string
          uuid?: string
        }
        Update: {
          department?: string
          email?: string | null
          icon_url?: string | null
          id?: number
          name?: string
          position?: string
          uuid?: string
        }
        Relationships: []
      }
      data_order: {
        Row: {
          account_num: string
          created_at: string
          customer_ref: string | null
          delivery_add: string
          invoice_to: string
          loaded_qty: string
          order_ref: string
          product_code: string
          product_desc: string
          product_qty: number
          token: number
          unit_price: string
          uploaded_by: string
          uuid: string
          weight: number | null
        }
        Insert: {
          account_num?: string
          created_at?: string
          customer_ref?: string | null
          delivery_add?: string
          invoice_to?: string
          loaded_qty?: string
          order_ref?: string
          product_code: string
          product_desc: string
          product_qty: number
          token?: number
          unit_price?: string
          uploaded_by: string
          uuid?: string
          weight?: number | null
        }
        Update: {
          account_num?: string
          created_at?: string
          customer_ref?: string | null
          delivery_add?: string
          invoice_to?: string
          loaded_qty?: string
          order_ref?: string
          product_code?: string
          product_desc?: string
          product_qty?: number
          token?: number
          unit_price?: string
          uploaded_by?: string
          uuid?: string
          weight?: number | null
        }
        Relationships: []
      }
      data_slateinfo: {
        Row: {
          colour: string | null
          description: string | null
          hole_to_bottom: string | null
          length: string | null
          product_code: string
          shapes: string | null
          thickness_bottom: string | null
          thickness_top: string | null
          tool_num: string | null
          uuid: string
          weight: string | null
          width: string | null
        }
        Insert: {
          colour?: string | null
          description?: string | null
          hole_to_bottom?: string | null
          length?: string | null
          product_code: string
          shapes?: string | null
          thickness_bottom?: string | null
          thickness_top?: string | null
          tool_num?: string | null
          uuid?: string
          weight?: string | null
          width?: string | null
        }
        Update: {
          colour?: string | null
          description?: string | null
          hole_to_bottom?: string | null
          length?: string | null
          product_code?: string
          shapes?: string | null
          thickness_bottom?: string | null
          thickness_top?: string | null
          tool_num?: string | null
          uuid?: string
          weight?: string | null
          width?: string | null
        }
        Relationships: []
      }
      data_supplier: {
        Row: {
          supplier_code: string
          supplier_name: string | null
        }
        Insert: {
          supplier_code: string
          supplier_name?: string | null
        }
        Update: {
          supplier_code?: string
          supplier_name?: string | null
        }
        Relationships: []
      }
      doc_upload: {
        Row: {
          created_at: string
          doc_name: string
          doc_type: string | null
          doc_url: string | null
          file_size: number | null
          folder: string | null
          json_txt: string | null
          upload_by: number
          uuid: string
        }
        Insert: {
          created_at?: string
          doc_name: string
          doc_type?: string | null
          doc_url?: string | null
          file_size?: number | null
          folder?: string | null
          json_txt?: string | null
          upload_by: number
          uuid?: string
        }
        Update: {
          created_at?: string
          doc_name?: string
          doc_type?: string | null
          doc_url?: string | null
          file_size?: number | null
          folder?: string | null
          json_txt?: string | null
          upload_by?: number
          uuid?: string
        }
        Relationships: []
      }
      grn_level: {
        Row: {
          grn_ref: number | null
          latest_update: string
          total_gross: number
          total_net: number | null
          total_unit: number
          uuid: string
        }
        Insert: {
          grn_ref?: number | null
          latest_update?: string
          total_gross?: number
          total_net?: number | null
          total_unit?: number
          uuid?: string
        }
        Update: {
          grn_ref?: number | null
          latest_update?: string
          total_gross?: number
          total_net?: number | null
          total_unit?: number
          uuid?: string
        }
        Relationships: []
      }
      order_loading_history: {
        Row: {
          action_by: string
          action_time: string | null
          action_type: string
          order_ref: string
          pallet_num: string
          product_code: string
          quantity: number
          remark: string | null
          uuid: string
        }
        Insert: {
          action_by: string
          action_time?: string | null
          action_type: string
          order_ref: string
          pallet_num: string
          product_code: string
          quantity: number
          remark?: string | null
          uuid?: string
        }
        Update: {
          action_by?: string
          action_time?: string | null
          action_type?: string
          order_ref?: string
          pallet_num?: string
          product_code?: string
          quantity?: number
          remark?: string | null
          uuid?: string
        }
        Relationships: []
      }
      pallet_number_buffer: {
        Row: {
          date_str: string
          id: number
          pallet_number: string
          series: string
          updated_at: string | null
          used: string
        }
        Insert: {
          date_str: string
          id: number
          pallet_number: string
          series: string
          updated_at?: string | null
          used?: string
        }
        Update: {
          date_str?: string
          id?: number
          pallet_number?: string
          series?: string
          updated_at?: string | null
          used?: string
        }
        Relationships: []
      }
      query_record: {
        Row: {
          answer: string
          complexity: string | null
          created_at: string
          execution_time: number | null
          expired_at: string | null
          expired_reason: string | null
          fuzzy_hash: string | null
          query: string
          query_hash: string | null
          result_json: Json | null
          row_count: number | null
          session_id: string | null
          sql_query: string
          token: number
          user: string
          uuid: string
        }
        Insert: {
          answer: string
          complexity?: string | null
          created_at?: string
          execution_time?: number | null
          expired_at?: string | null
          expired_reason?: string | null
          fuzzy_hash?: string | null
          query: string
          query_hash?: string | null
          result_json?: Json | null
          row_count?: number | null
          session_id?: string | null
          sql_query?: string
          token: number
          user: string
          uuid?: string
        }
        Update: {
          answer?: string
          complexity?: string | null
          created_at?: string
          execution_time?: number | null
          expired_at?: string | null
          expired_reason?: string | null
          fuzzy_hash?: string | null
          query?: string
          query_hash?: string | null
          result_json?: Json | null
          row_count?: number | null
          session_id?: string | null
          sql_query?: string
          token?: number
          user?: string
          uuid?: string
        }
        Relationships: []
      }
      record_aco: {
        Row: {
          code: string
          finished_qty: number | null
          latest_update: string
          order_ref: number
          required_qty: number
          uuid: string
        }
        Insert: {
          code: string
          finished_qty?: number | null
          latest_update?: string
          order_ref: number
          required_qty: number
          uuid?: string
        }
        Update: {
          code?: string
          finished_qty?: number | null
          latest_update?: string
          order_ref?: number
          required_qty?: number
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_aco2_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "data_code"
            referencedColumns: ["code"]
          },
        ]
      }
      record_grn: {
        Row: {
          creat_time: string
          grn_ref: number
          gross_weight: number
          material_code: string
          net_weight: number
          package: string
          package_count: number
          pallet: string
          pallet_count: number
          plt_num: string
          sup_code: string
          uuid: string
        }
        Insert: {
          creat_time?: string
          grn_ref: number
          gross_weight: number
          material_code: string
          net_weight: number
          package: string
          package_count?: number
          pallet: string
          pallet_count?: number
          plt_num: string
          sup_code: string
          uuid?: string
        }
        Update: {
          creat_time?: string
          grn_ref?: number
          gross_weight?: number
          material_code?: string
          net_weight?: number
          package?: string
          package_count?: number
          pallet?: string
          pallet_count?: number
          plt_num?: string
          sup_code?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_grn_material_code_fkey"
            columns: ["material_code"]
            isOneToOne: false
            referencedRelation: "data_code"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "record_grn_plt_num_fkey"
            columns: ["plt_num"]
            isOneToOne: false
            referencedRelation: "record_palletinfo"
            referencedColumns: ["plt_num"]
          },
          {
            foreignKeyName: "record_grn_sup_code_fkey"
            columns: ["sup_code"]
            isOneToOne: false
            referencedRelation: "data_supplier"
            referencedColumns: ["supplier_code"]
          },
        ]
      }
      record_history: {
        Row: {
          action: string
          id: number
          loc: string | null
          plt_num: string | null
          remark: string
          time: string
          uuid: string
        }
        Insert: {
          action: string
          id: number
          loc?: string | null
          plt_num?: string | null
          remark?: string
          time?: string
          uuid?: string
        }
        Update: {
          action?: string
          id?: number
          loc?: string | null
          plt_num?: string | null
          remark?: string
          time?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_history_op_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "data_id"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_history_plt_num_fkey"
            columns: ["plt_num"]
            isOneToOne: false
            referencedRelation: "record_palletinfo"
            referencedColumns: ["plt_num"]
          },
        ]
      }
      record_inventory: {
        Row: {
          await: number
          await_grn: number | null
          backcarpark: number
          bulk: number
          damage: number
          fold: number
          injection: number
          latest_update: string | null
          pipeline: number
          plt_num: string
          prebook: number
          product_code: string
          uuid: string
        }
        Insert: {
          await?: number
          await_grn?: number | null
          backcarpark?: number
          bulk?: number
          damage?: number
          fold?: number
          injection?: number
          latest_update?: string | null
          pipeline?: number
          plt_num: string
          prebook?: number
          product_code?: string
          uuid?: string
        }
        Update: {
          await?: number
          await_grn?: number | null
          backcarpark?: number
          bulk?: number
          damage?: number
          fold?: number
          injection?: number
          latest_update?: string | null
          pipeline?: number
          plt_num?: string
          prebook?: number
          product_code?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_inventory_plt_num_fkey"
            columns: ["plt_num"]
            isOneToOne: false
            referencedRelation: "record_palletinfo"
            referencedColumns: ["plt_num"]
          },
          {
            foreignKeyName: "record_inventory_product_code_fkey"
            columns: ["product_code"]
            isOneToOne: false
            referencedRelation: "data_code"
            referencedColumns: ["code"]
          },
        ]
      }
      record_palletinfo: {
        Row: {
          generate_time: string
          pdf_url: string | null
          plt_num: string
          plt_remark: string | null
          product_code: string
          product_qty: number
          series: string
        }
        Insert: {
          generate_time?: string
          pdf_url?: string | null
          plt_num: string
          plt_remark?: string | null
          product_code: string
          product_qty?: number
          series: string
        }
        Update: {
          generate_time?: string
          pdf_url?: string | null
          plt_num?: string
          plt_remark?: string | null
          product_code?: string
          product_qty?: number
          series?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_palletinfo_product_code_fkey"
            columns: ["product_code"]
            isOneToOne: false
            referencedRelation: "data_code"
            referencedColumns: ["code"]
          },
        ]
      }
      record_stocktake: {
        Row: {
          counted_id: number | null
          counted_name: string | null
          counted_qty: number | null
          created_at: string | null
          plt_num: string | null
          product_code: string
          product_desc: string
          remain_qty: number | null
          uuid: string
        }
        Insert: {
          counted_id?: number | null
          counted_name?: string | null
          counted_qty?: number | null
          created_at?: string | null
          plt_num?: string | null
          product_code: string
          product_desc: string
          remain_qty?: number | null
          uuid?: string
        }
        Update: {
          counted_id?: number | null
          counted_name?: string | null
          counted_qty?: number | null
          created_at?: string | null
          plt_num?: string | null
          product_code?: string
          product_desc?: string
          remain_qty?: number | null
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_stocktake_counted_id_fkey"
            columns: ["counted_id"]
            isOneToOne: false
            referencedRelation: "data_id"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_stocktake_plt_num_fkey"
            columns: ["plt_num"]
            isOneToOne: false
            referencedRelation: "record_palletinfo"
            referencedColumns: ["plt_num"]
          },
        ]
      }
      record_transfer: {
        Row: {
          f_loc: string
          operator_id: number
          plt_num: string
          t_loc: string
          tran_date: string
          uuid: string
        }
        Insert: {
          f_loc: string
          operator_id: number
          plt_num: string
          t_loc: string
          tran_date?: string
          uuid?: string
        }
        Update: {
          f_loc?: string
          operator_id?: number
          plt_num?: string
          t_loc?: string
          tran_date?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_transfer_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "data_id"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_transfer_plt_num_fkey"
            columns: ["plt_num"]
            isOneToOne: false
            referencedRelation: "record_palletinfo"
            referencedColumns: ["plt_num"]
          },
        ]
      }
      report_void: {
        Row: {
          damage_qty: number
          plt_num: string
          reason: string
          time: string
          uuid: string
        }
        Insert: {
          damage_qty: number
          plt_num: string
          reason: string
          time?: string
          uuid?: string
        }
        Update: {
          damage_qty?: number
          plt_num?: string
          reason?: string
          time?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_void_plt_num_fkey"
            columns: ["plt_num"]
            isOneToOne: false
            referencedRelation: "record_palletinfo"
            referencedColumns: ["plt_num"]
          },
        ]
      }
      stock_level: {
        Row: {
          description: string
          stock: string
          stock_level: number
          update_time: string
          uuid: string
        }
        Insert: {
          description: string
          stock?: string
          stock_level: number
          update_time?: string
          uuid?: string
        }
        Update: {
          description?: string
          stock?: string
          stock_level?: number
          update_time?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_level_stock_fkey"
            columns: ["stock"]
            isOneToOne: false
            referencedRelation: "data_code"
            referencedColumns: ["code"]
          },
        ]
      }
      work_level: {
        Row: {
          grn: number
          id: number
          latest_update: string
          loading: number
          move: number
          qc: number
          uuid: string
        }
        Insert: {
          grn?: number
          id: number
          latest_update?: string
          loading?: number
          move?: number
          qc?: number
          uuid?: string
        }
        Update: {
          grn?: number
          id?: number
          latest_update?: string
          loading?: number
          move?: number
          qc?: number
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_level_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "data_id"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      api_cleanup_pallet_buffer: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      auto_check_pallet_buffer_health: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      auto_cleanup_pallet_buffer: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      batch_search_pallets: {
        Args: { p_patterns: string[] }
        Returns: {
          plt_num: string
          product_code: string
          product_qty: number
          plt_remark: string
          series: string
          current_location: string
          last_update: string
        }[]
      }
      check_aco_order_completion: {
        Args: { p_order_ref: number }
        Returns: Json
      }
      check_pallet_buffer_health: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_qc_label_print_prerequisites: {
        Args: {
          p_product_code: string
          p_count: number
          p_user_id?: number
          p_aco_order_ref?: string
        }
        Returns: Json
      }
      cleanup_grn_records: {
        Args: { p_pallet_numbers: string[] }
        Returns: Json
      }
      cleanup_old_api_usage_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      confirm_pallet_usage: {
        Args: { p_pallet_numbers: string[] }
        Returns: boolean
      }
      diagnose_pallet_buffer: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      execute_sql_query: {
        Args: { query_text: string }
        Returns: Json
      }
      execute_stock_transfer: {
        Args: {
          p_plt_num: string
          p_product_code: string
          p_product_qty: number
          p_from_location: string
          p_to_location: string
          p_operator_id: number
        }
        Returns: Json
      }
      generate_atomic_pallet_numbers_v6: {
        Args: { p_count: number; p_session_id?: string }
        Returns: {
          pallet_number: string
          series: string
        }[]
      }
      get_aco_order_details: {
        Args: { p_product_code: string; p_order_ref?: string }
        Returns: Json
      }
      get_dashboard_stats: {
        Args: {
          p_use_estimated_count?: boolean
          p_include_detailed_stats?: boolean
        }
        Returns: Json
      }
      get_database_system_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_department_pipe_data_complete: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_feature_flag_stats: {
        Args: { p_flag_key: string; p_start_date?: string; p_end_date?: string }
        Returns: {
          date: string
          total_evaluations: number
          total_enabled: number
          total_disabled: number
          enable_rate: number
          variant_distribution: Json
        }[]
      }
      get_material_stocks_optimized: {
        Args: { stock_limit?: number }
        Returns: {
          stock: string
          description: string
          stock_level: number
          update_time: string
          type: string
          real_time_level: number
        }[]
      }
      get_optimized_inventory_data: {
        Args: {
          p_location?: string
          p_limit?: number
          p_offset?: number
          p_include_zero_qty?: boolean
          p_sort_by?: string
          p_sort_order?: string
          p_product_filter?: string
          p_aggregate_by_product?: boolean
        }
        Returns: Json
      }
      get_pallet_buffer_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_count: number
          available_count: number
          holded_count: number
          used_count: number
          next_available_id: number
        }[]
      }
      get_pallet_current_location: {
        Args: { p_plt_num: string }
        Returns: string
      }
      get_pipe_production_stats_optimized: {
        Args: Record<PropertyKey, never>
        Returns: {
          today_finished: number
          past_7days: number
          past_14days: number
          last_updated: string
        }[]
      }
      get_predicted_next_paths: {
        Args: { p_user_id: string; p_current_path: string; p_limit?: number }
        Returns: {
          path: string
          probability: number
          visit_count: number
        }[]
      }
      get_product_details_by_code: {
        Args: { p_code: string }
        Returns: {
          code: string
          description: string
          standard_qty: string
          type: string
          remark: string
        }[]
      }
      get_qc_label_print_usage: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_table_columns: {
        Args: { table_name: string }
        Returns: Json
      }
      get_table_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_top_pipe_stocks_optimized: {
        Args: { stock_limit?: number }
        Returns: {
          stock: string
          description: string
          stock_level: number
          update_time: string
          type: string
          real_time_level: number
        }[]
      }
      get_top_query_patterns: {
        Args: { days_back?: number; p_limit?: number }
        Returns: {
          pattern: string
          count: number
        }[]
      }
      get_warehouse_summary: {
        Args: { p_time_period?: string }
        Returns: Json
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      handle_print_label_updates: {
        Args: {
          p_product_code: string
          p_quantity: number
          p_user_id: number
          p_pallet_count?: number
          p_description?: string
        }
        Returns: Json
      }
      handle_qc_label_print: {
        Args: {
          p_product_code: string
          p_quantity: number
          p_count: number
          p_user_id: number
          p_aco_order_ref?: string
          p_batch_number?: string
          p_operator_clock?: string
        }
        Returns: Json
      }
      handle_qc_label_print_fixed: {
        Args: {
          p_product_code: string
          p_quantity: number
          p_count: number
          p_user_id: number
          p_aco_order_ref?: string
          p_batch_number?: string
          p_operator_clock?: string
        }
        Returns: Json
      }
      increment_navigation_stats: {
        Args: { p_user_id: string; p_path: string; p_time_spent?: number }
        Returns: undefined
      }
      initialize_inventory_after_qc: {
        Args: {
          p_plt_num: string
          p_product_code: string
          p_product_qty: number
          p_initial_location?: string
        }
        Returns: Json
      }
      log_feature_flag_evaluation: {
        Args: {
          p_flag_key: string
          p_enabled: boolean
          p_variant?: string
          p_context?: Json
        }
        Returns: undefined
      }
      process_grn_label_unified: {
        Args: {
          p_count: number
          p_grn_number: string
          p_material_code: string
          p_supplier_code: string
          p_clock_number: string
          p_label_mode?: string
          p_session_id?: string
          p_gross_weights?: number[]
          p_net_weights?: number[]
          p_quantities?: number[]
          p_pallet_count?: number
          p_package_count?: number
          p_pallet_type?: string
          p_package_type?: string
          p_pdf_urls?: string[]
        }
        Returns: Json
      }
      process_qc_label_unified: {
        Args: {
          p_count: number
          p_product_code: string
          p_product_qty: number
          p_clock_number: string
          p_plt_remark: string
          p_session_id?: string
          p_aco_order_ref?: string
          p_aco_quantity_used?: number
          p_slate_batch_number?: string
          p_pdf_urls?: string[]
        }
        Returns: Json
      }
      release_pallet_reservation: {
        Args: { p_pallet_numbers: string[] }
        Returns: boolean
      }
      reset_daily_pallet_buffer: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      rpc_create_supplier: {
        Args: {
          p_supplier_code: string
          p_supplier_name: string
          p_user_id: number
        }
        Returns: Json
      }
      rpc_get_aco_incomplete_orders_dashboard: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      rpc_get_aco_order_refs: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      rpc_get_aco_order_report: {
        Args: { p_order_ref: number; p_limit?: number; p_offset?: number }
        Returns: Json
      }
      rpc_get_aco_order_report_aggregation: {
        Args: {
          p_order_ref: number
          p_product_filter?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: Json
      }
      rpc_get_await_location_count: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      rpc_get_await_location_count_by_timeframe: {
        Args: { p_start_date: string; p_end_date: string }
        Returns: Json
      }
      rpc_get_await_percentage_stats: {
        Args: { p_start_date: string; p_end_date: string }
        Returns: Json
      }
      rpc_get_grn_material_codes: {
        Args: { p_grn_ref: string }
        Returns: Json
      }
      rpc_get_grn_references: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      rpc_get_grn_report_data: {
        Args: { p_grn_ref: string; p_material_code: string }
        Returns: Json
      }
      rpc_get_history_tree: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      rpc_get_inventory_analysis_aggregation: {
        Args: {
          p_warehouse?: string
          p_product_filter?: string
          p_category_filter?: string
          p_supplier_filter?: string
          p_low_stock_threshold?: number
          p_include_movements?: boolean
          p_movement_days?: number
          p_limit?: number
          p_offset?: number
        }
        Returns: Json
      }
      rpc_get_inventory_ordered_analysis: {
        Args: { p_product_type?: string }
        Returns: Json
      }
      rpc_get_order_loading_reports_aggregation: {
        Args: {
          p_start_date: string
          p_end_date: string
          p_order_ref?: string
          p_product_code?: string
          p_action_by?: string
          p_action_type?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: Json
      }
      rpc_get_order_reports_aggregation: {
        Args: {
          p_order_ref?: string
          p_status?: string
          p_start_date?: string
          p_end_date?: string
          p_customer_ref?: string
          p_product_filter?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: Json
      }
      rpc_get_order_state_list: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      rpc_get_orders_list: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          uuid: string
          time: string
          id: number
          action: string
          plt_num: string
          loc: string
          remark: string
          uploader_name: string
          doc_url: string
          total_count: number
        }[]
      }
      rpc_get_other_files_list: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      rpc_get_pallet_reprint_info: {
        Args: { p_pallet_num: string }
        Returns: {
          plt_num: string
          product_code: string
          product_description: string
          product_colour: string
          product_qty: number
          pdf_url: string
          series: string
          plt_remark: string
          generate_time: string
        }[]
      }
      rpc_get_product_distribution: {
        Args: { p_start_date?: string; p_end_date?: string; p_limit?: number }
        Returns: {
          name: string
          value: number
        }[]
      }
      rpc_get_production_details: {
        Args: { p_start_date?: string; p_end_date?: string; p_limit?: number }
        Returns: {
          plt_num: string
          product_code: string
          product_qty: number
          qc_by: string
          generate_time: string
        }[]
      }
      rpc_get_production_stats: {
        Args: { p_start_date?: string; p_end_date?: string; p_metric?: string }
        Returns: number
      }
      rpc_get_report_references: {
        Args: {
          p_table_name: string
          p_field_name: string
          p_limit?: number
          p_offset?: number
        }
        Returns: Json
      }
      rpc_get_staff_workload: {
        Args: {
          p_start_date?: string
          p_end_date?: string
          p_department?: string
        }
        Returns: {
          work_date: string
          staff_name: string
          action_count: number
        }[]
      }
      rpc_get_stock_distribution: {
        Args: { p_stock_type?: string }
        Returns: Json
      }
      rpc_get_stock_level_history: {
        Args: {
          p_product_codes: string[]
          p_start_date?: string
          p_end_date?: string
          p_time_segments?: number
        }
        Returns: {
          time_segment: string
          segment_start: string
          segment_end: string
          product_data: Json
          metadata: Json
        }[]
      }
      rpc_get_stock_take_report_aggregation: {
        Args: {
          p_take_date?: string
          p_product_filter?: string
          p_include_zero_variance?: boolean
          p_limit?: number
          p_offset?: number
        }
        Returns: Json
      }
      rpc_get_stock_types: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      rpc_get_top_products: {
        Args: { p_start_date?: string; p_end_date?: string; p_limit?: number }
        Returns: {
          name: string
          value: number
        }[]
      }
      rpc_get_transaction_report_aggregation: {
        Args: {
          p_start_date?: string
          p_end_date?: string
          p_location_filter?: string
          p_product_filter?: string
          p_operator_filter?: number
          p_limit?: number
          p_offset?: number
        }
        Returns: Json
      }
      rpc_get_transfer_time_distribution: {
        Args: {
          p_start_date: string
          p_end_date: string
          p_time_slots?: number
        }
        Returns: Json
      }
      rpc_get_user_id_by_email: {
        Args: { p_email: string }
        Returns: number
      }
      rpc_get_void_pallet_report_aggregation: {
        Args: {
          p_start_date: string
          p_end_date: string
          p_product_filter?: string
          p_reason_filter?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: Json
      }
      rpc_get_warehouse_transfer_list: {
        Args: {
          p_start_date?: string
          p_end_date?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          tran_date: string
          plt_num: string
          operator_name: string
          operator_id: number
          total_count: number
        }[]
      }
      rpc_get_warehouse_work_level: {
        Args: {
          p_start_date?: string
          p_end_date?: string
          p_department?: string
        }
        Returns: Json
      }
      rpc_get_warehouse_work_level_this_month: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      rpc_get_warehouse_work_level_this_week: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      rpc_get_warehouse_work_level_today: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      rpc_load_pallet_to_order: {
        Args: {
          p_order_ref: string
          p_pallet_input: string
          p_user_id?: number
          p_user_name?: string
        }
        Returns: Json
      }
      rpc_search_inventory_with_chart: {
        Args: { p_product_code: string; p_include_chart?: boolean }
        Returns: Json
      }
      rpc_search_supplier: {
        Args: { p_supplier_code: string }
        Returns: Json
      }
      rpc_transfer_pallet: {
        Args: {
          p_pallet_num: string
          p_to_location: string
          p_user_id: number
          p_user_name?: string
        }
        Returns: Json
      }
      rpc_undo_load_pallet: {
        Args: {
          p_order_ref: string
          p_pallet_num: string
          p_product_code: string
          p_quantity: number
          p_user_id?: number
          p_user_name?: string
        }
        Returns: Json
      }
      rpc_update_supplier: {
        Args: {
          p_supplier_code: string
          p_supplier_name: string
          p_user_id: number
        }
        Returns: Json
      }
      search_pallet_info: {
        Args: { p_search_type: string; p_search_value: string }
        Returns: Json
      }
      search_pallet_optimized: {
        Args: { p_search_type: string; p_search_value: string }
        Returns: {
          plt_num: string
          product_code: string
          product_qty: number
          plt_remark: string
          series: string
          current_location: string
          last_update: string
        }[]
      }
      search_pallet_optimized_v2: {
        Args: { p_search_type: string; p_search_value: string }
        Returns: {
          plt_num: string
          product_code: string
          product_qty: number
          plt_remark: string
          series: string
          current_location: string
          last_update: string
        }[]
      }
      search_product_code: {
        Args: { p_code: string }
        Returns: Json
      }
      search_supplier_code: {
        Args: { p_code: string }
        Returns: Json
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      smart_refresh_mv: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      smart_reset_pallet_buffer: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_condition_logic: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_handle_qc_label_print: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_pallet_selection: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      track_navigation_transition: {
        Args: { p_user_id: string; p_from_path: string; p_to_path: string }
        Returns: undefined
      }
      update_aco_order_with_completion_check: {
        Args: {
          p_order_ref: number
          p_product_code: string
          p_quantity_used: number
        }
        Returns: Json
      }
      update_grn_workflow: {
        Args:
          | {
              p_grn_ref: number
              p_product_code: string
              p_product_description: string
              p_label_mode: string
              p_user_id: string
              p_grn_quantity?: number
              p_grn_weight?: number
            }
          | {
              p_grn_ref: number
              p_product_code: string
              p_product_description: string
              p_label_mode: string
              p_user_id: string
              p_quantity?: number
              p_net_weight?: number
            }
          | {
              p_grn_ref: string
              p_label_mode: string
              p_user_id: number
              p_product_code: string
              p_product_description?: string
              p_gross_weight?: number
              p_net_weight?: number
              p_quantity?: number
              p_grn_count?: number
            }
        Returns: Json
      }
      update_stock_level: {
        Args: {
          p_product_code: string
          p_quantity: number
          p_description?: string
        }
        Returns: boolean
      }
      update_stock_level_void: {
        Args: {
          p_product_code: string
          p_quantity: number
          p_operation?: string
        }
        Returns: string
      }
      update_work_level_move: {
        Args: { p_user_id: number; p_move_count?: number }
        Returns: string
      }
      update_work_level_qc: {
        Args: { p_user_id: number; p_pallet_count: number }
        Returns: Json
      }
      validate_stocktake_count: {
        Args: { p_product_code: string; p_counted_qty: number }
        Returns: Json
      }
      validate_system_schema: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const