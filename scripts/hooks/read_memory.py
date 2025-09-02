#!/usr/bin/env python3
"""
AI Agents 長期記憶讀取腳本
用於從Supabase context_history表格檢索相關歷史記憶
"""

import os
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
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

class MemoryReader:
    def __init__(self, supabase_url: str, supabase_key: str, openai_api_key: str):
        """
        初始化記憶讀取器
        
        Args:
            supabase_url: Supabase項目URL
            supabase_key: Supabase API密鑰
            openai_api_key: OpenAI API密鑰
        """
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.openai_client = openai.OpenAI(api_key=openai_api_key)
    
    def generate_query_embedding(self, query: str) -> List[float]:
        """
        為查詢生成embedding向量
        
        Args:
            query: 查詢字符串
            
        Returns:
            embedding向量
        """
        try:
            response = self.openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=query
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"生成查詢embedding失敗: {e}")
            raise
    
    def search_similar_memories(
        self, 
        query: str, 
        limit: int = 10,
        similarity_threshold: float = 0.7,
        agent_id: Optional[str] = None,
        task_types: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
        time_range_days: Optional[int] = None
    ) -> List[Dict]:
        """
        搜索相似的記憶
        
        Args:
            query: 搜索查詢
            limit: 返回結果數量限制
            similarity_threshold: 相似度閾值 (0-1)
            agent_id: 特定agent ID過濾
            task_types: 任務類型過濾
            tags: 標籤過濾
            time_range_days: 時間範圍(天數)
            
        Returns:
            相似記憶列表
        """
        try:
            # 生成查詢embedding
            query_embedding = self.generate_query_embedding(query)
            
            # 構建RPC調用 (需要在Supabase中創建向量搜索函數)
            rpc_params = {
                'query_embedding': query_embedding,
                'match_threshold': similarity_threshold,
                'match_count': limit
            }
            
            # 添加過濾條件
            if agent_id:
                rpc_params['filter_agent_id'] = agent_id
            if task_types:
                rpc_params['filter_task_types'] = task_types
            if tags:
                rpc_params['filter_tags'] = tags
            if time_range_days:
                cutoff_date = (datetime.utcnow() - timedelta(days=time_range_days)).isoformat()
                rpc_params['filter_after_date'] = cutoff_date
            
            # 執行向量搜索
            result = self.supabase.rpc('match_memories', rpc_params).execute()
            
            if result.data:
                logger.info(f"找到 {len(result.data)} 條相關記憶")
                return result.data
            else:
                logger.info("未找到相關記憶")
                return []
                
        except Exception as e:
            logger.error(f"搜索記憶時出錯: {e}")
            # 如果向量搜索失敗，嘗試文本搜索作為後備
            return self._fallback_text_search(query, limit, agent_id, task_types, tags, time_range_days)
    
    def _fallback_text_search(
        self,
        query: str,
        limit: int,
        agent_id: Optional[str] = None,
        task_types: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
        time_range_days: Optional[int] = None
    ) -> List[Dict]:
        """
        後備文本搜索方法
        """
        try:
            query_builder = self.supabase.table('context_history').select('*')
            
            # 添加文本搜索
            query_builder = query_builder.text_search('context_content', query)
            
            # 添加過濾條件
            if agent_id:
                query_builder = query_builder.eq('agent_id', agent_id)
            
            if task_types:
                query_builder = query_builder.in_('task_type', task_types)
            
            if time_range_days:
                cutoff_date = (datetime.utcnow() - timedelta(days=time_range_days)).isoformat()
                query_builder = query_builder.gte('task_timestamp', cutoff_date)
            
            # 執行查詢
            result = query_builder.limit(limit).execute()
            
            logger.info(f"後備搜索找到 {len(result.data) if result.data else 0} 條記錄")
            return result.data or []
            
        except Exception as e:
            logger.error(f"後備搜索失敗: {e}")
            return []
    
    def get_memories_by_task_type(self, task_type: str, limit: int = 20) -> List[Dict]:
        """
        根據任務類型獲取記憶
        
        Args:
            task_type: 任務類型
            limit: 結果限制
            
        Returns:
            記憶列表
        """
        try:
            result = self.supabase.table('context_history')\
                .select('*')\
                .eq('task_type', task_type)\
                .order('task_timestamp', desc=True)\
                .limit(limit)\
                .execute()
            
            return result.data or []
        except Exception as e:
            logger.error(f"按任務類型搜索失敗: {e}")
            return []
    
    def get_recent_memories(self, agent_id: str, hours: int = 24, limit: int = 50) -> List[Dict]:
        """
        獲取最近的記憶
        
        Args:
            agent_id: Agent ID
            hours: 時間範圍(小時)
            limit: 結果限制
            
        Returns:
            最近記憶列表
        """
        try:
            cutoff_time = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
            
            result = self.supabase.table('context_history')\
                .select('*')\
                .eq('agent_id', agent_id)\
                .gte('task_timestamp', cutoff_time)\
                .order('task_timestamp', desc=True)\
                .limit(limit)\
                .execute()
            
            return result.data or []
        except Exception as e:
            logger.error(f"獲取最近記憶失敗: {e}")
            return []
    
    def format_memory_for_context(self, memories: List[Dict], include_raw_data: bool = False) -> str:
        """
        將記憶格式化為可用於AI context的字符串
        
        Args:
            memories: 記憶列表
            include_raw_data: 是否包含原始數據
            
        Returns:
            格式化的context字符串
        """
        if not memories:
            return "RELEVANT_MEMORIES: None found for this context."
        
        context_parts = ["RELEVANT_HISTORICAL_CONTEXT:"]
        
        for i, memory in enumerate(memories, 1):
            context_parts.append(f"\n--- MEMORY_{i} ---")
            context_parts.append(f"TIMESTAMP: {memory.get('task_timestamp', 'unknown')}")
            context_parts.append(f"TASK_TYPE: {memory.get('task_type', 'unknown')}")
            context_parts.append(f"AGENT_ID: {memory.get('agent_id', 'unknown')}")
            
            # 主要內容
            context_content = memory.get('context_content', '')
            context_parts.append("CONTEXT:")
            context_parts.append(context_content)
            
            # 標籤
            if memory.get('tags'):
                context_parts.append(f"TAGS: {', '.join(memory['tags'])}")
            
            # 包含原始數據(如果需要)
            if include_raw_data and memory.get('raw_data'):
                try:
                    raw_data = json.loads(memory['raw_data'])
                    context_parts.append("RAW_DATA:")
                    context_parts.append(json.dumps(raw_data, indent=2, ensure_ascii=False))
                except:
                    pass
        
        return "\n".join(context_parts)
    
    def get_contextual_memories(
        self,
        current_task: str,
        agent_id: str,
        max_memories: int = 5,
        include_recent: bool = True,
        recent_hours: int = 24
    ) -> Tuple[str, List[Dict]]:
        """
        獲取與當前任務相關的上下文記憶
        
        Args:
            current_task: 當前任務描述
            agent_id: Agent ID
            max_memories: 最大記憶數量
            include_recent: 是否包含最近記憶
            recent_hours: 最近記憶時間範圍
            
        Returns:
            格式化的context字符串和原始記憶數據
        """
        all_memories = []
        
        # 搜索相關記憶
        similar_memories = self.search_similar_memories(
            current_task,
            limit=max_memories,
            agent_id=agent_id
        )
        all_memories.extend(similar_memories)
        
        # 如果需要，添加最近記憶
        if include_recent:
            recent_memories = self.get_recent_memories(
                agent_id,
                hours=recent_hours,
                limit=max_memories
            )
            
            # 避免重複(基於ID)
            existing_ids = {mem.get('id') for mem in all_memories}
            for mem in recent_memories:
                if mem.get('id') not in existing_ids:
                    all_memories.append(mem)
        
        # 限制總數量並按時間排序
        all_memories = sorted(
            all_memories[:max_memories * 2],
            key=lambda x: x.get('task_timestamp', ''),
            reverse=True
        )[:max_memories]
        
        # 格式化為context
        formatted_context = self.format_memory_for_context(all_memories)
        
        return formatted_context, all_memories

