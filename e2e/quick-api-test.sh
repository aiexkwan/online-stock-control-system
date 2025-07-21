#!/bin/bash
# 快速檢查 API 狀態

echo "=== API 狀態檢查 ==="
echo ""

# 檢查 Next.js (3000)
echo -n "Next.js (port 3000): "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "✓ 運行中"
else
  echo "✗ 未運行"
fi

# 檢查 NestJS (3001)
echo -n "NestJS API (port 3001): "
if curl -s http://localhost:3001/api/v1/health > /dev/null 2>&1; then
  echo "✓ 運行中"
  echo ""
  echo "Widget API endpoints 可用："
  echo "- http://localhost:3001/api/v1/widgets/stats-card"
  echo "- http://localhost:3001/api/v1/widgets/product-distribution"
  echo "- http://localhost:3001/api/v1/widgets/inventory-ordered-analysis"
  echo "- http://localhost:3001/api/v1/widgets/transaction-report"
else
  echo "✗ 未運行"
  echo ""
  echo "請啟動 NestJS 服務器："
  echo "cd backend/newpennine-api && npm run start:dev"
fi

echo ""
echo "=== 總結 ==="
echo "- Next.js 前端應用運行喺 port 3000"
echo "- NestJS REST API 運行喺 port 3001"
echo "- v1.2.2 Widget endpoints 需要 NestJS 服務器"
