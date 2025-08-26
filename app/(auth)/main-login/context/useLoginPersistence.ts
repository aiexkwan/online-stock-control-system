'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';

// Storage keys - prefixed to avoid conflicts
const STORAGE_KEYS = {
  LOGIN_FORM: 'pennine_login_form_data',
  REGISTER_FORM: 'pennine_register_form_data',
  UI_STATE: 'pennine_login_ui_state',
  LAST_EMAIL: 'pennine_last_login_email', // For convenience, non-sensitive
} as const;

// Form data types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

// UI state type - only non-sensitive data
export interface UIStateData {
  showConfirmation?: boolean;
  confirmationMessage?: string;
  showPassword?: boolean;
  showConfirmPassword?: boolean;
  currentView?: 'login' | 'register' | 'reset' | 'change';
}

// Persistence configuration
export interface PersistenceConfig {
  enabled: boolean;
  useSessionStorage?: boolean; // Use sessionStorage instead of localStorage for sensitive data
  sensitiveDataTTL?: number; // TTL in milliseconds for sensitive data
}

// Persistence state interface
export interface LoginPersistenceState {
  loginFormData: LoginFormData;
  registerFormData: RegisterFormData;
  uiState: UIStateData;
  persistenceEnabled: boolean;
  
  // Actions
  updateFormData: (type: 'login' | 'register', data: Partial<LoginFormData | RegisterFormData>) => void;
  updateUIState: (data: Partial<UIStateData>) => void;
  clearFormData: () => void;
  clearSensitiveData: () => void;
  clearAll: () => void;
}

// Default values
const DEFAULT_LOGIN_FORM: LoginFormData = {
  email: '',
  password: '',
};

const DEFAULT_REGISTER_FORM: RegisterFormData = {
  email: '',
  password: '',
  confirmPassword: '',
};

const DEFAULT_UI_STATE: UIStateData = {
  showConfirmation: false,
  confirmationMessage: '',
  showPassword: false,
  showConfirmPassword: false,
  currentView: 'login',
};

/**
 * Safe storage utility with error handling
 */
class SafeStorage {
  private storage: Storage | null = null;
  
  constructor(useSessionStorage = false) {
    if (typeof window !== 'undefined') {
      try {
        this.storage = useSessionStorage ? window.sessionStorage : window.localStorage;
        // Test storage availability
        const testKey = '__storage_test__';
        this.storage.setItem(testKey, 'test');
        this.storage.removeItem(testKey);
      } catch (error) {
        console.warn('[SafeStorage] Storage not available:', error);
        this.storage = null;
      }
    }
  }
  
  setItem<T>(key: string, value: T): void {
    if (!this.storage) return;
    
    try {
      const serialized = JSON.stringify(value);
      this.storage.setItem(key, serialized);
    } catch (error) {
      console.warn(`[SafeStorage] Failed to set item ${key}:`, error);
    }
  }
  
  getItem<T>(key: string, defaultValue: T): T {
    if (!this.storage) return defaultValue;
    
    try {
      const item = this.storage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`[SafeStorage] Failed to get item ${key}:`, error);
      return defaultValue;
    }
  }
  
  removeItem(key: string): void {
    if (!this.storage) return;
    
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.warn(`[SafeStorage] Failed to remove item ${key}:`, error);
    }
  }
  
  clear(): void {
    if (!this.storage) return;
    
    try {
      // Only clear our keys, not entire storage
      Object.values(STORAGE_KEYS).forEach(key => {
        this.storage!.removeItem(key);
      });
    } catch (error) {
      console.warn('[SafeStorage] Failed to clear storage:', error);
    }
  }
}

/**
 * Hook for managing login-related state persistence
 * 
 * Features:
 * - Configurable storage backend (localStorage/sessionStorage)
 * - Automatic sensitive data cleanup
 * - Error-safe operations with fallback to in-memory state
 * - TTL support for sensitive data
 * - Hydration-safe for Next.js SSR
 */
