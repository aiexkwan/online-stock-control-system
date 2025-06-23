import MemoryClient from 'mem0ai';

// Get API key from environment variables
const apiKey = process.env.MEM0_API_KEY;
if (!apiKey) {
  console.error('MEM0_API_KEY is not set in environment variables');
  throw new Error('MEM0_API_KEY is required');
}

const client = new MemoryClient({ apiKey });

export interface MemoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface MemorySearchResult {
  memory: string;
  created_at: string;
  updated_at: string;
  id: string;
}

class MemoryService {
  private userId: string;

  constructor(userId: string = 'default') {
    this.userId = userId;
  }

  async addMemory(messages: MemoryMessage[]): Promise<void> {
    try {
      // Filter out system messages or convert them to user messages as mem0ai doesn't support system role
      const compatibleMessages = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }));
      
      if (compatibleMessages.length > 0) {
        await client.add(compatibleMessages, { user_id: this.userId });
      }
    } catch (error) {
      console.error('添加記憶時出錯:', error);
      throw error;
    }
  }

  async searchMemory(query: string): Promise<MemorySearchResult[]> {
    try {
      const result = await client.search(query, { user_id: this.userId });
      const memories = Array.isArray(result) ? result : (result as any)?.results || [];
      return memories.map((item: any) => ({
        memory: item.memory || item.text || '',
        created_at: item.created_at || '',
        updated_at: item.updated_at || '',
        id: item.id || ''
      }));
    } catch (error) {
      console.error('搜尋記憶時出錯:', error);
      return [];
    }
  }

  async getAll(): Promise<MemorySearchResult[]> {
    try {
      const result = await client.getAll({ user_id: this.userId });
      const memories = Array.isArray(result) ? result : (result as any)?.results || [];
      return memories.map((item: any) => ({
        memory: item.memory || item.text || '',
        created_at: item.created_at || '',
        updated_at: item.updated_at || '',
        id: item.id || ''
      }));
    } catch (error) {
      console.error('獲取所有記憶時出錯:', error);
      return [];
    }
  }

  async updateMemory(memoryId: string, data: string): Promise<void> {
    try {
      await client.update(memoryId, data);
    } catch (error) {
      console.error('更新記憶時出錯:', error);
      throw error;
    }
  }

  async deleteMemory(memoryId: string): Promise<void> {
    try {
      await client.delete(memoryId);
    } catch (error) {
      console.error('刪除記憶時出錯:', error);
      throw error;
    }
  }

  async deleteAll(): Promise<void> {
    try {
      await client.deleteAll({ user_id: this.userId });
    } catch (error) {
      console.error('刪除所有記憶時出錯:', error);
      throw error;
    }
  }
}

export default MemoryService;