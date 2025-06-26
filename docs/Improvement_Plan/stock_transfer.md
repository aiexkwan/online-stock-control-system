# 庫存轉移系統改進計劃（基於實際代碼分析）

## 概述
基於代碼分析，庫存轉移系統位於`/app/stock-transfer/`，已實現完善嘅單棧板轉移功能，包括5分鐘TTL緩存、樂觀UI更新同轉移碼系統。主要問題係缺乏批量轉移功能（雖然數據庫層已有支援），每日需處理500+次單獨轉移，效率低下。

## 現有系統實際架構

### 核心組件
```
app/stock-transfer/
├── page.tsx                           # 主頁面
├── components/
│   ├── TransferConfirmDialog.tsx     # 轉移確認對話框
│   ├── PalletSearchSection.tsx       # 棧板搜索
│   ├── TransferLogSection.tsx        # 活動日誌
│   └── PageHeader/Footer.tsx         # 頁面佈局
└── hooks/
    ├── useKeyboardShortcuts.tsx      # 鍵盤快捷鍵
    └── usePalletCache.tsx            # 緩存系統
```

### 現有功能
- **單棧板轉移**：掃描/輸入棧板號進行轉移
- **轉移碼系統**：6位數字碼映射目的地
- **位置選項**：Await、Production、PipeLine等8個位置
- **緩存優化**：5分鐘TTL，50-100項目上限
- **樂觀更新**：即時UI反饋
- **活動日誌**：顯示最近轉移記錄

### 發現嘅問題

#### 1. 無批量轉移
```typescript
// 現有實現：只支援單個棧板
const transferPallet = async (palletNum: string, location: string) => {
  // 單一處理邏輯
};
// 數據庫已有 batch_search_pallets 但未使用
```

#### 2. 重複操作效率低
```typescript
// 每次轉移都需要：
// 1. 掃描/輸入棧板號
// 2. 選擇目的地
// 3. 確認轉移
// 大量重複操作浪費時間
```

#### 3. 缺乏快速轉移模式
```typescript
// 無法設定默認目的地
// 無法連續掃描轉移到同一位置
// 每次都要重新選擇
```

## 改進方案

### 第一階段：計時器轉移模式（2週）

