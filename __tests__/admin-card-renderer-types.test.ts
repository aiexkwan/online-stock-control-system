/**
 * Admin Card Renderer Type Safety Tests
 * Validates type conversions and backward compatibility
 */

import { describe, it, expect, jest } from '@jest/globals';
import {
  MetricTypeSchema,
  ChartTypeSchema,
  CategoryTypeSchema,
  SearchModeSchema,
  SearchEntitySchema,
  PrefilledDataSchema,
  safeParseChartType,
  safeParseCategory,
  safeParseSearchMode,
  safeParseSearchEntities,
  migrateMetrics
} from '@/lib/types/admin-cards';

describe('AdminCardRenderer Type Safety', () => {
  // Mock console.warn to track warnings
  const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  afterEach(() => {
    consoleWarnSpy.mockClear();
  });

  describe('MetricType validation', () => {
    it('should handle legacy metric formats', () => {
      const legacyMetrics = ['COUNT', 'SUM'];
      const converted = migrateMetrics(legacyMetrics);
      
      expect(converted).toHaveLength(2);
      expect(converted[0]).toEqual({ type: 'COUNT' });
      expect(converted[1]).toEqual({ type: 'SUM' });
    });

    it('should handle invalid metric types with fallback', () => {
      const invalidMetrics = ['INVALID', 'COUNT', 'UNKNOWN'];
      const converted = migrateMetrics(invalidMetrics);
      
      expect(converted).toHaveLength(3);
      expect(converted[0].type).toBe('COUNT'); // Fallback
      expect(converted[1].type).toBe('COUNT');
      expect(converted[2].type).toBe('COUNT'); // Fallback
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle complex metric objects', () => {
      const complexMetrics = [
        { type: 'COUNT', label: 'Total Orders' },
        { type: 'AVERAGE', value: 123.45 }
      ];
      const converted = migrateMetrics(complexMetrics);
      
      expect(converted).toHaveLength(2);
      expect(converted[0]).toEqual({ type: 'COUNT', label: 'Total Orders' });
      expect(converted[1]).toEqual({ type: 'AVERAGE', value: 123.45 });
    });
  });

  describe('ChartType validation', () => {
    it('should validate valid chart types', () => {
      expect(() => ChartTypeSchema.parse('line')).not.toThrow();
      expect(() => ChartTypeSchema.parse('bar')).not.toThrow();
      expect(() => ChartTypeSchema.parse('pie')).not.toThrow();
      expect(() => ChartTypeSchema.parse('area')).not.toThrow();
      expect(() => ChartTypeSchema.parse('scatter')).not.toThrow();
    });

    it('should reject invalid chart types', () => {
      expect(() => ChartTypeSchema.parse('invalid')).toThrow();
      expect(() => ChartTypeSchema.parse('')).toThrow();
      expect(() => ChartTypeSchema.parse(null)).toThrow();
    });

    it('should use safe parsing with fallback', () => {
      expect(safeParseChartType('line')).toBe('line');
      expect(safeParseChartType('invalid')).toBe('line');
      expect(safeParseChartType(null)).toBe('line');
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('CategoryType validation', () => {
    it('should validate all category types', () => {
      const validCategories = ['SYSTEM', 'USER', 'ADMIN', 'PUBLIC', 'USER_PREFERENCES', 
                               'DEPARTMENT', 'NOTIFICATION', 'API', 'SECURITY', 'DISPLAY', 'WORKFLOW'];
      
      validCategories.forEach(category => {
        expect(() => CategoryTypeSchema.parse(category)).not.toThrow();
      });
    });

    it('should use safe parsing with fallback for categories', () => {
      expect(safeParseCategory('SYSTEM')).toBe('SYSTEM');
      expect(safeParseCategory('USER_PREFERENCES')).toBe('USER_PREFERENCES');
      expect(safeParseCategory('INVALID')).toBe('SYSTEM');
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('SearchMode validation', () => {
    it('should validate search modes', () => {
      expect(() => SearchModeSchema.parse('GLOBAL')).not.toThrow();
      expect(() => SearchModeSchema.parse('LOCAL')).not.toThrow();
      expect(() => SearchModeSchema.parse('SPECIFIC')).not.toThrow();
      expect(() => SearchModeSchema.parse('ADVANCED')).not.toThrow();
    });

    it('should use safe parsing for search modes', () => {
      expect(safeParseSearchMode('GLOBAL')).toBe('GLOBAL');
      expect(safeParseSearchMode('INVALID')).toBe('GLOBAL');
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('SearchEntity validation', () => {
    it('should validate search entities', () => {
      const validEntities = ['PRODUCT', 'PALLET', 'ORDER', 'SUPPLIER', 'LOCATION', 'USER', 'CUSTOMER'];
      
      validEntities.forEach(entity => {
        expect(() => SearchEntitySchema.parse(entity)).not.toThrow();
      });
    });

    it('should handle array of search entities with safe parsing', () => {
      const entities = ['PRODUCT', 'INVALID', 'PALLET', 'UNKNOWN'];
      const result = safeParseSearchEntities(entities);
      
      expect(result).toEqual(['PRODUCT', 'PALLET']);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    });

    it('should return default entities when all invalid', () => {
      const entities = ['INVALID1', 'INVALID2'];
      const result = safeParseSearchEntities(entities);
      
      expect(result).toEqual(['PRODUCT', 'PALLET']);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('PrefilledData validation', () => {
    it('should handle various data types in prefilled data', () => {
      const data = {
        name: 'Test Product',
        quantity: 100,
        isActive: true,
        createdAt: new Date(),
        tags: ['tag1', 'tag2']
      };
      
      expect(() => PrefilledDataSchema.parse(data)).not.toThrow();
    });

    it('should reject nested objects in prefilled data', () => {
      const data = {
        name: 'Test',
        nested: { invalid: 'object' }
      };
      
      expect(() => PrefilledDataSchema.parse(data)).toThrow();
    });
  });

  describe('Integration with AdminCardRenderer', () => {
    it('should maintain backward compatibility for all conversions', () => {
      // Test data that would come from config
      const testConfig = {
        metrics: ['COUNT', 'SUM', 'INVALID'],
        chartType: 'line',
        dataSource: 'SYSTEM',
        searchMode: 'GLOBAL',
        searchEntities: ['PRODUCT', 'INVALID', 'PALLET']
      };

      // Simulate the conversions done in AdminCardRenderer
      const metrics = migrateMetrics(testConfig.metrics);
      const chartType = safeParseChartType(testConfig.chartType);
      const category = safeParseCategory(testConfig.dataSource);
      const searchMode = safeParseSearchMode(testConfig.searchMode);
      const searchEntities = safeParseSearchEntities(testConfig.searchEntities);

      // Verify results
      expect(metrics).toHaveLength(3);
      expect(metrics[0].type).toBe('COUNT');
      expect(metrics[1].type).toBe('SUM');
      expect(metrics[2].type).toBe('COUNT'); // Fallback
      
      expect(chartType).toBe('line');
      expect(category).toBe('SYSTEM');
      expect(searchMode).toBe('GLOBAL');
      expect(searchEntities).toEqual(['PRODUCT', 'PALLET']);
    });
  });
});