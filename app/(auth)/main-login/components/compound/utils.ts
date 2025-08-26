/**
 * Compound Component Utilities
 * 
 * Helper functions and utilities for creating and managing compound components
 * in the authentication system.
 */

import React, { isValidElement } from 'react';
import { ComponentRegistry, ThemeContext, ComponentState } from './types';

/**
 * Component Registry for dynamic component management
 */
class CompoundComponentRegistry implements ComponentRegistry {
  private components = new Map<string, React.ComponentType<any>>();

  register(name: string, component: React.ComponentType<any>): void {
    this.components.set(name, component);
  }

  unregister(name: string): void {
    this.components.delete(name);
  }

  get(name: string): React.ComponentType<any> | undefined {
    return this.components.get(name);
  }

  getAll(): Record<string, React.ComponentType<any>> {
    return Object.fromEntries(this.components.entries());
  }

  has(name: string): boolean {
    return this.components.has(name);
  }

  size(): number {
    return this.components.size;
  }

  clear(): void {
    this.components.clear();
  }
}

// Global registry instance
export const componentRegistry = new CompoundComponentRegistry();

/**
 * Higher-order component for creating compound components
 */
export function withCompoundComponents<T>(
  BaseComponent: React.ComponentType<T>,
  subComponents: Record<string, React.ComponentType<any>>
) {
  const CompoundComponent = BaseComponent as any;
  
  Object.keys(subComponents).forEach(key => {
    CompoundComponent[key] = subComponents[key];
  });

  return CompoundComponent;
}

/**
 * Default theme configuration
 */
export const defaultTheme: ThemeContext = {
  colors: {
    primary: '#8b5cf6', // purple-500
    secondary: '#6b7280', // gray-500
    error: '#ef4444', // red-500
    success: '#10b981', // emerald-500
    warning: '#f59e0b', // amber-500
    info: '#3b82f6', // blue-500
    text: {
      primary: '#ffffff', // white
      secondary: '#d1d5db', // gray-300
      muted: '#9ca3af', // gray-400
    },
    background: {
      primary: '#0f172a', // slate-900
      secondary: '#1e293b', // slate-800
      accent: '#334155', // slate-700
    },
    border: {
      default: '#4b5563', // gray-600
      focus: '#8b5cf6', // purple-500
      error: '#ef4444', // red-500
    },
  },
  spacing: {
    xs: '0.25rem', // 1
    sm: '0.5rem',  // 2
    md: '1rem',    // 4
    lg: '1.5rem',  // 6
    xl: '2rem',    // 8
  },
  borderRadius: {
    sm: '0.25rem', // rounded-sm
    md: '0.5rem',  // rounded-lg
    lg: '0.75rem', // rounded-xl
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
};

/**
 * Utility to find child components by type
 */
export function findChildrenByType(
  children: React.ReactNode,
  types: React.ComponentType<any> | React.ComponentType<any>[]
): React.ReactElement[] {
  const typesArray = Array.isArray(types) ? types : [types];
  const result: React.ReactElement[] = [];

  React.Children.forEach(children, (child) => {
    if (isValidElement(child) && typesArray.some(type => child.type === type)) {
      result.push(child);
    }
  });

  return result;
}

/**
 * Utility to filter children by display name
 */
export function findChildrenByDisplayName(
  children: React.ReactNode,
  displayName: string | string[]
): React.ReactElement[] {
  const names = Array.isArray(displayName) ? displayName : [displayName];
  const result: React.ReactElement[] = [];

  React.Children.forEach(children, (child) => {
    if (isValidElement(child) && 
        child.type && 
        typeof child.type !== 'string' &&
        'displayName' in child.type &&
        names.includes((child.type as any).displayName)) {
      result.push(child);
    }
  });

  return result;
}

/**
 * Utility to clone children with additional props
 */
export function cloneChildrenWithProps(
  children: React.ReactNode,
  additionalProps: Record<string, any>
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (isValidElement(child)) {
      return React.cloneElement(child, additionalProps);
    }
    return child;
  });
}

/**
 * Component state manager
 */
export class ComponentStateManager {
  private states = new Map<string, ComponentState>();

  createState(id: string, type: string, initialState?: Partial<ComponentState>): ComponentState {
    const state: ComponentState = {
      id,
      type,
      isVisible: true,
      isEnabled: true,
      hasError: false,
      isDirty: false,
      isTouched: false,
      ...initialState,
    };

    this.states.set(id, state);
    return state;
  }

  updateState(id: string, updates: Partial<ComponentState>): ComponentState | undefined {
    const currentState = this.states.get(id);
    if (currentState) {
      const newState = { ...currentState, ...updates };
      this.states.set(id, newState);
      return newState;
    }
    return undefined;
  }

  getState(id: string): ComponentState | undefined {
    return this.states.get(id);
  }

  deleteState(id: string): boolean {
    return this.states.delete(id);
  }

  getAllStates(): ComponentState[] {
    return Array.from(this.states.values());
  }

  clearStates(): void {
    this.states.clear();
  }

  getStatesByType(type: string): ComponentState[] {
    return Array.from(this.states.values()).filter(state => state.type === type);
  }
}

/**
 * CSS class name utilities
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function mergeClasses(baseClasses: string, additionalClasses?: string): string {
  if (!additionalClasses) return baseClasses;
  return `${baseClasses} ${additionalClasses}`;
}

/**
 * Validation utilities for compound components
 */
export const validationUtils = {
  isRequired: (value: string): boolean => value.trim().length > 0,
  
  isEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  isStrongPassword: (password: string): boolean => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
  },
  
  passwordsMatch: (password: string, confirmPassword: string): boolean => {
    return password === confirmPassword && password.length > 0;
  },
  
  isCompanyEmail: (email: string): boolean => {
    return email.endsWith('@pennineindustries.com');
  },
};

/**
 * Accessibility utilities
 */
export const a11yUtils = {
  generateId: (prefix: string = 'component'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },
  
  announceToScreenReader: (message: string): void => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  },
  
  focusElement: (elementId: string): void => {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
    }
  },
  
  trapFocus: (containerElement: HTMLElement): () => void => {
    const focusableElements = containerElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };
    
    containerElement.addEventListener('keydown', handleTabKey);
    
    return () => {
      containerElement.removeEventListener('keydown', handleTabKey);
    };
  },
};

/**
 * Performance optimization utilities
 */
export const performanceUtils = {
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },
  
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  memoize: <T extends (...args: any[]) => any>(func: T): T => {
    const cache = new Map();
    return ((...args: any[]) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },
};

// Global state manager instance
export const stateManager = new ComponentStateManager();