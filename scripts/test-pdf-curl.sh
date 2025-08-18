#!/bin/bash

echo "============================================================"
echo "PDF提取測試 - 使用curl"
echo "============================================================"

# 測試第一個文件
echo ""
echo "測試文件1: 280481 Picking List.pdf"
echo "------------------------------------------------------------"

curl -X POST http://localhost:3000/api/pdf-extract \
  -H "x-internal-request: true" \
  -F "file=@/Users/chun/Library/Mobile Documents/com~apple~CloudDocs/280481 Picking List.pdf" \
  -F "fileName=280481 Picking List.pdf" | python3 -m json.tool

echo ""
echo "============================================================"
echo ""

# 測試第二個文件  
echo "測試文件2: 281513-Picking List.pdf"
echo "------------------------------------------------------------"

curl -X POST http://localhost:3000/api/pdf-extract \
  -H "x-internal-request: true" \
  -F "file=@/Users/chun/Downloads/281513-Picking List.pdf" \
  -F "fileName=281513-Picking List.pdf" | python3 -m json.tool

echo ""
echo "============================================================"
echo "測試完成"