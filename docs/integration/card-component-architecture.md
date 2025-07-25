# Card Component Architecture Design Document

**Version**: 1.0  
**Date**: 2025-07-25  
**Author**: System Architecture Team  
**Status**: Draft

## 1. Executive Summary

This document defines the architecture and design standards for the Card component system, which is replacing the legacy Widget system in the NewPennine WMS. The Card architecture provides a unified, maintainable, and performant component system that leverages GraphQL for data fetching and React's modern patterns for UI rendering.

## 2. Architecture Overview

### 2.1 Design Principles

1. **Unified Interface**: All Cards share a common interface and behavior patterns
2. **GraphQL-First**: Data fetching through GraphQL for optimal performance
3. **Type Safety**: Full TypeScript coverage with generated types
4. **Composability**: Cards can be composed and configured flexibly
5. **Performance**: Lazy loading, virtualization, and optimized rendering
6. **Accessibility**: WCAG 2.1 AA compliance

### 2.2 Component Hierarchy

```
┌─────────────────────────────────────┐
│         BaseCard (Abstract)         │
│  - Common props and behaviors       │
│  - Error boundary                   │
│  - Loading states                   │
│  - GraphQL integration              │
└─────────────────┬───────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼────────┐          ┌──────▼────────┐
│ DataCard   │          │ ActionCard    │
│ - Stats    │          │ - Form        │
│ - Chart    │          │ - Upload      │
│ - Table    │          │ - Config      │
│ - List     │          │ - Search      │
└────────────┘          └───────────────┘
```

## 3. Core Components

### 3.1 BaseCard Interface

```typescript
interface BaseCardProps {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'compact' | 'expanded' | 'minimal';
  loading?: boolean;
  error?: Error | null;
  className?: string;
  testId?: string;
  onRefresh?: () => void;
  onExpand?: () => void;
  onSettings?: () => void;
}

interface CardComponent<T = any> extends React.FC<BaseCardProps & T> {
  displayName: string;
  defaultProps?: Partial<BaseCardProps & T>;
  preload?: () => Promise<void>;
}
```

### 3.2 Data Cards (Display-focused)

#### StatsCard
- **Purpose**: Display statistical metrics with trends
- **Data Source**: `statsCardData` GraphQL query
- **Features**: Real-time updates, trend visualization, comparisons

#### ChartCard
- **Purpose**: Render various chart types (line, bar, pie, etc.)
- **Data Source**: `chartCardData` GraphQL query
- **Features**: Interactive charts, export functionality, responsive design

#### TableCard
- **Purpose**: Display tabular data with sorting, filtering, pagination
- **Data Source**: `tableCardData` GraphQL query
- **Features**: Virtual scrolling, column customization, bulk actions

#### ListCard
- **Purpose**: Display lists of items with various layouts
- **Data Source**: `listCardData` GraphQL query
- **Features**: Infinite scroll, search, multiple view modes

#### AnalysisCard
- **Purpose**: Complex data analysis with AI insights
- **Data Source**: `analysisCardData` GraphQL query
- **Features**: Multi-tab interface, AI integration, export reports

### 3.3 Action Cards (Interaction-focused)

#### FormCard
- **Purpose**: Handle form inputs and submissions
- **Data Source**: `formCardData` GraphQL query + mutations
- **Features**: Dynamic fields, validation, file uploads

#### UploadCard
- **Purpose**: File upload management
- **Data Source**: `uploadCardData` GraphQL query + mutations
- **Features**: Drag-drop, progress tracking, batch uploads

#### ConfigCard
- **Purpose**: System configuration management
- **Data Source**: `configCardData` GraphQL query + mutations
- **Features**: Settings groups, validation, import/export

#### SearchCard
- **Purpose**: Global and contextual search
- **Data Source**: `searchCardData` GraphQL query
- **Features**: Full-text search, filters, search history

### 3.4 Specialized Cards

#### AlertCard
- **Purpose**: Alert and notification management
- **Features**: Real-time updates, priority levels, actions

#### NavigationCard
- **Purpose**: Dynamic navigation and shortcuts
- **Features**: User-specific menus, quick actions

#### NotificationCard
- **Purpose**: System notifications display
- **Features**: Multi-channel, read status, actions

#### ReportCard
- **Purpose**: Report generation and viewing
- **Features**: Multiple formats, scheduling, sharing

#### DepartmentSelectorCard
- **Purpose**: Department selection and switching
- **Features**: Hierarchy display, permissions

#### HistoryTreeCard
- **Purpose**: Historical data visualization
- **Features**: Tree structure, timeline view

## 4. Technical Implementation

### 4.1 GraphQL Integration

```typescript
// Standardized query structure
const CARD_QUERY = gql`
  query ${CardName}Query($input: ${CardName}QueryInput!) {
    ${cardName}Data(input: $input) {
      data {
        # Card-specific data fields
      }
      metadata {
        total
        page
        pageSize
        lastUpdated
      }
      error {
        code
        message
      }
    }
  }
`;
```

### 4.2 State Management

```typescript
// Card state hook pattern
function useCardState<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Common state management logic
  return { state, setState, loading, setLoading, error, setError };
}
```

### 4.3 Performance Optimization

1. **Code Splitting**: Each Card is dynamically imported
2. **Memoization**: Heavy computations are memoized
3. **Virtual Rendering**: Large lists use virtualization
4. **Optimistic Updates**: Mutations update UI immediately
5. **Request Deduplication**: Prevent duplicate GraphQL requests

### 4.4 Error Handling

