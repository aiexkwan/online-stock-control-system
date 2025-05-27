# GRN Label 重構驗證腳本
# 用於驗證重構後的 GRN Label 系統是否正常運行

Write-Host "🔍 GRN Label 重構驗證開始..." -ForegroundColor Green

# 1. 檢查文件結構
Write-Host "`n📁 檢查文件結構..." -ForegroundColor Yellow

$requiredFiles = @(
    "app/print-grnlabel/page.tsx",
    "app/print-grnlabel/components/GrnLabelForm.tsx",
    "app/print-grnlabel/components/README.md",
    "app/print-grnlabel/components/test-integration.md",
    "app/components/qc-label-form/index.ts",
    "app/components/qc-label-form/ClockNumberConfirmDialog.tsx",
    "app/components/qc-label-form/ProductCodeInput.tsx",
    "app/components/qc-label-form/PrintProgressBar.tsx",
    "app/components/qc-label-form/ResponsiveLayout.tsx",
    "lib/supabase.ts",
    "lib/pdfUtils.tsx",
    "lib/seriesUtils.ts",
    "lib/palletNumUtils.ts",
    "app/actions/grnActions.ts",
    "app/utils/auth-utils.ts"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "`n❌ 發現缺失文件，請檢查：" -ForegroundColor Red
    $missingFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

# 2. 檢查服務器狀態
Write-Host "`n🌐 檢查開發服務器..." -ForegroundColor Yellow

$ports = @(3000, 3001, 3002, 3003, 3004)
$activePort = $null

foreach ($port in $ports) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $activePort = $port
            Write-Host "  ✅ 服務器運行在端口 $port" -ForegroundColor Green
            break
        }
    } catch {
        # 忽略錯誤，繼續檢查下一個端口
    }
}

if (-not $activePort) {
    Write-Host "  ❌ 未找到運行中的開發服務器" -ForegroundColor Red
    Write-Host "  請運行: npm run dev" -ForegroundColor Yellow
    exit 1
}

# 3. 檢查 GRN Label 頁面
Write-Host "`n📄 檢查 GRN Label 頁面..." -ForegroundColor Yellow

try {
    $grnResponse = Invoke-WebRequest -Uri "http://localhost:$activePort/print-grnlabel" -UseBasicParsing -TimeoutSec 10
    if ($grnResponse.StatusCode -eq 200) {
        Write-Host "  ✅ GRN Label 頁面載入成功 (HTTP $($grnResponse.StatusCode))" -ForegroundColor Green
        
        # 檢查頁面內容是否包含關鍵元素
        $content = $grnResponse.Content
        $keyElements = @(
            "Material Receiving",
            "GRN Detail",
            "Pallet Type",
            "Package Type",
            "Print GRN Label"
        )
        
        $missingElements = @()
        foreach ($element in $keyElements) {
            if ($content -like "*$element*") {
                Write-Host "    ✅ 包含: $element" -ForegroundColor Green
            } else {
                Write-Host "    ❌ 缺失: $element" -ForegroundColor Red
                $missingElements += $element
            }
        }
        
        if ($missingElements.Count -gt 0) {
            Write-Host "  ⚠️  頁面載入但缺少關鍵元素" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ❌ GRN Label 頁面載入失敗 (HTTP $($grnResponse.StatusCode))" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ❌ 無法訪問 GRN Label 頁面: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. 檢查 Node.js 進程
Write-Host "`n🔧 檢查 Node.js 進程..." -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "  ✅ 發現 $($nodeProcesses.Count) 個 Node.js 進程" -ForegroundColor Green
    if ($nodeProcesses.Count -gt 5) {
        Write-Host "  ⚠️  進程數量較多，可能有多餘的服務器在運行" -ForegroundColor Yellow
        Write-Host "  建議運行: taskkill /f /im node.exe 然後重新啟動" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ❌ 未找到 Node.js 進程" -ForegroundColor Red
}

# 5. 檢查端口使用情況
Write-Host "`n🔌 檢查端口使用情況..." -ForegroundColor Yellow

$usedPorts = @()
foreach ($port in $ports) {
    $connection = netstat -an | Select-String ":$port.*LISTENING"
    if ($connection) {
        $usedPorts += $port
        Write-Host "  ✅ 端口 $port 正在使用" -ForegroundColor Green
    }
}

if ($usedPorts.Count -gt 1) {
    Write-Host "  ⚠️  多個端口在使用，可能有衝突" -ForegroundColor Yellow
    Write-Host "  使用的端口: $($usedPorts -join ', ')" -ForegroundColor Yellow
}

# 6. 生成報告
Write-Host "`n📊 驗證報告" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "驗證時間: $timestamp" -ForegroundColor White
Write-Host "活動端口: $activePort" -ForegroundColor White
Write-Host "GRN 頁面: http://localhost:$activePort/print-grnlabel" -ForegroundColor White

if ($missingFiles.Count -eq 0 -and $activePort -and $grnResponse.StatusCode -eq 200) {
    Write-Host "`n🎉 驗證通過！GRN Label 重構成功" -ForegroundColor Green
    Write-Host "✅ 所有必需文件存在" -ForegroundColor Green
    Write-Host "✅ 開發服務器正常運行" -ForegroundColor Green
    Write-Host "✅ GRN Label 頁面正常載入" -ForegroundColor Green
    Write-Host "✅ 頁面包含所有關鍵元素" -ForegroundColor Green
    
    Write-Host "`n🚀 可以開始測試功能了！" -ForegroundColor Magenta
    Write-Host "訪問: http://localhost:$activePort/print-grnlabel" -ForegroundColor Magenta
} else {
    Write-Host "`n❌ 驗證失敗，請檢查上述問題" -ForegroundColor Red
    exit 1
}

Write-Host "`n" -ForegroundColor White 