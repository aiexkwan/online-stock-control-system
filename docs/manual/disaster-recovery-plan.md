# NewPennine WMS 災難恢復計劃

**版本**: v2.0.7  
**日期**: 2025-07-17  
**維護者**: Business Continuity Team  
**狀態**: 生產就緒  
**分類**: 機密文件

## 概述

本計劃提供 NewPennine 倉庫管理系統的完整災難恢復框架，確保在各種災難情況下能夠快速恢復業務營運。目標是最小化停機時間，保護關鍵數據，並維持業務連續性。

## 業務影響分析

### 1. 關鍵業務流程

#### 優先級分類
```
P1 (關鍵) - 必須在 1 小時內恢復
- 棧板管理系統
- 庫存查詢功能
- 用戶認證系統
- 健康檢查 API

P2 (重要) - 必須在 4 小時內恢復
- 訂單管理系統
- 報表生成功能
- 文件上傳系統
- 告警系統

P3 (一般) - 必須在 24 小時內恢復
- 分析儀表板
- 歷史數據查詢
- 系統監控
- 用戶培訓材料

P4 (輔助) - 可在 72 小時內恢復
- 高級報表功能
- 性能分析工具
- 開發文檔
- 測試環境
```

### 2. 停機影響評估

#### 財務影響
```
停機時間 | 直接損失 | 間接損失 | 總損失
1小時   | $1,000   | $500     | $1,500
4小時   | $5,000   | $3,000   | $8,000
8小時   | $15,000  | $10,000  | $25,000
24小時  | $50,000  | $40,000  | $90,000
```

#### 運營影響
- **庫存管理中斷**: 影響進出貨作業
- **訂單處理停滯**: 影響客戶服務
- **數據丟失風險**: 影響決策制定
- **合規性問題**: 可能面臨監管處罰

## 恢復目標

### 1. 恢復時間目標 (RTO)

```
系統組件         | RTO 目標    | 最大可接受
核心系統         | 30 分鐘     | 1 小時
數據庫          | 15 分鐘     | 30 分鐘
認證系統         | 10 分鐘     | 20 分鐘
API 服務        | 20 分鐘     | 45 分鐘
監控系統         | 1 小時      | 2 小時
```

### 2. 恢復點目標 (RPO)

```
數據類型         | RPO 目標    | 備份頻率
交易數據         | 5 分鐘      | 即時複製
配置數據         | 30 分鐘     | 每 15 分鐘
用戶數據         | 1 小時      | 每小時
日誌數據         | 4 小時      | 每 4 小時
歷史數據         | 24 小時     | 每日
```

## 災難分類和回應

### 1. 災難類型分類

#### 級別 1: 輕微事故
- **定義**: 部分功能受影響，但核心服務正常
- **範例**: 單個 Widget 故障、非關鍵 API 錯誤
- **回應時間**: 30 分鐘
- **通知級別**: 技術團隊

#### 級別 2: 中等事故
- **定義**: 重要功能受影響，部分用戶無法使用
- **範例**: 數據庫連接問題、認證服務中斷
- **回應時間**: 15 分鐘
- **通知級別**: 運營團隊 + 管理層

#### 級別 3: 嚴重事故
- **定義**: 核心系統不可用，大部分用戶受影響
- **範例**: 應用程式崩潰、主要 API 故障
- **回應時間**: 5 分鐘
- **通知級別**: 所有相關人員

#### 級別 4: 災難性事故
- **定義**: 完全系統故障，所有用戶無法使用
- **範例**: 數據中心故障、網絡攻擊
- **回應時間**: 立即
- **通知級別**: 緊急回應團隊 + 高級管理層

### 2. 災難場景和回應策略

#### 場景 1: 應用程式伺服器故障
```
檢測方式:
- 健康檢查失敗
- 用戶無法訪問系統
- 監控告警觸發

立即回應:
1. 確認故障範圍
2. 啟動備用伺服器
3. 更新負載均衡器
4. 通知相關人員

恢復步驟:
1. 診斷故障原因
2. 修復主要伺服器
3. 測試系統功能
4. 逐步恢復流量
5. 事後分析報告
```

#### 場景 2: 數據庫故障
```
檢測方式:
- 數據庫連接失敗
- 查詢超時
- 複製延遲告警

立即回應:
1. 切換到備用數據庫
2. 停止所有寫入操作
3. 評估數據完整性
4. 啟動恢復程序

恢復步驟:
1. 從最新備份恢復
2. 應用事務日誌
3. 驗證數據一致性
4. 重新啟動應用程式
5. 恢復正常操作
```

