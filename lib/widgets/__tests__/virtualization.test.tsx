import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VirtualContainer, useVirtualization } from '../components/VirtualContainer';
import { WidgetDefinition } from '../types';

// Mock widgets for testing
const mockWidgets: WidgetDefinition[] = Array.from({ length: 100 }, (_, i) => ({
  id: `widget-${i}`,
  title: `Widget ${i}`,
  category: 'core',
  path: `/components/widgets/Widget${i}`,
  gridArea: `${i + 1} / 1 / ${i + 2} / 2`,
  minRole: 'user',
}));

// Mock component for widgets
const MockWidget: React.FC<{ id: string; title: string }> = ({ id, title }) => (
  <div data-testid={`widget-${id}`} style={{ height: '100px' }}>
    {title}
  </div>
);

describe('VirtualContainer', () => {
  it('should render only visible widgets', () => {
    const { container } = render(
      <VirtualContainer
        widgets={mockWidgets}
        itemHeight={100}
        containerHeight={500}
        renderWidget={(widget) => (
          <MockWidget key={widget.id} id={widget.id} title={widget.title} />
        )}
      />
    );

    // Should render approximately 5 widgets (500px / 100px) plus overscan
    const renderedWidgets = screen.getAllByTestId(/^widget-widget-/);
    expect(renderedWidgets.length).toBeLessThan(10);
    expect(renderedWidgets.length).toBeGreaterThan(5);
  });

  it('should update visible widgets on scroll', async () => {
    const { container } = render(
      <VirtualContainer
        widgets={mockWidgets}
        itemHeight={100}
        containerHeight={500}
        renderWidget={(widget) => (
          <MockWidget key={widget.id} id={widget.id} title={widget.title} />
        )}
      />
    );

    const scrollContainer = container.querySelector('.virtual-scroll-container');
    expect(scrollContainer).toBeTruthy();

    // Initially should show widgets 0-6 (with overscan)
    expect(screen.getByTestId('widget-widget-0')).toBeInTheDocument();
    expect(screen.queryByTestId('widget-widget-20')).not.toBeInTheDocument();

    // Simulate scroll
    fireEvent.scroll(scrollContainer!, { target: { scrollTop: 1000 } });

    await waitFor(() => {
      // After scrolling, should show widgets around index 10
      expect(screen.queryByTestId('widget-widget-0')).not.toBeInTheDocument();
      expect(screen.getByTestId('widget-widget-10')).toBeInTheDocument();
    });
  });

  it('should maintain correct total height for scrolling', () => {
    const { container } = render(
      <VirtualContainer
        widgets={mockWidgets}
        itemHeight={100}
        containerHeight={500}
        renderWidget={(widget) => (
          <MockWidget key={widget.id} id={widget.id} title={widget.title} />
        )}
      />
    );

    const virtualList = container.querySelector('.virtual-list');
    expect(virtualList).toBeTruthy();
    
    // Total height should be widgets count * item height
    const computedStyle = window.getComputedStyle(virtualList!);
    expect(computedStyle.height).toBe('10000px'); // 100 widgets * 100px
  });

  it('should handle empty widget list', () => {
    const { container } = render(
      <VirtualContainer
        widgets={[]}
        itemHeight={100}
        containerHeight={500}
        renderWidget={(widget) => (
          <MockWidget key={widget.id} id={widget.id} title={widget.title} />
        )}
      />
    );

    const renderedWidgets = screen.queryAllByTestId(/^widget-widget-/);
    expect(renderedWidgets).toHaveLength(0);
  });

  it('should respect overscan prop', () => {
    const { container } = render(
      <VirtualContainer
        widgets={mockWidgets}
        itemHeight={100}
        containerHeight={500}
        overscan={5}
        renderWidget={(widget) => (
          <MockWidget key={widget.id} id={widget.id} title={widget.title} />
        )}
      />
    );

    // With overscan of 5, should render 5 (visible) + 5 (top) + 5 (bottom) = up to 15 widgets
    const renderedWidgets = screen.getAllByTestId(/^widget-widget-/);
    expect(renderedWidgets.length).toBeLessThanOrEqual(15);
    expect(renderedWidgets.length).toBeGreaterThan(5);
  });

  it('should call onScroll callback', () => {
    const onScroll = jest.fn();
    const { container } = render(
      <VirtualContainer
        widgets={mockWidgets}
        itemHeight={100}
        containerHeight={500}
        onScroll={onScroll}
        renderWidget={(widget) => (
          <MockWidget key={widget.id} id={widget.id} title={widget.title} />
        )}
      />
    );

    const scrollContainer = container.querySelector('.virtual-scroll-container');
    fireEvent.scroll(scrollContainer!, { target: { scrollTop: 500 } });

    expect(onScroll).toHaveBeenCalledWith(500);
  });
});

