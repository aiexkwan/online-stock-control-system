# 用戶聊天功能計劃

## 1. 功能概述

### 1.1 核心功能
- **一對一聊天**: 用戶之間嘅私人對話
- **群組聊天**: 多人參與嘅群組討論
- **實時通訊**: 基於 WebSocket 嘅即時訊息傳遞
- **訊息歷史**: 持久化儲存同檢索聊天記錄
- **用戶狀態**: 在線/離線/忙碌狀態顯示
- **訊息通知**: 新訊息提醒功能

### 1.2 進階功能
- **圖片上傳/下載**: 支援聊天中直接上傳、預覽同下載圖片
- **檔案分享**: 支援上傳同下載各類檔案（PDF、DOC、ZIP等）
- **訊息搜尋**: 搜尋聊天記錄
- **表情回應**: 對訊息添加表情反應
- **已讀回執**: 顯示訊息已讀狀態
- **@提及**: 群組中提及特定用戶
- **訊息編輯**: 編輯已發送訊息

## 2. 技術架構

### 2.1 前端技術
- **框架**: Next.js 14 (App Router)
- **UI 組件**: shadcn/ui + Tailwind CSS
- **狀態管理**: Zustand
- **實時通訊**: Supabase Realtime
- **日期處理**: date-fns
- **檔案處理**: react-dropzone + file-type
- **圖片預覽**: next/image + lightbox

### 2.2 後端技術
- **數據庫**: Supabase (PostgreSQL)
- **實時通訊**: Supabase Realtime Channels
- **認證**: Supabase Auth
- **檔案儲存**: Supabase Storage

### 2.3 架構圖
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js App   │ <-> │ Supabase Realtime│ <-> │  PostgreSQL DB  │
│   (Chat UI)     │     │   (WebSocket)    │     │ (Message Store) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         ↓                                                  ↑
         └──────────────────────────────────────────────────┘
                        Supabase Client
```

## 3. 數據庫設計

### 3.1 核心數據表

#### chat_conversations（對話表）
```sql
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'group')),
  name VARCHAR(255), -- 群組名稱，一對一可為 NULL
  description TEXT, -- 群組描述
  avatar_url TEXT, -- 群組頭像
  created_by INTEGER REFERENCES data_id(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  is_active BOOLEAN DEFAULT true
);
```

#### chat_participants（參與者表）
```sql
CREATE TABLE chat_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES data_id(id),
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  last_read_at TIMESTAMP WITH TIME ZONE,
  is_muted BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(conversation_id, user_id)
);
```

#### chat_messages（訊息表）
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES data_id(id),
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  metadata JSONB, -- 儲存檔案資訊、@提及等
  file_url TEXT, -- Supabase Storage 檔案 URL
  file_name VARCHAR(255), -- 原始檔案名稱
  file_size BIGINT, -- 檔案大小（bytes）
  file_type VARCHAR(100), -- MIME 類型
  thumbnail_url TEXT, -- 圖片縮圖 URL（僅圖片類型）
  reply_to UUID REFERENCES chat_messages(id), -- 回覆訊息
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false
);
```

#### chat_reactions（表情反應表）
```sql
CREATE TABLE chat_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES data_id(id),
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(message_id, user_id, emoji)
);
```

#### chat_read_receipts（已讀回執表）
```sql
CREATE TABLE chat_read_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES data_id(id),
  read_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(message_id, user_id)
);
```

#### user_presence（用戶狀態表）
```sql
CREATE TABLE user_presence (
  user_id INTEGER PRIMARY KEY REFERENCES data_id(id),
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  status_message TEXT
);
```

### 3.2 檔案儲存桶設定 (Supabase Storage)
```sql
-- 建立聊天檔案儲存桶
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', false);

-- 設定 RLS 政策
CREATE POLICY "Users can upload files to their conversations" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view files from their conversations" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-files' AND
    EXISTS (
      SELECT 1 FROM chat_messages cm
      JOIN chat_participants cp ON cm.conversation_id = cp.conversation_id
      WHERE cm.file_url LIKE '%' || name || '%'
      AND cp.user_id = auth.uid()
      AND cp.is_active = true
    )
  );
```

