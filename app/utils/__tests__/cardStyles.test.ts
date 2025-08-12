import { CardStyles, getCardStyle } from '../cardStyles';

describe('cardStyles', () => {
  describe('CardStyles object', () => {
    it('should have base style', () => {
      expect(CardStyles.base).toBe('bg-white/3 backdrop-blur-md');
    });

    it('should have all card border definitions', () => {
      const expectedBorders = [
        // Statistics
        'VOID_STATS',
        // Charts & Analytics
        'PRODUCT_MIX_CHART',
        // Operations
        'RECENT_ACTIVITY',
        'ACO_ORDER_PROGRESS',
        'FINISHED_PRODUCT',
        'MATERIAL_RECEIVED',
        // Tools
        'ASK_DATABASE',
        // System Tools
        'VOID_PALLET',
        // Document Management
        'UPLOAD_FILES',
        'REPORTS',
        'PRODUCT_SPEC',
        'CUSTOM',
        // Lowercase versions
        'void_stats',
        'product_mix_chart',
        'recent_activity',
        'aco_order_progress',
        'finished_product',
        'material_received',
        'ask_database',
        'void_pallet',
        'upload_files',
        'reports',
        'product_spec',
        'custom'
      ];

      expectedBorders.forEach(border => {
        expect(CardStyles.borders).toHaveProperty(border);
      });
    });

    it('should have empty string for all borders (no border effect)', () => {
      Object.values(CardStyles.borders).forEach(borderValue => {
        expect(borderValue).toBe('');
      });
    });

    it('should have text color definitions', () => {
      // Table colors (purple)
      expect(CardStyles.text.table).toBe('text-purple-400');
      expect(CardStyles.text.tableHeader).toBe('text-purple-300');
      expect(CardStyles.text.tableData).toBe('text-purple-200');

      // Chart colors (green)
      expect(CardStyles.text.chart).toBe('text-green-400');
      expect(CardStyles.text.chartLabel).toBe('text-green-300');
      expect(CardStyles.text.chartData).toBe('text-green-200');

      // General text colors
      expect(CardStyles.text.title).toBe('text-white');
      expect(CardStyles.text.subtitle).toBe('text-slate-300');
      expect(CardStyles.text.description).toBe('text-slate-400');
    });

    it('should have quickAccess button configurations', () => {
      // Reports buttons
      expect(CardStyles.quickAccess.reports).toHaveProperty('Void Pallet Report');
      expect(CardStyles.quickAccess.reports).toHaveProperty('Order Loading Report');
      expect(CardStyles.quickAccess.reports).toHaveProperty('Stock Take Report');
      expect(CardStyles.quickAccess.reports).toHaveProperty('ACO Order Report');
      expect(CardStyles.quickAccess.reports).toHaveProperty('Transaction Report');
      expect(CardStyles.quickAccess.reports).toHaveProperty('GRN Report');
      expect(CardStyles.quickAccess.reports).toHaveProperty('Export All Data');

      // System update buttons
      expect(CardStyles.quickAccess.systemUpdate).toHaveProperty('Update Product Info');
      expect(CardStyles.quickAccess.systemUpdate).toHaveProperty('Update Supplier Info');

      // Document upload buttons
      expect(CardStyles.quickAccess.documentUpload).toHaveProperty('Upload Files');
      expect(CardStyles.quickAccess.documentUpload).toHaveProperty('Upload Order PDF');
      expect(CardStyles.quickAccess.documentUpload).toHaveProperty('Upload Spec');

      // Void pallet button
      expect(CardStyles.quickAccess.voidPallet).toBeDefined();
    });

    it('should have gradient styles for all quick access buttons', () => {
      // Check reports buttons
      Object.values(CardStyles.quickAccess.reports).forEach(style => {
        expect(style).toContain('bg-gradient-to-r');
        expect(style).toContain('hover:from-');
        expect(style).toContain('hover:to-');
      });

      // Check system update buttons
      Object.values(CardStyles.quickAccess.systemUpdate).forEach(style => {
        expect(style).toContain('bg-gradient-to-r');
        expect(style).toContain('hover:from-');
        expect(style).toContain('hover:to-');
      });

      // Check document upload buttons
      Object.values(CardStyles.quickAccess.documentUpload).forEach(style => {
        expect(style).toContain('bg-gradient-to-r');
        expect(style).toContain('hover:from-');
        expect(style).toContain('hover:to-');
      });

      // Check void pallet button
      expect(CardStyles.quickAccess.voidPallet).toContain('bg-gradient-to-r');
    });

    it('should have chart color configuration', () => {
      expect(CardStyles.charts.line).toBe('#10b981');
      expect(CardStyles.charts.bar).toBe('#10b981');
      expect(CardStyles.charts.area).toBe('#10b981');
      expect(CardStyles.charts.pie).toEqual([
        '#10b981',
        '#34d399',
        '#6ee7b7',
        '#86efac',
        '#bbf7d0'
      ]);
    });

    it('should use green color palette for charts', () => {
      // All non-pie charts use the same green
      expect(CardStyles.charts.line).toBe(CardStyles.charts.bar);
      expect(CardStyles.charts.line).toBe(CardStyles.charts.area);

      // Pie chart uses gradient of greens
      CardStyles.charts.pie.forEach(color => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });

  describe('getCardStyle function', () => {
    it('should return base style for unknown card types', () => {
      const style = getCardStyle('UNKNOWN_WIDGET');
      expect(style).toBe('bg-white/3 backdrop-blur-md ');
    });

    it('should return base style for all known card types (no borders)', () => {
      const cardTypes = [
        'VOID_STATS',
        'PRODUCT_MIX_CHART',
        'RECENT_ACTIVITY',
        'ACO_ORDER_PROGRESS',
        'ASK_DATABASE',
        'VOID_PALLET'
      ];

      cardTypes.forEach(type => {
        const style = getCardStyle(type);
        expect(style).toBe('bg-white/3 backdrop-blur-md ');
      });
    });

    it('should handle lowercase card types', () => {
      const style = getCardStyle('void_stats');
      expect(style).toBe('bg-white/3 backdrop-blur-md ');
    });

    it('should handle null and undefined', () => {
      expect(getCardStyle(null as any)).toBe('bg-white/3 backdrop-blur-md ');
      expect(getCardStyle(undefined as any)).toBe('bg-white/3 backdrop-blur-md ');
    });

    it('should handle empty string', () => {
      const style = getCardStyle('');
      expect(style).toBe('bg-white/3 backdrop-blur-md ');
    });
  });

  describe('style consistency', () => {
    it('should use consistent gradient patterns', () => {
      const allButtonStyles = [
        ...Object.values(CardStyles.quickAccess.reports),
        ...Object.values(CardStyles.quickAccess.systemUpdate),
        ...Object.values(CardStyles.quickAccess.documentUpload),
        CardStyles.quickAccess.voidPallet
      ];

      allButtonStyles.forEach(style => {
        // All should have gradient
        expect(style).toContain('bg-gradient-to-r');
        // All should have from- and to- colors
        expect(style).toMatch(/from-\w+-600/);
        expect(style).toMatch(/to-\w+-600/);
        // All should have hover states
        expect(style).toMatch(/hover:from-\w+-500/);
        expect(style).toMatch(/hover:to-\w+-500/);
      });
    });

    it('should use 600 for default and 500 for hover states', () => {
      const voidPalletStyle = CardStyles.quickAccess.voidPallet;
      expect(voidPalletStyle).toContain('from-red-600');
      expect(voidPalletStyle).toContain('to-rose-600');
      expect(voidPalletStyle).toContain('hover:from-red-500');
      expect(voidPalletStyle).toContain('hover:to-rose-500');
    });

    it('should have uppercase and lowercase versions synchronized', () => {
      const uppercaseKeys = Object.keys(CardStyles.borders).filter(k => k === k.toUpperCase());
      const lowercaseKeys = Object.keys(CardStyles.borders).filter(k => k === k.toLowerCase());

      // Should have same number of uppercase and lowercase
      expect(uppercaseKeys.length).toBe(lowercaseKeys.length);

      // Each uppercase should have corresponding lowercase
      uppercaseKeys.forEach(upperKey => {
        const lowerKey = upperKey.toLowerCase();
        expect(CardStyles.borders).toHaveProperty(lowerKey);
        expect(CardStyles.borders[upperKey as keyof typeof CardStyles.borders]).toBe(
          CardStyles.borders[lowerKey as keyof typeof CardStyles.borders]
        );
      });
    });
  });

  describe('color grouping', () => {
    it('should group report buttons by color theme', () => {
      const reports = CardStyles.quickAccess.reports;

      // Void Pallet - Red theme
      expect(reports['Void Pallet Report']).toContain('from-red-600');
      expect(reports['Void Pallet Report']).toContain('to-pink-600');

      // Order Loading - Blue theme
      expect(reports['Order Loading Report']).toContain('from-blue-600');
      expect(reports['Order Loading Report']).toContain('to-indigo-600');

      // Stock Take - Green theme
      expect(reports['Stock Take Report']).toContain('from-green-600');
      expect(reports['Stock Take Report']).toContain('to-emerald-600');

      // ACO Order - Purple theme
      expect(reports['ACO Order Report']).toContain('from-purple-600');
      expect(reports['ACO Order Report']).toContain('to-violet-600');
    });

    it('should use complementary color pairs', () => {
      const systemUpdate = CardStyles.quickAccess.systemUpdate;

      // Product Info uses indigo-blue
      expect(systemUpdate['Update Product Info']).toContain('from-indigo-600');
      expect(systemUpdate['Update Product Info']).toContain('to-blue-600');

      // Supplier Info uses emerald-teal
      expect(systemUpdate['Update Supplier Info']).toContain('from-emerald-600');
      expect(systemUpdate['Update Supplier Info']).toContain('to-teal-600');
    });
  });
});