#### 場景 3: 網絡攻擊
```
檢測方式:
- 異常網絡流量
- 安全告警觸發
- 用戶報告異常

立即回應:
1. 隔離受影響系統
2. 啟動事件回應程序
3. 保存取證證據
4. 通知法律和合規團隊

恢復步驟:
1. 清理惡意軟件
2. 修補安全漏洞
3. 重置受影響帳戶
4. 恢復清潔備份
5. 強化安全措施
```

## 備份策略

### 1. 備份架構

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  生產環境       │    │  本地備份       │    │  異地備份       │
│  (Primary)      │───▶│  (Local)        │───▶│  (Remote)       │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│  即時數據       │    │  每小時備份     │    │  每日同步       │
│  PostgreSQL     │    │  增量備份       │    │  完整備份       │
│  Redis          │    │  壓縮存儲       │    │  加密存儲       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2. 備份配置

#### 數據庫備份
```bash
#!/bin/bash

# 數據庫備份腳本
db_backup() {
    local backup_date=$(date +%Y%m%d_%H%M%S)
    local backup_dir="/var/backups/database"
    local remote_backup_dir="/mnt/remote-backup/database"

    # 創建備份目錄
    mkdir -p "$backup_dir"
    mkdir -p "$remote_backup_dir"

    # 完整備份
    pg_dump $DATABASE_URL > "$backup_dir/full_backup_$backup_date.sql"

    # 壓縮備份
    gzip "$backup_dir/full_backup_$backup_date.sql"

    # 複製到遠程位置
    rsync -av "$backup_dir/full_backup_$backup_date.sql.gz" "$remote_backup_dir/"

    # 清理舊備份 (保留 30 天)
    find "$backup_dir" -name "*.sql.gz" -mtime +30 -delete
    find "$remote_backup_dir" -name "*.sql.gz" -mtime +90 -delete

    # 驗證備份
    if [ -f "$backup_dir/full_backup_$backup_date.sql.gz" ]; then
        echo "✅ 備份完成: $backup_date"
    else
        echo "❌ 備份失敗: $backup_date"
        exit 1
    fi
}

# 執行備份
db_backup
```

#### 應用程式備份
```bash
#!/bin/bash

# 應用程式備份腳本
app_backup() {
    local backup_date=$(date +%Y%m%d_%H%M%S)
    local app_dir="/var/www/newpennine-wms"
    local backup_dir="/var/backups/application"

    # 創建應用備份
    tar -czf "$backup_dir/app_backup_$backup_date.tar.gz" \
        --exclude="node_modules" \
        --exclude=".next" \
        --exclude="*.log" \
        "$app_dir"

    # 驗證備份
    if tar -tzf "$backup_dir/app_backup_$backup_date.tar.gz" > /dev/null; then
        echo "✅ 應用備份完成: $backup_date"
    else
        echo "❌ 應用備份失敗: $backup_date"
        exit 1
    fi
}

# 執行應用備份
app_backup
```

### 3. 備份驗證

#### 自動驗證腳本
```bash
#!/bin/bash

# 備份驗證腳本
verify_backup() {
    local backup_file="$1"
    local test_db="test_restore_$(date +%s)"

    echo "驗證備份: $backup_file"

    # 創建測試數據庫
    createdb "$test_db"

    # 恢復備份到測試數據庫
    if gunzip -c "$backup_file" | psql "$test_db"; then
        echo "✅ 備份可以成功恢復"

        # 驗證關鍵表
        local table_count=$(psql "$test_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")

        if [ "$table_count" -gt 0 ]; then
            echo "✅ 數據表驗證通過: $table_count 個表"
        else
            echo "❌ 數據表驗證失敗"
        fi

        # 驗證數據完整性
        local record_count=$(psql "$test_db" -t -c "SELECT COUNT(*) FROM record_palletinfo;")
        echo "📊 棧板記錄數: $record_count"

    else
        echo "❌ 備份恢復失敗"
    fi

    # 清理測試數據庫
    dropdb "$test_db"
}

# 驗證最新備份
LATEST_BACKUP=$(ls -t /var/backups/database/*.sql.gz | head -1)
verify_backup "$LATEST_BACKUP"
```

