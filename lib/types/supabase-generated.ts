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
      data_order: {
        Row: {
          account_num: string;
          created_at: string;
          customer_ref: string | null;
          delivery_add: string;
          invoice_to: string;
          loaded_qty: string;
          order_ref: string;
          product_code: string;
          product_desc: string;
          product_qty: number;
          token: number;
          unit_price: string;
          uploaded_by: string;
          uuid: string;
          weight: number | null;
        };
        Insert: {
          account_num?: string;
          created_at?: string;
          customer_ref?: string | null;
          delivery_add?: string;
          invoice_to?: string;
          loaded_qty?: string;
          order_ref?: string;
          product_code: string;
          product_desc: string;
          product_qty: number;
          token?: number;
          unit_price?: string;
          uploaded_by: string;
          uuid?: string;
          weight?: number | null;
        };
        Update: {
          account_num?: string;
          created_at?: string;
          customer_ref?: string | null;
          delivery_add?: string;
          invoice_to?: string;
          loaded_qty?: string;
          order_ref?: string;
          product_code?: string;
          product_desc?: string;
          product_qty?: number;
          token?: number;
          unit_price?: string;
          uploaded_by?: string;
          uuid?: string;
          weight?: number | null;
        };
        Relationships: [];
      };
      data_slateinfo: {
        Row: {
          colour: string | null;
          description: string | null;
          hole_to_bottom: string | null;
          length: string | null;
          product_code: string;
          shapes: string | null;
          thickness_bottom: string | null;
          thickness_top: string | null;
          tool_num: string | null;
          uuid: string;
          weight: string | null;
          width: string | null;
        };
        Insert: {
          colour?: string | null;
          description?: string | null;
          hole_to_bottom?: string | null;
          length?: string | null;
          product_code: string;
          shapes?: string | null;
          thickness_bottom?: string | null;
          thickness_top?: string | null;
          tool_num?: string | null;
          uuid?: string;
          weight?: string | null;
          width?: string | null;
        };
        Update: {
          colour?: string | null;
          description?: string | null;
          hole_to_bottom?: string | null;
          length?: string | null;
          product_code?: string;
          shapes?: string | null;
          thickness_bottom?: string | null;
          thickness_top?: string | null;
          tool_num?: string | null;
          uuid?: string;
          weight?: string | null;
          width?: string | null;
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
      debug_log: {
        Row: {
          msg: string;
          ts: string;
          UUID: string;
        };
        Insert: {
          msg: string;
          ts?: string;
          UUID?: string;
        };
        Update: {
          msg?: string;
          ts?: string;
          UUID?: string;
        };
        Relationships: [];
      };
      doc_upload: {
        Row: {
          created_at: string;
          doc_name: string;
          doc_type: string | null;
          doc_url: string | null;
          file_size: number | null;
          folder: string | null;
          json_txt: string | null;
          upload_by: number;
          uuid: string;
        };
        Insert: {
          created_at?: string;
          doc_name: string;
          doc_type?: string | null;
          doc_url?: string | null;
          file_size?: number | null;
          folder?: string | null;
          json_txt?: string | null;
          upload_by: number;
          uuid?: string;
        };
        Update: {
          created_at?: string;
          doc_name?: string;
          doc_type?: string | null;
          doc_url?: string | null;
          file_size?: number | null;
          folder?: string | null;
          json_txt?: string | null;
          upload_by?: number;
          uuid?: string;
        };
        Relationships: [];
      };
      feature_flags: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          default_value: Json;
          description: string | null;
          end_date: string | null;
          id: string;
          key: string;
          metadata: Json | null;
          name: string;
          rollout_percentage: number | null;
          rules: Json | null;
          start_date: string | null;
          status: string;
          tags: string[] | null;
          type: string;
          updated_at: string | null;
          updated_by: string | null;
          variants: Json | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          default_value?: Json;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          key: string;
          metadata?: Json | null;
          name: string;
          rollout_percentage?: number | null;
          rules?: Json | null;
          start_date?: string | null;
          status?: string;
          tags?: string[] | null;
          type?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          variants?: Json | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          default_value?: Json;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          key?: string;
          metadata?: Json | null;
          name?: string;
          rollout_percentage?: number | null;
          rules?: Json | null;
          start_date?: string | null;
          status?: string;
          tags?: string[] | null;
          type?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          variants?: Json | null;
        };
        Relationships: [];
      };
      feature_flags_audit: {
        Row: {
          action: string;
          context: Json | null;
          created_at: string | null;
          flag_id: string | null;
          flag_key: string;
          id: string;
          new_value: Json | null;
          old_value: Json | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          context?: Json | null;
          created_at?: string | null;
          flag_id?: string | null;
          flag_key: string;
          id?: string;
          new_value?: Json | null;
          old_value?: Json | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          context?: Json | null;
          created_at?: string | null;
          flag_id?: string | null;
          flag_key?: string;
          id?: string;
          new_value?: Json | null;
          old_value?: Json | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'feature_flags_audit_flag_id_fkey';
            columns: ['flag_id'];
            isOneToOne: false;
            referencedRelation: 'feature_flags';
            referencedColumns: ['id'];
          },
        ];
      };
      feature_flags_stats: {
        Row: {
          created_at: string | null;
          date: string;
          disabled_count: number | null;
          enabled_count: number | null;
          evaluations: number | null;
          flag_key: string;
          hour: number;
          id: string;
          unique_users: number | null;
          variant_distribution: Json | null;
        };
        Insert: {
          created_at?: string | null;
          date: string;
          disabled_count?: number | null;
          enabled_count?: number | null;
          evaluations?: number | null;
          flag_key: string;
          hour: number;
          id?: string;
          unique_users?: number | null;
          variant_distribution?: Json | null;
        };
        Update: {
          created_at?: string | null;
          date?: string;
          disabled_count?: number | null;
          enabled_count?: number | null;
          evaluations?: number | null;
          flag_key?: string;
          hour?: number;
          id?: string;
          unique_users?: number | null;
          variant_distribution?: Json | null;
        };
        Relationships: [];
      };
      grn_level: {
        Row: {
          grn_ref: number | null;
          latest_update: string;
          total_gross: number;
          total_net: number | null;
          total_unit: number;
          uuid: string;
        };
        Insert: {
          grn_ref?: number | null;
          latest_update?: string;
          total_gross?: number;
          total_net?: number | null;
          total_unit?: number;
          uuid?: string;
        };
        Update: {
          grn_ref?: number | null;
          latest_update?: string;
          total_gross?: number;
          total_net?: number | null;
          total_unit?: number;
          uuid?: string;
        };
        Relationships: [];
      };
      mv_refresh_tracking: {
        Row: {
          last_refresh: string | null;
          mv_name: string;
          needs_refresh: boolean | null;
        };
        Insert: {
          last_refresh?: string | null;
          mv_name: string;
          needs_refresh?: boolean | null;
        };
        Update: {
          last_refresh?: string | null;
          mv_name?: string;
          needs_refresh?: boolean | null;
        };
        Relationships: [];
      };
      order_loading_history: {
        Row: {
          action_by: string;
          action_time: string | null;
          action_type: string;
          order_ref: string;
          pallet_num: string;
          product_code: string;
          quantity: number;
          remark: string | null;
          uuid: string;
        };
        Insert: {
          action_by: string;
          action_time?: string | null;
          action_type: string;
          order_ref: string;
          pallet_num: string;
          product_code: string;
          quantity: number;
          remark?: string | null;
          uuid?: string;
        };
        Update: {
          action_by?: string;
          action_time?: string | null;
          action_type?: string;
          order_ref?: string;
          pallet_num?: string;
          product_code?: string;
          quantity?: number;
          remark?: string | null;
          uuid?: string;
        };
        Relationships: [];
      };
      pallet_number_buffer: {
        Row: {
          date_str: string;
          id: number;
          pallet_number: string;
          series: string;
          updated_at: string | null;
          used: string;
        };
        Insert: {
          date_str: string;
          id: number;
          pallet_number: string;
          series: string;
          updated_at?: string | null;
          used?: string;
        };
        Update: {
          date_str?: string;
          id?: number;
          pallet_number?: string;
          series?: string;
          updated_at?: string | null;
          used?: string;
        };
        Relationships: [];
      };
      pallet_number_buffer_backup: {
        Row: {
          allocated_at: string | null;
          date_str: string | null;
          id: number | null;
          pallet_number: string | null;
          session_id: string | null;
          used: boolean | null;
          used_at: string | null;
        };
        Insert: {
          allocated_at?: string | null;
          date_str?: string | null;
          id?: number | null;
          pallet_number?: string | null;
          session_id?: string | null;
          used?: boolean | null;
          used_at?: string | null;
        };
        Update: {
          allocated_at?: string | null;
          date_str?: string | null;
          id?: number | null;
          pallet_number?: string | null;
          session_id?: string | null;
          used?: boolean | null;
          used_at?: string | null;
        };
        Relationships: [];
      };
      print_history: {
        Row: {
          created_at: string | null;
          data: Json | null;
          id: string;
          job_id: string;
          metadata: Json | null;
          options: Json | null;
          result: Json | null;
          type: string;
        };
        Insert: {
          created_at?: string | null;
          data?: Json | null;
          id?: string;
          job_id: string;
          metadata?: Json | null;
          options?: Json | null;
          result?: Json | null;
          type: string;
        };
        Update: {
          created_at?: string | null;
          data?: Json | null;
          id?: string;
          job_id?: string;
          metadata?: Json | null;
          options?: Json | null;
          result?: Json | null;
          type?: string;
        };
        Relationships: [];
      };
      query_record: {
        Row: {
          answer: string;
          complexity: string | null;
          created_at: string;
          execution_time: number | null;
          expired_at: string | null;
          expired_reason: string | null;
          fuzzy_hash: string | null;
          query: string;
          query_hash: string | null;
          result_json: Json | null;
          row_count: number | null;
          session_id: string | null;
          sql_query: string;
          token: number;
          user: string;
          uuid: string;
        };
        Insert: {
          answer: string;
          complexity?: string | null;
          created_at?: string;
          execution_time?: number | null;
          expired_at?: string | null;
          expired_reason?: string | null;
          fuzzy_hash?: string | null;
          query: string;
          query_hash?: string | null;
          result_json?: Json | null;
          row_count?: number | null;
          session_id?: string | null;
          sql_query?: string;
          token: number;
          user: string;
          uuid?: string;
        };
        Update: {
          answer?: string;
          complexity?: string | null;
          created_at?: string;
          execution_time?: number | null;
          expired_at?: string | null;
          expired_reason?: string | null;
          fuzzy_hash?: string | null;
          query?: string;
          query_hash?: string | null;
          result_json?: Json | null;
          row_count?: number | null;
          session_id?: string | null;
          sql_query?: string;
          token?: number;
          user?: string;
          uuid?: string;
        };
        Relationships: [];
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
      record_aco_detail: {
        Row: {
          created_at: string | null;
          height: number | null;
          length: number | null;
          plt_num: string;
          uuid: string;
          weight: number | null;
          width: number | null;
        };
        Insert: {
          created_at?: string | null;
          height?: number | null;
          length?: number | null;
          plt_num: string;
          uuid?: string;
          weight?: number | null;
          width?: number | null;
        };
        Update: {
          created_at?: string | null;
          height?: number | null;
          length?: number | null;
          plt_num?: string;
          uuid?: string;
          weight?: number | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'record_aco_detail_plt_num_fkey';
            columns: ['plt_num'];
            isOneToOne: true;
            referencedRelation: 'mv_pallet_current_location';
            referencedColumns: ['plt_num'];
          },
          {
            foreignKeyName: 'record_aco_detail_plt_num_fkey';
            columns: ['plt_num'];
            isOneToOne: true;
            referencedRelation: 'record_palletinfo';
            referencedColumns: ['plt_num'];
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
            referencedRelation: 'mv_pallet_current_location';
            referencedColumns: ['plt_num'];
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
          {
            foreignKeyName: 'record_history_plt_num_fkey';
            columns: ['plt_num'];
            isOneToOne: false;
            referencedRelation: 'mv_pallet_current_location';
            referencedColumns: ['plt_num'];
          },
          {
            foreignKeyName: 'record_history_plt_num_fkey';
            columns: ['plt_num'];
            isOneToOne: false;
            referencedRelation: 'record_palletinfo';
            referencedColumns: ['plt_num'];
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
            referencedRelation: 'mv_pallet_current_location';
            referencedColumns: ['plt_num'];
          },
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
      record_slate: {
        Row: {
          b_thick: number;
          batch_num: string;
          centre_hole: number;
          code: string;
          colour: string;
          first_off: string | null;
          flame_test: number;
          length: number;
          mach_num: string;
          material: string;
          plt_num: string;
          remark: string | null;
          setter: string;
          shape: string;
          t_thick: number;
          uuid: string;
          weight: number;
          width: number;
        };
        Insert: {
          b_thick: number;
          batch_num?: string;
          centre_hole: number;
          code?: string;
          colour?: string;
          first_off?: string | null;
          flame_test: number;
          length: number;
          mach_num?: string;
          material?: string;
          plt_num?: string;
          remark?: string | null;
          setter?: string;
          shape?: string;
          t_thick: number;
          uuid?: string;
          weight: number;
          width: number;
        };
        Update: {
          b_thick?: number;
          batch_num?: string;
          centre_hole?: number;
          code?: string;
          colour?: string;
          first_off?: string | null;
          flame_test?: number;
          length?: number;
          mach_num?: string;
          material?: string;
          plt_num?: string;
          remark?: string | null;
          setter?: string;
          shape?: string;
          t_thick?: number;
          uuid?: string;
          weight?: number;
          width?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'record_slate_P_Code_fkey';
            columns: ['code'];
            isOneToOne: false;
            referencedRelation: 'data_code';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'record_slate_P_Num_fkey';
            columns: ['plt_num'];
            isOneToOne: false;
            referencedRelation: 'mv_pallet_current_location';
            referencedColumns: ['plt_num'];
          },
          {
            foreignKeyName: 'record_slate_P_Num_fkey';
            columns: ['plt_num'];
            isOneToOne: false;
            referencedRelation: 'record_palletinfo';
            referencedColumns: ['plt_num'];
          },
        ];
      };
      record_stocktake: {
        Row: {
          counted_id: number | null;
          counted_name: string | null;
          counted_qty: number | null;
          created_at: string | null;
          plt_num: string | null;
          product_code: string;
          product_desc: string;
          remain_qty: number | null;
          uuid: string;
        };
        Insert: {
          counted_id?: number | null;
          counted_name?: string | null;
          counted_qty?: number | null;
          created_at?: string | null;
          plt_num?: string | null;
          product_code: string;
          product_desc: string;
          remain_qty?: number | null;
          uuid?: string;
        };
        Update: {
          counted_id?: number | null;
          counted_name?: string | null;
          counted_qty?: number | null;
          created_at?: string | null;
          plt_num?: string | null;
          product_code?: string;
          product_desc?: string;
          remain_qty?: number | null;
          uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'record_stocktake_counted_id_fkey';
            columns: ['counted_id'];
            isOneToOne: false;
            referencedRelation: 'data_id';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'record_stocktake_plt_num_fkey';
            columns: ['plt_num'];
            isOneToOne: false;
            referencedRelation: 'mv_pallet_current_location';
            referencedColumns: ['plt_num'];
          },
          {
            foreignKeyName: 'record_stocktake_plt_num_fkey';
            columns: ['plt_num'];
            isOneToOne: false;
            referencedRelation: 'record_palletinfo';
            referencedColumns: ['plt_num'];
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
            referencedRelation: 'mv_pallet_current_location';
            referencedColumns: ['plt_num'];
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
      report_log: {
        Row: {
          error: string;
          error_info: string;
          state: boolean;
          time: string;
          user_id: number;
          uuid: string;
        };
        Insert: {
          error: string;
          error_info: string;
          state?: boolean;
          time?: string;
          user_id: number;
          uuid?: string;
        };
        Update: {
          error?: string;
          error_info?: string;
          state?: boolean;
          time?: string;
          user_id?: number;
          uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'report_log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'data_id';
            referencedColumns: ['id'];
          },
        ];
      };
      report_void: {
        Row: {
          damage_qty: number;
          plt_num: string;
          reason: string;
          time: string;
          uuid: string;
        };
        Insert: {
          damage_qty: number;
          plt_num: string;
          reason: string;
          time?: string;
          uuid?: string;
        };
        Update: {
          damage_qty?: number;
          plt_num?: string;
          reason?: string;
          time?: string;
          uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'report_void_plt_num_fkey';
            columns: ['plt_num'];
            isOneToOne: false;
            referencedRelation: 'mv_pallet_current_location';
            referencedColumns: ['plt_num'];
          },
          {
            foreignKeyName: 'report_void_plt_num_fkey';
            columns: ['plt_num'];
            isOneToOne: false;
            referencedRelation: 'record_palletinfo';
            referencedColumns: ['plt_num'];
          },
        ];
      };
      stock_level: {
        Row: {
          description: string;
          stock: string;
          stock_level: number;
          update_time: string;
          uuid: string;
        };
        Insert: {
          description: string;
          stock?: string;
          stock_level: number;
          update_time?: string;
          uuid?: string;
        };
        Update: {
          description?: string;
          stock?: string;
          stock_level?: number;
          update_time?: string;
          uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'stock_level_stock_fkey';
            columns: ['stock'];
            isOneToOne: false;
            referencedRelation: 'data_code';
            referencedColumns: ['code'];
          },
        ];
      };
      stocktake_batch_scan: {
        Row: {
          batch_id: string;
          counted_qty: number | null;
          created_at: string | null;
          error_message: string | null;
          plt_num: string | null;
          product_code: string;
          product_desc: string | null;
          scan_timestamp: string | null;
          status: string | null;
          user_id: number | null;
          user_name: string | null;
          uuid: string;
        };
        Insert: {
          batch_id: string;
          counted_qty?: number | null;
          created_at?: string | null;
          error_message?: string | null;
          plt_num?: string | null;
          product_code: string;
          product_desc?: string | null;
          scan_timestamp?: string | null;
          status?: string | null;
          user_id?: number | null;
          user_name?: string | null;
          uuid?: string;
        };
        Update: {
          batch_id?: string;
          counted_qty?: number | null;
          created_at?: string | null;
          error_message?: string | null;
          plt_num?: string | null;
          product_code?: string;
          product_desc?: string | null;
          scan_timestamp?: string | null;
          status?: string | null;
          user_id?: number | null;
          user_name?: string | null;
          uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'stocktake_batch_scan_plt_num_fkey';
            columns: ['plt_num'];
            isOneToOne: false;
            referencedRelation: 'mv_pallet_current_location';
            referencedColumns: ['plt_num'];
          },
          {
            foreignKeyName: 'stocktake_batch_scan_plt_num_fkey';
            columns: ['plt_num'];
            isOneToOne: false;
            referencedRelation: 'record_palletinfo';
            referencedColumns: ['plt_num'];
          },
          {
            foreignKeyName: 'stocktake_batch_scan_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'data_id';
            referencedColumns: ['id'];
          },
        ];
      };
      stocktake_batch_summary: {
        Row: {
          batch_time: string;
          counted_id: number | null;
          counted_name: string | null;
          created_at: string | null;
          end_time: string | null;
          product_count: number | null;
          scan_count: number | null;
          start_time: string | null;
          total_counted: number | null;
          updated_at: string | null;
          uuid: string;
        };
        Insert: {
          batch_time: string;
          counted_id?: number | null;
          counted_name?: string | null;
          created_at?: string | null;
          end_time?: string | null;
          product_count?: number | null;
          scan_count?: number | null;
          start_time?: string | null;
          total_counted?: number | null;
          updated_at?: string | null;
          uuid?: string;
        };
        Update: {
          batch_time?: string;
          counted_id?: number | null;
          counted_name?: string | null;
          created_at?: string | null;
          end_time?: string | null;
          product_count?: number | null;
          scan_count?: number | null;
          start_time?: string | null;
          total_counted?: number | null;
          updated_at?: string | null;
          uuid?: string;
        };
        Relationships: [];
      };
      stocktake_daily_summary: {
        Row: {
          count_date: string;
          created_at: string | null;
          final_remain_qty: number | null;
          last_count_time: string | null;
          pallet_count: number | null;
          product_code: string;
          product_desc: string | null;
          total_counted: number | null;
          updated_at: string | null;
          uuid: string;
        };
        Insert: {
          count_date: string;
          created_at?: string | null;
          final_remain_qty?: number | null;
          last_count_time?: string | null;
          pallet_count?: number | null;
          product_code: string;
          product_desc?: string | null;
          total_counted?: number | null;
          updated_at?: string | null;
          uuid?: string;
        };
        Update: {
          count_date?: string;
          created_at?: string | null;
          final_remain_qty?: number | null;
          last_count_time?: string | null;
          pallet_count?: number | null;
          product_code?: string;
          product_desc?: string | null;
          total_counted?: number | null;
          updated_at?: string | null;
          uuid?: string;
        };
        Relationships: [];
      };
      stocktake_report_cache: {
        Row: {
          cache_data: Json | null;
          expires_at: string | null;
          generated_at: string | null;
          report_date: string;
          report_type: string | null;
          uuid: string;
        };
        Insert: {
          cache_data?: Json | null;
          expires_at?: string | null;
          generated_at?: string | null;
          report_date: string;
          report_type?: string | null;
          uuid?: string;
        };
        Update: {
          cache_data?: Json | null;
          expires_at?: string | null;
          generated_at?: string | null;
          report_date?: string;
          report_type?: string | null;
          uuid?: string;
        };
        Relationships: [];
      };
      stocktake_session: {
        Row: {
          created_at: string | null;
          end_time: string | null;
          error_scans: number | null;
          session_date: string | null;
          session_status: string | null;
          start_time: string | null;
          success_scans: number | null;
          total_scans: number | null;
          user_id: number | null;
          user_name: string | null;
          uuid: string;
        };
        Insert: {
          created_at?: string | null;
          end_time?: string | null;
          error_scans?: number | null;
          session_date?: string | null;
          session_status?: string | null;
          start_time?: string | null;
          success_scans?: number | null;
          total_scans?: number | null;
          user_id?: number | null;
          user_name?: string | null;
          uuid?: string;
        };
        Update: {
          created_at?: string | null;
          end_time?: string | null;
          error_scans?: number | null;
          session_date?: string | null;
          session_status?: string | null;
          start_time?: string | null;
          success_scans?: number | null;
          total_scans?: number | null;
          user_id?: number | null;
          user_name?: string | null;
          uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'stocktake_session_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'data_id';
            referencedColumns: ['id'];
          },
        ];
      };
      stocktake_validation_rules: {
        Row: {
          created_at: string | null;
          error_threshold: number | null;
          is_active: boolean | null;
          max_value: number | null;
          min_value: number | null;
          require_approval: boolean | null;
          rule_name: string;
          rule_type: string | null;
          updated_at: string | null;
          uuid: string;
          warning_threshold: number | null;
        };
        Insert: {
          created_at?: string | null;
          error_threshold?: number | null;
          is_active?: boolean | null;
          max_value?: number | null;
          min_value?: number | null;
          require_approval?: boolean | null;
          rule_name: string;
          rule_type?: string | null;
          updated_at?: string | null;
          uuid?: string;
          warning_threshold?: number | null;
        };
        Update: {
          created_at?: string | null;
          error_threshold?: number | null;
          is_active?: boolean | null;
          max_value?: number | null;
          min_value?: number | null;
          require_approval?: boolean | null;
          rule_name?: string;
          rule_type?: string | null;
          updated_at?: string | null;
          uuid?: string;
          warning_threshold?: number | null;
        };
        Relationships: [];
      };
      stocktake_variance_analysis: {
        Row: {
          analysis_date: string | null;
          approved_at: string | null;
          approved_by: number | null;
          counted_qty: number | null;
          created_at: string | null;
          product_code: string;
          product_desc: string | null;
          system_qty: number | null;
          uuid: string;
          variance_percentage: number | null;
          variance_qty: number | null;
          variance_reason: string | null;
          variance_value: number | null;
        };
        Insert: {
          analysis_date?: string | null;
          approved_at?: string | null;
          approved_by?: number | null;
          counted_qty?: number | null;
          created_at?: string | null;
          product_code: string;
          product_desc?: string | null;
          system_qty?: number | null;
          uuid?: string;
          variance_percentage?: number | null;
          variance_qty?: number | null;
          variance_reason?: string | null;
          variance_value?: number | null;
        };
        Update: {
          analysis_date?: string | null;
          approved_at?: string | null;
          approved_by?: number | null;
          counted_qty?: number | null;
          created_at?: string | null;
          product_code?: string;
          product_desc?: string | null;
          system_qty?: number | null;
          uuid?: string;
          variance_percentage?: number | null;
          variance_qty?: number | null;
          variance_reason?: string | null;
          variance_value?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'stocktake_variance_analysis_approved_by_fkey';
            columns: ['approved_by'];
            isOneToOne: false;
            referencedRelation: 'data_id';
            referencedColumns: ['id'];
          },
        ];
      };
      stocktake_variance_report: {
        Row: {
          count_date: string;
          counted_stock: number | null;
          created_at: string | null;
          product_code: string;
          product_desc: string | null;
          system_stock: number | null;
          updated_at: string | null;
          uuid: string;
          variance: number | null;
          variance_percentage: number | null;
        };
        Insert: {
          count_date: string;
          counted_stock?: number | null;
          created_at?: string | null;
          product_code: string;
          product_desc?: string | null;
          system_stock?: number | null;
          updated_at?: string | null;
          uuid?: string;
          variance?: number | null;
          variance_percentage?: number | null;
        };
        Update: {
          count_date?: string;
          counted_stock?: number | null;
          created_at?: string | null;
          product_code?: string;
          product_desc?: string | null;
          system_stock?: number | null;
          updated_at?: string | null;
          uuid?: string;
          variance?: number | null;
          variance_percentage?: number | null;
        };
        Relationships: [];
      };
      transaction_log: {
        Row: {
          affected_records: Json | null;
          compensation_actions: Json | null;
          compensation_required: boolean | null;
          completed_at: string | null;
          created_at: string | null;
          error_code: string | null;
          error_details: Json | null;
          error_message: string | null;
          error_stack: string | null;
          id: number;
          metadata: Json | null;
          operation_type: string;
          parent_transaction_id: string | null;
          post_state: Json | null;
          pre_state: Json | null;
          related_transactions: string[] | null;
          report_log_id: string | null;
          rollback_attempted: boolean | null;
          rollback_by: string | null;
          rollback_reason: string | null;
          rollback_successful: boolean | null;
          rollback_timestamp: string | null;
          session_id: string | null;
          source_action: string;
          source_module: string;
          source_page: string;
          status: string | null;
          step_name: string | null;
          step_sequence: number | null;
          transaction_id: string;
          updated_at: string | null;
          user_clock_number: string | null;
          user_id: string;
        };
        Insert: {
          affected_records?: Json | null;
          compensation_actions?: Json | null;
          compensation_required?: boolean | null;
          completed_at?: string | null;
          created_at?: string | null;
          error_code?: string | null;
          error_details?: Json | null;
          error_message?: string | null;
          error_stack?: string | null;
          id?: number;
          metadata?: Json | null;
          operation_type: string;
          parent_transaction_id?: string | null;
          post_state?: Json | null;
          pre_state?: Json | null;
          related_transactions?: string[] | null;
          report_log_id?: string | null;
          rollback_attempted?: boolean | null;
          rollback_by?: string | null;
          rollback_reason?: string | null;
          rollback_successful?: boolean | null;
          rollback_timestamp?: string | null;
          session_id?: string | null;
          source_action: string;
          source_module: string;
          source_page: string;
          status?: string | null;
          step_name?: string | null;
          step_sequence?: number | null;
          transaction_id: string;
          updated_at?: string | null;
          user_clock_number?: string | null;
          user_id: string;
        };
        Update: {
          affected_records?: Json | null;
          compensation_actions?: Json | null;
          compensation_required?: boolean | null;
          completed_at?: string | null;
          created_at?: string | null;
          error_code?: string | null;
          error_details?: Json | null;
          error_message?: string | null;
          error_stack?: string | null;
          id?: number;
          metadata?: Json | null;
          operation_type?: string;
          parent_transaction_id?: string | null;
          post_state?: Json | null;
          pre_state?: Json | null;
          related_transactions?: string[] | null;
          report_log_id?: string | null;
          rollback_attempted?: boolean | null;
          rollback_by?: string | null;
          rollback_reason?: string | null;
          rollback_successful?: boolean | null;
          rollback_timestamp?: string | null;
          session_id?: string | null;
          source_action?: string;
          source_module?: string;
          source_page?: string;
          status?: string | null;
          step_name?: string | null;
          step_sequence?: number | null;
          transaction_id?: string;
          updated_at?: string | null;
          user_clock_number?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_report_log';
            columns: ['report_log_id'];
            isOneToOne: false;
            referencedRelation: 'report_log';
            referencedColumns: ['uuid'];
          },
          {
            foreignKeyName: 'fk_report_log';
            columns: ['report_log_id'];
            isOneToOne: false;
            referencedRelation: 'v_transaction_report';
            referencedColumns: ['report_log_uuid'];
          },
        ];
      };
      user_navigation_history: {
        Row: {
          created_at: string | null;
          device_type: string | null;
          id: string;
          path: string;
          session_id: string | null;
          user_id: string;
          visited_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          device_type?: string | null;
          id?: string;
          path: string;
          session_id?: string | null;
          user_id: string;
          visited_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          device_type?: string | null;
          id?: string;
          path?: string;
          session_id?: string | null;
          user_id?: string;
          visited_at?: string | null;
        };
        Relationships: [];
      };
      user_navigation_patterns: {
        Row: {
          from_path: string;
          last_transition: string | null;
          to_path: string;
          transition_count: number | null;
          user_id: string;
        };
        Insert: {
          from_path: string;
          last_transition?: string | null;
          to_path: string;
          transition_count?: number | null;
          user_id: string;
        };
        Update: {
          from_path?: string;
          last_transition?: string | null;
          to_path?: string;
          transition_count?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_navigation_stats: {
        Row: {
          avg_time_spent: number | null;
          first_visited: string | null;
          last_visited: string | null;
          path: string;
          user_id: string;
          visit_count: number | null;
        };
        Insert: {
          avg_time_spent?: number | null;
          first_visited?: string | null;
          last_visited?: string | null;
          path: string;
          user_id: string;
          visit_count?: number | null;
        };
        Update: {
          avg_time_spent?: number | null;
          first_visited?: string | null;
          last_visited?: string | null;
          path?: string;
          user_id?: string;
          visit_count?: number | null;
        };
        Relationships: [];
      };
      work_level: {
        Row: {
          grn: number;
          id: number;
          latest_update: string;
          loading: number;
          move: number;
          qc: number;
          uuid: string;
        };
        Insert: {
          grn: number;
          id: number;
          latest_update?: string;
          loading?: number;
          move?: number;
          qc?: number;
          uuid?: string;
        };
        Update: {
          grn?: number;
          id?: number;
          latest_update?: string;
          loading?: number;
          move?: number;
          qc?: number;
          uuid?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'work_level_id_fkey';
            columns: ['id'];
            isOneToOne: false;
            referencedRelation: 'data_id';
            referencedColumns: ['id'];
          },
        ];
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
      v_stock_transfer_performance: {
        Row: {
          row_count: number | null;
          table_name: string | null;
          total_size: string | null;
        };
        Relationships: [];
      };
      v_transaction_report: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          metadata: Json | null;
          report_error: string | null;
          report_error_info: string | null;
          report_log_uuid: string | null;
          report_state: boolean | null;
          report_time: string | null;
          source_action: string | null;
          source_module: string | null;
          status: string | null;
          transaction_id: string | null;
          user_clock_number: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      api_cleanup_pallet_buffer: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      auto_cleanup_pallet_buffer: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      batch_search_pallets: {
        Args: { p_patterns: string[] };
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
      check_aco_order_completion: {
        Args: { p_order_ref: number };
        Returns: Json;
      };
      check_pallet_buffer_health: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      cleanup_grn_records: {
        Args: { p_pallet_numbers: string[] };
        Returns: Json;
      };
      complete_transaction: {
        Args: {
          p_transaction_id: string;
          p_post_state?: Json;
          p_affected_records?: Json;
        };
        Returns: undefined;
      };
      comprehensive_performance_test: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      confirm_pallet_usage: {
        Args: { p_pallet_numbers: string[] };
        Returns: boolean;
      };
      execute_sql_query: {
        Args: { query_text: string };
        Returns: Json;
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
      force_sync_pallet_mv: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      generate_atomic_pallet_numbers_v6: {
        Args: { p_count: number; p_session_id?: string };
        Returns: {
          pallet_number: string;
          series: string;
        }[];
      };
      get_aco_order_details: {
        Args: { p_product_code: string; p_order_ref?: string };
        Returns: Json;
      };
      get_dashboard_stats: {
        Args: {
          p_use_estimated_count?: boolean;
          p_include_detailed_stats?: boolean;
        };
        Returns: Json;
      };
      get_feature_flag_stats: {
        Args: { p_flag_key: string; p_start_date?: string; p_end_date?: string };
        Returns: {
          date: string;
          total_evaluations: number;
          total_enabled: number;
          total_disabled: number;
          enable_rate: number;
          variant_distribution: Json;
        }[];
      };
      get_optimized_inventory_data: {
        Args: {
          p_location?: string;
          p_limit?: number;
          p_offset?: number;
          p_include_zero_qty?: boolean;
          p_sort_by?: string;
          p_sort_order?: string;
          p_product_filter?: string;
          p_aggregate_by_product?: boolean;
        };
        Returns: Json;
      };
      get_pallet_buffer_status: {
        Args: Record<PropertyKey, never>;
        Returns: {
          total_count: number;
          available_count: number;
          holded_count: number;
          used_count: number;
          next_available_id: number;
        }[];
      };
      get_predicted_next_paths: {
        Args: { p_user_id: string; p_current_path: string; p_limit?: number };
        Returns: {
          path: string;
          probability: number;
          visit_count: number;
        }[];
      };
      get_product_details_by_code: {
        Args: { p_code: string };
        Returns: {
          code: string;
          description: string;
          standard_qty: string;
          type: string;
          remark: string;
        }[];
      };
      get_rollback_status: {
        Args: { p_transaction_id: string };
        Returns: Json;
      };
      get_top_query_patterns: {
        Args: { days_back?: number; p_limit?: number };
        Returns: {
          pattern: string;
          count: number;
        }[];
      };
      get_warehouse_summary: {
        Args: { p_time_period?: string };
        Returns: Json;
      };
      gtrgm_compress: {
        Args: { '': unknown };
        Returns: unknown;
      };
      gtrgm_decompress: {
        Args: { '': unknown };
        Returns: unknown;
      };
      gtrgm_in: {
        Args: { '': unknown };
        Returns: unknown;
      };
      gtrgm_options: {
        Args: { '': unknown };
        Returns: undefined;
      };
      gtrgm_out: {
        Args: { '': unknown };
        Returns: unknown;
      };
      handle_print_label_updates: {
        Args: {
          p_product_code: string;
          p_quantity: number;
          p_user_id: number;
          p_pallet_count?: number;
          p_description?: string;
        };
        Returns: Json;
      };
      increment_navigation_stats: {
        Args: { p_user_id: string; p_path: string; p_time_spent?: number };
        Returns: undefined;
      };
      log_feature_flag_evaluation: {
        Args: {
          p_flag_key: string;
          p_enabled: boolean;
          p_variant?: string;
          p_context?: Json;
        };
        Returns: undefined;
      };
      process_grn_label_unified: {
        Args: {
          p_count: number;
          p_grn_number: string;
          p_material_code: string;
          p_supplier_code: string;
          p_clock_number: string;
          p_label_mode?: string;
          p_session_id?: string;
          p_gross_weights?: number[];
          p_net_weights?: number[];
          p_quantities?: number[];
          p_pallet_count?: number;
          p_package_count?: number;
          p_pallet_type?: string;
          p_package_type?: string;
          p_pdf_urls?: string[];
        };
        Returns: Json;
      };
      process_grn_label_with_transaction: {
        Args: {
          p_count: number;
          p_grn_number: string;
          p_material_code: string;
          p_supplier_code: string;
          p_clock_number: string;
          p_label_mode?: string;
          p_session_id?: string;
          p_gross_weights?: number[];
          p_net_weights?: number[];
          p_quantities?: number[];
          p_pallet_count?: number;
          p_package_count?: number;
          p_pallet_type?: string;
          p_package_type?: string;
          p_pdf_urls?: string[];
        };
        Returns: Json;
      };
      process_qc_label_unified: {
        Args: {
          p_count: number;
          p_product_code: string;
          p_product_qty: number;
          p_clock_number: string;
          p_plt_remark: string;
          p_session_id?: string;
          p_aco_order_ref?: string;
          p_aco_quantity_used?: number;
          p_slate_batch_number?: string;
          p_pdf_urls?: string[];
        };
        Returns: Json;
      };
      quick_performance_test: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      record_transaction_error: {
        Args: {
          p_transaction_id: string;
          p_error_code: string;
          p_error_message: string;
          p_error_details?: Json;
          p_error_stack?: string;
        };
        Returns: string;
      };
      record_transaction_step: {
        Args: {
          p_transaction_id: string;
          p_step_name: string;
          p_step_sequence: number;
          p_step_data?: Json;
        };
        Returns: undefined;
      };
      refresh_pallet_location_mv: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      release_pallet_reservation: {
        Args: { p_pallet_numbers: string[] };
        Returns: boolean;
      };
      reset_daily_pallet_buffer: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      rollback_transaction: {
        Args: {
          p_transaction_id: string;
          p_rollback_by: string;
          p_rollback_reason: string;
        };
        Returns: Json;
      };
      rpc_create_supplier: {
        Args: {
          p_supplier_code: string;
          p_supplier_name: string;
          p_user_id: number;
        };
        Returns: Json;
      };
      rpc_get_aco_incomplete_orders_dashboard: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: Json;
      };
      rpc_get_aco_order_refs: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: Json;
      };
      rpc_get_aco_order_report: {
        Args: { p_order_ref: number; p_limit?: number; p_offset?: number };
        Returns: Json;
      };
      rpc_get_await_location_count: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      rpc_get_await_location_count_by_timeframe: {
        Args: { p_start_date: string; p_end_date: string };
        Returns: Json;
      };
      rpc_get_await_percentage_stats: {
        Args: { p_start_date: string; p_end_date: string };
        Returns: Json;
      };
      rpc_get_grn_material_codes: {
        Args: { p_grn_ref: string };
        Returns: Json;
      };
      rpc_get_grn_references: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: Json;
      };
      rpc_get_grn_report_data: {
        Args: { p_grn_ref: string; p_material_code: string };
        Returns: Json;
      };
      rpc_get_history_tree: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: Json;
      };
      rpc_get_inventory_ordered_analysis: {
        Args: { p_product_type?: string };
        Returns: Json;
      };
      rpc_get_order_state_list: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: Json;
      };
      rpc_get_orders_list: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: {
          uuid: string;
          time: string;
          id: number;
          action: string;
          plt_num: string;
          loc: string;
          remark: string;
          uploader_name: string;
          doc_url: string;
          total_count: number;
        }[];
      };
      rpc_get_other_files_list: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: Json;
      };
      rpc_get_pallet_reprint_info: {
        Args: { p_pallet_num: string };
        Returns: {
          plt_num: string;
          product_code: string;
          product_description: string;
          product_colour: string;
          product_qty: number;
          pdf_url: string;
          series: string;
          plt_remark: string;
          generate_time: string;
        }[];
      };
      rpc_get_product_distribution: {
        Args: { p_start_date?: string; p_end_date?: string; p_limit?: number };
        Returns: {
          name: string;
          value: number;
        }[];
      };
      rpc_get_production_details: {
        Args: { p_start_date?: string; p_end_date?: string; p_limit?: number };
        Returns: {
          plt_num: string;
          product_code: string;
          product_qty: number;
          qc_by: string;
          generate_time: string;
        }[];
      };
      rpc_get_production_stats: {
        Args: { p_start_date?: string; p_end_date?: string; p_metric?: string };
        Returns: number;
      };
      rpc_get_report_references: {
        Args: {
          p_table_name: string;
          p_field_name: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: Json;
      };
      rpc_get_staff_workload: {
        Args: {
          p_start_date?: string;
          p_end_date?: string;
          p_department?: string;
        };
        Returns: {
          work_date: string;
          staff_name: string;
          action_count: number;
        }[];
      };
      rpc_get_stock_distribution: {
        Args: { p_stock_type?: string };
        Returns: Json;
      };
      rpc_get_stock_level_history: {
        Args: {
          p_product_codes: string[];
          p_start_date?: string;
          p_end_date?: string;
          p_time_segments?: number;
        };
        Returns: {
          time_segment: string;
          segment_start: string;
          segment_end: string;
          product_data: Json;
          metadata: Json;
        }[];
      };
      rpc_get_stock_types: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      rpc_get_top_products: {
        Args: { p_start_date?: string; p_end_date?: string; p_limit?: number };
        Returns: {
          name: string;
          value: number;
        }[];
      };
      rpc_get_transfer_time_distribution: {
        Args: {
          p_start_date: string;
          p_end_date: string;
          p_time_slots?: number;
        };
        Returns: Json;
      };
      rpc_get_user_id_by_email: {
        Args: { p_email: string };
        Returns: number;
      };
      rpc_get_warehouse_transfer_list: {
        Args: {
          p_start_date?: string;
          p_end_date?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          tran_date: string;
          plt_num: string;
          operator_name: string;
          operator_id: number;
          total_count: number;
        }[];
      };
      rpc_get_warehouse_work_level: {
        Args: {
          p_start_date?: string;
          p_end_date?: string;
          p_department?: string;
        };
        Returns: Json;
      };
      rpc_get_warehouse_work_level_this_month: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      rpc_get_warehouse_work_level_this_week: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      rpc_get_warehouse_work_level_today: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      rpc_load_pallet_to_order: {
        Args: {
          p_order_ref: string;
          p_pallet_input: string;
          p_user_id?: number;
          p_user_name?: string;
        };
        Returns: Json;
      };
      rpc_performance_benchmark: {
        Args: { p_test_type?: string };
        Returns: Json;
      };
      rpc_search_inventory_with_chart: {
        Args: { p_product_code: string; p_include_chart?: boolean };
        Returns: Json;
      };
      rpc_search_supplier: {
        Args: { p_supplier_code: string };
        Returns: Json;
      };
      rpc_transfer_pallet: {
        Args: {
          p_pallet_num: string;
          p_to_location: string;
          p_user_id: number;
          p_user_name: string;
        };
        Returns: Json;
      };
      rpc_undo_load_pallet: {
        Args: {
          p_order_ref: string;
          p_pallet_num: string;
          p_product_code: string;
          p_quantity: number;
          p_user_id?: number;
          p_user_name?: string;
        };
        Returns: Json;
      };
      rpc_update_supplier: {
        Args: {
          p_supplier_code: string;
          p_supplier_name: string;
          p_user_id: number;
        };
        Returns: Json;
      };
      search_pallet_info: {
        Args: { p_search_type: string; p_search_value: string };
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
      search_pallet_optimized_v2: {
        Args: { p_search_type: string; p_search_value: string };
        Returns: {
          plt_num: string;
          product_code: string;
          product_qty: number;
          plt_remark: string;
          series: string;
          current_location: string;
          last_update: string;
          is_from_mv: boolean;
        }[];
      };
      search_product_code: {
        Args: { p_code: string };
        Returns: Json;
      };
      search_supplier_code: {
        Args: { p_code: string };
        Returns: Json;
      };
      set_limit: {
        Args: { '': number };
        Returns: number;
      };
      show_limit: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      show_trgm: {
        Args: { '': string };
        Returns: string[];
      };
      smart_refresh_mv: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      smart_reset_pallet_buffer: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      start_transaction: {
        Args: {
          p_transaction_id: string;
          p_source_module: string;
          p_source_page: string;
          p_source_action: string;
          p_operation_type: string;
          p_user_id: string;
          p_user_clock_number?: string;
          p_session_id?: string;
          p_pre_state?: Json;
          p_metadata?: Json;
        };
        Returns: string;
      };
      track_navigation_transition: {
        Args: { p_user_id: string; p_from_path: string; p_to_path: string };
        Returns: undefined;
      };
      update_aco_order_with_completion_check: {
        Args: {
          p_order_ref: number;
          p_product_code: string;
          p_quantity_used: number;
        };
        Returns: Json;
      };
      update_grn_workflow: {
        Args:
          | {
              p_grn_ref: number;
              p_product_code: string;
              p_product_description: string;
              p_label_mode: string;
              p_user_id: string;
              p_grn_quantity?: number;
              p_grn_weight?: number;
            }
          | {
              p_grn_ref: number;
              p_product_code: string;
              p_product_description: string;
              p_label_mode: string;
              p_user_id: string;
              p_quantity?: number;
              p_net_weight?: number;
            }
          | {
              p_grn_ref: string;
              p_label_mode: string;
              p_user_id: number;
              p_product_code: string;
              p_product_description?: string;
              p_gross_weight?: number;
              p_net_weight?: number;
              p_quantity?: number;
              p_grn_count?: number;
            };
        Returns: Json;
      };
      update_stock_level: {
        Args: {
          p_product_code: string;
          p_quantity: number;
          p_description?: string;
        };
        Returns: boolean;
      };
      update_stock_level_void: {
        Args: {
          p_product_code: string;
          p_quantity: number;
          p_operation?: string;
        };
        Returns: string;
      };
      update_work_level_move: {
        Args: { p_user_id: number; p_move_count?: number };
        Returns: string;
      };
      update_work_level_qc: {
        Args: { p_user_id: number; p_pallet_count: number };
        Returns: Json;
      };
      validate_stocktake_count: {
        Args: { p_product_code: string; p_counted_qty: number };
        Returns: Json;
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
