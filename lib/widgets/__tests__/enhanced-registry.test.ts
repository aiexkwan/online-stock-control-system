import { EnhancedWidgetRegistry, VirtualWidgetContainer, GridVirtualizer, WidgetStateManager } from '../enhanced-registry';
import { WidgetDefinition, WidgetCategory } from '../types';

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

global.IntersectionObserver = MockIntersectionObserver as any;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('EnhancedWidgetRegistry', () => {
  let registry: EnhancedWidgetRegistry;

  beforeEach(() => {
    // Clear singleton instance
    (EnhancedWidgetRegistry as any).instance = null;
    registry = EnhancedWidgetRegistry.getInstance();
    jest.clearAllMocks();
  });

  describe('Widget Registration', () => {
    it('should register a widget definition', () => {
      const widgetDef: WidgetDefinition = {
        id: 'test-widget',
        title: 'Test Widget',
        category: 'stats',
        path: '/components/widgets/TestWidget',
        gridArea: '1 / 1 / 2 / 2',
        minRole: 'user',
        metadata: {
          version: '1.0.0',
          description: 'Test widget for unit tests',
        }
      };

      registry.register(widgetDef);

      const registered = registry.getById('test-widget');
      expect(registered).toBeDefined();
      expect(registered?.id).toBe('test-widget');
      expect(registered?.category).toBe('stats');
    });

    it('should update category index when registering widget', () => {
      const widget1: WidgetDefinition = {
        id: 'stats-widget-1',
        title: 'Stats Widget 1',
        category: 'stats',
        path: '/components/widgets/StatsWidget1',
        gridArea: '1 / 1 / 2 / 2',
        minRole: 'user',
      };

      const widget2: WidgetDefinition = {
        id: 'stats-widget-2',
        title: 'Stats Widget 2',
        category: 'stats',
        path: '/components/widgets/StatsWidget2',
        gridArea: '2 / 1 / 3 / 2',
        minRole: 'user',
      };

      registry.register(widget1);
      registry.register(widget2);

      const statsWidgets = registry.getByCategory('stats');
      expect(statsWidgets).toHaveLength(2);
      expect(statsWidgets.map(w => w.id)).toContain('stats-widget-1');
      expect(statsWidgets.map(w => w.id)).toContain('stats-widget-2');
    });
  });

  describe('Widget Unregistration', () => {
    it('should unregister a widget', () => {
      const widgetDef: WidgetDefinition = {
        id: 'temp-widget',
        title: 'Temporary Widget',
        category: 'core',
        path: '/components/widgets/TempWidget',
        gridArea: '1 / 1 / 2 / 2',
        minRole: 'user',
      };

      registry.register(widgetDef);
      expect(registry.getById('temp-widget')).toBeDefined();

      registry.unregister('temp-widget');
      expect(registry.getById('temp-widget')).toBeUndefined();
    });

    it('should update category index when unregistering widget', () => {
      const widgetDef: WidgetDefinition = {
        id: 'removable-widget',
        title: 'Removable Widget',
        category: 'stats',
        path: '/components/widgets/RemovableWidget',
        gridArea: '1 / 1 / 2 / 2',
        minRole: 'user',
      };

      registry.register(widgetDef);
      expect(registry.getByCategory('stats')).toHaveLength(1);

      registry.unregister('removable-widget');
      expect(registry.getByCategory('stats')).toHaveLength(0);
    });
  });

  describe('Widget Retrieval', () => {
    beforeEach(() => {
      const widgets: WidgetDefinition[] = [
        {
          id: 'admin-widget',
          title: 'Admin Widget',
          category: 'core',
          path: '/components/widgets/AdminWidget',
          gridArea: '1 / 1 / 2 / 2',
          minRole: 'admin',
        },
        {
          id: 'user-widget',
          title: 'User Widget',
          category: 'core',
          path: '/components/widgets/UserWidget',
          gridArea: '2 / 1 / 3 / 2',
          minRole: 'user',
        },
        {
          id: 'chart-widget',
          title: 'Chart Widget',
          category: 'charts',
          path: '/components/widgets/ChartWidget',
          gridArea: '1 / 2 / 2 / 3',
          minRole: 'user',
        },
      ];

      widgets.forEach(w => registry.register(w));
    });

    it('should get all widgets', () => {
      const allWidgets = registry.getAll();
      expect(allWidgets).toHaveLength(3);
    });

    it('should get widget by ID', () => {
      const widget = registry.getById('chart-widget');
      expect(widget).toBeDefined();
      expect(widget?.title).toBe('Chart Widget');
    });

    it('should get widgets by category', () => {
      const coreWidgets = registry.getByCategory('core');
      expect(coreWidgets).toHaveLength(2);
      
      const chartWidgets = registry.getByCategory('charts');
      expect(chartWidgets).toHaveLength(1);
      expect(chartWidgets[0].id).toBe('chart-widget');
    });

    it('should get widgets by role', () => {
      const userWidgets = registry.getByRole('user');
      expect(userWidgets).toHaveLength(3); // All widgets accessible to users

      const adminWidgets = registry.getByRole('admin');
      expect(adminWidgets).toHaveLength(1); // Only admin widget
      expect(adminWidgets[0].id).toBe('admin-widget');
    });

    it('should search widgets by query', () => {
      const results = registry.search('chart');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('chart-widget');
    });

    it('should get widgets by multiple IDs', () => {
      const widgets = registry.getByIds(['admin-widget', 'chart-widget']);
      expect(widgets).toHaveLength(2);
      expect(widgets.map(w => w.id)).toContain('admin-widget');
      expect(widgets.map(w => w.id)).toContain('chart-widget');
    });
  });

  describe('Performance Tracking', () => {
    it('should track widget performance', () => {
      const widgetDef: WidgetDefinition = {
        id: 'perf-widget',
        title: 'Performance Widget',
        category: 'core',
        path: '/components/widgets/PerfWidget',
        gridArea: '1 / 1 / 2 / 2',
        minRole: 'user',
      };

      registry.register(widgetDef);
      
      // Record load performance
      registry.recordLoadPerformance('perf-widget', 150);
      registry.recordLoadPerformance('perf-widget', 200);

      const metrics = registry.getPerformanceMetrics('perf-widget');
      expect(metrics).toBeDefined();
      expect(metrics?.avgLoadTime).toBe(175);
      expect(metrics?.loadCount).toBe(2);
    });

    it('should get performance report', () => {
      const widgets: WidgetDefinition[] = [
        {
          id: 'fast-widget',
          title: 'Fast Widget',
          category: 'core',
          path: '/components/widgets/FastWidget',
          gridArea: '1 / 1 / 2 / 2',
          minRole: 'user',
        },
        {
          id: 'slow-widget',
          title: 'Slow Widget',
          category: 'core',
          path: '/components/widgets/SlowWidget',
          gridArea: '2 / 1 / 3 / 2',
          minRole: 'user',
        },
      ];

      widgets.forEach(w => registry.register(w));

      registry.recordLoadPerformance('fast-widget', 50);
      registry.recordLoadPerformance('slow-widget', 500);

      const report = registry.getPerformanceReport();
      expect(report).toHaveLength(2);
      expect(report[0].widgetId).toBe('slow-widget'); // Sorted by load time desc
      expect(report[0].avgLoadTime).toBe(500);
    });
  });
});