## 恢復程序

### 1. 緊急恢復程序

#### 快速恢復清單
```markdown
# 緊急恢復檢查清單 (30 分鐘內完成)

## 第一階段: 評估和準備 (5 分鐘)
- [ ] 確認災難類型和範圍
- [ ] 啟動應急指揮中心
- [ ] 通知關鍵人員
- [ ] 評估安全狀況

## 第二階段: 即時回應 (10 分鐘)
- [ ] 隔離受影響系統
- [ ] 啟動備用系統
- [ ] 切換 DNS 指向
- [ ] 驗證基本連接

## 第三階段: 服務恢復 (10 分鐘)
- [ ] 恢復數據庫服務
- [ ] 啟動應用程式
- [ ] 驗證核心功能
- [ ] 恢復監控系統

## 第四階段: 驗證和通知 (5 分鐘)
- [ ] 執行煙霧測試
- [ ] 通知用戶恢復狀態
- [ ] 更新狀態頁面
- [ ] 開始詳細恢復
```

### 2. 階段性恢復程序

#### 階段 1: 核心系統恢復
```bash
#!/bin/bash

# 核心系統恢復腳本
restore_core_systems() {
    echo "=== 開始核心系統恢復 $(date) ==="

    # 1. 恢復數據庫
    echo "1. 恢復數據庫服務..."
    systemctl start postgresql

    # 檢查數據庫狀態
    if psql $DATABASE_URL -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ 數據庫恢復成功"
    else
        echo "❌ 數據庫恢復失敗，從備份恢復..."
        restore_database_from_backup
    fi

    # 2. 恢復緩存服務
    echo "2. 恢復緩存服務..."
    systemctl start redis-server

    # 3. 恢復應用程式
    echo "3. 恢復應用程式..."
    systemctl start newpennine-wms

    # 4. 驗證核心功能
    echo "4. 驗證核心功能..."
    if curl -s http://localhost:3000/api/v1/health | grep -q "healthy"; then
        echo "✅ 核心系統恢復完成"
        return 0
    else
        echo "❌ 核心系統恢復失敗"
        return 1
    fi
}

# 執行核心系統恢復
restore_core_systems
```

#### 階段 2: 業務功能恢復
```bash
#!/bin/bash

# 業務功能恢復腳本
restore_business_functions() {
    echo "=== 開始業務功能恢復 $(date) ==="

    # 1. 恢復告警系統
    echo "1. 恢復告警系統..."
    curl -X POST http://localhost:3000/api/v1/alerts/system/restart

    # 2. 恢復文件上傳服務
    echo "2. 恢復文件上傳服務..."
    systemctl start file-upload-service

    # 3. 恢復報表服務
    echo "3. 恢復報表服務..."
    systemctl start report-generator

    # 4. 恢復監控系統
    echo "4. 恢復監控系統..."
    systemctl start monitoring-agent

    # 5. 驗證業務功能
    echo "5. 驗證業務功能..."
    run_business_function_tests

    echo "✅ 業務功能恢復完成"
}

# 執行業務功能恢復
restore_business_functions
```

### 3. 數據恢復程序

#### 點時間恢復
```bash
#!/bin/bash

# 點時間恢復腳本
point_in_time_recovery() {
    local target_time="$1"
    local backup_file="$2"

    echo "=== 開始點時間恢復到 $target_time ==="

    # 1. 停止應用程式
    systemctl stop newpennine-wms

    # 2. 創建當前數據庫備份
    pg_dump $DATABASE_URL > "/tmp/pre_recovery_backup_$(date +%Y%m%d_%H%M%S).sql"

    # 3. 恢復基礎備份
    echo "恢復基礎備份..."
    dropdb newpennine_wms
    createdb newpennine_wms
    gunzip -c "$backup_file" | psql newpennine_wms

    # 4. 應用 WAL 日誌到指定時間
    echo "應用 WAL 日誌到 $target_time..."
    pg_wal_replay --target-time="$target_time" newpennine_wms

    # 5. 驗證恢復
    echo "驗證恢復結果..."
    local record_count=$(psql newpennine_wms -t -c "SELECT COUNT(*) FROM record_palletinfo;")
    echo "恢復後記錄數: $record_count"

    # 6. 重新啟動應用程式
    systemctl start newpennine-wms

    echo "✅ 點時間恢復完成"
}

# 使用範例
# point_in_time_recovery "2025-07-17 14:30:00" "/var/backups/database/full_backup_20250717_140000.sql.gz"
```

