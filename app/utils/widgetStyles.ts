/**
 * 統一的 Widget 風格配置
 */

export const WidgetStyles = {
  // 基礎樣式 - 透明背景
  base: 'bg-white/3 backdrop-blur-md',
  
  // Widget 專屬邊框顏色 - 完全移除邊框效果
  borders: {
    // Statistics 類
    VOID_STATS: '',
    
    // Charts & Analytics 類
    PRODUCT_MIX_CHART: '',
    
    // Operations 類
    RECENT_ACTIVITY: '',
    ACO_ORDER_PROGRESS: '',
    FINISHED_PRODUCT: '',
    MATERIAL_RECEIVED: '',
    
    // Tools 類
    ASK_DATABASE: '',
    
    // System Tools 類
    VOID_PALLET: '',
    
    // Document Management 類
    UPLOAD_FILES: '',
    REPORTS: '',
    PRODUCT_SPEC: '',
    CUSTOM: '',
    
    // 支援小寫版本（兼容性）
    void_stats: '',
    product_mix_chart: '',
    recent_activity: '',
    aco_order_progress: '',
    finished_product: '',
    material_received: '',
    ask_database: '',
    void_pallet: '',
    upload_files: '',
    reports: '',
    product_spec: '',
    custom: '',
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