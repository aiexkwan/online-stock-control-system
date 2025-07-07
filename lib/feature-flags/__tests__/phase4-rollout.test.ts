/**
 * Phase 4 Rollout Configuration Tests
 */

import {
  phase4FeatureFlags,
  getUserFeatureFlags,
  shouldRunTests,
  getCurrentCoverageTarget
} from '../configs/phase4-rollout';
import { FeatureFlagStatus } from '../types';

describe('Phase 4 Rollout Configuration', () => {
  describe('phase4FeatureFlags', () => {
    it('should define all required feature flags', () => {
      const expectedFlags = [
        'phase4_testing_infrastructure',
        'jest_unit_tests',
        'github_actions_ci',
        'e2e_testing',
        'test_coverage_enforcement',
        'performance_monitoring',
        'gradual_migration'
      ];

      const actualFlags = phase4FeatureFlags.map(f => f.key);
      expect(actualFlags).toEqual(expect.arrayContaining(expectedFlags));
    });

    it('should have valid configuration for each flag', () => {
      phase4FeatureFlags.forEach(flag => {
        expect(flag.key).toBeTruthy();
        expect(flag.name).toBeTruthy();
        expect(flag.type).toMatch(/^(boolean|percentage|variant|release)$/);
        expect(Object.values(FeatureFlagStatus)).toContain(flag.status);
        expect(flag.defaultValue).toBeDefined();
      });
    });

    it('should have rollout percentage for percentage-type flags', () => {
      const percentageFlags = phase4FeatureFlags.filter(f => f.type === 'percentage');
      
      percentageFlags.forEach(flag => {
        if (flag.status === FeatureFlagStatus.PARTIAL) {
          expect(flag.rolloutPercentage).toBeDefined();
          expect(flag.rolloutPercentage).toBeGreaterThanOrEqual(0);
          expect(flag.rolloutPercentage).toBeLessThanOrEqual(100);
        }
      });
    });

    it('should have variants for variant-type flags', () => {
      const variantFlags = phase4FeatureFlags.filter(f => f.type === 'variant');
      
      variantFlags.forEach(flag => {
        expect(flag.variants).toBeDefined();
        expect(flag.variants!.length).toBeGreaterThan(0);
        
        // Check variant weights sum to 100
        const totalWeight = flag.variants!.reduce((sum, v) => sum + (v.weight || 0), 0);
        expect(totalWeight).toBe(100);
      });
    });
  });

  describe('getUserFeatureFlags', () => {
    it('should return flags for test users', () => {
      const testUserFlags = getUserFeatureFlags('test@pennineindustries.com');
      
      expect(testUserFlags.phase4_testing_infrastructure).toBe(true);
      expect(testUserFlags.jest_unit_tests).toBe(true);
    });

    it('should return flags for admin users', () => {
      const adminFlags = getUserFeatureFlags('akwan@pennineindustries.com');
      
      expect(adminFlags.phase4_testing_infrastructure).toBe(true);
    });

    it('should use percentage rollout for regular users', () => {
      // Test multiple users to verify percentage distribution
      const results: Record<string, number> = {
        enabled: 0,
        disabled: 0
      };

      // Test with flags that have percentage rollout
      for (let i = 0; i < 100; i++) {
        const flags = getUserFeatureFlags(`user${i}@example.com`);
        // Check github_actions_ci which has 50% rollout
        if (flags.github_actions_ci) {
          results.enabled++;
        } else {
          results.disabled++;
        }
      }

      // Should have some enabled (for 50% rollout)
      expect(results.enabled).toBeGreaterThan(30); // At least 30%
      expect(results.enabled).toBeLessThan(70); // At most 70%
    });

    it('should respect default values', () => {
      const flags = getUserFeatureFlags('unknown@example.com');
      
      // jest_unit_tests has defaultValue: true
      expect(flags.jest_unit_tests).toBe(true);
      
      // phase4_testing_infrastructure has defaultValue: false
      expect(flags.phase4_testing_infrastructure).toBe(false);
    });
  });

  describe('shouldRunTests', () => {
    it('should always run tests in development environment', () => {
      const result = shouldRunTests({
        environment: 'development',
        testType: 'unit'
      });

      expect(result).toBe(true);
    });

    it('should check unit test flag for unit tests', () => {
      const result = shouldRunTests({
        environment: 'production',
        testType: 'unit'
      });

      // Should return true because jest_unit_tests is enabled by default
      expect(result).toBe(true);
    });

    it('should check e2e test flag for e2e tests', () => {
      const result = shouldRunTests({
        environment: 'production',
        testType: 'e2e'
      });

      // Should check the e2e_testing flag status
      const e2eFlag = phase4FeatureFlags.find(f => f.key === 'e2e_testing');
      expect(result).toBe(e2eFlag?.defaultValue as boolean);
    });

    it('should respect user-specific flags', () => {
      const result = shouldRunTests({
        environment: 'production',
        userId: 'test@pennineindustries.com',
        testType: 'unit'
      });

      expect(result).toBe(true);
    });

    it('should return false for disabled flags', () => {
      // Mock a disabled flag
      const originalFlag = phase4FeatureFlags.find(f => f.key === 'e2e_testing');
      if (originalFlag) {
        originalFlag.status = FeatureFlagStatus.DISABLED;
      }

      const result = shouldRunTests({
        environment: 'production',
        testType: 'e2e'
      });

      expect(result).toBe(false);

      // Restore original status
      if (originalFlag) {
        originalFlag.status = FeatureFlagStatus.PARTIAL;
      }
    });
  });

  describe('getCurrentCoverageTarget', () => {
    beforeEach(() => {
      // Mock current date
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return current coverage if no milestones reached', () => {
      jest.setSystemTime(new Date('2025-01-06'));
      
      const target = getCurrentCoverageTarget();
      expect(target).toBe(10.4);
    });

    it('should return milestone target after milestone date', () => {
      jest.setSystemTime(new Date('2025-01-11'));
      
      const target = getCurrentCoverageTarget();
      expect(target).toBe(30);
    });

    it('should return highest reached milestone', () => {
      jest.setSystemTime(new Date('2025-01-14'));
      
      const target = getCurrentCoverageTarget();
      expect(target).toBe(50);
    });

    it('should return final milestone after all dates', () => {
      jest.setSystemTime(new Date('2025-01-21'));
      
      const target = getCurrentCoverageTarget();
      expect(target).toBe(80);
    });

    it('should handle missing metadata gracefully', () => {
      const originalFlag = phase4FeatureFlags.find(f => f.key === 'jest_unit_tests');
      const originalMetadata = originalFlag?.metadata;
      
      if (originalFlag) {
        originalFlag.metadata = undefined;
      }

      const target = getCurrentCoverageTarget();
      expect(target).toBe(10);

      // Restore
      if (originalFlag) {
        originalFlag.metadata = originalMetadata;
      }
    });
  });

  describe('Feature Flag Integration', () => {
    it('should have consistent naming conventions', () => {
      phase4FeatureFlags.forEach(flag => {
        // Key should be snake_case (allow numbers)
        expect(flag.key).toMatch(/^[a-z0-9]+(_[a-z0-9]+)*$/);
        
        // Name should be Title Case (allow numbers and special chars)
        expect(flag.name).toMatch(/^[A-Z][a-zA-Z0-9\s:/-]+$/);
      });
    });

    it('should have appropriate tags', () => {
      phase4FeatureFlags.forEach(flag => {
        expect(flag.tags).toBeDefined();
        expect(flag.tags!.length).toBeGreaterThan(0);
        
        // All phase 4 flags should have related tags
        if (flag.key.includes('test')) {
          expect(flag.tags).toContain('testing');
        }
      });
    });

    it('should have metadata for tracking', () => {
      const infrastructureFlag = phase4FeatureFlags.find(
        f => f.key === 'phase4_testing_infrastructure'
      );

      expect(infrastructureFlag?.metadata).toBeDefined();
      expect(infrastructureFlag?.metadata?.phase).toBe(4);
      expect(infrastructureFlag?.metadata?.startDate).toBeDefined();
    });
  });
});