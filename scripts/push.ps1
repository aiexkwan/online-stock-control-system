# PowerShell 推送腳本

# 檢查是否提供了提交訊息
param (
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

# 顯示提交訊息
Write-Host "提交訊息: $CommitMessage" -ForegroundColor Green

# 添加所有更改
git add .

# 提交更改
git commit -m "$CommitMessage"

# 推送到 GitHub
git push origin main -ErrorAction SilentlyContinue
if ($LASTEXITCODE -ne 0) {
    git push origin master
}

Write-Host "已成功推送更改到 GitHub!" -ForegroundColor Green
