# 啟動自動推送腳本

# 切換到專案根目錄（如果此腳本是從其他目錄執行的）
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Split-Path -Parent $scriptPath)

Write-Host "正在安裝必要的套件..." -ForegroundColor Green
npm install

Write-Host "啟動自動推送功能..." -ForegroundColor Green
npm run auto-push