export function useLoginPersistence(config: PersistenceConfig): LoginPersistenceState {
  const { enabled, useSessionStorage = false, sensitiveDataTTL = 300000 } = config; // 5 minutes default TTL
  
  // Initialize storage
  const storage = useMemo(() => new SafeStorage(useSessionStorage), [useSessionStorage]);
  
  // Initialize state from storage or defaults
  const [loginFormData, setLoginFormData] = useState<LoginFormData>(() => {
    if (!enabled) return DEFAULT_LOGIN_FORM;
    return storage.getItem(STORAGE_KEYS.LOGIN_FORM, DEFAULT_LOGIN_FORM);
  });
  
  const [registerFormData, setRegisterFormData] = useState<RegisterFormData>(() => {
    if (!enabled) return DEFAULT_REGISTER_FORM;
    return storage.getItem(STORAGE_KEYS.REGISTER_FORM, DEFAULT_REGISTER_FORM);
  });
  
  const [uiState, setUIState] = useState<UIStateData>(() => {
    if (!enabled) return DEFAULT_UI_STATE;
    return storage.getItem(STORAGE_KEYS.UI_STATE, DEFAULT_UI_STATE);
  });
  
  // Auto-cleanup sensitive data based on TTL
  useEffect(() => {
    if (!enabled || !sensitiveDataTTL) return;
    
    const cleanupInterval = setInterval(() => {
      // Clear passwords from forms after TTL
      setLoginFormData(prev => {
        if (prev.password) {
          const updated = { ...prev, password: '' };
          storage.setItem(STORAGE_KEYS.LOGIN_FORM, updated);
          return updated;
        }
        return prev;
      });
      
      setRegisterFormData(prev => {
        if (prev.password || prev.confirmPassword) {
          const updated = { 
            ...prev, 
            password: '', 
            confirmPassword: '' 
          };
          storage.setItem(STORAGE_KEYS.REGISTER_FORM, updated);
          return updated;
        }
        return prev;
      });
    }, sensitiveDataTTL);
    
    return () => clearInterval(cleanupInterval);
  }, [enabled, sensitiveDataTTL, storage]);
  
  // Update form data
  const updateFormData = useCallback((
    type: 'login' | 'register',
    data: Partial<LoginFormData | RegisterFormData>
  ) => {
    if (type === 'login') {
      setLoginFormData(prev => {
        const updated = { ...prev, ...data } as LoginFormData;
        if (enabled) {
          storage.setItem(STORAGE_KEYS.LOGIN_FORM, updated);
        }
        return updated;
      });
    } else if (type === 'register') {
      setRegisterFormData(prev => {
        const updated = { ...prev, ...data } as RegisterFormData;
        if (enabled) {
          storage.setItem(STORAGE_KEYS.REGISTER_FORM, updated);
        }
        return updated;
      });
    }
  }, [enabled, storage]);
  
  // Update UI state
  const updateUIState = useCallback((data: Partial<UIStateData>) => {
    setUIState(prev => {
      const updated = { ...prev, ...data };
      if (enabled) {
        storage.setItem(STORAGE_KEYS.UI_STATE, updated);
      }
      return updated;
    });
  }, [enabled, storage]);
  
  // Clear form data
  const clearFormData = useCallback(() => {
    setLoginFormData(DEFAULT_LOGIN_FORM);
    setRegisterFormData(DEFAULT_REGISTER_FORM);
    
    if (enabled) {
      storage.removeItem(STORAGE_KEYS.LOGIN_FORM);
      storage.removeItem(STORAGE_KEYS.REGISTER_FORM);
    }
  }, [enabled, storage]);
  
  // Clear only sensitive data (passwords)
  const clearSensitiveData = useCallback(() => {
    setLoginFormData(prev => {
      const updated = { ...prev, password: '' };
      if (enabled) {
        storage.setItem(STORAGE_KEYS.LOGIN_FORM, updated);
        // Store last email for convenience (non-sensitive)
        if (updated.email) {
          storage.setItem(STORAGE_KEYS.LAST_EMAIL, updated.email);
        }
      }
      return updated;
    });
    
    setRegisterFormData(prev => {
      const updated = { 
        ...prev, 
        password: '', 
        confirmPassword: '' 
      };
      if (enabled) {
        storage.setItem(STORAGE_KEYS.REGISTER_FORM, updated);
      }
      return updated;
    });
  }, [enabled, storage]);
  
  // Clear all data
  const clearAll = useCallback(() => {
    setLoginFormData(DEFAULT_LOGIN_FORM);
    setRegisterFormData(DEFAULT_REGISTER_FORM);
    setUIState(DEFAULT_UI_STATE);
    
    if (enabled) {
      storage.clear();
    }
  }, [enabled, storage]);
  
  // Load last email convenience function
  const loadLastEmail = useCallback(() => {
    if (!enabled) return '';
    return storage.getItem(STORAGE_KEYS.LAST_EMAIL, '');
  }, [enabled, storage]);
  
  // Auto-load last email on mount (convenience feature)
  useEffect(() => {
    if (enabled && !loginFormData.email) {
      const lastEmail = loadLastEmail();
      if (lastEmail) {
        updateFormData('login', { email: lastEmail });
      }
    }
  }, [enabled, loginFormData.email, loadLastEmail, updateFormData]);
  
  return {
    loginFormData,
    registerFormData,
    uiState,
    persistenceEnabled: enabled,
    
    // Actions
    updateFormData,
    updateUIState,
    clearFormData,
    clearSensitiveData,
    clearAll,
  };
}