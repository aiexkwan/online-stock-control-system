import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFeatureFlag, useFeatureFlags, useAllFeatureFlags } from '../hooks/useFeatureFlag';
import { featureFlagManager } from '../FeatureFlagManager';
import { FeatureEvaluation } from '../types';

// Mock the feature flag manager
jest.mock('../FeatureFlagManager', () => ({
  featureFlagManager: {
    evaluate: jest.fn(),
    evaluateAll: jest.fn(),
    getMergedContext: jest.fn((context) => ({ ...context })),
    subscribe: jest.fn(() => () => {}),
    toggleFlag: jest.fn()
  }
}));

describe('Feature Flag Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useFeatureFlag', () => {
    it('should return feature flag evaluation', async () => {
      const mockEvaluation: FeatureEvaluation = {
        enabled: true,
        variant: 'variant-a',
        reason: 'Rule matched'
      };

      (featureFlagManager.evaluate as jest.Mock).mockResolvedValue(mockEvaluation);

      const { result } = renderHook(() => useFeatureFlag('test-flag'));

      // Initial loading state
      expect(result.current.loading).toBe(true);
      expect(result.current.enabled).toBe(false);

      // Wait for evaluation
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.enabled).toBe(true);
      expect(result.current.variant).toBe('variant-a');
      expect(result.current.error).toBeUndefined();
    });

    it('should handle evaluation errors', async () => {
      const mockError = new Error('Evaluation failed');
      (featureFlagManager.evaluate as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useFeatureFlag('error-flag'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.enabled).toBe(false);
      expect(result.current.error).toBe(mockError);
    });

    it('should use provided context', async () => {
      const context = { userId: 'user123', userGroups: ['beta'] };
      
      renderHook(() => useFeatureFlag('test-flag', context));

      await waitFor(() => {
        expect(featureFlagManager.getMergedContext).toHaveBeenCalledWith(context);
      });
    });

    it('should refresh evaluation', async () => {
      const mockEvaluation: FeatureEvaluation = {
        enabled: true,
        reason: 'Default enabled'
      };

      (featureFlagManager.evaluate as jest.Mock).mockResolvedValue(mockEvaluation);

      const { result } = renderHook(() => useFeatureFlag('test-flag'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear mock and set new value
      (featureFlagManager.evaluate as jest.Mock).mockClear();
      (featureFlagManager.evaluate as jest.Mock).mockResolvedValue({
        enabled: false,
        reason: 'Flag disabled'
      });

      // Trigger refresh
      await act(async () => {
        await result.current.refresh();
      });

      expect(featureFlagManager.evaluate).toHaveBeenCalledTimes(1);
    });

    it('should subscribe to flag changes', () => {
      let subscribeCallback: Function;
      (featureFlagManager.subscribe as jest.Mock).mockImplementation((cb) => {
        subscribeCallback = cb;
        return jest.fn(); // unsubscribe function
      });

      const { unmount } = renderHook(() => useFeatureFlag('test-flag'));

      expect(featureFlagManager.subscribe).toHaveBeenCalled();

      // Cleanup on unmount
      unmount();
    });
  });

  describe('useFeatureFlags', () => {
    it('should evaluate multiple flags', async () => {
      const mockEvaluations = {
        'flag1': { enabled: true },
        'flag2': { enabled: false, reason: 'Disabled' }
      };

      (featureFlagManager.evaluate as jest.Mock)
        .mockResolvedValueOnce(mockEvaluations['flag1'])
        .mockResolvedValueOnce(mockEvaluations['flag2']);

      const { result } = renderHook(() => 
        useFeatureFlags(['flag1', 'flag2'])
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.flags).toEqual(mockEvaluations);
      expect(result.current.error).toBeUndefined();
    });

    it('should handle partial failures', async () => {
      (featureFlagManager.evaluate as jest.Mock)
        .mockResolvedValueOnce({ enabled: true })
        .mockRejectedValueOnce(new Error('Flag not found'));

      const { result } = renderHook(() => 
        useFeatureFlags(['flag1', 'flag2'])
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useAllFeatureFlags', () => {
    it('should evaluate all flags', async () => {
      const mockEvaluations = {
        'flag1': { enabled: true },
        'flag2': { enabled: false },
        'flag3': { enabled: true, variant: 'variant-b' }
      };

      (featureFlagManager.evaluateAll as jest.Mock).mockResolvedValue(mockEvaluations);

      const { result } = renderHook(() => useAllFeatureFlags());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.flags).toEqual(mockEvaluations);
      expect(result.current.error).toBeUndefined();
    });

    it('should use provided context', async () => {
      const context = { environment: 'staging' as const };
      
      renderHook(() => useAllFeatureFlags(context));

      await waitFor(() => {
        expect(featureFlagManager.getMergedContext).toHaveBeenCalledWith(context);
      });
    });
  });
});