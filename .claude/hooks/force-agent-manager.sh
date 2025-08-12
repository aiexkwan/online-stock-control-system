#!/bin/bash
# ~/.claude/hooks/force-agent-manager.sh

# 每次都強制提醒
cat << 'EOF' >&2
╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                          MANDATORY DELEGATION PROTOCOL ACTIVE                                        ║
╠══════════════════════════════════════════════════════════════════════════════════════════════════════╣
║  !! STOP: Do NOT process this request directly                                                       ║
║                                                                                                      ║
║  Required Action:                                                                                    ║
║  1. Invoke agent-manager IMMEDIATELY                                                                 ║
║  2. agent-manager will analyze complexity                                                            ║
║  3. agent-manager will delegate to specialists                                                       ║
║  4. agent-manager assigns [sub-agents](../agents/README.md) for all broken down tasks                ║
║                                                                                                      ║
║  This ensures:                                                                                       ║
║  • Optimal task distribution                                                                         ║
║  • Parallel processing where possible                                                                ║
║  • Appropriate expertise for each subtask                                                            ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝
EOF

# 可選：記錄原始請求
if [ -n "$CLAUDE_USER_PROMPT" ]; then
    echo "[Original Request]: $CLAUDE_USER_PROMPT" >&2
    echo "[Next Step]: Invoke [Agent-Manager](../agents/agent-manager.md) for analysis" >&2
fi

exit 0