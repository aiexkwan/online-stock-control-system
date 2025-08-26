import os
import sys
import json
import datetime
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client, Client

# --- Client Initialization ---

def init_clients():
    """
    Initializes and returns OpenAI and Supabase clients.
    """
    # Find project root directory (where .env is located)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "../../../"))
    env_path = os.path.join(project_root, ".env")
    load_dotenv(dotenv_path=env_path)
    
    openai_api_key = os.getenv("OPENAI_API_KEY")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set.")
    if not supabase_url or not supabase_key:
        raise ValueError("Supabase URL or Key environment variable not set.")
        
    openai_client = OpenAI(api_key=openai_api_key)
    supabase_client: Client = create_client(supabase_url, supabase_key)
    
    return openai_client, supabase_client

# --- Core Logic Functions ---

def extract_core_query(prompt: str, openai_client: OpenAI, model="gpt-4o-mini") -> str:
    """
    Uses an LLM to extract the core query from a user prompt.
    """
    system_prompt = """
    You are an expert in refining user prompts. Your task is to extract the key technical concepts, questions, or objectives from the user's text. 
    Focus on the core intent and discard any conversational filler (e.g., greetings, pleasantries). 
    The output should be a concise and clean string that can be used for vector embedding search.
    Example:
    - User Prompt: "Hey, can you help me remember how we decided to handle authentication tokens in the new system?"
    - Output: "authentication token handling strategy in new system"
    - User Prompt: "I'm getting a weird CORS error on the staging server for the `orders` endpoint. What did we do last time to fix this?"
    - Output: "CORS error fix for staging server orders endpoint"
    """
    try:
        response = openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
        )
        core_query = response.choices[0].message.content.strip()
        return core_query
    except Exception as e:
        print(f"Error extracting core query with OpenAI: {e}", file=sys.stderr)
        return prompt # Fallback

def generate_embedding(text: str, openai_client: OpenAI, model="text-embedding-3-small") -> list[float]:
    """
    Generates a vector embedding for the given text.
    """
    try:
        response = openai_client.embeddings.create(input=[text.replace("\n", " ")], model=model)
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding with OpenAI: {e}", file=sys.stderr)
        return []

def find_similar_contexts(embedding: list[float], threshold: float, count: int, supabase_client: Client) -> list[dict]:
    """
    Calls the Supabase RPC function to find similar contexts.
    """
    try:
        response = supabase_client.rpc('match_context_summaries_with_metadata', {
            'query_embedding': embedding,
            'match_threshold': threshold,
            'match_count': count
        }).execute()
        return response.data
    except Exception as e:
        print(f"Error calling Supabase RPC: {e}", file=sys.stderr)
        return []

def generate_structured_summary(conversation_text: str, openai_client: OpenAI) -> dict:
    """
    Uses OpenAI's function calling to generate a structured summary from conversation text.
    """
    prompt = f"""
    Analyze the following conversation and generate a structured summary in JSON format.
    The summary must conform to the specified schema.
    - The 'title' should be a concise summary of the conversation's main goal.
    - The 'tags' should be relevant keywords.
    - Extract key decisions, action items, and referenced files.
    - The goal should be the primary objective of the conversation.

    Conversation:
    {conversation_text}
    """
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert in summarizing technical conversations and structuring them into a specific JSON format."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
        )
        summary_json = json.loads(response.choices[0].message.content)
        return summary_json
    except Exception as e:
        print(f"Error generating summary with OpenAI: {e}", file=sys.stderr)
        return {}

def save_summary_to_supabase(session_id: str, content: str, embedding: list[float], metadata: dict, supabase_client: Client):
    """
    Saves the summary data to the Supabase table.
    """
    try:
        supabase_client.table("context_summaries").insert({
            "session_id": session_id,
            "content": content,
            "embedding": embedding,
            "metadata": metadata
        }).execute()
        print(f"Successfully inserted summary {session_id} into Supabase.")
    except Exception as e:
        print(f"Error inserting data into Supabase: {e}", file=sys.stderr)
