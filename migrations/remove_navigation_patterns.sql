-- Migration: Remove User Navigation Patterns System
-- Date: 2025-07-22
-- Description: 移除用戶導航追蹤系統的數據庫組件
-- Reason: 系統過度複雜，違反 KISS/YAGNI 原則，不適合 30-40 人的小型系統

-- =====================================================
-- Step 1: 移除 RPC 函數
-- =====================================================

-- 移除增加導航統計的 RPC 函數
DROP FUNCTION IF EXISTS increment_navigation_stats(uuid, text);

-- 移除追蹤導航轉移的 RPC 函數  
DROP FUNCTION IF EXISTS track_navigation_transition(uuid, text, text);

-- 移除獲取預測路徑的 RPC 函數
DROP FUNCTION IF EXISTS get_predicted_next_paths(uuid);

-- =====================================================
-- Step 2: 移除數據表
-- =====================================================

-- 移除用戶導航歷史表
DROP TABLE IF EXISTS user_navigation_history CASCADE;

-- 移除用戶導航統計表
DROP TABLE IF EXISTS user_navigation_stats CASCADE;

-- 移除用戶導航模式表
DROP TABLE IF EXISTS user_navigation_patterns CASCADE;

-- =====================================================
-- Step 3: 移除相關索引（如果有單獨創建的）
-- =====================================================

-- 這些索引會隨著表的刪除自動移除，但為了完整性列出
-- DROP INDEX IF EXISTS idx_navigation_history_user_path;
-- DROP INDEX IF EXISTS idx_navigation_stats_user_path;
-- DROP INDEX IF EXISTS idx_navigation_patterns_user_from_to;

-- =====================================================
-- Step 4: 清理相關權限（如果有特殊設置）
-- =====================================================

-- 通常 RLS 政策會隨表刪除，但確保完全清理
-- 這些命令可能會報錯如果對象不存在，這是正常的

-- =====================================================
-- 驗證清理結果
-- =====================================================

-- 執行以下查詢來確認所有對象已被移除：
/*
-- 檢查表是否已移除
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_navigation_history', 'user_navigation_stats', 'user_navigation_patterns');

-- 檢查函數是否已移除
SELECT proname FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace 
AND proname IN ('increment_navigation_stats', 'track_navigation_transition', 'get_predicted_next_paths');
*/

-- =====================================================
-- 注意事項
-- =====================================================
-- 1. 執行此腳本前請確保已備份數據庫
-- 2. 確認應用程序已更新為不依賴這些數據庫對象
-- 3. 此操作不可逆，刪除的數據無法恢復
-- 4. 建議在非生產環境先測試此腳本

-- End of migration