describe('VirtualWidgetContainer', () => {
  let container: VirtualWidgetContainer;
  const mockWidgets: WidgetDefinition[] = Array.from({ length: 100 }, (_, i) => ({
    id: `widget-${i}`,
    title: `Widget ${i}`,
    category: 'core' as WidgetCategory,
    path: `/components/widgets/Widget${i}`,
    gridArea: `${i + 1} / 1 / ${i + 2} / 2`,
    minRole: 'user',
  }));

  beforeEach(() => {
    container = new VirtualWidgetContainer({
      widgets: mockWidgets,
      itemHeight: 100,
      containerHeight: 500,
      overscan: 2,
    });
  });

  it('should calculate visible widgets correctly', () => {
    const visible = container.getVisibleWidgets();
    // With containerHeight 500 and itemHeight 100, should show 5 items + 2 overscan on each side = 9 items
    expect(visible).toHaveLength(7); // 5 + 2 overscan (but capped at start)
    expect(visible[0].id).toBe('widget-0');
    expect(visible[6].id).toBe('widget-6');
  });

  it('should update visible range on scroll', () => {
    container.updateScrollPosition(300);
    const visible = container.getVisibleWidgets();
    
    // Scrolled to 300px, item at index 3 should be at top
    // With overscan, should start from index 1
    expect(visible[0].id).toBe('widget-1');
  });

  it('should calculate total height correctly', () => {
    const totalHeight = container.getTotalHeight();
    expect(totalHeight).toBe(10000); // 100 widgets * 100px each
  });

  it('should get correct offset for index', () => {
    expect(container.getOffsetForIndex(0)).toBe(0);
    expect(container.getOffsetForIndex(10)).toBe(1000);
    expect(container.getOffsetForIndex(50)).toBe(5000);
  });
});

describe('WidgetStateManager', () => {
  let stateManager: WidgetStateManager;

  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    stateManager = new WidgetStateManager();
  });

  it('should save and retrieve widget state', () => {
    stateManager.saveState('widget-1', {
      collapsed: true,
      settings: { theme: 'dark' },
    });

    const state = stateManager.getState('widget-1');
    expect(state).toBeDefined();
    expect(state?.collapsed).toBe(true);
    expect(state?.settings?.theme).toBe('dark');
  });

  it('should persist states to localStorage', () => {
    stateManager.saveState('widget-1', { collapsed: true });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'widget-states-v1',
      expect.stringContaining('widget-1')
    );
  });

  it('should load states from localStorage', () => {
    const savedStates = {
      'widget-1': {
        id: 'widget-1',
        collapsed: true,
        lastUpdated: Date.now(),
      },
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedStates));
    
    // Create new instance to trigger load
    const newStateManager = new WidgetStateManager();
    const state = newStateManager.getState('widget-1');
    
    expect(state).toBeDefined();
    expect(state?.collapsed).toBe(true);
  });

  it('should clear individual widget state', () => {
    stateManager.saveState('widget-1', { collapsed: true });
    stateManager.saveState('widget-2', { collapsed: false });
    
    stateManager.clearState('widget-1');
    
    expect(stateManager.getState('widget-1')).toBeUndefined();
    expect(stateManager.getState('widget-2')).toBeDefined();
  });

  it('should clear all states', () => {
    stateManager.saveState('widget-1', { collapsed: true });
    stateManager.saveState('widget-2', { collapsed: false });
    
    stateManager.clearAllStates();
    
    expect(stateManager.getState('widget-1')).toBeUndefined();
    expect(stateManager.getState('widget-2')).toBeUndefined();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('widget-states-v1');
  });
});