describe('useVirtualization hook', () => {
  const TestComponent: React.FC<{
    items: any[];
    itemHeight: number;
    containerHeight: number;
  }> = ({ items, itemHeight, containerHeight }) => {
    const {
      visibleItems,
      totalHeight,
      offsetY,
      handleScroll
    } = useVirtualization({
      items,
      itemHeight,
      containerHeight,
      overscan: 2
    });

    return (
      <div
        className="scroll-container"
        style={{ height: containerHeight, overflow: 'auto' }}
        onScroll={(e) => handleScroll(e.currentTarget.scrollTop)}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleItems.map((item) => (
              <div key={item.id} data-testid={`item-${item.id}`} style={{ height: itemHeight }}>
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  it('should calculate visible items correctly', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      name: `Item ${i}`
    }));

    const { container } = render(
      <TestComponent
        items={items}
        itemHeight={50}
        containerHeight={200}
      />
    );

    // Should show 4 visible items (200/50) + overscan
    const visibleItems = screen.getAllByTestId(/^item-/);
    expect(visibleItems.length).toBeGreaterThan(4);
    expect(visibleItems.length).toBeLessThan(10);
  });

  it('should update on scroll', async () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      name: `Item ${i}`
    }));

    const { container } = render(
      <TestComponent
        items={items}
        itemHeight={50}
        containerHeight={200}
      />
    );

    const scrollContainer = container.querySelector('.scroll-container');

    // Initially showing items 0-5
    expect(screen.getByTestId('item-0')).toBeInTheDocument();
    expect(screen.queryByTestId('item-20')).not.toBeInTheDocument();

    // Scroll down
    fireEvent.scroll(scrollContainer!, { target: { scrollTop: 500 } });

    await waitFor(() => {
      // Should now show items around index 10
      expect(screen.queryByTestId('item-0')).not.toBeInTheDocument();
      expect(screen.getByTestId('item-10')).toBeInTheDocument();
    });
  });

  it('should calculate total height correctly', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      name: `Item ${i}`
    }));

    const { container } = render(
      <TestComponent
        items={items}
        itemHeight={100}
        containerHeight={400}
      />
    );

    const scrollContent = container.querySelector('.scroll-container > div');
    expect(scrollContent).toBeTruthy();
    
    const computedStyle = window.getComputedStyle(scrollContent!);
    expect(computedStyle.height).toBe('2000px'); // 20 items * 100px
  });

  it('should handle dynamic item updates', () => {
    const { rerender } = render(
      <TestComponent
        items={[{ id: 1, name: 'Item 1' }]}
        itemHeight={100}
        containerHeight={400}
      />
    );

    expect(screen.getByTestId('item-1')).toBeInTheDocument();

    // Add more items
    const newItems = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      name: `Item ${i}`
    }));

    rerender(
      <TestComponent
        items={newItems}
        itemHeight={100}
        containerHeight={400}
      />
    );

    // Should show new items
    expect(screen.getByTestId('item-0')).toBeInTheDocument();
    expect(screen.queryByTestId('item-1')).toBeInTheDocument();
  });
});

describe('Performance optimization', () => {
  it('should not re-render unchanged visible items', () => {
    const renderCount = new Map<string, number>();
    
    const TrackedWidget: React.FC<{ id: string }> = React.memo(({ id }) => {
      renderCount.set(id, (renderCount.get(id) || 0) + 1);
      return <div data-testid={`tracked-${id}`}>{id}</div>;
    });
    TrackedWidget.displayName = 'TrackedWidget';

    const { container } = render(
      <VirtualContainer
        widgets={mockWidgets.slice(0, 20)}
        itemHeight={100}
        containerHeight={500}
        renderWidget={(widget) => (
          <TrackedWidget key={widget.id} id={widget.id} />
        )}
      />
    );

    // Get initial render counts
    const initialCounts = new Map(renderCount);

    // Small scroll that doesn't change visible widgets
    const scrollContainer = container.querySelector('.virtual-scroll-container');
    fireEvent.scroll(scrollContainer!, { target: { scrollTop: 10 } });

    // Visible widgets should not re-render
    initialCounts.forEach((count, id) => {
      if (screen.queryByTestId(`tracked-${id}`)) {
        expect(renderCount.get(id)).toBe(count);
      }
    });
  });

  it('should debounce scroll events', async () => {
    let scrollEventCount = 0;
    
    const TestComponent: React.FC = () => {
      const [scrollTop, setScrollTop] = React.useState(0);
      
      React.useEffect(() => {
        scrollEventCount++;
      }, [scrollTop]);

      return (
        <VirtualContainer
          widgets={mockWidgets}
          itemHeight={100}
          containerHeight={500}
          onScroll={setScrollTop}
          renderWidget={(widget) => (
            <div key={widget.id}>{widget.title}</div>
          )}
        />
      );
    };

    const { container } = render(<TestComponent />);
    const scrollContainer = container.querySelector('.virtual-scroll-container');

    // Fire multiple scroll events rapidly
    for (let i = 0; i < 10; i++) {
      fireEvent.scroll(scrollContainer!, { target: { scrollTop: i * 10 } });
    }

    // Due to debouncing, scroll event count should be less than 10
    await waitFor(() => {
      expect(scrollEventCount).toBeLessThan(10);
    });
  });
});