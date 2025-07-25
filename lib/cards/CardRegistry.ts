/**
 * Card Registry - 輕量級註冊系統
 * 管理所有 Card 的註冊和查詢
 * 
 * @module CardRegistry
 * @version 1.0.0
 */

import { ComponentType } from 'react';
import { 
  CardDefinition, 
  CardManifest, 
  CardRegistrationOptions,
  CardError 
} from './types';

/**
 * Card 註冊表
 * 使用 Map 存儲所有已註冊的 Cards
 */
export class CardRegistry {
  private static cards = new Map<string, CardDefinition>();
  private static registrationCallbacks: ((card: CardDefinition) => void)[] = [];

  /**
   * 註冊一個 Card
   */
  static register(
    definition: CardDefinition, 
    options: CardRegistrationOptions = {}
  ): void {
    const { override = false, validate = true } = options;

    // 檢查是否已存在
    if (this.cards.has(definition.type) && !override) {
      throw new CardError(
        `Card type "${definition.type}" is already registered`,
        'CARD_ALREADY_REGISTERED',
        definition.type
      );
    }

    // 驗證 manifest
    if (validate) {
      this.validateManifest(definition.manifest);
    }

    // 註冊 Card
    this.cards.set(definition.type, definition);

    // 觸發註冊回調
    this.registrationCallbacks.forEach(callback => {
      try {
        callback(definition);
      } catch (error) {
        console.error('[CardRegistry] Registration callback error:', error);
      }
    });

    console.debug(`[CardRegistry] Registered card: ${definition.type}`);
  }

  /**
   * 獲取指定類型的 Card
   */
  static get(type: string): CardDefinition | undefined {
    return this.cards.get(type);
  }

  /**
   * 獲取所有已註冊的 Cards
   */
  static getAll(): CardDefinition[] {
    return Array.from(this.cards.values());
  }

  /**
   * 按分類獲取 Cards
   */
  static getByCategory(category: string): CardDefinition[] {
    return this.getAll().filter(card => card.manifest.category === category);
  }

  /**
   * 檢查 Card 是否已註冊
   */
  static has(type: string): boolean {
    return this.cards.has(type);
  }

  /**
   * 移除註冊的 Card
   */
  static unregister(type: string): boolean {
    return this.cards.delete(type);
  }

  /**
   * 清空所有註冊
   */
  static clear(): void {
    this.cards.clear();
  }

  /**
   * 添加註冊回調
   */
  static onRegister(callback: (card: CardDefinition) => void): () => void {
    this.registrationCallbacks.push(callback);
    
    // 返回取消訂閱函數
    return () => {
      const index = this.registrationCallbacks.indexOf(callback);
      if (index > -1) {
        this.registrationCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 驗證 Card manifest
   */
  private static validateManifest(manifest: CardManifest): void {
    const errors: string[] = [];

    // 必填字段檢查
    if (!manifest.type) {
      errors.push('Manifest must have a type');
    }
    if (!manifest.name) {
      errors.push('Manifest must have a name');
    }
    if (!manifest.version) {
      errors.push('Manifest must have a version');
    }
    if (!manifest.category) {
      errors.push('Manifest must have a category');
    }
    if (!manifest.description) {
      errors.push('Manifest must have a description');
    }

    // 配置架構檢查
    if (!manifest.configSchema || !manifest.configSchema.properties) {
      errors.push('Manifest must have a configSchema with properties');
    }

    // 版本格式檢查
    if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
      errors.push('Version must follow semantic versioning (e.g., 1.0.0)');
    }

    // 性能預算檢查
    if (manifest.performance) {
      if (manifest.performance.maxBundleSize && manifest.performance.maxBundleSize <= 0) {
        errors.push('maxBundleSize must be positive');
      }
      if (manifest.performance.maxRenderTime && manifest.performance.maxRenderTime <= 0) {
        errors.push('maxRenderTime must be positive');
      }
    }

    if (errors.length > 0) {
      throw new CardError(
        'Invalid card manifest',
        'INVALID_MANIFEST',
        manifest.type,
        errors
      );
    }
  }

  /**
   * 獲取註冊統計
   */
  static getStats(): {
    totalCards: number;
    byCategory: Record<string, number>;
    withCapabilities: {
      realtime: number;
      export: number;
      print: number;
      mobile: number;
    };
  } {
    const cards = this.getAll();
    const byCategory: Record<string, number> = {};
    const withCapabilities = {
      realtime: 0,
      export: 0,
      print: 0,
      mobile: 0,
    };

    cards.forEach(card => {
      // 統計分類
      const category = card.manifest.category;
      byCategory[category] = (byCategory[category] || 0) + 1;

      // 統計能力
      const capabilities = card.manifest.capabilities || {};
      if (capabilities.realtime) withCapabilities.realtime++;
      if (capabilities.export) withCapabilities.export++;
      if (capabilities.print) withCapabilities.print++;
      if (capabilities.mobile) withCapabilities.mobile++;
    });

    return {
      totalCards: cards.length,
      byCategory,
      withCapabilities,
    };
  }

  /**
   * 搜索 Cards
   */
  static search(query: {
    name?: string;
    category?: string;
    capabilities?: Partial<CardManifest['capabilities']>;
  }): CardDefinition[] {
    return this.getAll().filter(card => {
      const manifest = card.manifest;

      // 名稱匹配
      if (query.name && !manifest.name.toLowerCase().includes(query.name.toLowerCase())) {
        return false;
      }

      // 分類匹配
      if (query.category && manifest.category !== query.category) {
        return false;
      }

      // 能力匹配
      if (query.capabilities) {
        const cardCapabilities = manifest.capabilities || {};
        for (const [key, value] of Object.entries(query.capabilities)) {
          if (value && !cardCapabilities[key as keyof typeof cardCapabilities]) {
            return false;
          }
        }
      }

      return true;
    });
  }
}

/**
 * Card 註冊裝飾器
 * 用於自動註冊 Card 組件
 */
export function registerCard(manifest: CardManifest) {
  return function <T extends ComponentType<any>>(Component: T): T {
    // 自動註冊到 Registry
    CardRegistry.register({
      type: manifest.type,
      manifest,
      component: Component,
    });

    // 添加靜態屬性
    (Component as any).cardType = manifest.type;
    (Component as any).cardManifest = manifest;

    return Component;
  };
}

/**
 * 批量註冊 Cards
 */
export function registerCards(definitions: CardDefinition[]): void {
  definitions.forEach(definition => {
    CardRegistry.register(definition);
  });
}

/**
 * 條件註冊
 */
export function registerCardIf(
  condition: boolean | (() => boolean),
  definition: CardDefinition
): void {
  const shouldRegister = typeof condition === 'function' ? condition() : condition;
  
  if (shouldRegister) {
    CardRegistry.register(definition);
  }
}

// 導出便捷方法
export const getCard = (type: string) => CardRegistry.get(type);
export const getAllCards = () => CardRegistry.getAll();
export const hasCard = (type: string) => CardRegistry.has(type);
export const searchCards = (query: Parameters<typeof CardRegistry.search>[0]) => 
  CardRegistry.search(query);