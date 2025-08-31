#!/usr/bin/env python3
"""
Stdio wrapper for Archon HTTP MCP server
This bridges stdio-based MCP clients (like Claude Code) with Archon's HTTP MCP server
"""

import json
import sys
import requests
import warnings
from typing import Dict, Any

# Suppress urllib3 SSL warnings
warnings.filterwarnings('ignore', module='urllib3')
import urllib3
urllib3.disable_warnings()

MCP_SERVER_URL = "http://localhost:8051/mcp"

def send_http_mcp_request(message: Dict[str, Any]) -> Dict[str, Any]:
    """Send a JSON-RPC request to the HTTP MCP server"""
    headers = {
        "Accept": "application/json, text/event-stream",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(MCP_SERVER_URL, json=message, headers=headers, timeout=30)
        response.raise_for_status()
        
        # Debug: print raw response
        #print(f"DEBUG Response: {response.text}", file=sys.stderr)
        
        # Handle both JSON and Server-Sent Events responses
        content_type = response.headers.get('content-type', '').lower()
        
        if 'application/json' in content_type:
            return response.json()
        elif 'text/event-stream' in content_type or 'text/plain' in content_type:
            # Parse Server-Sent Events or plain text response
            lines = response.text.strip().split('\n')
            for line in lines:
                if line.startswith('data: '):
                    data_str = line[6:]  # Remove 'data: ' prefix
                    try:
                        return json.loads(data_str)
                    except json.JSONDecodeError:
                        continue
                elif line.strip() and not line.startswith('event:') and not line.startswith('id:'):
                    # Try to parse as direct JSON
                    try:
                        return json.loads(line.strip())
                    except json.JSONDecodeError:
                        continue
            
            # If no valid JSON found, return raw text as error
            return {
                "jsonrpc": "2.0",
                "id": message.get("id"),
                "error": {
                    "code": -32603,
                    "message": f"Could not parse response: {response.text}"
                }
            }
        else:
            # Try to parse as JSON anyway
            try:
                return response.json()
            except:
                return {
                    "jsonrpc": "2.0",
                    "id": message.get("id"),
                    "error": {
                        "code": -32603,
                        "message": f"Unknown response format: {response.text}"
                    }
                }
            
    except Exception as e:
        return {
            "jsonrpc": "2.0",
            "id": message.get("id"),
            "error": {
                "code": -32603,
                "message": f"HTTP MCP request failed: {str(e)}"
            }
        }

def main():
    """Main stdio loop"""
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
            
        try:
            # Parse JSON-RPC request from stdin
            request = json.loads(line)
            
            # Forward to HTTP MCP server
            response = send_http_mcp_request(request)
            
            # Send response to stdout
            print(json.dumps(response))
            sys.stdout.flush()
            
        except json.JSONDecodeError as e:
            # Send JSON-RPC error for invalid JSON
            error_response = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {
                    "code": -32700,
                    "message": f"Parse error: {str(e)}"
                }
            }
            print(json.dumps(error_response))
            sys.stdout.flush()
            
        except Exception as e:
            # Send generic error
            error_response = {
                "jsonrpc": "2.0", 
                "id": None,
                "error": {
                    "code": -32603,
                    "message": f"Internal error: {str(e)}"
                }
            }
            print(json.dumps(error_response))
            sys.stdout.flush()

if __name__ == "__main__":
    main()