#### 1.1 計時器會話轉移
```typescript
// app/components/TimedTransferMode.tsx
export function TimedTransferMode() {
  const [sessionActive, setSessionActive] = useState(false);
  const [defaultLocation, setDefaultLocation] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(300); // 默認5分鐘
  const [transferCount, setTransferCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();

  // 開始計時會話
  const startSession = (location: string) => {
    setDefaultLocation(location);
    setSessionActive(true);
    setTimeRemaining(sessionDuration);
    setTransferCount(0);
    
    // 啟動倒計時
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          endSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 結束會話
  const endSession = () => {
    setSessionActive(false);
    setDefaultLocation('');
    setTimeRemaining(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // 顯示會話摘要
    showSessionSummary(transferCount);
  };

  // 處理掃描
  const handleScan = async (palletNum: string) => {
    if (!sessionActive) {
      // 第一次掃描 - 顯示位置選擇
      showLocationDialog(palletNum);
    } else {
      // 會話期間 - 使用默認位置但可修改
      await quickTransfer(palletNum, defaultLocation);
    }
  };

  // 快速轉移（可選擇性修改目的地）
  const quickTransfer = async (palletNum: string, location: string) => {
    // 顯示快速確認UI，允許修改
    const confirmed = await showQuickConfirm(palletNum, location);
    
    if (confirmed.proceed) {
      await transferPallet(palletNum, confirmed.location);
      setTransferCount(prev => prev + 1);
    }
  };

  return (
    <div className="timed-transfer-mode">
      {/* 計時器狀態欄 */}
      {sessionActive && (
        <div className="session-status">
          <div className="timer">
            <ClockIcon />
            <span>{formatTime(timeRemaining)}</span>
          </div>
          <div className="default-location">
            默認目的地：<strong>{defaultLocation}</strong>
          </div>
          <div className="count">
            已轉移：<strong>{transferCount}</strong>
          </div>
          <button onClick={endSession} className="end-btn">
            結束
          </button>
        </div>
      )}

      {/* 掃描區域 */}
      <Scanner onScan={handleScan} />

      {/* 設定 */}
      {!sessionActive && (
        <div className="session-settings">
          <label>會話時長：</label>
          <select value={sessionDuration} onChange={(e) => setSessionDuration(Number(e.target.value))}>
            <option value={180}>3分鐘</option>
            <option value={300}>5分鐘</option>
            <option value={600}>10分鐘</option>
            <option value={900}>15分鐘</option>
          </select>
        </div>
      )}
    </div>
  );
}

// 位置選擇對話框（第一次掃描時）
export function LocationDialog({ palletNum, onConfirm }) {
  const [selectedLocation, setSelectedLocation] = useState('');
  
  return (
    <Dialog open={true}>
      <div className="location-dialog">
        <h3>轉移 {palletNum} 到：</h3>
        
        {/* 快捷位置按鈕 */}
        <div className="quick-locations">
          {['Await', 'Production', 'Fold Mill', 'PipeLine'].map(loc => (
            <button
              key={loc}
              onClick={() => {
                setSelectedLocation(loc);
                onConfirm(loc);
              }}
              className="location-btn"
            >
              {loc}
            </button>
          ))}
        </div>
        
        {/* 或選擇其他 */}
        <LocationSelector 
          value={selectedLocation}
          onChange={(loc) => {
            setSelectedLocation(loc);
            onConfirm(loc);
          }}
        />
      </div>
    </Dialog>
  );
}

// 快速確認組件（會話期間）
export function QuickConfirm({ palletNum, defaultLocation, onConfirm }) {
  const [showOptions, setShowOptions] = useState(false);
  const [countdown, setCountdown] = useState(3);
  
  useEffect(() => {
    // 3秒自動確認
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onConfirm({ proceed: true, location: defaultLocation });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="quick-confirm">
      <div className="confirm-card">
        <p>{palletNum} → {defaultLocation}</p>
        
        {!showOptions ? (
          <div className="auto-confirm">
            <span className="countdown">{countdown}</span>
            <button onClick={() => setShowOptions(true)}>
              改變目的地
            </button>
          </div>
        ) : (
          <div className="location-options">
            <LocationSelector 
              value={defaultLocation}
              onChange={(loc) => onConfirm({ proceed: true, location: loc })}
            />
            <button onClick={() => onConfirm({ proceed: false })}>
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

#### 1.2 簡化批量轉移（無分組）
```typescript
// app/components/SimpleBatchTransfer.tsx
export function SimpleBatchTransfer() {
  const [scannedPallets, setScannedPallets] = useState<string[]>([]);
  const [targetLocation, setTargetLocation] = useState('');
  
  const handleScan = (palletNum: string) => {
    // 避免重複
    if (!scannedPallets.includes(palletNum)) {
      setScannedPallets(prev => [...prev, palletNum]);
      playBeep(); // 聲音反饋
    }
  };
  
  const executeTransfer = async () => {
    // 一次過轉移所有掃描嘅棧板到同一個位置
    const results = await batchTransfer(scannedPallets, targetLocation);
    
    // 顯示結果
    showResults(results);
    
    // 清空列表，準備下一批
    setScannedPallets([]);
  };
  
  return (
    <div className="simple-batch-transfer">
      {/* 步驟1：選擇目的地 */}
      <div className="step-1">
        <h3>1. 選擇目的地</h3>
        <LocationSelector 
          value={targetLocation} 
          onChange={setTargetLocation}
        />
      </div>
      
      {/* 步驟2：掃描棧板 */}
      <div className="step-2">
        <h3>2. 掃描棧板 ({scannedPallets.length} 個)</h3>
        <Scanner onScan={handleScan} continuous={true} />
        
        {/* 簡單列表顯示 */}
        <div className="scanned-list">
          {scannedPallets.map(pallet => (
            <div key={pallet}>
              {pallet} 
              <button onClick={() => removePallet(pallet)}>✕</button>
            </div>
          ))}
        </div>
      </div>
      
      {/* 步驟3：執行轉移 */}
      <button 
        className="transfer-btn"
        onClick={executeTransfer}
        disabled={!targetLocation || scannedPallets.length === 0}
      >
        轉移全部到 {targetLocation} ({scannedPallets.length} 個)
      </button>
    </div>
  );
}
```

#### 1.2 批量處理邏輯
```typescript
// app/hooks/useBatchTransfer.ts
export function useBatchTransfer() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const executeBatchTransfer = async (
    pallets: PalletInfo[],
    targetLocation: string,
    options?: BatchTransferOptions
  ) => {
    setProcessing(true);
    setProgress(0);
    
    try {
      // 優化批次大小
      const batchSize = options?.batchSize || 10;
      const batches = chunk(pallets, batchSize);
      
      let completed = 0;
      const results: TransferResult[] = [];
      
      for (const batch of batches) {
        // 並行處理每批
        const batchResults = await Promise.allSettled(
          batch.map(pallet => 
            transferSinglePallet(pallet, targetLocation)
          )
        );
        
        // 收集結果
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push({
              pallet: batch[index],
              success: true,
              ...result.value
            });
          } else {
            results.push({
              pallet: batch[index],
              success: false,
              error: result.reason
            });
          }
        });
        
        // 更新進度
        completed += batch.length;
        setProgress((completed / pallets.length) * 100);
        
        // 避免過載
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // 生成摘要報告
      const summary = generateTransferSummary(results);
      
      return { results, summary };
    } finally {
      setProcessing(false);
    }
  };
  
  const generateTransferSummary = (results: TransferResult[]) => {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return {
      total: results.length,
      successful,
      failed,
      successRate: (successful / results.length) * 100,
      failedPallets: results.filter(r => !r.success).map(r => ({
        plt_num: r.pallet.plt_num,
        error: r.error
      }))
    };
  };
  
  return { executeBatchTransfer, processing, progress };
}
```

### 第二階段：快速轉移模式（1週）

#### 2.1 連續掃描模式
```typescript
// app/components/QuickTransferMode.tsx
export function QuickTransferMode() {
  const [isActive, setIsActive] = useState(false);
  const [defaultLocation, setDefaultLocation] = useState<string>('');
  const [transferCount, setTransferCount] = useState(0);
  const { transferPallet } = useTransfer();
  
  const handleQuickScan = async (code: string) => {
    if (!defaultLocation) {
      toast.error('請先設定默認目的地');
      return;
    }
    
    try {
      // 直接轉移到默認位置
      await transferPallet(code, defaultLocation);
      setTransferCount(prev => prev + 1);
      
      // 成功反饋
      playSuccessSound();
      showSuccessAnimation();
    } catch (error) {
      // 錯誤處理
      playErrorSound();
      toast.error(`轉移失敗: ${error.message}`);
    }
  };
  
  return (
    <div className="quick-transfer-mode">
      <div className="mode-header">
        <h2>快速轉移模式</h2>
        <Switch
          checked={isActive}
          onChange={setIsActive}
          label="啟用快速模式"
        />
      </div>
      
      {isActive && (
        <>
          <div className="default-location">
            <label>默認目的地：</label>
            <LocationSelector
              value={defaultLocation}
              onChange={setDefaultLocation}
              showFrequent={true}
            />
          </div>
          
          <div className="scan-area">
            <ContinuousScanner
              onScan={handleQuickScan}
              enabled={isActive && !!defaultLocation}
              autoFocus={true}
            />
          </div>
          
          <div className="transfer-stats">
            <div className="stat-card">
              <span className="label">已轉移</span>
              <span className="value">{transferCount}</span>
            </div>
            <button
              onClick={() => setTransferCount(0)}
              className="reset-btn"
            >
              重置計數
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

#### 2.2 預設配置管理
```typescript
// app/hooks/useTransferPresets.ts
export function useTransferPresets() {
  const [presets, setPresets] = useState<TransferPreset[]>([]);
  
  useEffect(() => {
    // 載入保存的預設
    const saved = localStorage.getItem('transfer-presets');
    if (saved) {
      setPresets(JSON.parse(saved));
    }
  }, []);
  
  const savePreset = (preset: TransferPreset) => {
    const updated = [...presets, { ...preset, id: crypto.randomUUID() }];
    setPresets(updated);
    localStorage.setItem('transfer-presets', JSON.stringify(updated));
  };
  
  const applyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      return {
        location: preset.location,
        transferCode: preset.transferCode,
        autoConfirm: preset.autoConfirm
      };
    }
    return null;
  };
  
  return { presets, savePreset, applyPreset };
}

// 預設配置組件
export function PresetManager() {
  const { presets, savePreset } = useTransferPresets();
  const [showCreate, setShowCreate] = useState(false);
  
  return (
    <div className="preset-manager">
      <div className="preset-list">
        {presets.map(preset => (
          <PresetCard
            key={preset.id}
            preset={preset}
            onSelect={() => applyPreset(preset.id)}
          />
        ))}
      </div>
      
      <button
        onClick={() => setShowCreate(true)}
        className="create-preset-btn"
      >
        + 新增預設
      </button>
      
      {showCreate && (
        <CreatePresetDialog
          onSave={savePreset}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
```

### 第三階段：性能優化（1週）

#### 3.1 優化緩存策略
```typescript
// app/hooks/useEnhancedCache.ts
export function useEnhancedCache() {
  const cache = useRef<Map<string, CacheEntry>>(new Map());
  const prefetchQueue = useRef<Set<string>>(new Set());
  
  // 預加載常用棧板
  const prefetchCommonPallets = async () => {
    const commonPrefixes = ['PM-', 'PT-', 'PL-'];
    const today = format(new Date(), 'ddMMyy');
    
    for (const prefix of commonPrefixes) {
      // 預加載今天的棧板
      const pattern = `${prefix}${today}%`;
      const pallets = await fetchPalletsByPattern(pattern);
      
      pallets.forEach(pallet => {
        cache.current.set(pallet.plt_num, {
          data: pallet,
          timestamp: Date.now(),
          hits: 0
        });
      });
    }
  };
  
  // 智能預測下一個可能的棧板
  const predictNext = (currentPallet: string): string[] => {
    const predictions: string[] = [];
    
    // 基於序號預測
    const match = currentPallet.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1]);
      const prefix = currentPallet.substring(0, currentPallet.length - match[1].length);
      
      // 預測接下來的5個
      for (let i = 1; i <= 5; i++) {
        predictions.push(`${prefix}${num + i}`);
      }
    }
    
    return predictions;
  };
  
  // 背景預加載
  const backgroundPrefetch = async (predictions: string[]) => {
    for (const prediction of predictions) {
      if (!cache.current.has(prediction) && !prefetchQueue.current.has(prediction)) {
        prefetchQueue.current.add(prediction);
        
        // 異步預加載
        fetchPallet(prediction).then(pallet => {
          if (pallet) {
            cache.current.set(prediction, {
              data: pallet,
              timestamp: Date.now(),
              hits: 0
            });
          }
          prefetchQueue.current.delete(prediction);
        });
      }
    }
  };
  
  return {
    cache,
    prefetchCommonPallets,
    predictNext,
    backgroundPrefetch
  };
}
```

#### 3.2 UI響應優化
```typescript
// app/components/OptimizedTransferUI.tsx
export function OptimizedTransferUI() {
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([]);
  const { executeTransfer } = useTransfer();
  
  // 樂觀更新
  const optimisticTransfer = async (pallet: string, location: string) => {
    const tempId = crypto.randomUUID();
    
    // 立即更新UI
    setPendingTransfers(prev => [...prev, {
      id: tempId,
      pallet,
      location,
      status: 'pending'
    }]);
    
    try {
      // 背景執行實際轉移
      const result = await executeTransfer(pallet, location);
      
      // 更新狀態為成功
      setPendingTransfers(prev => 
        prev.map(t => t.id === tempId ? { ...t, status: 'success' } : t)
      );
      
      // 2秒後移除成功項目
      setTimeout(() => {
        setPendingTransfers(prev => prev.filter(t => t.id !== tempId));
      }, 2000);
    } catch (error) {
      // 更新狀態為失敗
      setPendingTransfers(prev => 
        prev.map(t => t.id === tempId ? { ...t, status: 'error', error: error.message } : t)
      );
    }
  };
  
  return (
    <div className="optimized-transfer-ui">
      {/* 主要轉移界面 */}
      <TransferForm onSubmit={optimisticTransfer} />
      
      {/* 懸浮狀態顯示 */}
      <div className="pending-transfers">
        {pendingTransfers.map(transfer => (
          <PendingTransferCard
            key={transfer.id}
            transfer={transfer}
            onRetry={() => optimisticTransfer(transfer.pallet, transfer.location)}
          />
        ))}
      </div>
    </div>
  );
}
```

## 實施時間表

### 第1-2週：批量轉移（高優先級）
- [ ] 批量掃描介面 - 🔥 高優先級
- [ ] 並行處理邏輯 - 🔥 高優先級
- [ ] 進度追蹤UI - 🔥 高優先級
- 🎯 目標：解決每日500+次單獨轉移嘅效率問題

### 第3週：快速模式（中優先級）
- [ ] 連續掃描功能 - 計時器轉移模式實施
- [ ] 預設配置管理 - 默認目的地設定
- [ ] 快速切換介面 - 3秒自動確認機制

### 第4週：性能優化
- [x] 基礎緩存系統 - ✅ 已有5分鐘TTL，50-100項目上限
- [ ] 增強緩存策略 - 語義相似度匹配
- [ ] 預測性加載 - 基於序號預測下一個棧板
- [x] 樂觀UI更新 - ✅ 已實現即時UI反饋

## 目標成果

### 🎯 核心目標
**現狀**：每日需處理500+次單獨轉移，每次都需要：
1. 掃描/輸入棧板號
2. 選擇目的地
3. 確認轉移

**目標**：
- 轉移效率：單件 → 批量10-50件
- 操作時間：減少 60%（快速模式）
- 每日處理量：500 → 2000+ 次

### 已實現基礎
- ✅ 單棧板轉移：掃描/輸入棧板號進行轉移
- ✅ 轉移碼系統：6位數字碼映射目的地
- ✅ 緩存優化：5分鐘TTL，50-100項目上限
- ✅ 樂觀更新：即時UI反饋
- ✅ 活動日誌：顯示最近轉移記錄

### 待實現改進
- 🔥 批量轉移功能（數據庫層已支援batch_search_pallets）
- 🔥 計時器會話轉移（設定默認目的地）
- 連續掃描模式
- 智能預測下一個棧板

### 技術基礎
- ✅ 系統性能：緩存命中率已達基本水平
- ✅ UI響應時間：<100ms（樂觀更新）
- 待增強：並發處理支援10+同時轉移

## 風險評估

### 技術風險
- 批量操作的錯誤處理
- 緩存一致性問題

### 緩解措施
- 完善的錯誤恢復機制
- 定期緩存同步驗證

## 實施狀態更新（2025-06-26）

### 現有系統完整性
- ✅ 核心架構：位於 `/app/stock-transfer/`，功能完善
- ✅ 緩存系統：`/app/stock-transfer/hooks/usePalletCache.tsx`
- ✅ 數據庫支援：`batch_search_pallets` 函數已存在（待使用）
- ✅ 基礎功能：單棧板轉移、轉移碼、樂觀更新全部運作正常

### 下一步行動
1. **立即優先級**：實施批量轉移功能（利用現有 batch_search_pallets）
2. **第二優先級**：計時器會話轉移模式
3. **第三優先級**：性能和預測性優化

### 技術債務
- 🔥 主要瓶頸：缺乏批量轉移導致效率低下
- 💡 機會：數據庫層已有支援，只需前端實施
- ⚡ 快速勝利：計時器模式可大幅減少重複操作

## 相關資源
- 現有代碼：`/app/stock-transfer/`
- 緩存實現：`/app/stock-transfer/hooks/usePalletCache.tsx`
- 數據庫函數：`batch_search_pallets` (已存在但未使用)
- 文檔：`/docs/fn_stock_transfer.md`