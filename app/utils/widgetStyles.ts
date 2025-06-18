/**
 * 統一的 Widget 風格配置
 */

export const WidgetStyles = {
  // 基礎樣式 - 透明背景
  base: 'bg-white/5 backdrop-blur-md',
  
  // Widget 專屬邊框顏色
  borders: {
    // Statistics 類
    OUTPUT_STATS: 'border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    BOOKED_OUT_STATS: 'border-2 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
    VOID_STATS: 'border-2 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
    
    // Charts & Analytics 類
    PRODUCT_MIX_CHART: 'border-2 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
    
    // Operations 類
    RECENT_ACTIVITY: 'border-2 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
    ACO_ORDER_PROGRESS: 'border-2 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]',
    INVENTORY_SEARCH: 'border-2 border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.3)]',
    FINISHED_PRODUCT: 'border-2 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]',
    MATERIAL_RECEIVED: 'border-2 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]',
    
    // Tools 類
    ASK_DATABASE: 'border-2 border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.3)]',
    
    // System Tools 類
    VOID_PALLET: 'border-2 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)]',
    VIEW_HISTORY: 'border-2 border-lime-500/50 shadow-[0_0_15px_rgba(132,204,22,0.3)]',
    DATABASE_UPDATE: 'border-2 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]',
    
    // Document Management 類
    UPLOAD_FILES: 'border-2 border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.3)]',
    REPORTS: 'border-2 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    
    // 支援小寫版本（兼容性）
    output_stats: 'border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    booked_out_stats: 'border-2 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
    void_stats: 'border-2 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
    product_mix_chart: 'border-2 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
    recent_activity: 'border-2 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
    aco_order_progress: 'border-2 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]',
    inventory_search: 'border-2 border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.3)]',
    finished_product: 'border-2 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]',
    material_received: 'border-2 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]',
    ask_database: 'border-2 border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.3)]',
    void_pallet: 'border-2 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)]',
    view_history: 'border-2 border-lime-500/50 shadow-[0_0_15px_rgba(132,204,22,0.3)]',
    database_update: 'border-2 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]',
    upload_files: 'border-2 border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.3)]',
    reports: 'border-2 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
  },
  
  // 文字顏色
  text: {
    // 數據表使用紫色系
    table: 'text-purple-400',
    tableHeader: 'text-purple-300',
    tableData: 'text-purple-200',
    
    // 圖表使用綠色系
    chart: 'text-green-400',
    chartLabel: 'text-green-300',
    chartData: 'text-green-200',
    
    // 標題和描述
    title: 'text-white',
    subtitle: 'text-slate-300',
    description: 'text-slate-400',
  },
  
  // Quick Access 按鈕顏色配置
  quickAccess: {
    // Report Center Widget
    reports: {
      'Void Pallet Report': 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500',
      'Order Loading Report': 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500',
      'Stock Take Report': 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500',
      'ACO Order Report': 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500',
      'Transaction Report': 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500',
      'GRN Report': 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500',
      'Export All Data': 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500',
    },
    
    // System Update Widget
    systemUpdate: {
      'Update Product Info': 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500',
      'Update Supplier Info': 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500',
    },
    
    // Document Upload Widget
    documentUpload: {
      'Upload Files': 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500',
      'Upload Order PDF': 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500',
      'Upload Spec': 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500',
    },
    
    // Void Pallet Widget
    voidPallet: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500',
    
    // View History Widget
    viewHistory: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500',
  },
  
  // 圖表顏色配置
  charts: {
    line: '#10b981', // green-500
    bar: '#10b981',
    area: '#10b981',
    pie: ['#10b981', '#34d399', '#6ee7b7', '#86efac', '#bbf7d0'],
  }
};

// Helper function to get widget style
export function getWidgetStyle(widgetType: string) {
  return `${WidgetStyles.base} ${WidgetStyles.borders[widgetType as keyof typeof WidgetStyles.borders] || ''}`;
}