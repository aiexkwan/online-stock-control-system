# 認證系統架構分析與重構計劃

*最後更新: 2025-08-11*

## 📊 **現狀分析**

### 當前架構問題

系統目前採用了**有問題的雙重認證架構**：

```
前端: Supabase Auth → JWT Token (Supabase 簽名)
                           ↓
後端: NestJS API ← JWT Guard (期望 JWT_SECRET 簽名)
```

### 主要問題識別

#### 1. **Token 簽名不兼容**
- **前端**: Supabase Auth 使用自己的 secret 簽名 JWT
- **後端**: NestJS JwtStrategy 使用 `JWT_SECRET` 環境變數驗證
- **結果**: Token 驗證失敗，API 調用被拒絕

#### 2. **用戶身份映射錯誤**
- **Supabase**: 使用 UUID 格式的 `sub` (例: `550e8400-e29b-41d4-a716-446655440000`)
- **系統期望**: clock_number 整數格式 (例: `12345`)
- **影響**: `AuthService.validateUser()` 無法找到對應用戶

#### 3. **架構不一致性**
```typescript
// 前端登入流程
await supabase.auth.signInWithPassword(email, password)
// ✅ 成功，獲得 Supabase JWT

// API 調用流程  
fetch('/api/endpoint', {
  headers: { Authorization: `Bearer ${supabaseToken}` }
})
// ❌ 失敗，NestJS 無法驗證 Supabase token
```

## 🔍 **受影響的模組**

### Backend Controllers (10個)
所有使用 `@UseGuards(JwtAuthGuard)` 的控制器：

1. `aco.controller.ts` - ACO 訂單管理
2. `grn.controller.ts` - 貨物接收
3. `history.controller.ts` - 歷史記錄
4. `inventory.controller.ts` - 庫存管理
5. `orders.controller.ts` - 訂單管理
6. `pallets.controller.ts` - 棧板管理
7. `products.controller.ts` - 產品管理
8. `rpc.controller.ts` - RPC 調用
9. `transfers.controller.ts` - 庫存轉移
10. `warehouse-transfers.controller.ts` - 倉庫轉移

### 核心認證模組
- `AuthModule` - 主認證模組
- `JwtAuthGuard` - JWT 守衛
- `JwtStrategy` - JWT 驗證策略
- `AuthService` - 認證服務

## 🎯 **重構方案**

### 方案 A: 統一 Supabase Auth (推薦)

**設計原則**: 單一認證源，前後端一致

```
前端: Supabase Auth → Supabase JWT
                           ↓
後端: SupabaseAuthGuard → 驗證 Supabase JWT (使用 JWKS)
```

#### 實施步驟

**階段 1: 準備 Supabase 認證模組**
```typescript
// 新建 supabase-auth.module.ts
@Module({
  imports: [
    PassportModule,
    JwtModule.register({}) // 空配置，使用 JWKS
  ],
  providers: [SupabaseJwtStrategy, SupabaseAuthGuard],
  exports: [SupabaseAuthGuard]
})
export class SupabaseAuthModule {}
```

**階段 2: 實施 Supabase JWT 策略**
```typescript
// 新建 supabase-jwt.strategy.ts
@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // 使用 Supabase JWKS endpoint
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/.well-known/jwks_json`
      }),
      // 驗證 issuer 和 audience
      issuer: process.env.NEXT_PUBLIC_SUPABASE_URL,
      audience: 'authenticated'
    });
  }

  async validate(payload: SupabaseJwtPayload) {
    // 處理 Supabase JWT payload
    return {
      userId: payload.sub, // UUID format
      email: payload.email,
      role: payload.role
    };
  }
}
```

**階段 3: 用戶身份映射**
```typescript
// 擴展 validate 方法處理用戶映射
async validate(payload: SupabaseJwtPayload) {
  // 1. 從 Supabase UUID 映射到 clock_number
  const clockNumber = await this.mapSupabaseUserToClockNumber(payload.sub);
  
  // 2. 驗證用戶存在於 data_id 表
  const userData = await this.validateUserInDataId(clockNumber);
  
  return {
    supabaseId: payload.sub,
    clockNumber: clockNumber,
    email: payload.email,
    ...userData
  };
}
```

**階段 4: 逐步替換 Guards**
```typescript
// 從這個
@UseGuards(JwtAuthGuard)

