#!/bin/bash
# Script to run v1.2.2 Widget API tests
# 這個腳本會啟動 NestJS 服務器並運行 Playwright 測試

echo "=== v1.2.2 Widget API 測試腳本 ==="
echo ""

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# 檢查 NestJS 服務器是否運行
check_nestjs_server() {
  echo "檢查 NestJS 服務器狀態..."
  if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✓ NestJS 服務器已運行${NC}"
    return 0
  else
    echo -e "${YELLOW}⚠ NestJS 服務器未運行${NC}"
    return 1
  fi
}

# 啟動 NestJS 服務器
start_nestjs_server() {
  echo "啟動 NestJS 服務器..."
  cd backend/newpennine-api
  npm run start:dev &
  NESTJS_PID=$!
  echo "NestJS PID: $NESTJS_PID"

  # 等待服務器啟動
  echo "等待服務器啟動..."
  for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
      echo -e "${GREEN}✓ NestJS 服務器已啟動${NC}"
      cd ../..
      return 0
    fi
    echo -n "."
    sleep 2
  done

  echo -e "${RED}✗ NestJS 服務器啟動失敗${NC}"
  cd ../..
  return 1
}

# 運行測試
run_tests() {
  echo ""
  echo "=== 運行 Widget API 測試 ==="

  # 運行 v1.2.2 Widget API 測試
  echo ""
  echo "1. 運行 v1.2.2 Widget Endpoints 測試..."
  npx playwright test e2e/widgets/nestjs-widgets-api-v122.spec.ts --project=chromium

  # 運行性能基準測試
  echo ""
  echo "2. 運行 GraphQL vs REST 性能基準測試..."
  npx playwright test e2e/performance/graphql-vs-rest-benchmark.spec.ts --project=chromium
}

# 清理函數
cleanup() {
  echo ""
  echo "清理中..."
  if [ ! -z "$NESTJS_PID" ]; then
    echo "停止 NestJS 服務器 (PID: $NESTJS_PID)..."
    kill $NESTJS_PID 2>/dev/null
  fi
}

# 設置清理 trap
trap cleanup EXIT

# 主流程
echo "開始測試流程..."

# 檢查或啟動 NestJS
if ! check_nestjs_server; then
  if ! start_nestjs_server; then
    echo -e "${RED}無法啟動 NestJS 服務器，測試中止${NC}"
    exit 1
  fi
fi

# 運行測試
run_tests

# 生成報告
echo ""
echo "=== 生成測試報告 ==="
npx playwright show-report

echo ""
echo -e "${GREEN}測試完成！${NC}"
