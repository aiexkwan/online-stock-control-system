#!/usr/bin/env python3
import json
import sys
import os
from mem0 import Memory

def main():
    try:
        # Parse arguments
        args = json.loads(sys.argv[1])
        
        # Initialize Memory with API key from environment
        config = {
            "llm": {
                "provider": "openai",
                "config": {
                    "model": "gpt-4o-mini",
                    "api_key": os.getenv("OPENAI_API_KEY")
                }
            }
        }
        
        memory = Memory.from_config(config)
        
        # Search memories
        results = memory.search(
            query=args['query'],
            user_id=args.get('user_id'),
            agent_id=args.get('agent_id'),
            session_id=args.get('session_id'),
            limit=args.get('limit', 10)
        )
        
        # Return results
        print(json.dumps({
            "success": True,
            "memories": results
        }))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()