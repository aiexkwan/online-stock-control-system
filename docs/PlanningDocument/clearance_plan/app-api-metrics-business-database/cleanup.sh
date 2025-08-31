#!/bin/bash

# 系統清理腳本：安全刪除未使用的 metrics API 端點
# 生成日期: 2025-08-30
# 目標: /app/api/metrics/business 和 /app/api/metrics/database

set -e

echo "========================================="
echo "開始執行 Metrics API 端點清理"
echo "========================================="

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 第一步：最終確認
echo -e "${YELLOW}步驟 1: 最終確認無引用${NC}"
echo "檢查 metrics/business 引用..."
if grep -r "metrics/business" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=docs 2>/dev/null | grep -v "middleware.ts" | grep -v "apiRedirects.ts"; then
    echo -e "${RED}警告: 發現未預期的引用！請手動檢查。${NC}"
    exit 1
fi
echo -e "${GREEN}✓ metrics/business 無實際引用${NC}"

echo "檢查 metrics/database 引用..."
if grep -r "metrics/database" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=docs 2>/dev/null | grep -v "apiRedirects.ts"; then
    echo -e "${RED}警告: 發現未預期的引用！請手動檢查。${NC}"
    exit 1
fi
echo -e "${GREEN}✓ metrics/database 無實際引用${NC}"

# 第二步：備份
echo -e "${YELLOW}步驟 2: 備份檔案${NC}"
BACKUP_DIR="./backup_metrics_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -d "app/api/metrics/business" ]; then
    cp -r app/api/metrics/business "$BACKUP_DIR/"
    echo -e "${GREEN}✓ 已備份 business 端點${NC}"
fi

if [ -d "app/api/metrics/database" ]; then
    cp -r app/api/metrics/database "$BACKUP_DIR/"
    echo -e "${GREEN}✓ 已備份 database 端點${NC}"
fi

# 第三步：刪除檔案
echo -e "${YELLOW}步驟 3: 刪除端點目錄${NC}"

if [ -d "app/api/metrics/business" ]; then
    rm -rf app/api/metrics/business
    echo -e "${GREEN}✓ 已刪除 app/api/metrics/business${NC}"
else
    echo "app/api/metrics/business 不存在，跳過"
fi

if [ -d "app/api/metrics/database" ]; then
    rm -rf app/api/metrics/database
    echo -e "${GREEN}✓ 已刪除 app/api/metrics/database${NC}"
else
    echo "app/api/metrics/database 不存在，跳過"
fi

# 第四步：清理配置
echo -e "${YELLOW}步驟 4: 清理相關配置${NC}"

# 清理 middleware.ts
if grep -q "'/api/metrics/business'" middleware.ts 2>/dev/null; then
    sed -i.bak "/\\'\/api\/metrics\/business\\'/d" middleware.ts
    echo -e "${GREEN}✓ 已清理 middleware.ts${NC}"
fi

# 清理 apiRedirects.ts
if [ -f "lib/middleware/apiRedirects.ts" ]; then
    sed -i.bak "/\\'\/api\/v1\/metrics\/business\\'/d" lib/middleware/apiRedirects.ts
    sed -i.bak "/\\'\/api\/v1\/metrics\/database\\'/d" lib/middleware/apiRedirects.ts
    echo -e "${GREEN}✓ 已清理 apiRedirects.ts${NC}"
fi

# 第五步：驗證
echo -e "${YELLOW}步驟 5: 執行驗證${NC}"

# TypeScript 編譯檢查
echo "執行 TypeScript 檢查..."
if npm run typecheck; then
    echo -e "${GREEN}✓ TypeScript 檢查通過${NC}"
else
    echo -e "${RED}✗ TypeScript 檢查失敗${NC}"
    exit 1
fi

# 建置檢查
echo "執行建置檢查..."
if npm run build; then
    echo -e "${GREEN}✓ 建置成功${NC}"
else
    echo -e "${RED}✗ 建置失敗${NC}"
    exit 1
fi

echo "========================================="
echo -e "${GREEN}清理完成！${NC}"
echo "備份位置: $BACKUP_DIR"
echo "========================================="
echo ""
echo "建議後續步驟："
echo "1. 運行開發服務器: npm run dev"
echo "2. 測試主要功能"
echo "3. 提交變更: git commit -m 'refactor: 移除未使用的 metrics API 端點'"
echo ""