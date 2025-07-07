import { WidgetStyles, getWidgetStyle } from '../widgetStyles';

describe('widgetStyles', () => {
  describe('WidgetStyles object', () => {
    it('should have base style', () => {
      expect(WidgetStyles.base).toBe('bg-white/3 backdrop-blur-md');
    });

    it('should have all widget border definitions', () => {
      const expectedBorders = [
        // Statistics
        'VOID_STATS',
        // Charts & Analytics
        'PRODUCT_MIX_CHART',
        // Operations
        'RECENT_ACTIVITY',
        'ACO_ORDER_PROGRESS',
        'INVENTORY_SEARCH',
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
        'inventory_search',
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
        expect(WidgetStyles.borders).toHaveProperty(border);
      });
    });

    it('should have empty string for all borders (no border effect)', () => {
      Object.values(WidgetStyles.borders).forEach(borderValue => {
        expect(borderValue).toBe('');
      });
    });

    it('should have text color definitions', () => {
      // Table colors (purple)
      expect(WidgetStyles.text.table).toBe('text-purple-400');
      expect(WidgetStyles.text.tableHeader).toBe('text-purple-300');
      expect(WidgetStyles.text.tableData).toBe('text-purple-200');
      
      // Chart colors (green)
      expect(WidgetStyles.text.chart).toBe('text-green-400');
      expect(WidgetStyles.text.chartLabel).toBe('text-green-300');
      expect(WidgetStyles.text.chartData).toBe('text-green-200');
      
      // General text colors
      expect(WidgetStyles.text.title).toBe('text-white');
      expect(WidgetStyles.text.subtitle).toBe('text-slate-300');
      expect(WidgetStyles.text.description).toBe('text-slate-400');
    });

    it('should have quickAccess button configurations', () => {
      // Reports buttons
      expect(WidgetStyles.quickAccess.reports).toHaveProperty('Void Pallet Report');
      expect(WidgetStyles.quickAccess.reports).toHaveProperty('Order Loading Report');
      expect(WidgetStyles.quickAccess.reports).toHaveProperty('Stock Take Report');
      expect(WidgetStyles.quickAccess.reports).toHaveProperty('ACO Order Report');
      expect(WidgetStyles.quickAccess.reports).toHaveProperty('Transaction Report');
      expect(WidgetStyles.quickAccess.reports).toHaveProperty('GRN Report');
      expect(WidgetStyles.quickAccess.reports).toHaveProperty('Export All Data');
      
      // System update buttons
      expect(WidgetStyles.quickAccess.systemUpdate).toHaveProperty('Update Product Info');
      expect(WidgetStyles.quickAccess.systemUpdate).toHaveProperty('Update Supplier Info');
      
      // Document upload buttons
      expect(WidgetStyles.quickAccess.documentUpload).toHaveProperty('Upload Files');
      expect(WidgetStyles.quickAccess.documentUpload).toHaveProperty('Upload Order PDF');
      expect(WidgetStyles.quickAccess.documentUpload).toHaveProperty('Upload Spec');
      
      // Void pallet button
      expect(WidgetStyles.quickAccess.voidPallet).toBeDefined();
    });

    it('should have gradient styles for all quick access buttons', () => {
      // Check reports buttons
      Object.values(WidgetStyles.quickAccess.reports).forEach(style => {
        expect(style).toContain('bg-gradient-to-r');
        expect(style).toContain('hover:from-');
        expect(style).toContain('hover:to-');
      });
      
      // Check system update buttons
      Object.values(WidgetStyles.quickAccess.systemUpdate).forEach(style => {
        expect(style).toContain('bg-gradient-to-r');
        expect(style).toContain('hover:from-');
        expect(style).toContain('hover:to-');
      });
      
      // Check document upload buttons
      Object.values(WidgetStyles.quickAccess.documentUpload).forEach(style => {
        expect(style).toContain('bg-gradient-to-r');
        expect(style).toContain('hover:from-');
        expect(style).toContain('hover:to-');
      });
      
      // Check void pallet button
      expect(WidgetStyles.quickAccess.voidPallet).toContain('bg-gradient-to-r');
    });

    it('should have chart color configuration', () => {
      expect(WidgetStyles.charts.line).toBe('#10b981');
      expect(WidgetStyles.charts.bar).toBe('#10b981');
      expect(WidgetStyles.charts.area).toBe('#10b981');
      expect(WidgetStyles.charts.pie).toEqual([
        '#10b981',
        '#34d399',
        '#6ee7b7',
        '#86efac',
        '#bbf7d0'
      ]);
    });

    it('should use green color palette for charts', () => {
      // All non-pie charts use the same green
      expect(WidgetStyles.charts.line).toBe(WidgetStyles.charts.bar);
      expect(WidgetStyles.charts.line).toBe(WidgetStyles.charts.area);
      
      // Pie chart uses gradient of greens
      WidgetStyles.charts.pie.forEach(color => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });

  describe('getWidgetStyle function', () => {
    it('should return base style for unknown widget types', () => {
      const style = getWidgetStyle('UNKNOWN_WIDGET');
      expect(style).toBe('bg-white/3 backdrop-blur-md ');
    });

    it('should return base style for all known widget types (no borders)', () => {
      const widgetTypes = [
        'VOID_STATS',
        'PRODUCT_MIX_CHART',
        'RECENT_ACTIVITY',
        'ACO_ORDER_PROGRESS',
        'INVENTORY_SEARCH',
        'ASK_DATABASE',
        'VOID_PALLET'
      ];
      
      widgetTypes.forEach(type => {
        const style = getWidgetStyle(type);
        expect(style).toBe('bg-white/3 backdrop-blur-md ');
      });
    });

    it('should handle lowercase widget types', () => {
      const style = getWidgetStyle('void_stats');
      expect(style).toBe('bg-white/3 backdrop-blur-md ');
    });

    it('should handle null and undefined', () => {
      expect(getWidgetStyle(null as any)).toBe('bg-white/3 backdrop-blur-md ');
      expect(getWidgetStyle(undefined as any)).toBe('bg-white/3 backdrop-blur-md ');
    });

    it('should handle empty string', () => {
      const style = getWidgetStyle('');
      expect(style).toBe('bg-white/3 backdrop-blur-md ');
    });
  });

  describe('style consistency', () => {
    it('should use consistent gradient patterns', () => {
      const allButtonStyles = [
        ...Object.values(WidgetStyles.quickAccess.reports),
        ...Object.values(WidgetStyles.quickAccess.systemUpdate),
        ...Object.values(WidgetStyles.quickAccess.documentUpload),
        WidgetStyles.quickAccess.voidPallet
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
      const voidPalletStyle = WidgetStyles.quickAccess.voidPallet;
      expect(voidPalletStyle).toContain('from-red-600');
      expect(voidPalletStyle).toContain('to-rose-600');
      expect(voidPalletStyle).toContain('hover:from-red-500');
      expect(voidPalletStyle).toContain('hover:to-rose-500');
    });

    it('should have uppercase and lowercase versions synchronized', () => {
      const uppercaseKeys = Object.keys(WidgetStyles.borders).filter(k => k === k.toUpperCase());
      const lowercaseKeys = Object.keys(WidgetStyles.borders).filter(k => k === k.toLowerCase());
      
      // Should have same number of uppercase and lowercase
      expect(uppercaseKeys.length).toBe(lowercaseKeys.length);
      
      // Each uppercase should have corresponding lowercase
      uppercaseKeys.forEach(upperKey => {
        const lowerKey = upperKey.toLowerCase();
        expect(WidgetStyles.borders).toHaveProperty(lowerKey);
        expect(WidgetStyles.borders[upperKey as keyof typeof WidgetStyles.borders]).toBe(
          WidgetStyles.borders[lowerKey as keyof typeof WidgetStyles.borders]
        );
      });
    });
  });

  describe('color grouping', () => {
    it('should group report buttons by color theme', () => {
      const reports = WidgetStyles.quickAccess.reports;
      
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
      const systemUpdate = WidgetStyles.quickAccess.systemUpdate;
      
      // Product Info uses indigo-blue
      expect(systemUpdate['Update Product Info']).toContain('from-indigo-600');
      expect(systemUpdate['Update Product Info']).toContain('to-blue-600');
      
      // Supplier Info uses emerald-teal
      expect(systemUpdate['Update Supplier Info']).toContain('from-emerald-600');
      expect(systemUpdate['Update Supplier Info']).toContain('to-teal-600');
    });
  });
});