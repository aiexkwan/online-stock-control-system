#!/bin/bash

# 檢查是否提供了提交訊息
if [ -z "$1" ]; then
  echo "請提供提交訊息，例如: ./push.sh \"修復登入頁面問題\""
  exit 1
fi

# 添加所有更改
git add .

# 提交更改
git commit -m "$1"

# 先拉取遠端最新（rebase）
git pull --rebase origin main

# 推送到 GitHub
git push origin main || git push origin master

echo "✅ 已成功推送更改到 GitHub!"
