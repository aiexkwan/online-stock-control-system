# 主登入界面 (Main Login) 規劃文檔

## 概述
創建一個新的主登入界面，提供更嚴格的安全控制，只允許 @pennineindustries.com 域名的用戶註冊和登入，並提供密碼管理功能。

## 核心需求

### 1. 安全控制
- **域名限制**: 只允許 `@pennineindustries.com` 結尾的 email 註冊
- **無 Cookie 存儲**: 成功登入後不記錄任何 cookies 到 localStorage
- **訪問控制**: 登入後直接跳轉到 `/access` 頁面
- **外部阻擋**: 防止外來者隨意登入系統

### 2. 功能需求
- **用戶註冊**: 新用戶可以註冊帳號（限制域名）
- **用戶登入**: 現有用戶登入驗證
- **密碼修改**: 用戶可以修改自己的密碼
- **密碼重設**: 忘記密碼時的重設功能

## 技術架構

### 路由結構
```
/main-login                 # 新的主登入頁面
├── /main-login/register    # 用戶註冊頁面
├── /main-login/reset       # 密碼重設頁面
└── /main-login/change      # 密碼修改頁面
```

### 組件架構
```
app/main-login/
├── page.tsx                # 主登入頁面
├── register/
│   └── page.tsx           # 註冊頁面
├── reset/
│   └── page.tsx           # 密碼重設頁面
├── change/
│   └── page.tsx           # 密碼修改頁面
└── components/
    ├── LoginForm.tsx      # 登入表單組件
    ├── RegisterForm.tsx   # 註冊表單組件
    ├── ResetForm.tsx      # 密碼重設表單
    ├── ChangeForm.tsx     # 密碼修改表單
    └── EmailValidator.tsx # Email 域名驗證組件
```

## 功能詳細設計

### 1. 主登入頁面 (`/main-login`)
**功能**:
- 用戶登入表單
- 註冊連結
- 忘記密碼連結
- 公司品牌展示

**UI 設計**:
- 深色主題 (與系統一致)
- 居中卡片式佈局
- Pennine Industries 品牌標識
- 響應式設計

**驗證邏輯**:
```typescript
interface LoginFormData {
  email: string;
  password: string;
}

const validateLogin = (data: LoginFormData) => {
  // Email 格式驗證
  if (!data.email.endsWith('@pennineindustries.com')) {
    throw new Error('只允許 @pennineindustries.com 域名登入');
  }
  
  // 密碼強度驗證
  if (data.password.length < 8) {
    throw new Error('密碼至少需要 8 個字符');
  }
};
```

### 2. 用戶註冊頁面 (`/main-login/register`)
**功能**:
- 新用戶註冊表單
- Email 域名驗證
- 密碼強度要求
- 用戶協議確認

**表單欄位**:
```typescript
interface RegisterFormData {
  email: string;           // 必須 @pennineindustries.com
  password: string;        // 最少 8 字符，包含大小寫和數字
  confirmPassword: string; // 密碼確認
  firstName: string;       // 名字
  lastName: string;        // 姓氏
  department?: string;     // 部門 (可選)
  agreeToTerms: boolean;   // 同意條款
}
```

**驗證規則**:
- Email 必須以 `@pennineindustries.com` 結尾
- 密碼至少 8 字符，包含大寫、小寫字母和數字
- 確認密碼必須匹配
- 所有必填欄位不能為空

### 3. 密碼重設頁面 (`/main-login/reset`)
**功能**:
- 發送重設密碼 email
- 驗證重設 token
- 設置新密碼

**流程**:
1. 用戶輸入 email 地址
2. 系統發送重設連結到 email
3. 用戶點擊連結跳轉到重設頁面
4. 輸入新密碼並確認
5. 更新密碼並跳轉到登入頁面

### 4. 密碼修改頁面 (`/main-login/change`)
**功能**:
- 已登入用戶修改密碼
- 舊密碼驗證
- 新密碼設置

**表單欄位**:
```typescript
interface ChangePasswordData {
  currentPassword: string; // 當前密碼
  newPassword: string;     // 新密碼
  confirmPassword: string; // 確認新密碼
}
```

## 安全機制

### 1. Email 域名驗證
```typescript
const validateEmailDomain = (email: string): boolean => {
  const allowedDomain = '@pennineindustries.com';
  return email.toLowerCase().endsWith(allowedDomain);
};

const EmailValidator = {
  validate: (email: string) => {
    if (!validateEmailDomain(email)) {
      throw new Error('只允許 Pennine Industries 員工註冊');
    }
  }
};
```

### 2. 密碼強度要求
```typescript
const PasswordValidator = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  
  validate: (password: string) => {
    const errors: string[] = [];
    
    if (password.length < this.minLength) {
      errors.push(`密碼至少需要 ${this.minLength} 個字符`);
    }
    
    if (this.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('密碼必須包含大寫字母');
    }
    
    if (this.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('密碼必須包含小寫字母');
    }
    
    if (this.requireNumbers && !/\d/.test(password)) {
      errors.push('密碼必須包含數字');
    }
    
    return errors;
  }
};
```

