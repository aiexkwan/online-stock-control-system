#!/usr/bin/env python3
"""
AI Agents 長期記憶寫入腳本
用於將task執行結果儲存到Supabase context_history表格
"""

import os
import sys
import json
import hashlib
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path

# 載入 .env 文件
try:
    from dotenv import load_dotenv
    # 獲取專案根目錄的 .env 文件路徑
    project_root = Path(__file__).parent.parent.parent
    env_path = project_root / '.env'
    load_dotenv(env_path)
except ImportError:
    print("請安裝 python-dotenv: pip install python-dotenv")
    sys.exit(1)

import openai
from supabase import create_client, Client
import logging

# 設定logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MemoryWriter:
    def __init__(self, supabase_url: str, supabase_key: str, openai_api_key: str):
        """
        初始化記憶寫入器
        
        Args:
            supabase_url: Supabase項目URL
            supabase_key: Supabase API密鑰
            openai_api_key: OpenAI API密鑰
        """
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.openai_client = openai.OpenAI(api_key=openai_api_key)
        
    def generate_embedding(self, text: str) -> List[float]:
        """
        使用OpenAI生成文本embedding
        
        Args:
            text: 需要生成embedding的文本
            
        Returns:
            embedding向量
        """
        try:
            response = self.openai_client.embeddings.create(
                model="text-embedding-3-small",  # 或使用 text-embedding-3-large 獲得更好效果
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"生成embedding失敗: {e}")
            raise
    
    def create_task_context(self, task_data: Dict) -> str:
        """
        將task數據格式化為適合AI agents理解的上下文字符串
        
        Args:
            task_data: 包含task所有相關信息的字典
            
        Returns:
            格式化後的上下文字符串
        """
        context_parts = [
            f"TASK_TYPE: {task_data.get('task_type', 'unknown')}",
            f"EXECUTION_REASON: {task_data.get('reason', '')}",
            f"TASK_OBJECTIVE: {task_data.get('objective', '')}",
        ]
        
        # 執行過程
        if 'process_steps' in task_data:
            context_parts.append("EXECUTION_PROCESS:")
            for i, step in enumerate(task_data['process_steps'], 1):
                context_parts.append(f"  STEP_{i}: {step}")
        
        # 執行結果
        if 'results' in task_data:
            context_parts.append(f"EXECUTION_RESULT: {task_data['results']}")
        
        # 執行的動作
        if 'actions_performed' in task_data:
            context_parts.append("ACTIONS_PERFORMED:")
            for action in task_data['actions_performed']:
                context_parts.append(f"  - {action}")
        
        # 修改的檔案
        if 'files_modified' in task_data:
            context_parts.append("FILES_MODIFIED:")
            for file_info in task_data['files_modified']:
                if isinstance(file_info, dict):
                    context_parts.append(f"  - {file_info.get('path', '')}: {file_info.get('operation', '')}")
                else:
                    context_parts.append(f"  - {file_info}")
        
        # 相關資源和依賴
        if 'resources_used' in task_data:
            context_parts.append("RESOURCES_USED:")
            for resource in task_data['resources_used']:
                context_parts.append(f"  - {resource}")
        
        # 錯誤和異常
        if 'errors' in task_data:
            context_parts.append("ERRORS_ENCOUNTERED:")
            for error in task_data['errors']:
                context_parts.append(f"  - {error}")
        
        # 學習點和洞察
        if 'insights' in task_data:
            context_parts.append("INSIGHTS_LEARNED:")
            for insight in task_data['insights']:
                context_parts.append(f"  - {insight}")
        
        # 執行時間信息
        if 'execution_time' in task_data:
            context_parts.append(f"EXECUTION_DURATION: {task_data['execution_time']}")
        
        # 相關標籤
        if 'tags' in task_data:
            context_parts.append(f"TAGS: {', '.join(task_data['tags'])}")
        
        return "\n".join(context_parts)
    
    def generate_content_hash(self, content: str) -> str:
        """
        生成內容的hash值，用於避免重複儲存
        
        Args:
            content: 內容字符串
            
        Returns:
            SHA-256 hash值
        """
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
    
    def save_memory(self, task_data: Dict, agent_id: str = "default_agent") -> bool:
        """
        儲存task記憶到Supabase
        
        Args:
            task_data: task數據字典
            agent_id: AI agent識別符
            
        Returns:
            儲存是否成功
        """
        try:
            # 生成適合AI agents理解的上下文
            context_content = self.create_task_context(task_data)
            
            # 生成embedding
            embedding_vector = self.generate_embedding(context_content)
            
            # 生成內容hash
            content_hash = self.generate_content_hash(context_content)
            
            # 檢查是否已存在相同內容
            existing_check = self.supabase.table('context_history').select('id').eq('content_hash', content_hash).execute()
            if existing_check.data:
                logger.info(f"內容已存在，跳過儲存. Hash: {content_hash}")
                return True
            
            # 準備插入數據
            insert_data = {
                'agent_id': agent_id,
                'task_type': task_data.get('task_type', 'unknown'),
                'context_content': context_content,
                'embedding': embedding_vector,
                'content_hash': content_hash,
                'raw_data': json.dumps(task_data, ensure_ascii=False),
                'task_timestamp': datetime.utcnow().isoformat(),
                'tags': task_data.get('tags', [])
            }
            
            # 插入數據到Supabase
            result = self.supabase.table('context_history').insert(insert_data).execute()
            
            if result.data:
                logger.info(f"記憶儲存成功. ID: {result.data[0]['id']}")
                return True
            else:
                logger.error(f"儲存失敗: {result}")
                return False
                
        except Exception as e:
            logger.error(f"儲存記憶時出錯: {e}")
            return False

