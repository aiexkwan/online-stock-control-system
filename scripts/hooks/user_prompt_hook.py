import sys
import json
import argparse
import datetime
import os

# Add lib to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'lib'))
from context_utils import init_clients, extract_core_query, generate_embedding, find_similar_contexts

def main():
    """
    This hook is triggered on UserPromptSubmit. It finds relevant context from past conversations
    based on the user's prompt and injects it into the context for the AI.
    """
    parser = argparse.ArgumentParser(description="Find relevant past conversations from a user prompt.")
    parser.add_argument("--threshold", type=float, default=0.78, help="Similarity threshold for matching contexts.")
    parser.add_argument("--count", type=int, default=3, help="Maximum number of contexts to retrieve.")
    args = parser.parse_args()

    # 1. Initialize clients
    try:
        openai_client, supabase_client = init_clients()
    except ValueError as e:
        print(f"Initialization Error: {e}", file=sys.stderr)
        print(json.dumps([])) # Exit gracefully
        return

    # 2. Read hook event data from stdin
    hook_input = sys.stdin.read().strip()
    
    # Debug logging
    debug_log_path = "/tmp/claude_hook_debug.log"
    with open(debug_log_path, "a") as debug_file:
        debug_file.write(f"[{datetime.datetime.now().isoformat()}] UserPromptHook - Raw input: {repr(hook_input)}\n")

    if not hook_input:
        print(json.dumps([]))
        return

    # 3. Extract user prompt
    try:
        hook_data = json.loads(hook_input)
        user_prompt = hook_data.get("prompt", "")
    except json.JSONDecodeError:
        user_prompt = hook_input # Treat raw input as prompt if not JSON
    
    if not user_prompt.strip():
        print(json.dumps([]))
        return

    # 4. Extract core query and generate embedding
    core_query = extract_core_query(user_prompt, openai_client)
    prompt_embedding = generate_embedding(core_query, openai_client)

    if not prompt_embedding:
        print(json.dumps([]))
        return

    # 5. Find similar contexts in Supabase
    similar_contexts = find_similar_contexts(prompt_embedding, args.threshold, args.count, supabase_client)

    # 6. Output results as a JSON array to stdout for context injection
    output_data = [
        {
            "similarity": context.get("similarity"),
            "metadata": context.get("metadata"),
            "session_id": context.get("session_id")
        }
        for context in similar_contexts
    ]
    
    print(json.dumps(output_data, indent=2))

if __name__ == "__main__":
    main()
