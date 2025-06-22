# Brave Search MCP Server Setup

## Configuration Added
The Brave Search MCP server has been added to your Claude desktop configuration.

## Next Steps

1. **Get a Brave Search API Key**:
   - Visit https://api.search.brave.com/app/keys
   - Sign up or log in to your Brave account
   - Create a new API key for the Search API

2. **Update the API Key**:
   - Open the config file: `/Users/kwanchuncheong/Library/Application Support/Claude/claude_desktop_config.json`
   - Replace `YOUR_API_KEY_HERE` with your actual Brave API key

3. **Restart Claude Desktop**:
   - Completely quit Claude Desktop
   - Reopen Claude Desktop to load the new MCP server

4. **Verify Installation**:
   - After restart, the Brave search MCP server should be available
   - You'll see new tools prefixed with `mcp__brave-search__` if successful

## Troubleshooting
- Ensure you have Node.js installed
- Check Claude Desktop logs if the server doesn't appear
- Make sure the API key is valid and has proper permissions