### 3.3 索引優化
```sql
-- 優化查詢性能
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id, created_at DESC);
CREATE INDEX idx_chat_participants_user ON chat_participants(user_id, is_active);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_read_receipts_user ON chat_read_receipts(user_id);
CREATE INDEX idx_chat_messages_file_type ON chat_messages(message_type, created_at DESC);
```

### 3.4 RLS (Row Level Security) 政策
```sql
-- 用戶只能查看自己參與嘅對話
CREATE POLICY "Users can view their conversations" ON chat_conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE conversation_id = chat_conversations.id
      AND user_id = auth.uid()
      AND is_active = true
    )
  );

-- 用戶只能在自己參與嘅對話中發送訊息
CREATE POLICY "Users can send messages in their conversations" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE conversation_id = chat_messages.conversation_id
      AND user_id = auth.uid()
      AND is_active = true
    )
  );
```

## 4. 功能模組設計

### 4.1 聊天列表模組
- **功能**: 顯示所有對話列表
- **排序**: 按最新訊息時間排序
- **顯示資訊**:
  - 對話名稱/對方用戶名
  - 最後一條訊息預覽
  - 未讀訊息數量
  - 最後訊息時間

### 4.2 聊天視窗模組
- **訊息顯示區**:
  - 時間分組顯示
  - 支援無限滾動加載歷史訊息
  - 顯示發送者資訊同頭像
  - 圖片訊息內嵌預覽
  - 檔案訊息顯示檔案名稱、大小同下載按鈕
  - 點擊圖片放大檢視（lightbox 效果）
- **訊息輸入區**:
  - 文字輸入框
  - 表情選擇器
  - 圖片上傳按鈕（支援拖拽）
  - 檔案上傳按鈕
  - 上傳進度顯示
  - 發送按鈕

### 4.3 用戶/群組管理模組
- **一對一聊天**: 搜尋用戶、開始對話
- **群組管理**:
  - 創建群組
  - 添加/移除成員
  - 修改群組資訊
  - 管理員權限設定

### 4.4 檔案上傳/下載模組
- **檔案上傳**:
  - 支援多種檔案格式（圖片、PDF、DOC、ZIP等）
  - 拖拽上傳介面
  - 檔案大小限制（最大50MB）
  - 上傳進度顯示
  - 圖片自動壓縮同縮圖生成
- **檔案下載**:
  - 安全下載連結生成
  - 下載權限驗證
  - 下載進度顯示
  - 圖片預覽功能

### 4.5 通知模組
- **桌面通知**: 使用 Web Notification API
- **應用內通知**: 未讀訊息數顯示
- **聲音提醒**: 新訊息聲音提示

## 5. 實施計劃

### Phase 1: 基礎建設（第1-2週）
1. **數據庫設計實施**
   - 建立所有數據表
   - 設置 RLS 政策
   - 創建索引

2. **基礎 UI 框架**
   - 聊天列表組件
   - 聊天視窗組件
   - 訊息輸入組件

3. **Supabase Realtime 集成**
   - 設置實時訂閱
   - 訊息發送/接收處理

### Phase 2: 核心功能（第3-4週）
1. **一對一聊天**
   - 建立對話
   - 發送/接收訊息
   - 訊息歷史加載

2. **群組聊天**
   - 建立群組
   - 成員管理
   - 群組訊息功能

3. **用戶狀態**
   - 實時狀態更新
   - 最後上線時間

### Phase 3: 檔案分享功能（第5-6週）
1. **圖片上傳功能**
   - 實施 react-dropzone 拖拽上傳
   - 圖片壓縮同縮圖生成
   - 上傳進度條顯示
   - 圖片預覽同 lightbox 效果

