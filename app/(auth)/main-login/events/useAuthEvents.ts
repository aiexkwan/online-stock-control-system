/**
 * useAuthEvents Hook
 *
 * React hook that provides event-driven functionality for authentication components.
 * Enables components to communicate through events rather than direct coupling.
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getEventManager } from './EventManager';
import { EventMap, EventListener, EVENT_TYPES } from './types';
import { AuthUser, RegisterFormSubmissionData, FormSubmissionData } from '@/lib/types/auth-system';
import { LoginUIState } from '../context/LoginContext';

interface UseAuthEventsOptions {
  namespace?: string;
  enableHistory?: boolean;
  debugMode?: boolean;
}

export function useAuthEvents(options: UseAuthEventsOptions = {}) {
  const { namespace, enableHistory = false, debugMode = false } = options;
  const eventManager = getEventManager();
  const namespacedManager = useRef(namespace ? eventManager.createNamespace(namespace) : null);
  const subscriptions = useRef<Set<() => void>>(new Set());

  // Auto-cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      const currentSubscriptions = subscriptions.current;
      currentSubscriptions.forEach(unsubscribe => unsubscribe());
      currentSubscriptions.clear();
    };
  }, []);

  // Event emission
  const emit = useCallback(
    <K extends keyof EventMap>(eventType: K, payload: EventMap[K]['payload']) => {
      if (namespacedManager.current) {
        return namespacedManager.current.emit(eventType, payload);
      }
      return eventManager.emit(eventType, payload, namespace);
    },
    [eventManager, namespace]
  );

  // Event subscription with auto-cleanup
  const on = useCallback(
    <K extends keyof EventMap>(eventType: K, listener: EventListener<EventMap[K]>) => {
      const unsubscribe = namespacedManager.current
        ? namespacedManager.current.on(eventType, listener)
        : eventManager.on(eventType, listener);

      const currentSubscriptions = subscriptions.current;
      currentSubscriptions.add(unsubscribe);
      return unsubscribe;
    },
    [eventManager]
  );

  // One-time event subscription
  const once = useCallback(
    <K extends keyof EventMap>(eventType: K, listener: EventListener<EventMap[K]>) => {
      const unsubscribe = namespacedManager.current
        ? namespacedManager.current.once(eventType, listener)
        : eventManager.once(eventType, listener);

      const currentSubscriptions = subscriptions.current;
      currentSubscriptions.add(unsubscribe);
      return unsubscribe;
    },
    [eventManager]
  );

  // Event unsubscription
  const off = useCallback(
    <K extends keyof EventMap>(eventType: K, listener: EventListener<EventMap[K]>) => {
      if (namespacedManager.current) {
        namespacedManager.current.off(eventType, listener);
      } else {
        eventManager.off(eventType, listener);
      }
    },
    [eventManager]
  );

  // High-level auth event emitters
  const authEvents = {
    // Login events
    emitLoginAttempt: useCallback(
      (email: string, password: string) => emit('LOGIN_ATTEMPT', { email, password }),
      [emit]
    ),

    emitLoginSuccess: useCallback(
      (email: string, user: AuthUser, redirectPath?: string) =>
        emit('LOGIN_SUCCESS', { email, user, redirectPath }),
      [emit]
    ),

    emitLoginError: useCallback(
      (error: string, field?: string) => emit('LOGIN_ERROR', { error, field }),
      [emit]
    ),

    // Register events
    emitRegisterAttempt: useCallback(
      (data: RegisterFormSubmissionData) => emit('REGISTER_ATTEMPT', data),
      [emit]
    ),

    emitRegisterSuccess: useCallback(
      (email: string) => emit('REGISTER_SUCCESS', { email }),
      [emit]
    ),

    emitRegisterError: useCallback(
      (error: string, field?: string) => emit('REGISTER_ERROR', { error, field }),
      [emit]
    ),

    // Form events
    emitFormFieldChange: useCallback(
      (field: string, value: string, formType: 'login' | 'register' | 'reset' | 'change') =>
        emit('FORM_FIELD_CHANGE', { field, value, formType }),
      [emit]
    ),

    emitFormSubmit: useCallback(
      (formType: 'login' | 'register' | 'reset' | 'change', data: FormSubmissionData) =>
        emit('FORM_SUBMIT', { formType, data }),
      [emit]
    ),

    // UI events
    emitViewChange: useCallback(
      (from: LoginUIState['currentView'], to: LoginUIState['currentView']) =>
        emit('VIEW_CHANGE', { from, to }),
      [emit]
    ),

    emitPasswordVisibilityToggle: useCallback(
      (field: 'password' | 'confirmPassword', visible: boolean) =>
        emit('PASSWORD_VISIBILITY_TOGGLE', { field, visible }),
      [emit]
    ),

    emitConfirmationShow: useCallback(
      (message: string, type: 'success' | 'error' | 'info' = 'info') =>
        emit('CONFIRMATION_SHOW', { message, type }),
      [emit]
    ),

    emitConfirmationHide: useCallback(() => emit('CONFIRMATION_HIDE', {}), [emit]),

    // System events
    emitErrorClear: useCallback(
      (scope?: 'field' | 'form' | 'all', field?: string) => emit('ERROR_CLEAR', { scope, field }),
      [emit]
    ),

    emitStateReset: useCallback(
      (scope: 'forms' | 'ui' | 'errors' | 'all') => emit('STATE_RESET', { scope }),
      [emit]
    ),

    emitLoadingState: useCallback(
      (loading: boolean, operation?: string) => emit('LOADING_STATE', { loading, operation }),
      [emit]
    ),
  };

  // Event history access
  const getHistory = useCallback(
    (eventType?: keyof EventMap, limit?: number) => {
      return enableHistory ? eventManager.getHistory(eventType, limit) : [];
    },
    [eventManager, enableHistory]
  );

  // Debug helpers
  const debug = debugMode
    ? {
        getStats: () => eventManager.getStats(),
        getListenerCount: (eventType?: keyof EventMap) => eventManager.getListenerCount(eventType),
        clearHistory: () => eventManager.clearHistory(),
      }
    : undefined;

  return {
    // Core event methods
    emit,
    on,
    once,
    off,

    // High-level event emitters
    ...authEvents,

    // Utilities
    getHistory,
    debug,

    // Constants
    EVENT_TYPES,
  };
}

/**
 * Hook for components that only need to listen to events
 */
