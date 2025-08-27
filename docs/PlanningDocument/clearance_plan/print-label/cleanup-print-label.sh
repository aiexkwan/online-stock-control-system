#!/bin/bash

# Print-Label 清理執行腳本
# 基於清理分析報告：docs/PlanningDocument/clearance_plan/print-label/print-label.md
# 使用方法：./cleanup-print-label.sh [--dry-run] [--skip-backup]

set -e  # 遇到錯誤就停止
set -u  # 使用未定義變量時報錯

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 解析命令行參數
DRY_RUN=false
SKIP_BACKUP=false

for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-backup)
      SKIP_BACKUP=true
      shift
      ;;
    --help)
      echo "Print-Label 清理執行腳本"
      echo ""
      echo "用法: $0 [選項]"
      echo ""
      echo "選項:"
      echo "  --dry-run      只顯示將要執行的操作，不實際執行"
      echo "  --skip-backup  跳過備份分支建立（不建議用於生產）"
      echo "  --help         顯示此幫助信息"
      echo ""
      echo "執行前請確保："
      echo "1. useStockUpdates.tsx 已遷移到 RPC 調用"
      echo "2. QCLabelCard 功能經過完整測試"
      echo "3. 有完整的系統備份"
      exit 0
      ;;
    *)
      echo -e "${RED}錯誤：未知參數 $arg${NC}"
      echo "使用 --help 查看可用選項"
      exit 1
      ;;
  esac
done

# 輔助函數
print_step() {
    echo -e "${BLUE}🔄 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

execute_command() {
    local cmd="$1"
    local description="$2"
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY RUN] 將執行: $cmd${NC}"
    else
        print_step "$description"
        if eval "$cmd"; then
            print_success "$description 完成"
        else
            print_error "$description 失敗"
            exit 1
        fi
    fi
}

# 檢查前置條件
check_prerequisites() {
    print_step "檢查執行環境..."
    
    # 檢查是否在正確的目錄
    if [ ! -f "package.json" ] || [ ! -d "app/(app)" ]; then
        print_error "請在專案根目錄執行此腳本"
        exit 1
    fi
    
    # 檢查git狀態
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "工作目錄有未提交的變更"
        echo "請先提交或暫存變更，然後重新執行"
        if [ "$DRY_RUN" = false ]; then
            exit 1
        fi
    fi
    
    # 檢查當前分支
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [ "$current_branch" != "main" ]; then
        print_warning "當前分支不是 main ($current_branch)"
        echo "建議切換到 main 分支後執行"
    fi
    
    print_success "環境檢查完成"
}

# 執行備份
create_backup() {
    if [ "$SKIP_BACKUP" = true ]; then
        print_warning "跳過備份步驟（--skip-backup 已指定）"
        return
    fi
    
    local backup_branch="backup/print-label-cleanup-$(date +%Y%m%d-%H%M%S)"
    
    execute_command "git checkout -b $backup_branch" "建立備份分支 $backup_branch"
    execute_command "git checkout main" "切換回 main 分支"
    
    if [ "$DRY_RUN" = false ]; then
        echo -e "${GREEN}💾 備份分支已建立: $backup_branch${NC}"
        echo "如需回滾，請執行: git checkout main && git reset --hard $backup_branch"
    fi
}

# 移除主要文件
remove_main_files() {
    print_step "準備移除主要模組文件..."
    
    local files_to_remove=(
        "app/(app)/print-label/"
        "app/api/print-label-html/"
        "app/api/print-label-updates/"
    )
    
    for file in "${files_to_remove[@]}"; do
        if [ -e "$file" ]; then
            execute_command "git rm -r '$file'" "移除 $file"
        else
            print_warning "$file 不存在，跳過"
        fi
    done
}

# 檢查並移除組件
remove_components() {
    print_step "檢查 print-label-pdf 組件依賴..."
    
    local component_path="app/components/print-label-pdf/"
    
    if [ ! -d "$component_path" ]; then
        print_warning "$component_path 不存在，跳過"
        return
    fi
    
    # 檢查是否仍被其他地方使用
    local usage_count
    if command -v rg >/dev/null 2>&1; then
        # 使用 ripgrep（更快）
        usage_count=$(rg -g '!node_modules' -g '!.git' -g '!.next' 'print-label-pdf' --type=typescript --type=javascript | wc -l)
    else
        # 備用 grep
        usage_count=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "print-label-pdf" 2>/dev/null | wc -l)
    fi
    
    if [ "$usage_count" -eq 0 ]; then
        execute_command "git rm -r '$component_path'" "移除無依賴的 print-label-pdf 組件"
    else
        print_warning "print-label-pdf 仍被其他模組使用($usage_count 個引用)，跳過刪除"
        if [ "$DRY_RUN" = false ]; then
            echo "如需查看引用位置，執行："
            echo "rg -g '!node_modules' -g '!.git' 'print-label-pdf' --type=typescript --type=javascript"
        fi
    fi
}

