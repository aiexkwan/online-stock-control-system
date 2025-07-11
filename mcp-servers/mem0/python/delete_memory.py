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
        
        # Delete memory
        memory.delete(memory_id=args['memory_id'])
        
        # Return success
        print(json.dumps({
            "success": True,
            "message": f"Memory {args['memory_id']} deleted successfully"
        }))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()