/**
 * Stock Transfer 頁面的樣式常量
 * 統一管理所有重複使用的樣式
 */

export const CARD_STYLES = {
  // 卡片容器樣式
  wrapper: 'relative group',
  
  // 背景效果
  backgroundBlur: 'absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-3xl blur-xl',
  
  // 主卡片樣式
  card: 'relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-blue-900/20 hover:border-blue-500/30 transition-all duration-300',
  
  // 懸停效果
  hoverGradient: 'absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl',
  
  // 頂部邊框光效
  topBorder: 'absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-3xl',
  
  // 內容區域
  content: 'relative z-10'
} as const;

export const TEXT_STYLES = {
  // 標題樣式
  pageTitle: 'text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-300 bg-clip-text text-transparent mb-3 flex items-center justify-center',
  
  sectionTitle: 'text-2xl font-semibold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent',
  
  // 時間戳樣式
  timestamp: {
    default: 'text-xs font-mono text-slate-400',
    error: 'text-xs font-mono text-red-400'
  }
} as const;

export const ANIMATION_STYLES = {
  // 脈動動畫
  pulse: 'animate-pulse',
  
  // 錯誤動畫
  errorPulse: 'animate-pulse shadow-lg shadow-red-500/30',
  
  // 過渡效果
  transition: 'transition-all duration-300'
} as const;

export const LOG_ITEM_STYLES = {
  // 基礎樣式
  base: 'flex items-start space-x-3 p-4 rounded-xl border transition-all duration-300',
  
  // 狀態樣式
  states: {
    success: 'bg-green-500/10 border-green-500/30 text-green-300',
    error: 'bg-black border-red-500 text-red-500 font-bold animate-pulse shadow-lg shadow-red-500/30',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    pending: 'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse'
  },
  
  // 圓點樣式
  dots: {
    success: 'bg-green-400',
    error: 'bg-red-500 animate-pulse',
    info: 'bg-blue-400',
    pending: 'bg-amber-400 animate-pulse'
  }
} as const;

export const ICON_STYLES = {
  // 圖標容器
  container: 'inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/25',
  
  // 圖標樣式
  icon: 'w-6 h-6 text-white'
} as const;