## 通信計劃

### 1. 通知流程

#### 內部通知
```
第一級通知 (5 分鐘內):
- 技術運營團隊
- 應急指揮官
- 值班工程師

第二級通知 (15 分鐘內):
- 部門主管
- 業務負責人
- 客戶服務團隊

第三級通知 (30 分鐘內):
- 高級管理層
- 法律合規團隊
- 公關團隊

第四級通知 (1 小時內):
- 董事會
- 外部合作夥伴
- 監管機構 (如需要)
```

#### 外部通知
```
用戶通知:
- 系統狀態頁面更新
- 電郵通知重要用戶
- 社交媒體公告

合作夥伴通知:
- 供應商聯絡
- 客戶服務通知
- 業務影響評估

監管通知:
- 數據保護當局 (如涉及個人數據)
- 行業監管機構
- 保險公司
```

### 2. 通信模板

#### 初始事件通知
```
主題: [緊急] NewPennine WMS 系統事件通知

尊敬的團隊，

我們目前正在處理一個影響 NewPennine WMS 系統的事件：

事件級別: [級別]
發生時間: [時間]
影響範圍: [影響的系統/用戶]
預計恢復時間: [ETA]

當前狀態:
- [已採取的行動]
- [正在進行的工作]
- [下一步計劃]

我們會每 30 分鐘提供更新，直到問題解決。

應急指揮官: [姓名]
聯絡電話: [電話號碼]
```

#### 恢復完成通知
```
主題: [已解決] NewPennine WMS 系統恢復正常

團隊，

NewPennine WMS 系統已完全恢復正常運行：

事件摘要:
- 開始時間: [時間]
- 結束時間: [時間]
- 總停機時間: [時間]
- 受影響用戶: [數量]

根本原因: [簡要說明]

已採取措施:
- [立即修復措施]
- [預防措施]

後續行動:
- [事後檢討計劃]
- [系統改進計劃]

感謝大家的配合和耐心。

運營團隊
```

## 測試和演練

### 1. 災難恢復演練

#### 月度演練計劃
```
第1個月: 數據庫故障恢復
- 模擬數據庫服務器故障
- 練習主從切換
- 驗證數據一致性

第2個月: 應用程式故障恢復
- 模擬應用服務器故障
- 練習負載均衡切換
- 驗證用戶體驗

第3個月: 完整災難恢復
- 模擬數據中心故障
- 練習完整系統恢復
- 驗證業務連續性

第4個月: 安全事件回應
- 模擬安全攻擊
- 練習事件隔離
- 驗證恢復程序
```

#### 演練腳本範例
```bash
#!/bin/bash

# 災難恢復演練腳本
disaster_recovery_drill() {
    local drill_type="$1"
    local start_time=$(date)

    echo "=== 開始災難恢復演練: $drill_type ==="
    echo "開始時間: $start_time"

    case $drill_type in
        "database")
            drill_database_failure
            ;;
        "application")
            drill_application_failure
            ;;
        "network")
            drill_network_failure
            ;;
        "full")
            drill_full_disaster
            ;;
        *)
            echo "❌ 未知的演練類型: $drill_type"
            exit 1
            ;;
    esac

    local end_time=$(date)
    echo "結束時間: $end_time"
    echo "=== 演練完成 ==="
}

# 數據庫故障演練
drill_database_failure() {
    echo "1. 模擬數據庫故障..."
    systemctl stop postgresql

    echo "2. 檢測故障..."
    if ! curl -s http://localhost:3000/api/v1/health | grep -q "healthy"; then
        echo "✅ 故障檢測成功"
    fi

    echo "3. 執行恢復程序..."
    systemctl start postgresql

    echo "4. 驗證恢復..."
    if curl -s http://localhost:3000/api/v1/health | grep -q "healthy"; then
        echo "✅ 恢復成功"
    else
        echo "❌ 恢復失敗"
    fi
}

# 執行演練
drill_type="${1:-database}"
disaster_recovery_drill "$drill_type"
```

### 2. 演練評估

