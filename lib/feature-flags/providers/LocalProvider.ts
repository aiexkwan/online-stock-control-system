import { BaseFeatureFlagProvider } from './BaseProvider';
import { FeatureFlag, FeatureFlagStatus } from '../types';

/**
 * 本地 Feature Flag 提供者
 * 用於開發和測試環境
 */
export class LocalFeatureFlagProvider extends BaseFeatureFlagProvider {
  private flags: Map<string, FeatureFlag> = new Map();
  private configPath?: string;

  constructor(
    initialFlags?: FeatureFlag[],
    options?: {
      configPath?: string;
      autoSave?: boolean;
    }
  ) {
    super();

    // 初始化默認 flags
    if (initialFlags) {
      initialFlags.forEach(flag => this.flags.set(flag.key, flag));
    }

    this.configPath = options?.configPath;

    // 從本地存儲加載（如果在瀏覽器環境）
    if (typeof window !== 'undefined' && !this.configPath) {
      this.loadFromLocalStorage();
    }
  }

  /**
   * 初始化
   */
  async initialize(): Promise<void> {
    // 如果指定了配置文件路徑，從文件加載
    if (this.configPath && typeof window === 'undefined') {
      await this.loadFromFile();
    }

    // 設置默認 flags
    this.setupDefaultFlags();

    // 更新緩存
    this.updateCache();
  }

  /**
   * 獲取所有 Feature Flags
   */
  async getAllFlags(): Promise<FeatureFlag[]> {
    return Array.from(this.flags.values());
  }

  /**
   * 獲取單個 Feature Flag
   */
  async getFlag(key: string): Promise<FeatureFlag | null> {
    return this.flags.get(key) || null;
  }

  /**
   * 更新 Feature Flag
   */
  async updateFlag(key: string, updates: Partial<FeatureFlag>): Promise<void> {
    const existingFlag = this.flags.get(key);
    if (!existingFlag) {
      throw new Error(`Feature flag ${key} not found`);
    }

    const updatedFlag = { ...existingFlag, ...updates };
    this.flags.set(key, updatedFlag);

    // 保存到本地存儲
    this.saveToLocalStorage();

    // 通知訂閱者
    this.notifySubscribers(Array.from(this.flags.values()));
  }

  /**
   * 創建新的 Feature Flag
   */
  async createFlag(flag: FeatureFlag): Promise<void> {
    if (this.flags.has(flag.key)) {
      throw new Error(`Feature flag ${flag.key} already exists`);
    }

    this.flags.set(flag.key, flag);
    this.saveToLocalStorage();
    this.notifySubscribers(Array.from(this.flags.values()));
  }

  /**
   * 刪除 Feature Flag
   */
  async deleteFlag(key: string): Promise<void> {
    if (!this.flags.has(key)) {
      throw new Error(`Feature flag ${key} not found`);
    }

    this.flags.delete(key);
    this.saveToLocalStorage();
    this.notifySubscribers(Array.from(this.flags.values()));
  }

  /**
   * 重置所有 flags 到默認值
   */
  async resetToDefaults(): Promise<void> {
    this.flags.clear();
    this.setupDefaultFlags();
    this.saveToLocalStorage();
    this.notifySubscribers(Array.from(this.flags.values()));
  }

