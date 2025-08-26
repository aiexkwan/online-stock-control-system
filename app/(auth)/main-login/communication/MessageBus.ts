/**
 * Message Bus Implementation
 * 
 * Centralized message bus for component communication that supports
 * multiple communication channels and middleware processing.
 */

import { 
  MessageBus, 
  CommunicationMessage, 
  CommunicationChannel, 
  CommunicationMiddleware,
  CommunicationError,
  CommunicationMetrics 
} from './interfaces';

export class MessageBusImpl implements MessageBus {
  private subscribers = new Map<string, Set<(message: CommunicationMessage) => void | Promise<void>>>();
  private channels = new Map<string, CommunicationChannel>();
  private middleware: CommunicationMiddleware[] = [];
  private messageHistory: CommunicationMessage[] = [];
  private metrics: CommunicationMetrics = {
    messagesSent: 0,
    messagesReceived: 0,
    messagesProcessed: 0,
    messagesFailed: 0,
    averageProcessingTime: 0,
    peakThroughput: 0,
    channelUsage: {
      'direct-props': 0,
      'context': 0,
      'events': 0,
      'callback': 0,
      'ref': 0,
      'global-state': 0,
    },
    componentInteractions: {},
  };
  
  private isDebugMode = false;
  private maxHistorySize = 1000;
  private processingTimes: number[] = [];

  constructor(options: { debugMode?: boolean; maxHistorySize?: number } = {}) {
    this.isDebugMode = options.debugMode ?? false;
    this.maxHistorySize = options.maxHistorySize ?? 1000;
  }

  // Publishing methods
  async publish<T>(message: CommunicationMessage<T>): Promise<void> {
    const startTime = performance.now();
    
    try {
      await this.processMessage(message);
      this.updateMetrics('sent', startTime);
      
      if (this.isDebugMode) {
        console.debug('[MessageBus] Message published:', message);
      }
    } catch (error) {
      this.metrics.messagesFailed++;
      this.handleError(error as Error, message);
      throw error;
    }
  }

  async publishAndWait<T, R>(message: CommunicationMessage<T>): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      const responseType = `${message.type}_RESPONSE`;
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for response to ${message.type}`));
      }, 5000); // 5 second timeout

      // Subscribe once for the response
      const unsubscribe = this.subscribeOnce(responseType, (responseMessage) => {
        clearTimeout(timeout);
        if (responseMessage.correlationId === message.id) {
          resolve(responseMessage.payload as R);
        }
      });

      // Publish the original message
      this.publish({ ...message, requiresResponse: true })
        .catch((error) => {
          clearTimeout(timeout);
          unsubscribe();
          reject(error);
        });
    });
  }

  // Subscribing methods
  subscribe<T>(
    type: string,
    handler: (message: CommunicationMessage<T>) => void | Promise<void>
  ): () => void {
    const handlers = this.subscribers.get(type) || new Set();
    handlers.add(handler as any);
    this.subscribers.set(type, handlers);

    if (this.isDebugMode) {
      console.debug(`[MessageBus] Subscribed to ${type}. Total handlers: ${handlers.size}`);
    }

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as any);
      if (handlers.size === 0) {
        this.subscribers.delete(type);
      }
    };
  }

  subscribeOnce<T>(
    type: string,
    handler: (message: CommunicationMessage<T>) => void | Promise<void>
  ): () => void {
    const onceHandler = (message: CommunicationMessage<T>) => {
      unsubscribe();
      return handler(message);
    };

    const unsubscribe = this.subscribe(type, onceHandler);
    return unsubscribe;
  }

  // Channel management
  createChannel(name: string, type: CommunicationChannel): void {
    this.channels.set(name, type);
    
    if (this.isDebugMode) {
      console.debug(`[MessageBus] Channel created: ${name} (${type})`);
    }
  }

  destroyChannel(name: string): void {
    this.channels.delete(name);
    
    if (this.isDebugMode) {
      console.debug(`[MessageBus] Channel destroyed: ${name}`);
    }
  }

  getChannel(name: string): CommunicationChannel | undefined {
    return this.channels.get(name);
  }

  // Message history and debugging
  getMessageHistory(limit?: number): CommunicationMessage[] {
    if (limit) {
      return this.messageHistory.slice(-limit);
    }
    return [...this.messageHistory];
  }

  clearHistory(): void {
    this.messageHistory = [];
    
    if (this.isDebugMode) {
      console.debug('[MessageBus] Message history cleared');
    }
  }

  enableDebugMode(enabled: boolean): void {
    this.isDebugMode = enabled;
    console.log(`[MessageBus] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Middleware management
  addMiddleware(middleware: CommunicationMiddleware): void {
    this.middleware.push(middleware);
    this.middleware.sort((a, b) => b.priority - a.priority); // Higher priority first
    
    if (this.isDebugMode) {
      console.debug(`[MessageBus] Middleware added: ${middleware.name} (priority: ${middleware.priority})`);
    }
  }

  removeMiddleware(name: string): void {
    const index = this.middleware.findIndex(m => m.name === name);
    if (index !== -1) {
      this.middleware.splice(index, 1);
      
      if (this.isDebugMode) {
        console.debug(`[MessageBus] Middleware removed: ${name}`);
      }
    }
  }

