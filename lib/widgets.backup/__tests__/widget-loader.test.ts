import React from 'react';
import dynamic from 'next/dynamic';
import { createDynamicWidget, preloadWidget, preloadWidgets, isWidgetPreloaded, preloadedWidgets } from '../widget-loader';
import { getWidgetImport } from '../dynamic-imports';

// Mock Next.js dynamic
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock dynamic imports
jest.mock('../dynamic-imports', () => ({
  getWidgetImport: jest.fn(),
}));

describe('Widget Loader', () => {
  const mockDynamic = dynamic as jest.MockedFunction<typeof dynamic>;
  const mockGetWidgetImport = getWidgetImport as jest.MockedFunction<typeof getWidgetImport>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear preloaded widgets cache
    preloadedWidgets.clear();
  });

  describe('createDynamicWidget', () => {
    it('should create a lazy loaded widget component', () => {
      const mockImportFn = jest.fn().mockResolvedValue({
        TestWidget: () => React.createElement('div', null, 'Test Widget'),
      });
      
      mockGetWidgetImport.mockReturnValue(mockImportFn);
      mockDynamic.mockImplementation((importFn: any) => {
        // Simulate Next.js dynamic behavior
        const Component = () => React.createElement('div', null, 'Lazy Widget');
        Component.displayName = 'LazyWidget';
        return Component;
      });

      const LazyComponent = createDynamicWidget('TestWidget');
      
      expect(mockGetWidgetImport).toHaveBeenCalledWith('TestWidget');
      expect(LazyComponent).toBeDefined();
      expect(mockDynamic).toHaveBeenCalledWith(expect.any(Function), {
        loading: expect.any(Function),
        ssr: false,
      });
    });

    it('should handle default exports', async () => {
      const mockComponent = () => React.createElement('div', null, 'Default Export');
      const mockImportFn = jest.fn().mockResolvedValue({
        default: mockComponent,
      });
      
      mockGetWidgetImport.mockReturnValue(mockImportFn);
      
      let importHandler: Function;
      mockDynamic.mockImplementation((importFn: any) => {
        importHandler = importFn;
        const Component = () => React.createElement('div', null, 'Lazy Widget');
        Component.displayName = 'LazyWidget';
        return Component;
      });

      createDynamicWidget('TestWidget');
      
      // Test the import handler
      const result = await importHandler!();
      expect(result.default).toBe(mockComponent);
    });

    it('should handle named exports matching widget ID', async () => {
      const mockComponent = () => React.createElement('div', null, 'Named Export');
      const mockImportFn = jest.fn().mockResolvedValue({
        TestWidget: mockComponent,
      });
      
      mockGetWidgetImport.mockReturnValue(mockImportFn);
      
      let importHandler: Function;
      mockDynamic.mockImplementation((importFn: any) => {
        importHandler = importFn;
        const Component = () => React.createElement('div', null, 'Lazy Widget');
        Component.displayName = 'LazyWidget';
        return Component;
      });

      createDynamicWidget('TestWidget');
      
      // Test the import handler
      const result = await importHandler!();
      expect(result.default).toBe(mockComponent);
    });

    it('should return error component for unknown widget', () => {
      mockGetWidgetImport.mockReturnValue(undefined);
      
      const result = createDynamicWidget('UnknownWidget');
      
      expect(result).toBeDefined();
      expect(result?.displayName).toBe('ErrorWidget(UnknownWidget)');
      expect(mockDynamic).not.toHaveBeenCalled();
    });

    it('should provide loading component', () => {
      const mockImportFn = jest.fn();
      mockGetWidgetImport.mockReturnValue(mockImportFn);
      
      let loadingComponent: Function;
      mockDynamic.mockImplementation((importFn: any, options: any) => {
        loadingComponent = options.loading;
        const Component = () => React.createElement('div', null, 'Lazy Widget');
        Component.displayName = 'LazyWidget';
        return Component;
      });

      createDynamicWidget('TestWidget');
      
      // Test loading component
      const loading = loadingComponent!();
      expect(loading.type).toBe('div');
      expect(loading.props.className).toContain('animate-pulse');
    });
  });

  describe('preloadWidget', () => {
    it('should preload a single widget', async () => {
      const mockComponent = () => React.createElement('div', null, 'Preloaded Widget');
      const mockImportFn = jest.fn().mockResolvedValue({
        TestWidget: mockComponent,
      });
      
      mockGetWidgetImport.mockReturnValue(mockImportFn);

      await preloadWidget('TestWidget');
      
      expect(mockGetWidgetImport).toHaveBeenCalledWith('TestWidget');
      expect(mockImportFn).toHaveBeenCalled();
      expect(isWidgetPreloaded('TestWidget')).toBe(true);
    });

    it('should handle import errors gracefully', async () => {
      const mockImportFn = jest.fn().mockRejectedValue(new Error('Import failed'));
      mockGetWidgetImport.mockReturnValue(mockImportFn);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await preloadWidget('FailingWidget');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[WidgetLoader] Failed to preload widget: FailingWidget',
        expect.any(Error)
      );
      expect(isWidgetPreloaded('FailingWidget')).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it('should not preload unknown widgets', async () => {
      mockGetWidgetImport.mockReturnValue(undefined);

      await preloadWidget('UnknownWidget');
      
      expect(isWidgetPreloaded('UnknownWidget')).toBe(false);
    });

    it('should not preload the same widget twice', async () => {
      const mockImportFn = jest.fn().mockResolvedValue({
        TestWidget: () => React.createElement('div'),
      });
      
      mockGetWidgetImport.mockReturnValue(mockImportFn);

      await preloadWidget('TestWidget');
      await preloadWidget('TestWidget');
      
      expect(mockImportFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('preloadWidgets', () => {
    it('should preload multiple widgets', async () => {
      const mockImports = {
        Widget1: jest.fn().mockResolvedValue({ Widget1: () => React.createElement('div') }),
        Widget2: jest.fn().mockResolvedValue({ Widget2: () => React.createElement('div') }),
        Widget3: jest.fn().mockResolvedValue({ Widget3: () => React.createElement('div') }),
      };
      
      mockGetWidgetImport.mockImplementation((id: string) => mockImports[id as keyof typeof mockImports]);

      await preloadWidgets(['Widget1', 'Widget2', 'Widget3']);
      
      expect(mockImports.Widget1).toHaveBeenCalled();
      expect(mockImports.Widget2).toHaveBeenCalled();
      expect(mockImports.Widget3).toHaveBeenCalled();
      
      expect(isWidgetPreloaded('Widget1')).toBe(true);
      expect(isWidgetPreloaded('Widget2')).toBe(true);
      expect(isWidgetPreloaded('Widget3')).toBe(true);
    });

    it('should handle mixed success and failure', async () => {
      const mockImports = {
        Widget1: jest.fn().mockResolvedValue({ Widget1: () => React.createElement('div') }),
        Widget2: jest.fn().mockRejectedValue(new Error('Import failed')),
        Widget3: jest.fn().mockResolvedValue({ Widget3: () => React.createElement('div') }),
      };
      
      mockGetWidgetImport.mockImplementation((id: string) => mockImports[id as keyof typeof mockImports]);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await preloadWidgets(['Widget1', 'Widget2', 'Widget3']);
      
      expect(isWidgetPreloaded('Widget1')).toBe(true);
      expect(isWidgetPreloaded('Widget2')).toBe(false);
      expect(isWidgetPreloaded('Widget3')).toBe(true);

      consoleErrorSpy.mockRestore();
    });

    it('should preload widgets in parallel', async () => {
      let resolveCallbacks: Function[] = [];
      const mockImports: { [key: string]: jest.Mock } = {};
      
      ['Widget1', 'Widget2', 'Widget3'].forEach(widgetId => {
        mockImports[widgetId] = jest.fn().mockImplementation(() => {
          return new Promise(resolve => {
            resolveCallbacks.push(() => resolve({ [widgetId]: () => React.createElement('div') }));
          });
        });
      });
      
      mockGetWidgetImport.mockImplementation((id: string) => mockImports[id]);

      const preloadPromise = preloadWidgets(['Widget1', 'Widget2', 'Widget3']);
      
      // All imports should be called immediately
      expect(mockImports.Widget1).toHaveBeenCalledTimes(1);
      expect(mockImports.Widget2).toHaveBeenCalledTimes(1);
      expect(mockImports.Widget3).toHaveBeenCalledTimes(1);
      
      // Resolve all promises
      resolveCallbacks.forEach(resolve => resolve());
      
      await preloadPromise;
      
      expect(isWidgetPreloaded('Widget1')).toBe(true);
      expect(isWidgetPreloaded('Widget2')).toBe(true);
      expect(isWidgetPreloaded('Widget3')).toBe(true);
    });
  });

  describe('isWidgetPreloaded', () => {
    it('should return false for non-preloaded widgets', () => {
      expect(isWidgetPreloaded('NotPreloaded')).toBe(false);
    });

    it('should return true for preloaded widgets', async () => {
      const mockImportFn = jest.fn().mockResolvedValue({
        TestWidget: () => React.createElement('div'),
      });
      
      mockGetWidgetImport.mockReturnValue(mockImportFn);

      await preloadWidget('TestWidget');
      
      expect(isWidgetPreloaded('TestWidget')).toBe(true);
    });
  });

  describe('Dynamic Import Integration', () => {
    it('should handle complex module structures', async () => {
      const mockComponents = {
        Component1: () => React.createElement('div', null, 'Component 1'),
        Component2: () => React.createElement('div', null, 'Component 2'),
        default: () => React.createElement('div', null, 'Default Component'),
        someUtility: () => 'not a component',
      };
      
      const mockImportFn = jest.fn().mockResolvedValue(mockComponents);
      mockGetWidgetImport.mockReturnValue(mockImportFn);
      
      let importHandler: Function;
      mockDynamic.mockImplementation((importFn: any) => {
        importHandler = importFn;
        const Component = () => React.createElement('div', null, 'Lazy Widget');
        Component.displayName = 'LazyWidget';
        return Component;
      });

      createDynamicWidget('Component1');
      
      // Test that it correctly identifies the component
      const result = await importHandler!();
      // When module has default export, it should return the module as-is
      expect(result).toBe(mockComponents);
      expect(result.default).toBe(mockComponents.default);
    });

    it('should fallback to first function export if widget ID not found', async () => {
      const mockComponent = () => React.createElement('div', null, 'Fallback Component');
      const mockImportFn = jest.fn().mockResolvedValue({
        SomeOtherComponent: mockComponent,
        utility: 'not a component',
      });
      
      mockGetWidgetImport.mockReturnValue(mockImportFn);
      
      let importHandler: Function;
      mockDynamic.mockImplementation((importFn: any) => {
        importHandler = importFn;
        const Component = () => React.createElement('div', null, 'Lazy Widget');
        Component.displayName = 'LazyWidget';
        return Component;
      });

      createDynamicWidget('UnknownWidget');
      
      // Test fallback behavior
      const result = await importHandler!();
      expect(result.default).toBe(mockComponent);
    });
  });
});