# 簡單的 git 推送腳本
param (
    [Parameter(Mandatory=$true)]
    [string]$Message
)

# 添加所有更改
git add .

# 提交更改
git commit -m $Message

# 嘗試推送到 main 分支
git push origin main -ErrorAction SilentlyContinue

# 如果失敗則嘗試推送到 master 分支
if ($LASTEXITCODE -ne 0) {
    git push origin master
}
