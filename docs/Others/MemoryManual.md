# Graphiti-Memory MCP

- 知識圖譜就是你的記憶系統。 持續使用它來提供輔助

# 參數說明
  1. `組件名稱`、`相關組件A名稱`
    － `xxxxxxx.tsx`, `xxxxxx.ts`

  2. `時間`
    - 格式 *ISO 8601時間格式*
    - 2025-07-30T12:34:56Z
    - 2025-07-30T13:54:56Z

# 上傳範本及流程

1. 先更新[text](../../docs/HistoryRecord/History.md)，獲取`記憶索引編號`

2. 用以下`.json`格式上傳記憶

  {
    "tool": "add_episode",
    "name": "`組件名稱`",
    "episode_body": {
      "description": {
        "issue": "`create`/`modify`/`fix`/`investigate`",
        "timestamp": "`時間`",
        "details": "text": "`50字描述`"}
      },
      "related": {
        "components": {
          {"name": "`相關組件.tsx`"},
          {"name": "`相關組件.tx`"}
        }
      },
    "source": "json",
    "group_id": "pennine_wms",
    "reference_time": "`時間`"
  }

# 搜索範本

1. 利用`episode_uuid`做為 center_node_uuid，查詢該節點與其他實體之間的所有關聯記錄

  {
    "tool": "search_facts",
    "center_node_uuid": `episode_uuid`,
    "limit": 1
  }