import os
import sys
import json
import datetime

# Add lib to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'lib'))
from context_utils import init_clients, generate_structured_summary, generate_embedding, save_summary_to_supabase

def main():
    """
    This hook is triggered on SessionEnd or SubagentStop. It generates a structured summary
    of the conversation, creates an embedding, and saves it to Supabase.
    """
    # 1. Initialize clients
    try:
        openai_client, supabase_client = init_clients()
    except ValueError as e:
        print(f"Initialization Error: {e}", file=sys.stderr)
        return

    # 2. Read hook event data from stdin
    hook_input = sys.stdin.read().strip()
    
    # Debug logging
    debug_log_path = "/tmp/claude_hook_debug.log"
    with open(debug_log_path, "a") as debug_file:
        debug_file.write(f"[{datetime.datetime.now().isoformat()}] SaveContextHook - Raw input: {repr(hook_input)}\n")
    
    if not hook_input:
        print("No input received from stdin. Exiting.", file=sys.stderr)
        return
        
    try:
        hook_data = json.loads(hook_input)
        
        # Extract conversation content from Claude Code hook format
        conversation_parts = []
        if "prompt" in hook_data:
            conversation_parts.append(f"User: {hook_data['prompt']}")
        if "tool_response" in hook_data:
            conversation_parts.append(f"Assistant: {hook_data['tool_response']}")
        
        conversation_text = "\n".join(conversation_parts)
        
        if not conversation_text.strip():
            print("No meaningful conversation content found. Exiting.", file=sys.stderr)
            return
            
    except (json.JSONDecodeError, KeyError) as e:
        print(f"Error parsing hook input: {e}", file=sys.stderr)
        return

    # 3. Generate structured summary
    summary_data = generate_structured_summary(conversation_text, openai_client)
    if not summary_data:
        print("Failed to generate summary. Exiting.", file=sys.stderr)
        return
        
    # 4. Add metadata
    timestamp = datetime.datetime.now(datetime.timezone.utc)
    session_id = f"ctx-{timestamp.strftime('%Y%m%d-%H%M%S')}"
    summary_data.setdefault('meta', {})
    summary_data['meta']['timestamp'] = timestamp.isoformat()
    summary_data['meta']['sessionId'] = session_id

    # 5. Generate content for embedding
    content_parts = []
    goal = summary_data.get('goal', '')
    if goal: content_parts.append(goal)
    decisions = summary_data.get('decisions', []) or summary_data.get('key_decisions', [])
    if decisions: content_parts.extend(decisions)
    actions = summary_data.get('actions', []) or summary_data.get('action_items', [])
    if actions:
        for action in actions:
            task = str(action.get('task', '')) if isinstance(action, dict) else str(action)
            if task: content_parts.append(task)
    
    content_for_embedding = " ".join(content_parts).strip()

    if not content_for_embedding:
        print("No content available for embedding. Exiting.", file=sys.stderr)
        return

    # 6. Generate embedding vector
    embedding = generate_embedding(content_for_embedding, openai_client)
    if not embedding:
        print("Failed to generate embedding. Exiting.", file=sys.stderr)
        return

    # 7. Write to Supabase - this is now the single source of truth
    save_summary_to_supabase(session_id, content_for_embedding, embedding, summary_data, supabase_client)

if __name__ == "__main__":
    main()