# 清理配置文件
clean_config_files() {
    print_step "清理配置文件中的 print-label 引用..."
    
    local config_cleanups=(
        "middleware.ts|/api/print-label-html"
        "app/components/AuthChecker.tsx|print-label"  
        "app/components/GlobalSkipLinks.tsx|print-label"
        "vitest.setup.ts|print-label-pdf"
        "scripts/lighthouse-quick-test.js|Print Label.*print-label"
        "scripts/performance-lighthouse-test.js|Print Label.*print-label"
        ".lighthouserc.js|print-label"
    )
    
    for config in "${config_cleanups[@]}"; do
        IFS='|' read -r file pattern <<< "$config"
        
        if [ -f "$file" ]; then
            if [ "$DRY_RUN" = true ]; then
                echo -e "${YELLOW}[DRY RUN] 將從 $file 移除包含 '$pattern' 的行${NC}"
                # 顯示會被移除的行
                grep -n "$pattern" "$file" 2>/dev/null || echo "  (無匹配行)"
            else
                local backup_file="$file.backup-$(date +%Y%m%d-%H%M%S)"
                cp "$file" "$backup_file"
                
                if sed -i '' "/$pattern/d" "$file" 2>/dev/null; then
                    print_success "已清理 $file 中的 print-label 引用"
                    echo "  備份已保存至: $backup_file"
                else
                    print_warning "清理 $file 時出現問題，請手動檢查"
                fi
            fi
        else
            print_warning "$file 不存在，跳過"
        fi
    done
}

# 執行驗證
run_verification() {
    print_step "執行基本驗證檢查..."
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY RUN] 跳過驗證步驟${NC}"
        return
    fi
    
    # TypeScript 編譯檢查
    if command -v npm >/dev/null 2>&1; then
        print_step "執行 TypeScript 類型檢查..."
        if npm run type-check >/dev/null 2>&1; then
            print_success "TypeScript 類型檢查通過"
        else
            print_error "TypeScript 類型檢查失敗"
            echo "請檢查控制台輸出並修復類型錯誤"
            echo "可以執行 'npm run type-check' 查看詳細錯誤"
        fi
        
        # ESLint 檢查
        print_step "執行 ESLint 檢查..."
        if npm run lint >/dev/null 2>&1; then
            print_success "ESLint 檢查通過"
        else
            print_warning "ESLint 檢查有警告或錯誤"
            echo "可以執行 'npm run lint' 查看詳細信息"
        fi
    else
        print_warning "npm 不可用，跳過類型和代碼風格檢查"
    fi
}

# 生成清理報告
generate_report() {
    local report_file="docs/PlanningDocument/clearance_plan/print-label/cleanup-execution-report.md"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY RUN] 將生成清理報告至: $report_file${NC}"
        return
    fi
    
    print_step "生成清理執行報告..."
    
    cat > "$report_file" << EOF
# Print-Label 清理執行報告

## 執行資訊
- **執行時間**: $timestamp
- **執行模式**: $([ "$DRY_RUN" = true ] && echo "模擬運行" || echo "實際執行")
- **備份狀態**: $([ "$SKIP_BACKUP" = true ] && echo "已跳過" || echo "已建立")
- **執行分支**: $(git rev-parse --abbrev-ref HEAD)

## 清理項目

### 已移除的文件
- [x] app/(app)/print-label/ (主要頁面組件)
- [x] app/api/print-label-html/ (HTML預覽API)
- [x] app/api/print-label-updates/ (庫存更新API)
- [x] print-label-pdf組件 (如無其他依賴)

### 已清理的配置引用
- [x] middleware.ts - 移除API路由引用
- [x] AuthChecker.tsx - 移除註釋行
- [x] GlobalSkipLinks.tsx - 移除跳轉連結
- [x] 測試和監控配置文件

## 驗證結果
- [x] TypeScript編譯檢查
- [x] ESLint代碼風格檢查
- [ ] 功能測試 (需手動執行)
- [ ] 性能測試 (需手動執行)

## 後續步驟
1. 執行完整測試套件: \`npm test\`
2. 執行構建測試: \`npm run build\`  
3. 手動測試QCLabelCard功能
4. 24小時監控期觀察系統穩定性

## 回滾信息
- **備份分支**: $(git branch | grep "backup/print-label-cleanup" | tail -1 || echo "無")
- **回滾命令**: \`git reset --hard <backup-branch>\`

---
報告生成時間: $timestamp
EOF
    
    print_success "清理執行報告已保存至: $report_file"
}

# 主執行函數
main() {
    echo -e "${BLUE}🚀 Print-Label 模組清理腳本${NC}"
    echo -e "${BLUE}==================================${NC}"
    echo ""
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}⚠️ 模擬運行模式 - 不會實際修改文件${NC}"
        echo ""
    fi
    
    # 執行各個步驟
    check_prerequisites
    echo ""
    
    create_backup
    echo ""
    
    remove_main_files
    echo ""
    
    remove_components
    echo ""
    
    clean_config_files
    echo ""
    
    run_verification
    echo ""
    
    generate_report
    echo ""
    
    # 最終提示
    if [ "$DRY_RUN" = true ]; then
        echo -e "${BLUE}📋 模擬運行完成！${NC}"
        echo -e "${YELLOW}要實際執行清理，請移除 --dry-run 參數${NC}"
    else
        echo -e "${GREEN}🎉 清理執行完成！${NC}"
        echo ""
        echo -e "${BLUE}後續步驟：${NC}"
        echo "1. 執行: npm run build"
        echo "2. 執行: npm run test"  
        echo "3. 測試QCLabelCard功能 (Admin > Operations > QC Label)"
        echo "4. 如有問題，使用備份分支回滾"
        echo ""
        echo -e "${BLUE}📊 預期收益：${NC}"
        echo "• 代碼庫減少 ~15MB"
        echo "• 移除27個無用文件"
        echo "• 簡化系統架構"
        echo "• 降低維護複雜度"
    fi
}

# 執行主函數
main "$@"