/**
 * Event Manager for Login System
 *
 * Centralized event management system that enables loose coupling
 * between components through event-driven architecture.
 */

import { AuthEvent, EventListener, EventMap, EVENT_TYPES } from './types';

export class EventManager {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private history: AuthEvent[] = [];
  private readonly maxHistorySize = 100;
  private isDebugMode = process.env.NODE_ENV === 'development';

  /**
   * Subscribe to an event type
   */
  public on<K extends keyof EventMap>(
    eventType: K,
    listener: EventListener<EventMap[K]>
  ): () => void {
    const listeners = this.listeners.get(eventType) || new Set();
    listeners.add(listener as EventListener);
    this.listeners.set(eventType, listeners);

    if (this.isDebugMode) {
      console.debug(`[EventManager] Listener added for ${eventType}. Total: ${listeners.size}`);
    }

    // Return unsubscribe function
    return () => this.off(eventType, listener);
  }

  /**
   * Unsubscribe from an event type
   */
  public off<K extends keyof EventMap>(eventType: K, listener: EventListener<EventMap[K]>): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener as EventListener);
      if (listeners.size === 0) {
        this.listeners.delete(eventType);
      }

      if (this.isDebugMode) {
        console.debug(
          `[EventManager] Listener removed for ${eventType}. Remaining: ${listeners.size}`
        );
      }
    }
  }

  /**
   * Subscribe to an event type once (auto-unsubscribe after first trigger)
   */
  public once<K extends keyof EventMap>(
    eventType: K,
    listener: EventListener<EventMap[K]>
  ): () => void {
    const onceListener = (event: EventMap[K]) => {
      this.off(eventType, onceListener);
      return listener(event);
    };

    return this.on(eventType, onceListener);
  }

  /**
   * Emit an event to all subscribers
   */
  public async emit<K extends keyof EventMap>(
    eventType: K,
    payload: EventMap[K]['payload'],
    source?: string
  ): Promise<void> {
    const event: EventMap[K] = {
      type: eventType,
      payload,
      timestamp: Date.now(),
      source,
    } as EventMap[K];

    // Add to history
    this.addToHistory(event);

    if (this.isDebugMode) {
      console.debug(`[EventManager] Emitting ${eventType}:`, { payload, source });
    }

    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const promises = Array.from(listeners).map(async listener => {
        try {
          await listener(event);
        } catch (error) {
          console.error(`[EventManager] Error in listener for ${eventType}:`, error);
        }
      });

      await Promise.all(promises);
    }
  }

  /**
   * Get event history
   */
  public getHistory(eventType?: keyof EventMap, limit?: number): AuthEvent[] {
    let events = eventType ? this.history.filter(event => event.type === eventType) : this.history;

    if (limit) {
      events = events.slice(-limit);
    }

    return events;
  }

  /**
   * Clear event history
   */
  public clearHistory(): void {
    this.history = [];
    if (this.isDebugMode) {
      console.debug('[EventManager] History cleared');
    }
  }

  /**
   * Get current listeners count for debugging
   */
  public getListenerCount(eventType?: keyof EventMap): number {
    if (eventType) {
      return this.listeners.get(eventType)?.size || 0;
    }

    let total = 0;
    for (const listeners of this.listeners.values()) {
      total += listeners.size;
    }
    return total;
  }

  /**
   * Remove all listeners
   */
  public removeAllListeners(eventType?: keyof EventMap): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }

    if (this.isDebugMode) {
      console.debug(
        `[EventManager] ${eventType ? `Listeners for ${eventType}` : 'All listeners'} removed`
      );
    }
  }

  /**
   * Create a namespaced event emitter
   */
  public createNamespace(namespace: string) {
    return {
      emit: <K extends keyof EventMap>(eventType: K, payload: EventMap[K]['payload']) =>
        this.emit(eventType, payload, namespace),

      on: <K extends keyof EventMap>(eventType: K, listener: EventListener<EventMap[K]>) =>
        this.on(eventType, listener),

      once: <K extends keyof EventMap>(eventType: K, listener: EventListener<EventMap[K]>) =>
        this.once(eventType, listener),

      off: <K extends keyof EventMap>(eventType: K, listener: EventListener<EventMap[K]>) =>
        this.off(eventType, listener),
    };
  }

  /**
   * Add event to history with size limit
   */
  private addToHistory(event: AuthEvent): void {
    this.history.push(event);

    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  /**
   * Debug method to get system stats
   */
  public getStats() {
    return {
      totalListeners: this.getListenerCount(),
      eventTypes: Array.from(this.listeners.keys()),
      historySize: this.history.length,
      listenersByType: Object.fromEntries(
        Array.from(this.listeners.entries()).map(([type, listeners]) => [type, listeners.size])
      ),
    };
  }
}

// Global singleton instance
let globalEventManager: EventManager | null = null;

/**
 * Get the global event manager instance
 */
export function getEventManager(): EventManager {
  if (!globalEventManager) {
    globalEventManager = new EventManager();
  }
  return globalEventManager;
}

/**
 * Utility function to create event payload
 */
export function createEvent<T>(
  type: string,
  payload: T,
  source?: string
): { type: string; payload: T; timestamp: number; source?: string } {
  return {
    type,
    payload,
    timestamp: Date.now(),
    source,
  };
}

// Export EVENT_TYPES for convenience
export { EVENT_TYPES };

// Type-safe event creation helpers
export const createLoginAttemptEvent = (email: string, password: string, source?: string) =>
  createEvent(EVENT_TYPES.LOGIN_ATTEMPT, { email, password }, source);

export const createLoginSuccessEvent = (
  email: string,
  user: any,
  redirectPath?: string,
  source?: string
) => createEvent(EVENT_TYPES.LOGIN_SUCCESS, { email, user, redirectPath }, source);

export const createLoginErrorEvent = (error: string, field?: string, source?: string) =>
  createEvent(EVENT_TYPES.LOGIN_ERROR, { error, field }, source);

export const createFormFieldChangeEvent = (
  field: string,
  value: string,
  formType: 'login' | 'register',
  source?: string
) => createEvent(EVENT_TYPES.FORM_FIELD_CHANGE, { field, value, formType }, source);

export const createViewChangeEvent = (from: string, to: string, source?: string) =>
  createEvent(EVENT_TYPES.VIEW_CHANGE, { from, to }, source);
