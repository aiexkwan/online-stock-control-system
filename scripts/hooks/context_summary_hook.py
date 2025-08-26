#!/usr/bin/env python3
"""
Context Summary Hook
Wrapper script that calls save_context_hook.py for backward compatibility
"""

import os
import sys
import subprocess

def main():
    """
    Execute the actual save_context_hook.py script
    This provides backward compatibility for the context_summary_hook.py filename
    """
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    save_hook_path = os.path.join(script_dir, 'save_context_hook.py')
    
    # Check if save_context_hook.py exists
    if not os.path.exists(save_hook_path):
        print(f"Error: save_context_hook.py not found at {save_hook_path}", file=sys.stderr)
        sys.exit(1)
    
    # Forward all input to the actual hook script
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        
        # Execute save_context_hook.py with the same input
        result = subprocess.run(
            [sys.executable, save_hook_path],
            input=input_data,
            text=True,
            capture_output=True
        )
        
        # Forward output
        if result.stdout:
            print(result.stdout, end='')
        if result.stderr:
            print(result.stderr, end='', file=sys.stderr)
            
        sys.exit(result.returncode)
        
    except Exception as e:
        print(f"Error executing save_context_hook.py: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()