2. **檔案上傳/下載**
   - 多格式檔案支援（PDF、DOC、ZIP等）
   - Supabase Storage 整合
   - 檔案權限驗證
   - 安全下載連結生成

3. **訊息互動功能**
   - 訊息搜尋
   - @提及功能
   - 訊息編輯刪除

4. **通知系統**
   - 桌面通知
   - 未讀訊息計數

### Phase 4: 優化同測試（第7週）
1. **性能優化**
   - 訊息分頁加載
   - 圖片懶加載
   - 緩存優化

2. **用戶體驗優化**
   - 載入動畫
   - 錯誤處理
   - 響應式設計

## 6. API 設計

### 6.1 RESTful API
```typescript
// 對話相關
GET    /api/chat/conversations              // 獲取對話列表
POST   /api/chat/conversations              // 建立新對話
GET    /api/chat/conversations/:id          // 獲取對話詳情
PUT    /api/chat/conversations/:id          // 更新對話資訊
DELETE /api/chat/conversations/:id          // 刪除對話

// 訊息相關
GET    /api/chat/conversations/:id/messages // 獲取訊息列表
POST   /api/chat/conversations/:id/messages // 發送訊息
PUT    /api/chat/messages/:id               // 編輯訊息
DELETE /api/chat/messages/:id               // 刪除訊息

// 檔案上傳/下載相關
POST   /api/chat/upload                     // 上傳檔案到 Supabase Storage
GET    /api/chat/download/:fileId           // 生成安全下載連結
POST   /api/chat/messages/file              // 發送檔案訊息
GET    /api/chat/files/:conversationId      // 獲取對話中所有檔案

// 參與者相關
GET    /api/chat/conversations/:id/participants // 獲取參與者列表
POST   /api/chat/conversations/:id/participants // 添加參與者
DELETE /api/chat/conversations/:id/participants/:userId // 移除參與者
```

### 6.2 Realtime Events
```typescript
// 訂閱頻道
channel: `chat:${conversationId}`

// 事件類型
- new_message      // 新訊息
- new_file_message // 新檔案訊息
- message_updated  // 訊息更新
- message_deleted  // 訊息刪除
- file_uploaded    // 檔案上傳完成
- user_typing      // 用戶輸入中
- user_joined      // 用戶加入
- user_left        // 用戶離開
- presence_updated // 用戶狀態更新
```

## 7. 安全考慮

### 7.1 訪問控制
- 用戶只能訪問自己參與嘅對話
- 群組管理員才能修改群組設置
- 訊息發送者才能編輯/刪除自己嘅訊息

### 7.2 數據驗證
- 訊息內容長度限制（最大5000字符）
- 檔案大小限制（最大50MB）
- 檔案類型白名單驗證
- 圖片檔案病毒掃描
- XSS 防護（訊息內容清理）
- 檔案名稱過濾（防止路徑注入）

### 7.3 隱私保護
- 端到端加密（可選）
- 訊息刪除同清理機制
- 檔案自動清理（刪除訊息時同步刪除檔案）
- 用戶數據導出功能
- 檔案訪問日誌記錄

## 8. 性能優化策略

### 8.1 前端優化
- 虛擬滾動（大量訊息）
- 訊息分頁加載
- 圖片懶加載同壓縮
- 離線訊息緩存
- 檔案上傳分塊處理（大檔案）
- 圖片縮圖預載入
- 檔案預覽快取

### 8.2 後端優化
- 數據庫查詢優化
- 訊息批量處理
- 使用 CDN 加速檔案下載
- WebSocket 連接池
- 檔案儲存優化（壓縮、去重）
- 圖片自動縮圖生成
- 檔案過期清理機制

## 9. 監控同維護

### 9.1 監控指標
- 訊息發送成功率
- 檔案上傳成功率
- 實時連接穩定性
- API 響應時間
- 檔案下載速度
- 儲存空間使用量
- 用戶活躍度