def main():
    """
    主函數 - 支援從 stdin 接收輸入或使用範例數據
    """
    # 從環境變數獲取配置
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    openai_api_key = os.getenv('OPENAI_API_KEY')
    
    if not all([supabase_url, supabase_key, openai_api_key]):
        logger.error("請設定所需的環境變數: SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY")
        sys.exit(1)
    
    # 創建記憶寫入器
    writer = MemoryWriter(supabase_url, supabase_key, openai_api_key)
    
    # 檢查是否有 stdin 輸入
    import select
    import sys
    
    # 檢查 stdin 是否有資料（兼容不同平台）
    if sys.stdin.isatty():
        # 沒有 stdin 輸入，使用範例數據
        use_sample = True
    else:
        # 有 stdin 輸入
        use_sample = False
        try:
            input_data = sys.stdin.read()
            if input_data.strip():
                # 解析 JSON 輸入
                task_data = json.loads(input_data)
                agent_id = task_data.get('agent_id', 'default_agent')
                
                # 保存記憶
                result = writer.save_memory(task_data, agent_id)
                if result:
                    print(f"記憶儲存結果: 成功")
                    sys.exit(0)
                else:
                    print(f"記憶儲存結果: 失敗")
                    sys.exit(1)
            else:
                use_sample = True
        except json.JSONDecodeError as e:
            logger.error(f"JSON 解析錯誤: {e}")
            sys.exit(1)
        except Exception as e:
            logger.error(f"處理輸入時發生錯誤: {e}")
            sys.exit(1)
    
    if use_sample:
        # 範例task數據
        sample_task = {
            'task_type': 'code_refactoring',
            'reason': '優化系統性能和代碼可讀性',
            'objective': '重構用戶認證模組',
            'process_steps': [
            '分析現有代碼結構',
            '識別性能瓶頸',
            '設計新的架構',
            '實施重構',
            '測試驗證'
        ],
        'results': '成功將響應時間提升35%，代碼複雜度降低50%',
        'actions_performed': [
            '重構auth.py模組',
            '優化數據庫查詢',
            '添加單元測試',
            '更新API文檔'
        ],
        'files_modified': [
            {'path': '/auth/auth.py', 'operation': '重構'},
            {'path': '/tests/test_auth.py', 'operation': '新增'},
            {'path': '/docs/api.md', 'operation': '更新'}
        ],
        'resources_used': [
            'PostgreSQL數據庫',
            'Redis緩存',
            'JWT認證庫'
        ],
        'execution_time': '2小時30分鐘',
        'tags': ['authentication', 'performance', 'refactoring', 'optimization'],
        'insights': [
            '使用Redis緩存可以顯著提升認證速度',
            '模組化設計提高了代碼維護性'
        ]
    }
    
    # 儲存記憶
    success = writer.save_memory(sample_task, "refactor_agent")
    print(f"記憶儲存結果: {'成功' if success else '失敗'}")

if __name__ == "__main__":
    main()