// 改為這個  
@UseGuards(SupabaseAuthGuard)
```

**階段 5: 移除舊認證模組**
- 移除 `AuthModule` from `AppModule`
- 刪除 `/src/auth/` 目錄
- 清理相關依賴

### 方案 B: 統一 NestJS Auth

**設計原則**: 自建完整認證系統

```
前端: 調用 NestJS /auth/login → NestJS JWT
                                    ↓  
後端: JwtAuthGuard → 驗證 NestJS JWT
```

#### 實施步驟
1. 修改前端移除 Supabase Auth
2. 前端調用 `/auth/login` API
3. 保持現有後端認證邏輯
4. 處理用戶註冊、密碼重置等流程

### 方案 C: Token 轉換橋接 (不推薦)

**設計**: 在 API Gateway 層面轉換 token

```
前端: Supabase JWT → API Gateway → 轉換為 NestJS JWT → 後端
```

**缺點**: 增加複雜度，維護困難

## 📋 **實施計劃**

### 推薦: 方案 A (統一 Supabase Auth)

#### 時間線
- **第1週**: 準備 SupabaseAuthModule 和 Strategy
- **第2週**: 實施用戶映射邏輯  
- **第3週**: 逐步替換 Controllers (分批進行)
- **第4週**: 測試和清理舊代碼

#### 風險評估
| 風險 | 影響 | 緩解策略 |
|------|------|----------|
| JWKS 連接失敗 | API 無法認證 | 實施 fallback 機制 |
| 用戶映射錯誤 | 用戶無法訪問 | 建立完整的映射表 |
| Token 格式變更 | 前端需要更新 | 保持向後兼容 |

#### 測試策略
1. **單元測試**: SupabaseJwtStrategy 驗證邏輯
2. **整合測試**: 每個 Controller 的認證流程
3. **E2E 測試**: 完整的登入到 API 調用流程
4. **負載測試**: JWKS 快取效能

## 🚨 **注意事項**

### 資料庫映射需求
```sql
-- 需要建立 Supabase UUID 到 clock_number 的映射
CREATE TABLE user_mapping (
  supabase_uuid UUID PRIMARY KEY,
  clock_number INTEGER REFERENCES data_id(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 環境變數更新
```env
# 新增 Supabase JWKS 相關配置
SUPABASE_JWKS_URI=https://your-project.supabase.co/rest/v1/.well-known/jwks_json
SUPABASE_JWT_ISSUER=https://your-project.supabase.co
SUPABASE_JWT_AUDIENCE=authenticated
```

### 前端適配
前端可能需要調整 token 獲取方式：
```typescript
// 確保使用正確的 access token
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token; // 使用這個 token 調用 API
```

## 🔍 **驗證清單**

### 重構前檢查
- [ ] 確認所有使用 JwtAuthGuard 的 endpoints
- [ ] 記錄當前用戶數據結構
- [ ] 備份現有認證配置
- [ ] 建立測試環境

### 重構後驗證
- [ ] 所有 API endpoints 正常工作
- [ ] 用戶登入流程順暢
- [ ] 權限控制正確
- [ ] 效能沒有明顯下降
- [ ] 錯誤處理適當

## 💡 **建議**

1. **優先使用方案 A**: 統一 Supabase Auth 係最符合現有前端架構嘅選擇
2. **分階段實施**: 唔好一次性替換所有 Guards，分批進行
3. **保持向後兼容**: 確認新系統穩定前保留舊代碼
4. **完善監控**: 實施認證失敗監控和告警
5. **文檔更新**: 及時更新 API 文檔和開發指南

## 📊 **架構評級**

| 評估項目 | 現狀分數 | 方案A分數 | 方案B分數 |
|---------|---------|----------|----------|
| **一致性** | 2/10 | 9/10 | 8/10 |
| **可維護性** | 3/10 | 8/10 | 7/10 |
| **安全性** | 4/10 | 9/10 | 8/10 |
| **調試性** | 2/10 | 7/10 | 8/10 |
| **整體合理性** | **2.5/10** | **8.5/10** | **7.5/10** |

---

**結論**: 當前嘅雙重認證架構存在根本性設計問題，建議採用統一 Supabase Auth 方案進行重構，以提高系統一致性和可維護性。