### 9.2 維護計劃
- 訊息備份策略
- 檔案備份同清理
- 錯誤日誌收集
- 檔案掃描同安全檢查
- 用戶反饋收集

## 10. 未來擴展

### 10.1 短期擴展
- 語音/視頻通話
- 翻譯功能
- 訊息加密
- AI 智能回覆

### 10.2 長期擴展
- 移動應用（React Native）
- 桌面應用（Electron）
- API 開放平台

## 11. 預算估算

### 11.1 Supabase 費用
- 數據庫儲存: ~10GB/月
- 實時連接: ~1000 並發
- 檔案儲存: ~100GB（包含聊天檔案）
- 檔案傳輸: ~500GB/月
- 預計費用: $50-100/月

### 11.2 開發時間
- 開發時間: 7週
- 測試時間: 1週
- 總計: 8週（約2個月）

## 12. 風險評估

### 12.1 技術風險
- WebSocket 連接不穩定
- 大量訊息時性能問題
- 檔案上傳失敗/中斷處理
- 大檔案儲存成本
- 惡意檔案上傳安全風險

### 12.2 業務風險
- 用戶接受度
- 數據合規性
- 系統擴展性

## 13. 檔案上傳/下載技術實現細節

### 13.1 檔案上傳流程
```typescript
// 1. 前端拖拽/選擇檔案
const handleFileUpload = async (files: File[]) => {
  for (const file of files) {
    // 檔案驗證
    if (file.size > 50 * 1024 * 1024) throw new Error('檔案過大');
    
    // 生成唯一檔案名
    const fileName = `${conversationId}/${Date.now()}_${file.name}`;
    
    // 上傳到 Supabase Storage
    const { data, error } = await supabase.storage
      .from('chat-files')
      .upload(fileName, file, {
        onUploadProgress: (progress) => setUploadProgress(progress)
      });
    
    // 生成縮圖（如果是圖片）
    if (file.type.startsWith('image/')) {
      const thumbnail = await generateThumbnail(file);
      await supabase.storage
        .from('chat-files')
        .upload(`${fileName}_thumb`, thumbnail);
    }
    
    // 發送檔案訊息
    await sendFileMessage({
      conversation_id: conversationId,
      file_url: data.path,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      message_type: file.type.startsWith('image/') ? 'image' : 'file'
    });
  }
};
```

### 13.2 檔案下載流程
```typescript
// 生成安全下載連結
const generateDownloadUrl = async (filePath: string) => {
  const { data } = await supabase.storage
    .from('chat-files')
    .createSignedUrl(filePath, 3600); // 1小時有效期
  
  return data.signedUrl;
};

// 下載檔案
const downloadFile = async (message: ChatMessage) => {
  const downloadUrl = await generateDownloadUrl(message.file_url);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = message.file_name;
  link.click();
};
```

### 13.3 圖片預覽組件
```typescript
const ImageMessage = ({ message }: { message: ChatMessage }) => {
  const [showLightbox, setShowLightbox] = useState(false);
  
  return (
    <div className="relative">
      <Image
        src={message.thumbnail_url || message.file_url}
        alt={message.file_name}
        width={200}
        height={150}
        className="rounded-lg cursor-pointer"
        onClick={() => setShowLightbox(true)}
      />
      
      {showLightbox && (
        <Lightbox
          src={message.file_url}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </div>
  );
};
```

## 14. 總結

此聊天系統設計考慮咗完整嘅功能需求、技術架構同實施計劃，特別加強咗檔案上傳/下載功能：

- **完整檔案支援**: 圖片、文檔、壓縮檔等多種格式
- **安全機制**: 檔案類型驗證、大小限制、權限控制
- **用戶體驗**: 拖拽上傳、進度顯示、圖片預覽
- **性能優化**: 圖片壓縮、分塊上傳、CDN 加速

透過分階段開發，可以快速推出 MVP 版本，然後根據用戶反饋持續優化同擴展功能。