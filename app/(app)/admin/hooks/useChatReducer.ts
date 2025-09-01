/**
 * Chat Reducer Hook - 使用 useReducer 管理複雜聊天狀態
 *
 * 採用 useReducer 模式管理本地複雜狀態：
 * - 消息狀態（messages, isLoading, error）
 * - 用戶輸入狀態（input, showSuggestions）
 * - 會話狀態（sessionId, streaming狀態）
 *
 * 職責分離：
 * - 狀態更新邏輯集中化
 * - 類型安全的動作調度
 * - 可預測的狀態變更
 */

import { useReducer, useCallback } from 'react';
import type { ChatMessage, ChatMessageContent } from '../types/ai-response';

// 聊天狀態接口
export interface ChatState {
  // 消息狀態
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  // 用戶輸入狀態
  input: string;
  showSuggestions: boolean;
  selectedCategory: string | null;

  // 會話狀態
  sessionId: string;
  streamingMessageId: string | null;
  abortController: AbortController | null;

  // UI狀態
  isRetrying: boolean;
  lastUserMessage: ChatMessage | null;
}

// 動作類型
export type ChatAction =
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'CLEAR_INPUT' }
  | { type: 'SET_SHOW_SUGGESTIONS'; payload: boolean }
  | { type: 'TOGGLE_SUGGESTIONS' }
  | { type: 'SET_SELECTED_CATEGORY'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; content: ChatMessageContent } }
  | { type: 'REMOVE_MESSAGE'; payload: string }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'START_STREAMING'; payload: string }
  | { type: 'STOP_STREAMING' }
  | { type: 'SET_ABORT_CONTROLLER'; payload: AbortController | null }
  | { type: 'SET_RETRYING'; payload: boolean }
  | { type: 'UPDATE_LAST_USER_MESSAGE'; payload: ChatMessage | null }
  | { type: 'RESET_SESSION'; payload: string };

// Reducer函數
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_INPUT':
      return { ...state, input: action.payload };

    case 'CLEAR_INPUT':
      return { ...state, input: '' };

    case 'SET_SHOW_SUGGESTIONS':
      return { ...state, showSuggestions: action.payload };

    case 'TOGGLE_SUGGESTIONS':
      return { ...state, showSuggestions: !state.showSuggestions };

    case 'SET_SELECTED_CATEGORY':
      return { ...state, selectedCategory: action.payload };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? null : state.error, // 清除錯誤當開始loading
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false, // 停止loading當有錯誤
      };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        lastUserMessage: action.payload.type === 'user' ? action.payload : state.lastUserMessage,
      };

    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id ? { ...msg, content: action.payload.content } : msg
        ),
      };

    case 'REMOVE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload),
      };

    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
        lastUserMessage: action.payload.filter(msg => msg.type === 'user').pop() || null,
      };

    case 'START_STREAMING':
      return {
        ...state,
        streamingMessageId: action.payload,
        isLoading: true,
      };

    case 'STOP_STREAMING':
      return {
        ...state,
        streamingMessageId: null,
        isLoading: false,
      };

    case 'SET_ABORT_CONTROLLER':
      return { ...state, abortController: action.payload };

    case 'SET_RETRYING':
      return { ...state, isRetrying: action.payload };

    case 'UPDATE_LAST_USER_MESSAGE':
      return { ...state, lastUserMessage: action.payload };

    case 'RESET_SESSION':
      return {
        ...state,
        sessionId: action.payload,
        messages: [
          {
            id: 'welcome',
            role: 'assistant',
            type: 'ai',
            content:
              'Hello! I can help you query the database. Ask me anything about your inventory, orders, or stock levels.',
            timestamp: new Date().toISOString(),
          },
        ],
        input: '',
        error: null,
        isLoading: false,
        streamingMessageId: null,
        abortController: null,
        isRetrying: false,
        lastUserMessage: null,
      };

    default:
      return state;
  }
}