```typescript
class CardErrorBoundary extends React.Component {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service
    console.error('Card Error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <CardErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

## 5. Migration Strategy

### 5.1 Widget to Card Mapping

| Legacy Widget | Target Card | Priority | Status |
|--------------|-------------|----------|---------|
| StatsWidget | StatsCard | P0 | ✅ Complete |
| ChartWidget | ChartCard | P0 | ✅ Complete |
| TableWidget | TableCard | P0 | ✅ Complete |
| FormWidget | FormCard | P1 | ✅ Complete |
| ... | ... | ... | ... |

### 5.2 Migration Steps

1. **Identify Dependencies**: Map Widget usage across the application
2. **Create Card Equivalent**: Implement Card with same functionality
3. **Add Feature Flag**: Use feature flags for gradual rollout
4. **Migrate Usage**: Replace Widget imports with Card imports
5. **Test Thoroughly**: Ensure functionality parity
6. **Remove Widget**: Delete Widget code after successful migration

## 6. Development Guidelines

### 6.1 File Structure

```
cards/
├── [CardName]/
│   ├── index.tsx           # Main component
│   ├── [CardName].types.ts # TypeScript types
│   ├── [CardName].query.ts # GraphQL queries
│   ├── [CardName].test.tsx # Unit tests
│   ├── [CardName].stories.tsx # Storybook stories
│   └── components/         # Sub-components
├── common/
│   ├── BaseCard.tsx
│   ├── CardHeader.tsx
│   ├── CardFooter.tsx
│   └── utils/
└── index.ts               # Barrel export
```

### 6.2 Naming Conventions

- Component files: PascalCase (e.g., `StatsCard.tsx`)
- Utility files: camelCase (e.g., `cardUtils.ts`)
- Test files: `[Component].test.tsx`
- Story files: `[Component].stories.tsx`
- Type files: `[Component].types.ts`

### 6.3 Code Standards

```typescript
// Standard Card component template
export const ExampleCard: CardComponent<ExampleCardProps> = ({
  id,
  title = 'Example Card',
  variant = 'default',
  loading = false,
  error = null,
  onRefresh,
  ...props
}) => {
  // GraphQL query
  const { data, loading: queryLoading, error: queryError } = useQuery(
    EXAMPLE_CARD_QUERY,
    { variables: { id } }
  );
  
  // Combine loading states
  const isLoading = loading || queryLoading;
  const cardError = error || queryError;
  
  // Render
  return (
    <BaseCard
      title={title}
      variant={variant}
      loading={isLoading}
      error={cardError}
      onRefresh={onRefresh}
    >
      {/* Card content */}
    </BaseCard>
  );
};

ExampleCard.displayName = 'ExampleCard';
```

## 7. Testing Strategy

### 7.1 Unit Testing

```typescript
describe('ExampleCard', () => {
  it('should render with default props', () => {
    render(<ExampleCard id="test-1" />);
    expect(screen.getByTestId('example-card')).toBeInTheDocument();
  });
  
  it('should handle loading state', () => {
    render(<ExampleCard id="test-1" loading />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
  
  it('should handle error state', () => {
    const error = new Error('Test error');
    render(<ExampleCard id="test-1" error={error} />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });
});
```

### 7.2 Integration Testing

- Test GraphQL queries and mutations
- Test Card interactions with other components
- Test state management and side effects

### 7.3 E2E Testing

- Test complete user workflows
- Test Card performance under load
- Test accessibility compliance

## 8. Performance Metrics

### 8.1 Target Metrics

| Metric | Target | Current |
|--------|---------|---------| 
| Initial Load Time | < 1s | TBD |
| Time to Interactive | < 2s | TBD |
| GraphQL Query Time | < 200ms | TBD |
| Memory Usage | < 50MB | TBD |
| Bundle Size (per Card) | < 50KB | TBD |

### 8.2 Monitoring

- Use React DevTools Profiler
- Implement custom performance marks
- Track GraphQL query performance
- Monitor error rates and types

## 9. Security Considerations

1. **Input Validation**: All user inputs must be validated
2. **XSS Protection**: Sanitize all rendered content
3. **CSRF Protection**: Use proper authentication tokens
4. **Data Authorization**: Verify user permissions for data access
5. **Secure Communication**: All data fetched over HTTPS

## 10. Accessibility Requirements

1. **Keyboard Navigation**: All Cards must be keyboard accessible
2. **Screen Reader Support**: Proper ARIA labels and roles
3. **Color Contrast**: WCAG 2.1 AA compliance
4. **Focus Management**: Clear focus indicators
5. **Error Messages**: Accessible error announcements

## 11. Future Enhancements

1. **AI-Powered Cards**: Integrate more AI capabilities
2. **Custom Card Builder**: Allow users to create custom Cards
3. **Card Marketplace**: Share Cards between organizations
4. **Advanced Analytics**: Built-in analytics for Card usage
5. **Offline Support**: Progressive Web App capabilities

## 12. Appendices

### A. Card Component Checklist

- [ ] Implements BaseCard interface
- [ ] Has TypeScript types defined
- [ ] GraphQL queries/mutations implemented
- [ ] Unit tests written (>80% coverage)
- [ ] Storybook stories created
- [ ] Accessibility tested
- [ ] Performance benchmarked
- [ ] Documentation updated
- [ ] Code reviewed and approved

### B. References

- [React Documentation](https://react.dev)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Document Status**: This is a living document and will be updated as the Card system evolves.
**Last Updated**: 2025-07-25
**Next Review**: 2025-08-01