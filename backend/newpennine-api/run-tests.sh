#!/bin/bash

# NewPennine v1.3.2 測試執行腳本
# 用於快速執行所有相關測試

set -e  # 遇到錯誤時停止執行

echo "🚀 開始 NewPennine v1.3.2 測試執行..."
echo "======================================"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函數：打印彩色訊息
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查環境
print_status "檢查環境配置..."

if [ ! -f ".env" ]; then
    print_error ".env 文件不存在！請根據 .env.example 創建 .env 文件"
    exit 1
fi

if [ ! -f "package.json" ]; then
    print_error "package.json 不存在！請確認在正確的目錄中"
    exit 1
fi

print_success "環境檢查完成"

# 檢查 Node.js 和 npm
print_status "檢查 Node.js 版本..."
node_version=$(node --version)
npm_version=$(npm --version)
print_success "Node.js: $node_version, npm: $npm_version"

# 安裝依賴（如果需要）
print_status "檢查並安裝依賴..."
if [ ! -d "node_modules" ]; then
    print_status "安裝 npm 依賴..."
    npm install
else
    print_success "依賴已存在"
fi

# 運行測試
echo ""
echo "======================================"
print_status "開始運行測試套件..."
echo "======================================"

# 1. 快速驗證測試
echo ""
print_status "1️⃣ 運行快速驗證測試..."
if npm run test:e2e -- test/quick-validation.e2e-spec.ts; then
    print_success "快速驗證測試通過"
else
    print_warning "快速驗證測試失敗，但繼續執行其他測試"
fi

# 2. v1.3.2 專用測試
echo ""
print_status "2️⃣ 運行 v1.3.2 功能驗證測試..."
if npm run test:v1.3.2; then
    print_success "v1.3.2 功能驗證測試通過"
else
    print_warning "v1.3.2 功能驗證測試失敗"
fi

# 3. 單元測試
echo ""
print_status "3️⃣ 運行單元測試..."
if npm test; then
    print_success "單元測試通過"
else
    print_warning "單元測試失敗"
fi

# 4. 所有 E2E 測試
echo ""
print_status "4️⃣ 運行完整 E2E 測試..."
if npm run test:e2e; then
    print_success "E2E 測試通過"
else
    print_warning "E2E 測試失敗"
fi

# 5. Playwright 測試（可選）
echo ""
print_status "5️⃣ 檢查 Playwright 測試..."
if command -v npx >/dev/null 2>&1 && npx playwright --version >/dev/null 2>&1; then
    print_status "運行 Playwright 測試..."
    if npx playwright test; then
        print_success "Playwright 測試通過"
    else
        print_warning "Playwright 測試失敗"
    fi
else
    print_warning "Playwright 未安裝，跳過前端整合測試"
    print_status "要安裝 Playwright，請運行: npm install @playwright/test && npx playwright install"
fi

# 生成測試報告
echo ""
print_status "生成測試報告..."

# 創建測試結果目錄
mkdir -p test-results

# 記錄測試完成時間
echo "測試完成時間: $(date)" > test-results/test-summary.txt
echo "測試執行腳本版本: v1.3.2" >> test-results/test-summary.txt

print_success "測試報告已保存到 test-results/ 目錄"

# 總結
echo ""
echo "======================================"
print_status "測試執行完成！"
echo "======================================"

print_status "測試結果摘要:"
echo "- 快速驗證測試: 已執行"
echo "- v1.3.2 功能測試: 已執行"
echo "- 單元測試: 已執行"
echo "- E2E 測試: 已執行"
echo "- Playwright 測試: $(command -v npx >/dev/null 2>&1 && echo '已執行' || echo '跳過')"

echo ""
print_status "接下來的步驟:"
echo "1. 檢查 test-results/ 目錄中的詳細報告"
echo "2. 如有測試失敗，查看具體錯誤訊息"
echo "3. 確保所有核心功能測試通過後再部署"

echo ""
print_success "v1.3.2 測試執行腳本完成！"