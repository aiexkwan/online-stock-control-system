#!/usr/bin/env python3
"""
Agent 任務完成 Hook
當任何 agent 完成任務時自動執行記憶寫入
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional, Any

# 載入 .env 文件
try:
    from dotenv import load_dotenv
    project_root = Path(__file__).parent.parent.parent
    env_path = project_root / '.env'
    load_dotenv(env_path)
except ImportError:
    print("請安裝 python-dotenv: pip install python-dotenv")
    sys.exit(1)

import logging

# 設定 logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AgentTaskCompletionHook:
    """Agent 任務完成 Hook 處理器"""
    
    def __init__(self):
        self.write_memory_script = Path(__file__).parent / "write_momory.py"
        self.supported_agents = [
            "general-purpose",
            "devops-troubleshooter", 
            "frontend-developer",
            "backend-architect",
            "database-optimizer",
            "security-auditor",
            "test-automator",
            "debugger",
            "performance-engineer",
            "legacy-modernizer",
            "error-detective",
            "deployment-engineer",
            "incident-responder",
            "context-manager",
            "architect-reviewer",
            "ai-engineer",
            "code-reviewer",
            "typescript-pro",
            "eslint-fixer",
            "build-error-resolver",
            "ui-ux-designer",
            "data-architect",
            "data-analyst",
            "docs-architect",
            "api-documenter",
            "ml-engineer",
            "prompt-engineer",
            "reference-builder"
        ]
    
    def extract_task_data(self, agent_output: str, agent_type: str) -> Dict[str, Any]:
        """
        從 agent 輸出中提取任務數據
        
        Args:
            agent_output: Agent 的輸出內容
            agent_type: Agent 類型
            
        Returns:
            格式化的任務數據
        """
        task_data = {
            "agent_id": agent_type,
            "task_type": self._determine_task_type(agent_type),
            "task_timestamp": datetime.utcnow().isoformat(),
            "context_content": self._format_context(agent_output, agent_type),
            "raw_data": {
                "agent_type": agent_type,
                "output": agent_output[:5000] if len(agent_output) > 5000 else agent_output,  # 限制大小
                "completion_time": datetime.utcnow().isoformat()
            },
            "tags": self._generate_tags(agent_type, agent_output)
        }
        
        return task_data
    
    def _determine_task_type(self, agent_type: str) -> str:
        """根據 agent 類型決定任務類型"""
        task_type_mapping = {
            "frontend-developer": "frontend_development",
            "backend-architect": "backend_architecture",
            "database-optimizer": "database_optimization",
            "security-auditor": "security_audit",
            "test-automator": "test_automation",
            "debugger": "debugging",
            "performance-engineer": "performance_optimization",
            "legacy-modernizer": "code_modernization",
            "error-detective": "error_investigation",
            "deployment-engineer": "deployment",
            "code-reviewer": "code_review",
            "typescript-pro": "typescript_development",
            "ai-engineer": "ai_integration",
            "data-architect": "data_architecture",
            "ui-ux-designer": "ui_ux_design"
        }
        
        return task_type_mapping.get(agent_type, "general_task")
    
    def _format_context(self, output: str, agent_type: str) -> str:
        """格式化上下文內容"""
        context_lines = [
            f"AGENT_TYPE: {agent_type}",
            f"COMPLETION_TIME: {datetime.utcnow().isoformat()}",
            "TASK_OUTPUT:",
            output[:2000] if len(output) > 2000 else output  # 限制上下文大小
        ]
        
        return "\n".join(context_lines)
    
    def _generate_tags(self, agent_type: str, output: str) -> list:
        """生成相關標籤"""
        tags = [agent_type]
        
        # 根據 agent 類型添加相關標籤
        if "frontend" in agent_type:
            tags.extend(["frontend", "react", "ui"])
        elif "backend" in agent_type:
            tags.extend(["backend", "api", "server"])
        elif "database" in agent_type:
            tags.extend(["database", "sql", "optimization"])
        elif "security" in agent_type:
            tags.extend(["security", "audit", "vulnerability"])
        elif "test" in agent_type:
            tags.extend(["testing", "qa", "automation"])
        elif "performance" in agent_type:
            tags.extend(["performance", "optimization", "metrics"])
        elif "deployment" in agent_type:
            tags.extend(["deployment", "ci-cd", "devops"])
        
        # 根據輸出內容添加標籤
        output_lower = output.lower()
        if "error" in output_lower or "bug" in output_lower:
            tags.append("bug_fix")
        if "refactor" in output_lower:
            tags.append("refactoring")
        if "optimize" in output_lower or "performance" in output_lower:
            tags.append("optimization")
        if "feature" in output_lower:
            tags.append("feature")
        
        return list(set(tags))  # 去重
    
    def save_to_memory(self, task_data: Dict[str, Any]) -> bool:
        """
        調用記憶寫入腳本保存任務數據
        
        Args:
            task_data: 任務數據
            
        Returns:
            是否成功保存
        """
        try:
            # 準備寫入記憶系統的數據
            memory_input = json.dumps(task_data, ensure_ascii=False)
            
            # 調用 write_momory.py 腳本
            result = subprocess.run(
                [sys.executable, str(self.write_memory_script)],
                input=memory_input,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                logger.info(f"成功保存 {task_data['agent_id']} 的任務記憶")
                return True
            else:
                logger.error(f"保存記憶失敗: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            logger.error("記憶寫入超時")
            return False
        except Exception as e:
            logger.error(f"保存記憶時發生錯誤: {e}")
            return False
    
    def process_agent_completion(self, agent_type: str, agent_output: str) -> bool:
        """
        處理 agent 任務完成事件
        
        Args:
            agent_type: Agent 類型
            agent_output: Agent 輸出
            
        Returns:
            是否成功處理
        """
        try:
            # 檢查是否為支援的 agent
            if agent_type not in self.supported_agents:
                logger.warning(f"未支援的 agent 類型: {agent_type}")
                return False
            
            logger.info(f"處理 {agent_type} 的任務完成")
            
            # 提取任務數據
            task_data = self.extract_task_data(agent_output, agent_type)
            
            # 保存到記憶系統
            success = self.save_to_memory(task_data)
            
            if success:
                logger.info(f"✅ {agent_type} 的任務記憶已成功保存")
            else:
                logger.error(f"❌ {agent_type} 的任務記憶保存失敗")
            
            return success
            
        except Exception as e:
            logger.error(f"處理 agent 完成事件時發生錯誤: {e}")
            return False

def main():
    """
    主函數 - 可從命令行或其他腳本調用
    
    使用方式:
    1. 從命令行: python agent_task_completion_hook.py <agent_type> <output_file>
    2. 從其他腳本: 導入並調用 process_agent_completion
    """
    if len(sys.argv) < 2:
        print("使用方式: python agent_task_completion_hook.py <agent_type> [output_file]")
        print("或從 stdin 讀取: echo 'agent output' | python agent_task_completion_hook.py <agent_type>")
        sys.exit(1)
    
    agent_type = sys.argv[1]
    
    # 讀取 agent 輸出
    if len(sys.argv) >= 3:
        # 從文件讀取
        output_file = sys.argv[2]
        try:
            with open(output_file, 'r', encoding='utf-8') as f:
                agent_output = f.read()
        except Exception as e:
            logger.error(f"無法讀取輸出文件: {e}")
            sys.exit(1)
    else:
        # 從 stdin 讀取
        agent_output = sys.stdin.read()
    
    # 處理任務完成
    hook = AgentTaskCompletionHook()
    success = hook.process_agent_completion(agent_type, agent_output)
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()