### 3. 無 Cookie 存儲策略
```typescript
const AuthManager = {
  // 登入成功後不存儲任何本地數據
  handleLoginSuccess: (user: User) => {
    // 不使用 localStorage 或 sessionStorage
    // 直接跳轉到 /access 頁面
    router.push('/access');
  },
  
  // 使用 Supabase 的內建 session 管理
  // 但不持久化到本地存儲
  configureAuth: () => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // 立即跳轉，不存儲 session
        router.push('/access');
      }
    });
  }
};
```

## UI/UX 設計

### 1. 視覺設計
- **主題**: 深色主題，與現有系統一致
- **色彩**: 
  - 背景: `bg-gray-900`
  - 卡片: `bg-gray-800`
  - 主色調: `text-blue-400`
  - 文字: `text-white`, `text-gray-300`

### 2. 佈局設計
```typescript
const MainLoginLayout = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="max-w-md w-full space-y-8 p-8">
      {/* 品牌標識 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">
          Pennine Industries
        </h1>
        <p className="text-gray-400 mt-2">
          Stock Control System
        </p>
      </div>
      
      {/* 登入表單 */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
        {/* 表單內容 */}
      </div>
    </div>
  </div>
);
```

### 3. 響應式設計
- **桌面**: 居中卡片式佈局
- **平板**: 適中寬度，保持可讀性
- **手機**: 全寬佈局，優化觸控操作

## 資料庫設計

### 1. 用戶表擴展
```sql
-- 擴展現有用戶表或創建新表
CREATE TABLE main_login_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  
  -- 確保只允許 @pennineindustries.com 域名
  CONSTRAINT email_domain_check 
    CHECK (email LIKE '%@pennineindustries.com')
);
```

### 2. 密碼重設 Token 表
```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES main_login_users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API 設計

### 1. 認證 API
```typescript
// app/api/main-auth/login/route.ts
export async function POST(request: Request) {
  const { email, password } = await request.json();
  
  // 驗證域名
  if (!email.endsWith('@pennineindustries.com')) {
    return NextResponse.json(
      { error: '只允許 Pennine Industries 員工登入' },
      { status: 403 }
    );
  }
  
  // 執行登入邏輯
  // ...
}

// app/api/main-auth/register/route.ts
export async function POST(request: Request) {
  const userData = await request.json();
  
  // 驗證註冊數據
  // 創建新用戶
  // ...
}
```

### 2. 密碼管理 API
```typescript
// app/api/main-auth/reset-password/route.ts
export async function POST(request: Request) {
  const { email } = await request.json();
  
  // 生成重設 token
  // 發送重設 email
  // ...
}

// app/api/main-auth/change-password/route.ts
export async function POST(request: Request) {
  const { currentPassword, newPassword } = await request.json();
  
  // 驗證當前密碼
  // 更新新密碼
  // ...
}
```

## 測試策略

### 1. 單元測試
- Email 域名驗證測試
- 密碼強度驗證測試
- 表單驗證邏輯測試

### 2. 整合測試
- 註冊流程測試
- 登入流程測試
- 密碼重設流程測試

### 3. 安全測試
- 域名限制繞過測試
- 密碼強度要求測試
- Session 管理測試

## 部署考慮

### 1. 環境變量
```env
# 新增的環境變量
MAIN_LOGIN_ALLOWED_DOMAIN=@pennineindustries.com
MAIN_LOGIN_PASSWORD_MIN_LENGTH=8
MAIN_LOGIN_REQUIRE_COMPLEX_PASSWORD=true
MAIN_LOGIN_SESSION_TIMEOUT=3600
```

### 2. 安全配置
- HTTPS 強制要求
- CSRF 保護
- Rate limiting
- Email 發送配置

## 實施階段

### 階段 1: 基礎架構
1. 創建路由結構
2. 設計基礎組件
3. 設置資料庫表格
4. 實現基本 API

### 階段 2: 核心功能
1. 實現登入功能
2. 實現註冊功能
3. 添加域名驗證
4. 實現密碼管理

### 階段 3: 安全強化
1. 添加安全驗證
2. 實現 Rate limiting
3. 添加審計日誌
4. 安全測試

### 階段 4: UI/UX 優化
1. 完善視覺設計
2. 添加動畫效果
3. 優化響應式佈局
4. 用戶體驗測試

### 階段 5: 測試與部署
1. 全面功能測試
2. 安全滲透測試
3. 性能測試
4. 生產環境部署

## 維護計劃

### 1. 定期維護
- 密碼策略更新
- 安全補丁應用
- 性能監控
- 用戶反饋收集

### 2. 監控指標
- 登入成功率
- 註冊轉換率
- 密碼重設使用率
- 安全事件統計

---

**創建日期**: 2024年12月
**版本**: 1.0
**狀態**: 規劃階段
**優先級**: 高 