  // Metrics
  getMetrics(): CommunicationMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      messagesProcessed: 0,
      messagesFailed: 0,
      averageProcessingTime: 0,
      peakThroughput: 0,
      channelUsage: {
        'direct-props': 0,
        'context': 0,
        'events': 0,
        'callback': 0,
        'ref': 0,
        'global-state': 0,
      },
      componentInteractions: {},
    };
    this.processingTimes = [];
  }

  // Private methods
  private async processMessage<T>(message: CommunicationMessage<T>): Promise<void> {
    // Add to history
    this.addToHistory(message);
    
    // Process through middleware chain
    let currentMessage = message;
    let middlewareIndex = 0;

    const processNext = async (msg: CommunicationMessage<T>): Promise<void> => {
      if (middlewareIndex < this.middleware.length) {
        const middleware = this.middleware[middlewareIndex++];
        await middleware.process(msg, processNext);
      } else {
        // Final step: deliver to subscribers
        await this.deliverMessage(msg);
      }
    };

    await processNext(currentMessage);
  }

  private async deliverMessage<T>(message: CommunicationMessage<T>): Promise<void> {
    const handlers = this.subscribers.get(message.type);
    
    if (handlers && handlers.size > 0) {
      this.metrics.messagesReceived++;
      
      // Update channel usage
      this.metrics.channelUsage[message.channel]++;
      
      // Track component interactions
      if (message.target) {
        if (!this.metrics.componentInteractions[message.source]) {
          this.metrics.componentInteractions[message.source] = {};
        }
        if (!this.metrics.componentInteractions[message.source][message.target]) {
          this.metrics.componentInteractions[message.source][message.target] = 0;
        }
        this.metrics.componentInteractions[message.source][message.target]++;
      }

      // Deliver to all handlers
      const promises = Array.from(handlers).map(async (handler) => {
        try {
          await handler(message);
          this.metrics.messagesProcessed++;
        } catch (error) {
          this.metrics.messagesFailed++;
          this.handleError(error as Error, message);
        }
      });

      await Promise.all(promises);
    }
  }

  private addToHistory<T>(message: CommunicationMessage<T>): void {
    this.messageHistory.push(message);
    
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory = this.messageHistory.slice(-this.maxHistorySize);
    }
  }

  private updateMetrics(type: 'sent' | 'received', startTime: number): void {
    const processingTime = performance.now() - startTime;
    this.processingTimes.push(processingTime);
    
    if (type === 'sent') {
      this.metrics.messagesSent++;
    }
    
    // Calculate average processing time
    if (this.processingTimes.length > 100) {
      this.processingTimes = this.processingTimes.slice(-100); // Keep last 100 samples
    }
    
    this.metrics.averageProcessingTime = 
      this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;
  }

  private handleError<T>(error: Error, message: CommunicationMessage<T>): void {
    const communicationError: CommunicationError = {
      name: 'CommunicationError',
      message: `Error processing message ${message.type}: ${error.message}`,
      code: 'MESSAGE_PROCESSING_ERROR',
      source: message.source,
      target: message.target,
      originalMessage: message,
      timestamp: Date.now(),
    };

    console.error('[MessageBus] Communication error:', communicationError);
    
    // Emit error event
    this.publish({
      id: `error-${Date.now()}`,
      type: 'COMMUNICATION_ERROR',
      channel: 'events',
      source: 'MessageBus',
      payload: communicationError,
      timestamp: Date.now(),
    }).catch(() => {
      // Prevent infinite error loops
    });
  }
}

// Global message bus instance
let globalMessageBus: MessageBusImpl | null = null;

export function getMessageBus(options?: { debugMode?: boolean; maxHistorySize?: number }): MessageBusImpl {
  if (!globalMessageBus) {
    globalMessageBus = new MessageBusImpl(options);
  }
  return globalMessageBus;
}

// Common middleware implementations
export const loggingMiddleware: CommunicationMiddleware = {
  name: 'logging',
  priority: 1000,
  async process(message, next) {
    console.debug(`[MessageBus] Processing: ${message.type} from ${message.source}`);
    await next(message);
  },
};

export const validationMiddleware: CommunicationMiddleware = {
  name: 'validation',
  priority: 900,
  async process(message, next) {
    // Basic validation
    if (!message.id || !message.type || !message.source) {
      throw new Error('Invalid message format: missing required fields');
    }
    
    if (!message.timestamp) {
      message.timestamp = Date.now();
    }
    
    await next(message);
  },
};

export const securityMiddleware: CommunicationMiddleware = {
  name: 'security',
  priority: 800,
  async process(message, next) {
    // Security checks - sanitize payload if needed
    if (message.type.includes('AUTH') && message.payload) {
      // Remove sensitive data from logs
      const sanitizedMessage = {
        ...message,
        payload: message.type.includes('PASSWORD') 
          ? { ...message.payload, password: '[REDACTED]' }
          : message.payload,
      };
      
      await next(sanitizedMessage);
    } else {
      await next(message);
    }
  },
};

// Utility functions
export function createMessage<T>(
  type: string,
  payload: T,
  source: string,
  channel: CommunicationChannel = 'events',
  target?: string
): CommunicationMessage<T> {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    channel,
    source,
    target,
    payload,
    timestamp: Date.now(),
  };
}