// Hook選項接口
export interface UseChatReducerOptions {
  sessionId?: string;
  initialMessages?: ChatMessage[];
}

// Hook返回值接口
export interface UseChatReducerReturn {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;

  // 便捷方法
  setInput: (value: string) => void;
  clearInput: () => void;
  toggleSuggestions: () => void;
  setShowSuggestions: (show: boolean) => void;
  setSelectedCategory: (category: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, content: ChatMessageContent) => void;
  removeMessage: (id: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  startStreaming: (messageId: string) => void;
  stopStreaming: () => void;
  setAbortController: (controller: AbortController | null) => void;
  setRetrying: (retrying: boolean) => void;
  resetSession: (newSessionId?: string) => void;
}

/**
 * 聊天狀態管理Hook - 使用useReducer處理複雜狀態
 */
export const useChatReducer = (options: UseChatReducerOptions = {}): UseChatReducerReturn => {
  const { sessionId: initialSessionId, initialMessages } = options;

  // 初始狀態
  const initialState: ChatState = {
    messages: initialMessages || [
      {
        id: 'welcome',
        role: 'assistant',
        type: 'ai',
        content:
          'Hello! I can help you query the database. Ask me anything about your inventory, orders, or stock levels.',
        timestamp: new Date().toISOString(),
      },
    ],
    isLoading: false,
    error: null,
    input: '',
    showSuggestions: true,
    selectedCategory: null,
    sessionId: initialSessionId || `session_${Date.now()}`,
    streamingMessageId: null,
    abortController: null,
    isRetrying: false,
    lastUserMessage: null,
  };

  const [state, dispatch] = useReducer(chatReducer, initialState);

  // 便捷方法 - 使用 useCallback 避免不必要的重新渲染
  const setInput = useCallback((value: string) => {
    dispatch({ type: 'SET_INPUT', payload: value });
  }, []);

  const clearInput = useCallback(() => {
    dispatch({ type: 'CLEAR_INPUT' });
  }, []);

  const toggleSuggestions = useCallback(() => {
    dispatch({ type: 'TOGGLE_SUGGESTIONS' });
  }, []);

  const setShowSuggestions = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_SUGGESTIONS', payload: show });
  }, []);

  const setSelectedCategory = useCallback((category: string | null) => {
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: category });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, []);

  const updateMessage = useCallback((id: string, content: ChatMessageContent) => {
    dispatch({ type: 'UPDATE_MESSAGE', payload: { id, content } });
  }, []);

  const removeMessage = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_MESSAGE', payload: id });
  }, []);

  const setMessages = useCallback((messages: ChatMessage[]) => {
    dispatch({ type: 'SET_MESSAGES', payload: messages });
  }, []);

  const startStreaming = useCallback((messageId: string) => {
    dispatch({ type: 'START_STREAMING', payload: messageId });
  }, []);

  const stopStreaming = useCallback(() => {
    dispatch({ type: 'STOP_STREAMING' });
  }, []);

  const setAbortController = useCallback((controller: AbortController | null) => {
    dispatch({ type: 'SET_ABORT_CONTROLLER', payload: controller });
  }, []);

  const setRetrying = useCallback((retrying: boolean) => {
    dispatch({ type: 'SET_RETRYING', payload: retrying });
  }, []);

  const resetSession = useCallback((newSessionId?: string) => {
    const sessionId = newSessionId || `session_${Date.now()}`;
    dispatch({ type: 'RESET_SESSION', payload: sessionId });
  }, []);

  return {
    state,
    dispatch,
    setInput,
    clearInput,
    toggleSuggestions,
    setShowSuggestions,
    setSelectedCategory,
    setLoading,
    setError,
    clearError,
    addMessage,
    updateMessage,
    removeMessage,
    setMessages,
    startStreaming,
    stopStreaming,
    setAbortController,
    setRetrying,
    resetSession,
  };
};
