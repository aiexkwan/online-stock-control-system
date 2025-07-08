import { useState, useCallback, useMemo, useContext, createContext } from 'react';
import MemoryService, { MemoryMessage, MemorySearchResult } from '@/app/services/memoryService';
import { useAuth } from '@/app/hooks/useAuth';
import { widgetRegistry, WidgetState } from '@/lib/widgets/enhanced-registry';

export const useMemory = () => {
  const [loading, setLoading] = useState(false);
  const [memories, setMemories] = useState<MemorySearchResult[]>([]);
  const { user } = useAuth();

  const memoryService = useMemo(() => new MemoryService(user?.id || 'default'), [user?.id]);

  const addMemory = useCallback(
    async (messages: MemoryMessage[]) => {
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
    },
    [memoryService]
  );

  const searchMemory = useCallback(
    async (query: string) => {
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
    },
    [memoryService]
  );

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

  const updateMemory = useCallback(
    async (memoryId: string, newData: string) => {
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
    },
    [memoryService]
  );

  const deleteMemory = useCallback(
    async (memoryId: string) => {
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
    },
    [memoryService]
  );

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
    clearAllMemories,
  };
};

/**
 * Widget State Context for providing state management to widgets
 */
export const WidgetStateContext = createContext<{
  getState: (widgetId: string) => WidgetState | undefined;
  saveState: (widgetId: string, state: Partial<WidgetState>) => void;
} | null>(null);

/**
 * Hook for managing widget state
 * @param widgetId - The unique identifier of the widget
 * @param defaultState - The default state for the widget
 * @returns [state, updateState] - Current state and update function
 */
export function useWidgetState<T extends Record<string, any>>(
  widgetId: string,
  defaultState: T
): [T, (newState: Partial<T>) => void] {
  // Try to use context first
  const context = useContext(WidgetStateContext);

  // Initialize state with saved state or default
  const [state, setState] = useState<T>(() => {
    if (context) {
      const savedState = context.getState(widgetId);
      return (savedState?.settings as T) || defaultState;
    } else {
      // Fallback to direct registry access
      const savedState = widgetRegistry.getWidgetState(widgetId);
      return (savedState?.settings as T) || defaultState;
    }
  });

  // Update state function
  const updateState = useCallback(
    (newState: Partial<T>) => {
      setState(prev => {
        const updated = { ...prev, ...newState };

        // Save to persistent storage
        if (context) {
          context.saveState(widgetId, { settings: updated });
        } else {
          // Fallback to direct registry access
          widgetRegistry.saveWidgetState(widgetId, { settings: updated });
        }

        return updated;
      });
    },
    [widgetId, context]
  );

  return [state, updateState];
}

/**
 * Widget State Provider component
 * Provides widget state management context to child components
 */
export function WidgetStateProvider({ children }: { children: React.ReactNode }) {
  const getState = useCallback((widgetId: string) => {
    return widgetRegistry.getWidgetState(widgetId);
  }, []);

  const saveState = useCallback((widgetId: string, state: Partial<WidgetState>) => {
    widgetRegistry.saveWidgetState(widgetId, state);
  }, []);

  return (
    <WidgetStateContext.Provider value={{ getState, saveState }}>
      {children}
    </WidgetStateContext.Provider>
  );
}