#### 評估標準
```
時間指標:
- 故障檢測時間: < 5 分鐘
- 回應啟動時間: < 10 分鐘
- 系統恢復時間: < 30 分鐘
- 完整恢復時間: < 1 小時

功能指標:
- 數據完整性: 100%
- 核心功能恢復: 100%
- 用戶訪問恢復: 95%
- 性能恢復: 90%

流程指標:
- 通知及時性: 100%
- 角色分工清晰: 100%
- 文檔完整性: 100%
- 決策效率: 良好
```

#### 演練報告模板
```markdown
# 災難恢復演練報告

## 演練概述
- 演練日期: [日期]
- 演練類型: [類型]
- 參與人員: [名單]
- 演練時長: [時間]

## 演練結果
- 檢測時間: [時間]
- 回應時間: [時間]
- 恢復時間: [時間]
- 功能恢復率: [百分比]

## 成功要素
- [列出表現良好的方面]

## 改進建議
- [列出需要改進的方面]

## 後續行動
- [列出具體的改進措施]
- [責任人和截止日期]
```

## 供應商和資源

### 1. 關鍵供應商聯絡

#### 技術供應商
```
雲服務提供商:
- 公司: [供應商名稱]
- 聯絡電話: [電話]
- 技術支援: [支援電話]
- 合約編號: [編號]

數據中心服務:
- 公司: [供應商名稱]
- 聯絡電話: [電話]
- 緊急支援: [支援電話]
- 服務級別: [SLA]

網絡服務提供商:
- 公司: [供應商名稱]
- 聯絡電話: [電話]
- 故障報告: [報告電話]
- 帳戶經理: [姓名]
```

#### 硬件供應商
```
服務器供應商:
- 公司: [供應商名稱]
- 聯絡電話: [電話]
- 技術支援: [支援電話]
- 保修狀態: [狀態]

網絡設備供應商:
- 公司: [供應商名稱]
- 聯絡電話: [電話]
- 現場支援: [支援電話]
- 響應時間: [時間]
```

### 2. 外部資源

#### 專業服務
```
災難恢復顧問:
- 公司: [顧問公司]
- 聯絡人: [姓名]
- 電話: [電話]
- 專長: [專業領域]

法律顧問:
- 律師事務所: [名稱]
- 聯絡人: [姓名]
- 電話: [電話]
- 專長: [法律領域]

保險公司:
- 保險公司: [名稱]
- 理賠專員: [姓名]
- 電話: [電話]
- 保單編號: [編號]
```

## 成本分析

### 1. 災難恢復成本

#### 預防成本
```
備份系統: $50,000/年
監控系統: $30,000/年
冗餘設備: $100,000/年
人員培訓: $20,000/年
演練費用: $15,000/年
總計: $215,000/年
```

#### 恢復成本
```
緊急人員: $5,000/事件
外部支援: $10,000/事件
設備更換: $20,000/事件
數據恢復: $15,000/事件
總計: $50,000/事件
```

### 2. 投資回報分析

#### 成本效益
```
年度預防投資: $215,000
預期避免損失: $500,000
投資回報率: 133%
回收期: 9 個月
```

## 文檔維護

### 1. 更新程序

#### 定期更新
```
月度更新:
- 聯絡資訊更新
- 程序細節調整
- 新風險評估

季度更新:
- 恢復目標審查
- 演練結果整合
- 供應商信息更新

年度更新:
- 完整計劃審查
- 業務影響重評
- 成本效益分析
```

### 2. 版本控制

#### 文檔版本
```
v2.0.7 (2025-07-17): 初始完整版本
v2.0.8 (計劃): 演練反饋整合
v2.1.0 (計劃): 新技術架構適配
```

## 聯絡資訊

### 應急聯絡人
- **應急指揮官**: emergency@newpennine.com / +852-1234-5678
- **技術主管**: tech-lead@newpennine.com / +852-1234-5679
- **業務主管**: business-lead@newpennine.com / +852-1234-5680
- **法律顧問**: legal@newpennine.com / +852-1234-5681

### 24/7 支援
- **技術支援**: support@newpennine.com / +852-1234-5682
- **運營中心**: operations@newpennine.com / +852-1234-5683
- **安全團隊**: security@newpennine.com / +852-1234-5684

---

**版本**: v2.0.7  
**建立日期**: 2025-07-17  
**最後更新**: 2025-07-17  
**下次審查**: 2025-10-17  
**機密等級**: 機密  

**維護者**: NewPennine Business Continuity Team  
**核准人**: [CEO 簽名]  
**文檔路徑**: `/docs/manual/disaster-recovery-plan.md`
