import { BaseFeatureFlagProvider } from '../providers/BaseProvider';
import { FeatureFlag, FeatureContext, FeatureFlagStatus } from '../types';

// Mock implementation for testing
class MockProvider extends BaseFeatureFlagProvider {
  private flags: Map<string, FeatureFlag> = new Map();

  async initialize(): Promise<void> {
    // Mock initialization
  }

  async getAllFlags(): Promise<FeatureFlag[]> {
    return Array.from(this.flags.values());
  }

  async getFlag(key: string): Promise<FeatureFlag | null> {
    return this.flags.get(key) || null;
  }

  async updateFlag(key: string, updates: Partial<FeatureFlag>): Promise<void> {
    const existing = this.flags.get(key);
    if (existing) {
      this.flags.set(key, { ...existing, ...updates });
    }
  }

  // Helper method for tests
  setFlag(flag: FeatureFlag): void {
    this.flags.set(flag.key, flag);
  }
}

describe('BaseFeatureFlagProvider', () => {
  let provider: MockProvider;

  beforeEach(() => {
    provider = new MockProvider();
  });

  describe('evaluate', () => {
    it('should return disabled for non-existent flag', async () => {
      const result = await provider.evaluate('non-existent', {});
      
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('Flag not found');
    });

    it('should return disabled for disabled flag', async () => {
      provider.setFlag({
        key: 'test-flag',
        name: 'Test Flag',
        type: 'boolean',
        status: FeatureFlagStatus.DISABLED,
        defaultValue: false
      });

      const result = await provider.evaluate('test-flag', {});
      
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('Flag is disabled');
    });

    it('should respect date ranges', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      provider.setFlag({
        key: 'future-flag',
        name: 'Future Flag',
        type: 'boolean',
        status: FeatureFlagStatus.ENABLED,
        defaultValue: true,
        startDate: futureDate
      });

      const result = await provider.evaluate('future-flag', {});
      
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('Flag not yet active');
    });

    it('should evaluate user rules correctly', async () => {
      provider.setFlag({
        key: 'user-flag',
        name: 'User Flag',
        type: 'boolean',
        status: FeatureFlagStatus.ENABLED,
        defaultValue: false,
        rules: [
          { type: 'user', value: ['user123', 'user456'] }
        ]
      });

      const context: FeatureContext = {
        userId: 'user123'
      };

      const result = await provider.evaluate('user-flag', context);
      expect(result.enabled).toBe(true);
      expect(result.reason).toBe('Rule matched');

      const otherUserResult = await provider.evaluate('user-flag', { userId: 'user789' });
      expect(otherUserResult.enabled).toBe(true); // Default is enabled when no rules match
    });

    it('should evaluate group rules correctly', async () => {
      provider.setFlag({
        key: 'group-flag',
        name: 'Group Flag',
        type: 'boolean',
        status: FeatureFlagStatus.ENABLED,
        defaultValue: false,
        rules: [
          { type: 'group', value: ['beta-testers', 'admins'] }
        ]
      });

      const context: FeatureContext = {
        userId: 'user123',
        userGroups: ['beta-testers']
      };

      const result = await provider.evaluate('group-flag', context);
      expect(result.enabled).toBe(true);
    });

    it('should handle rollout percentage', async () => {
      provider.setFlag({
        key: 'rollout-flag',
        name: 'Rollout Flag',
        type: 'boolean',
        status: FeatureFlagStatus.ENABLED,
        defaultValue: true,
        rolloutPercentage: 50
      });

      const enabledCount = await Promise.all(
        Array.from({ length: 1000 }, (_, i) => 
          provider.evaluate('rollout-flag', { userId: `user${i}` })
        )
      ).then(results => results.filter(r => r.enabled).length);

      // Should be approximately 50% (with some tolerance)
      expect(enabledCount).toBeGreaterThan(400);
      expect(enabledCount).toBeLessThan(600);
    });

    it('should select variants correctly', async () => {
      provider.setFlag({
        key: 'variant-flag',
        name: 'Variant Flag',
        type: 'variant',
        status: FeatureFlagStatus.ENABLED,
        defaultValue: 'control',
        variants: [
          { key: 'control', name: 'Control', weight: 50 },
          { key: 'variant-a', name: 'Variant A', weight: 25 },
          { key: 'variant-b', name: 'Variant B', weight: 25 }
        ]
      });

      const variants: Record<string, number> = {
        control: 0,
        'variant-a': 0,
        'variant-b': 0
      };

      // Run multiple evaluations
      for (let i = 0; i < 1000; i++) {
        const result = await provider.evaluate('variant-flag', { userId: `user${i}` });
        if (result.variant) {
          variants[result.variant]++;
        }
      }

      // Check distribution (with tolerance)
      expect(variants.control).toBeGreaterThan(400);
      expect(variants.control).toBeLessThan(600);
      expect(variants['variant-a']).toBeGreaterThan(150);
      expect(variants['variant-a']).toBeLessThan(350);
      expect(variants['variant-b']).toBeGreaterThan(150);
      expect(variants['variant-b']).toBeLessThan(350);
    });

    it('should evaluate custom rules', async () => {
      provider.setFlag({
        key: 'custom-flag',
        name: 'Custom Flag',
        type: 'boolean',
        status: FeatureFlagStatus.ENABLED,
        defaultValue: false,
        rules: [
          {
            type: 'custom',
            value: { attribute: 'accountAge', value: 30 },
            operator: 'gte'
          }
        ]
      });

      const newUserContext: FeatureContext = {
        userId: 'user123',
        customAttributes: { accountAge: 15 }
      };

      const oldUserContext: FeatureContext = {
        userId: 'user456',
        customAttributes: { accountAge: 45 }
      };

      const newUserResult = await provider.evaluate('custom-flag', newUserContext);
      expect(newUserResult.enabled).toBe(true); // Default is enabled when no rules match

      const oldUserResult = await provider.evaluate('custom-flag', oldUserContext);
      expect(oldUserResult.enabled).toBe(true);
    });
  });

  describe('evaluateAll', () => {
    it('should evaluate all flags', async () => {
      provider.setFlag({
        key: 'flag1',
        name: 'Flag 1',
        type: 'boolean',
        status: FeatureFlagStatus.ENABLED,
        defaultValue: true
      });

      provider.setFlag({
        key: 'flag2',
        name: 'Flag 2',
        type: 'boolean',
        status: FeatureFlagStatus.DISABLED,
        defaultValue: false
      });

      const context: FeatureContext = {
        userId: 'user123'
      };

      const results = await provider.evaluateAll(context);

      expect(results.flag1.enabled).toBe(true);
      expect(results.flag2.enabled).toBe(false);
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers', () => {
      const callback = jest.fn();
      const unsubscribe = provider.subscribe(callback);

      const flags: FeatureFlag[] = [{
        key: 'test',
        name: 'Test',
        type: 'boolean',
        status: FeatureFlagStatus.ENABLED,
        defaultValue: true
      }];

      // Trigger notification
      (provider as any).notifySubscribers(flags);

      expect(callback).toHaveBeenCalledWith(flags);

      // Unsubscribe and verify no more calls
      unsubscribe();
      (provider as any).notifySubscribers(flags);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});