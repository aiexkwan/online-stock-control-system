#!/bin/bash
# 手動測試 v1.2.2 Widget API endpoints
# 使用 curl 直接測試 API

echo "=== v1.2.2 Widget API 手動測試 ==="
echo ""

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API 配置
BASE_URL="http://localhost:3000/api/v1"
EMAIL="akwan@pennineindustries.com"
PASSWORD="X315Y316"

# 檢查服務器狀態
echo -e "${BLUE}檢查服務器狀態...${NC}"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo -e "${GREEN}✓ 服務器運行中${NC}"
else
  echo -e "${RED}✗ 服務器未運行${NC}"
  echo "請先啟動服務器: npm run dev"
  exit 1
fi

# 登入獲取 token
echo ""
echo -e "${BLUE}1. 測試登入端點...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

if [[ $LOGIN_RESPONSE == *"accessToken"* ]]; then
  echo -e "${GREEN}✓ 登入成功${NC}"
  TOKEN=$(echo $LOGIN_RESPONSE | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
  echo "Token: ${TOKEN:0:20}..."
else
  echo -e "${RED}✗ 登入失敗${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

# 測試 StatsCard API
echo ""
echo -e "${BLUE}2. 測試 StatsCard Widget API...${NC}"
DATA_SOURCES=("total_pallets" "today_transfers" "active_products")

for SOURCE in "${DATA_SOURCES[@]}"; do
  echo -n "  - 測試 $SOURCE: "
  RESPONSE=$(curl -s -X GET "${BASE_URL}/widgets/stats-card?dataSource=${SOURCE}" \
    -H "Authorization: Bearer ${TOKEN}")

  if [[ $RESPONSE == *"value"* ]] && [[ $RESPONSE == *"label"* ]]; then
    VALUE=$(echo $RESPONSE | sed -n 's/.*"value":\([^,}]*\).*/\1/p')
    LABEL=$(echo $RESPONSE | sed -n 's/.*"label":"\([^"]*\)".*/\1/p')
    echo -e "${GREEN}✓ 成功 - Value: $VALUE, Label: $LABEL${NC}"
  else
    echo -e "${RED}✗ 失敗${NC}"
    echo "    Response: $RESPONSE"
  fi
done

# 測試 Product Distribution API
echo ""
echo -e "${BLUE}3. 測試 Product Distribution Widget API...${NC}"
RESPONSE=$(curl -s -X GET "${BASE_URL}/widgets/product-distribution?limit=5" \
  -H "Authorization: Bearer ${TOKEN}")

if [[ $RESPONSE == *"value"* ]] && [[ $RESPONSE == *"timestamp"* ]]; then
  ITEM_COUNT=$(echo $RESPONSE | grep -o '"name"' | wc -l)
  echo -e "${GREEN}✓ 成功 - 返回 $ITEM_COUNT 個產品${NC}"
else
  echo -e "${RED}✗ 失敗${NC}"
  echo "Response: $RESPONSE"
fi

# 測試 Inventory Ordered Analysis API
echo ""
echo -e "${BLUE}4. 測試 Inventory Ordered Analysis Widget API...${NC}"
RESPONSE=$(curl -s -X GET "${BASE_URL}/widgets/inventory-ordered-analysis" \
  -H "Authorization: Bearer ${TOKEN}")

if [[ $RESPONSE == *"products"* ]] && [[ $RESPONSE == *"summary"* ]]; then
  echo -e "${GREEN}✓ 成功 - 返回產品分析數據${NC}"
else
  echo -e "${RED}✗ 失敗${NC}"
  echo "Response: $RESPONSE"
fi

# 測試 Transaction Report API
echo ""
echo -e "${BLUE}5. 測試 Transaction Report Widget API...${NC}"
START_DATE=$(date -d "7 days ago" +%Y-%m-%d)
END_DATE=$(date +%Y-%m-%d)

RESPONSE=$(curl -s -X GET "${BASE_URL}/widgets/transaction-report?startDate=${START_DATE}&endDate=${END_DATE}" \
  -H "Authorization: Bearer ${TOKEN}")

if [[ $RESPONSE == *"transactions"* ]] && [[ $RESPONSE == *"summary"* ]]; then
  TRANSACTION_COUNT=$(echo $RESPONSE | sed -n 's/.*"totalTransactions":\([0-9]*\).*/\1/p')
  echo -e "${GREEN}✓ 成功 - 找到 $TRANSACTION_COUNT 筆交易${NC}"
else
  echo -e "${RED}✗ 失敗${NC}"
  echo "Response: $RESPONSE"
fi

# 性能測試
echo ""
echo -e "${BLUE}6. 簡單性能測試...${NC}"
echo "測試 10 次 StatsCard API 調用..."

TOTAL_TIME=0
for i in {1..10}; do
  START_TIME=$(date +%s%N)
  curl -s -X GET "${BASE_URL}/widgets/stats-card?dataSource=total_pallets" \
    -H "Authorization: Bearer ${TOKEN}" > /dev/null
  END_TIME=$(date +%s%N)

  ELAPSED=$((($END_TIME - $START_TIME) / 1000000))
  TOTAL_TIME=$(($TOTAL_TIME + $ELAPSED))
  echo -n "."
done

AVG_TIME=$(($TOTAL_TIME / 10))
echo ""
echo -e "${GREEN}平均響應時間: ${AVG_TIME}ms${NC}"

echo ""
echo -e "${GREEN}=== 測試完成 ===${NC}"