export function useAuthEventListener<K extends keyof EventMap>(
  eventType: K,
  listener: EventListener<EventMap[K]>,
  deps: React.DependencyList = []
) {
  const { on } = useAuthEvents();

  useEffect(() => {
    const unsubscribe = on(eventType, listener);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, ...deps]);
}

/**
 * Hook for components that only need to emit events
 */
export function useAuthEventEmitter(namespace?: string) {
  const events = useAuthEvents({ namespace });

  return {
    emitLoginAttempt: events.emitLoginAttempt,
    emitLoginSuccess: events.emitLoginSuccess,
    emitLoginError: events.emitLoginError,
    emitRegisterAttempt: events.emitRegisterAttempt,
    emitRegisterSuccess: events.emitRegisterSuccess,
    emitRegisterError: events.emitRegisterError,
    emitFormFieldChange: events.emitFormFieldChange,
    emitFormSubmit: events.emitFormSubmit,
    emitViewChange: events.emitViewChange,
    emitPasswordVisibilityToggle: events.emitPasswordVisibilityToggle,
    emitConfirmationShow: events.emitConfirmationShow,
    emitConfirmationHide: events.emitConfirmationHide,
    emitErrorClear: events.emitErrorClear,
    emitStateReset: events.emitStateReset,
    emitLoadingState: events.emitLoadingState,
  };
}