def create_supabase_function():
    """
    需要在Supabase中創建的向量搜索函數SQL
    """
    sql_function = """
    create or replace function match_memories(
      query_embedding vector(1536),
      match_threshold float,
      match_count int,
      filter_agent_id text default null,
      filter_task_types text[] default null,
      filter_tags text[] default null,
      filter_after_date timestamp default null
    )
    returns table (
      id bigint,
      agent_id text,
      task_type text,
      context_content text,
      raw_data jsonb,
      timestamp timestamp,
      tags text[],
      similarity float
    )
    language sql stable
    as $$
    select
      ch.id,
      ch.agent_id,
      ch.task_type,
      ch.context_content,
      ch.raw_data,
      ch.timestamp,
      ch.tags,
      1 - (ch.embedding <=> query_embedding) as similarity
    from context_history ch
    where 
      (1 - (ch.embedding <=> query_embedding)) > match_threshold
      and (filter_agent_id is null or ch.agent_id = filter_agent_id)
      and (filter_task_types is null or ch.task_type = any(filter_task_types))
      and (filter_tags is null or ch.tags && filter_tags)
      and (filter_after_date is null or ch.timestamp >= filter_after_date)
    order by similarity desc
    limit match_count;
    $$;
    """
    return sql_function

def main():
    """
    使用範例
    """
    # 從環境變數獲取配置
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY') 
    openai_api_key = os.getenv('OPENAI_API_KEY')
    
    if not all([supabase_url, supabase_key, openai_api_key]):
        logger.error("請設定所需的環境變數: SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY")
        return
    
    # 創建記憶讀取器
    reader = MemoryReader(supabase_url, supabase_key, openai_api_key)
    
    # 範例查詢
    current_task = "我需要優化數據庫查詢性能，特別是用戶認證相關的查詢"
    
    # 獲取相關上下文
    context, raw_memories = reader.get_contextual_memories(
        current_task,
        agent_id="refactor_agent",
        max_memories=5
    )
    
    print("=== 相關歷史上下文 ===")
    print(context)
    print(f"\n找到 {len(raw_memories)} 條相關記憶")
    
    # 顯示Supabase函數創建SQL
    print("\n=== 需要在Supabase中執行的SQL函數 ===")
    print(create_supabase_function())

if __name__ == "__main__":
    main()