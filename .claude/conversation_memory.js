const MemoryClient = require('mem0ai').default;

const apiKey = 'm0-S0JE8FcAYEgnJrCosoLeXZOync7kPcM01kACRN7l';
const client = new MemoryClient({ apiKey });

// 儲存對話記憶
async function saveConversation(messages, userId = 'kwanchuncheong') {
  try {
    await client.add(messages, { user_id: userId });
    console.log('對話已儲存到 mem0');
  } catch (error) {
    console.error('儲存對話時出錯:', error);
  }
}

// 搜尋相關記憶
async function searchMemory(query, userId = 'kwanchuncheong') {
  try {
    const result = await client.search(query, { user_id: userId });
    return result.results || [];
  } catch (error) {
    console.error('搜尋記憶時出錯:', error);
    return [];
  }
}

// 獲取所有記憶
async function getAllMemories(userId = 'kwanchuncheong') {
  try {
    const result = await client.getAll({ user_id: userId });
    return result.results || [];
  } catch (error) {
    console.error('獲取記憶時出錯:', error);
    return [];
  }
}

// 儲存今天的對話記錄
const todayConversation = [
  {
    role: "user",
    content: "繼續優化 /dashboard/custom，將 admin 頁面功能轉換成 widgets"
  },
  {
    role: "assistant", 
    content: "已成功將所有 admin 功能轉換成 widgets，包括 Void Pallet、View History、Database Update、Document Upload、Analytics Dashboard 和 Reports"
  },
  {
    role: "user",
    content: "優化 widget 選擇體驗，改為分步驟顯示"
  },
  {
    role: "assistant",
    content: "創建了新的 WidgetSelectDialog 組件，提供更好的用戶體驗"
  },
  {
    role: "user",
    content: "將 dashboard 設定從 localStorage 改為儲存在 Supabase"
  },
  {
    role: "assistant",
    content: "已實現雲端同步功能，創建了 user_dashboard_settings 表和相關服務"
  }
];

// 執行儲存
saveConversation(todayConversation);

module.exports = {
  saveConversation,
  searchMemory,
  getAllMemories
};