  /**
   * 導出配置
   */
  async exportConfig(): Promise<string> {
    const config = {
      version: '1.0',
      flags: Array.from(this.flags.values()),
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * 導入配置
   */
  async importConfig(configJson: string): Promise<void> {
    try {
      const config = JSON.parse(configJson);

      if (!config.flags || !Array.isArray(config.flags)) {
        throw new Error('Invalid config format');
      }

      this.flags.clear();
      config.flags.forEach((flag: FeatureFlag) => {
        // 轉換日期字符串
        if (flag.startDate) flag.startDate = new Date(flag.startDate);
        if (flag.endDate) flag.endDate = new Date(flag.endDate);

        this.flags.set(flag.key, flag);
      });

      this.saveToLocalStorage();
      this.notifySubscribers(Array.from(this.flags.values()));
    } catch (error) {
      throw new Error(`Failed to import config: ${error}`);
    }
  }

  /**
   * 設置默認 flags
   */
  private setupDefaultFlags(): void {
    const defaults: FeatureFlag[] = [
      {
        key: 'new_dashboard',
        name: 'New Dashboard',
        description: 'Enable the new dashboard design',
        type: 'boolean',
        status: FeatureFlagStatus.ENABLED,
        defaultValue: false,
        rolloutPercentage: 50,
        tags: ['ui', 'experiment'],
      },
      {
        key: 'dark_mode',
        name: 'Dark Mode',
        description: 'Enable dark mode theme',
        type: 'boolean',
        status: FeatureFlagStatus.ENABLED,
        defaultValue: false,
        tags: ['ui', 'theme'],
      },
      {
        key: 'advanced_search',
        name: 'Advanced Search',
        description: 'Enable advanced search features',
        type: 'boolean',
        status: FeatureFlagStatus.PARTIAL,
        defaultValue: false,
        rolloutPercentage: 30,
        tags: ['feature', 'search'],
      },
      {
        key: 'batch_operations',
        name: 'Batch Operations',
        description: 'Enable batch operations for inventory',
        type: 'boolean',
        status: FeatureFlagStatus.ENABLED,
        defaultValue: true,
        rules: [{ type: 'environment', value: ['production'] }],
        tags: ['feature', 'inventory'],
      },
      {
        key: 'ai_predictions',
        name: 'AI Predictions',
        description: 'Enable AI-powered inventory predictions',
        type: 'boolean',
        status: FeatureFlagStatus.DISABLED,
        defaultValue: false,
        tags: ['experimental', 'ai'],
      },
      {
        key: 'theme_variant',
        name: 'Theme Variant',
        description: 'Test different theme variants',
        type: 'variant',
        status: FeatureFlagStatus.ENABLED,
        defaultValue: 'default',
        variants: [
          { key: 'default', name: 'Default Theme', weight: 40 },
          { key: 'modern', name: 'Modern Theme', weight: 30 },
          { key: 'classic', name: 'Classic Theme', weight: 30 },
        ],
        tags: ['ui', 'theme', 'experiment'],
      },
    ];

    // 只添加不存在的默認 flags
    defaults.forEach(flag => {
      if (!this.flags.has(flag.key)) {
        this.flags.set(flag.key, flag);
      }
    });
  }

  /**
   * 更新緩存
   */
  private updateCache(): void {
    this.cache.clear();
    this.flags.forEach((flag, key) => this.cache.set(key, flag));
  }

  /**
   * 保存到本地存儲
   */
  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        version: '1.0',
        flags: Array.from(this.flags.values()),
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem('feature-flags', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save feature flags to localStorage:', error);
    }
  }

  /**
   * 從本地存儲加載
   */
  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('feature-flags');
      if (!stored) return;

      const data = JSON.parse(stored);
      if (!data.flags || !Array.isArray(data.flags)) return;

      this.flags.clear();
      data.flags.forEach((flag: any) => {
        // 轉換日期字符串
        if (flag.startDate) flag.startDate = new Date(flag.startDate);
        if (flag.endDate) flag.endDate = new Date(flag.endDate);

        this.flags.set(flag.key, flag);
      });
    } catch (error) {
      console.error('Failed to load feature flags from localStorage:', error);
    }
  }

  /**
   * 從文件加載（Node.js 環境）
   */
  private async loadFromFile(): Promise<void> {
    if (!this.configPath || typeof window !== 'undefined') return;

    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(this.configPath, 'utf-8');
      await this.importConfig(content);
    } catch (error) {
      console.error('Failed to load feature flags from file:', error);
    }
  }

  /**
   * 保存到文件（Node.js 環境）
   */
  async saveToFile(): Promise<void> {
    if (!this.configPath || typeof window !== 'undefined') return;

    try {
      const fs = await import('fs/promises');
      const content = await this.exportConfig();
      await fs.writeFile(this.configPath, content, 'utf-8');
    } catch (error) {
      console.error('Failed to save feature flags to file:', error);
    }
  }
}
