#!/bin/bash

echo "🚀 啟動開發服務器..."

# 啟動開發服務器（背景運行）
npm run dev &
SERVER_PID=$!

echo "等待服務器啟動..."

# 等待服務器準備好
MAX_TRIES=30
TRIES=0
while ! curl -s http://localhost:3000 > /dev/null 2>&1; do
  if [ $TRIES -ge $MAX_TRIES ]; then
    echo "❌ 服務器啟動超時"
    kill $SERVER_PID 2>/dev/null
    exit 1
  fi
  TRIES=$((TRIES + 1))
  echo "等待中... ($TRIES/$MAX_TRIES)"
  sleep 2
done

echo "✅ 服務器已啟動"

# 運行測試
echo "🧪 開始運行測試..."
node __tests__/e2e/run-pdf-test.js

# 獲取測試退出碼
TEST_EXIT_CODE=$?

# 清理：關閉服務器
echo "🛑 關閉服務器..."
kill $SERVER_PID 2>/dev/null

exit $TEST_EXIT_CODE