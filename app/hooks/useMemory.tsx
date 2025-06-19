import { useState, useCallback, useMemo } from 'react';
import MemoryService, { MemoryMessage, MemorySearchResult } from '@/app/services/memoryService';
import { useAuth } from '@/app/hooks/useAuth';

export const useMemory = () => {
  const [loading, setLoading] = useState(false);
  const [memories, setMemories] = useState<MemorySearchResult[]>([]);
  const { user } = useAuth();
  
  const memoryService = useMemo(() => new MemoryService(user?.id || 'default'), [user?.id]);

  const addMemory = useCallback(async (messages: MemoryMessage[]) => {
    setLoading(true);
    try {
      await memoryService.addMemory(messages);
      return { success: true };
    } catch (error) {
      console.error('添加記憶失敗:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [memoryService]);

  const searchMemory = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const results = await memoryService.searchMemory(query);
      setMemories(results);
      return results;
    } catch (error) {
      console.error('搜尋記憶失敗:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [memoryService]);

  const getAllMemories = useCallback(async () => {
    setLoading(true);
    try {
      const results = await memoryService.getAll();
      setMemories(results);
      return results;
    } catch (error) {
      console.error('獲取記憶失敗:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [memoryService]);

  const updateMemory = useCallback(async (memoryId: string, newData: string) => {
    setLoading(true);
    try {
      await memoryService.updateMemory(memoryId, newData);
      return { success: true };
    } catch (error) {
      console.error('更新記憶失敗:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [memoryService]);

  const deleteMemory = useCallback(async (memoryId: string) => {
    setLoading(true);
    try {
      await memoryService.deleteMemory(memoryId);
      setMemories(prev => prev.filter(m => m.id !== memoryId));
      return { success: true };
    } catch (error) {
      console.error('刪除記憶失敗:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [memoryService]);

  const clearAllMemories = useCallback(async () => {
    setLoading(true);
    try {
      await memoryService.deleteAll();
      setMemories([]);
      return { success: true };
    } catch (error) {
      console.error('清除記憶失敗:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [memoryService]);

  return {
    loading,
    memories,
    addMemory,
    searchMemory,
    getAllMemories,
    updateMemory,
    deleteMemory,
    clearAllMemories
  };
};