#!/bin/bash

# 切換到專案根目錄（如果此腳本是從其他目錄執行的）
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/.."

# 給予執行權限
chmod +x push.sh

# 安裝必要的套件
echo -e "\033[0;32m正在安裝必要的套件...\033[0m"
npm install

# 啟動自動推送功能
echo -e "\033[0;32m啟動自動推送功能...\033[0m"
npm run auto-push 