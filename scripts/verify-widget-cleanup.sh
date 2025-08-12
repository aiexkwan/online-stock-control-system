#!/bin/bash

# Widget 殘留驗證腳本
# 用於檢查系統中所有 widget 相關內容

echo "========================================"
echo "Widget 殘留完整性檢查"
echo "========================================"

# 1. 統計 widget 關鍵字出現次數
echo -e "\n[1] 統計 'widget' 關鍵字（不區分大小寫）："
rg -i "widget" --stats-only

# 2. 檢查前端 widget 組件
echo -e "\n[2] 前端 Widget 組件檢查："
echo "app/admin/components/dashboard/widgets/ 目錄內容："
ls -la app/\(app\)/admin/components/dashboard/widgets/ 2>/dev/null || echo "目錄不存在"

# 3. 檢查後端 widget API
echo -e "\n[3] 後端 Widget API 檢查："
echo "backend/newpennine-api/src/widgets/ 目錄內容："
ls -la backend/newpennine-api/src/widgets/ 2>/dev/null || echo "目錄不存在"

# 4. 檢查 import 語句
echo -e "\n[4] Import 語句檢查（前 20 個）："
rg -i "^import.*widget" --type ts --type tsx -n | head -20

# 5. 檢查 GraphQL schema
echo -e "\n[5] GraphQL Schema 檢查："
rg -i "widget" lib/graphql/schema/ --type graphql --type ts -n | head -20

# 6. 檢查實際的 Widget 組件文件
echo -e "\n[6] Widget 組件文件列表："
find . -name "*Widget*.tsx" -type f | grep -v node_modules | head -30

# 7. 檢查測試文件
echo -e "\n[7] Widget 測試文件："
find . -name "*widget*.spec.ts" -o -name "*widget*.test.tsx" | grep -v node_modules | head -20

# 8. 檢查 types 定義
echo -e "\n[8] Types 定義檢查："
rg -i "widget" types/ --type ts -n | head -20

# 總結
echo -e "\n========================================"
echo "檢查完成！以上是系統中 Widget 殘留的實際情況"
echo "你可以根據這些結果判斷清理工作的真實進度"
echo "========================================"