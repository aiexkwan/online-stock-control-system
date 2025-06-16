import MemoryClient from 'mem0ai';

const apiKey = 'm0-S0JE8FcAYEgnJrCosoLeXZOync7kPcM01kACRN7l';
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
      await client.add(messages, { user_id: this.userId });
    } catch (error) {
      console.error('添加記憶時出錯:', error);
      throw error;
    }
  }

  async searchMemory(query: string): Promise<MemorySearchResult[]> {
    try {
      const result = await client.search(query, { user_id: this.userId });
      return result.results || [];
    } catch (error) {
      console.error('搜尋記憶時出錯:', error);
      return [];
    }
  }

  async getAll(): Promise<MemorySearchResult[]> {
    try {
      const result = await client.getAll({ user_id: this.userId });
      return result.results || [];
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