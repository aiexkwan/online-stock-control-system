import React from 'react';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { FeatureContext } from '../types';

/**
 * Feature Flag 組件屬性
 */
interface FeatureFlagProps {
  /** Feature flag key */
  flag: string;
  /** 啟用時顯示的內容 */
  children: React.ReactNode;
  /** 禁用時顯示的內容 */
  fallback?: React.ReactNode;
  /** 加載時顯示的內容 */
  loading?: React.ReactNode;
  /** 評估上下文 */
  context?: Partial<FeatureContext>;
  /** 是否反轉邏輯（當 flag 禁用時顯示內容） */
  invert?: boolean;
}

/**
 * Feature Flag 條件渲染組件
 *
 * @example
 * ```tsx
 * <FeatureFlag flag="new_dashboard">
 *   <NewDashboard />
 * </FeatureFlag>
 * ```
 *
 * @example
 * ```tsx
 * <FeatureFlag
 *   flag="advanced_search"
 *   fallback={<BasicSearch />}
 * >
 *   <AdvancedSearch />
 * </FeatureFlag>
 * ```
 */
export const FeatureFlag: React.FC<FeatureFlagProps> = ({
  flag,
  children,
  fallback = null,
  loading: loadingContent = null,
  context,
  invert = false,
}) => {
  const { enabled, loading } = useFeatureFlag(flag, context);

  if (loading) {
    return <>{loadingContent}</>;
  }

  const shouldRender = invert ? !enabled : enabled;

  return <>{shouldRender ? children : fallback}</>;
};

/**
 * Feature Flag 變體組件屬性
 */
interface FeatureVariantProps {
  /** Feature flag key */
  flag: string;
  /** 變體映射 */
  variants: Record<string, React.ReactNode>;
  /** 默認內容（當沒有匹配的變體時） */
  defaultContent?: React.ReactNode;
  /** 加載時顯示的內容 */
  loading?: React.ReactNode;
  /** 評估上下文 */
  context?: Partial<FeatureContext>;
}

/**
 * Feature Flag 變體組件
 * 根據變體值渲染不同內容
 *
 * @example
 * ```tsx
 * <FeatureVariant
 *   flag="theme_variant"
 *   variants={{
 *     default: <DefaultTheme />,
 *     modern: <ModernTheme />,
 *     classic: <ClassicTheme />
 *   }}
 * />
 * ```
 */
export const FeatureVariant: React.FC<FeatureVariantProps> = ({
  flag,
  variants,
  defaultContent = null,
  loading: loadingContent = null,
  context,
}) => {
  const { variant, loading } = useFeatureFlag(flag, context);

  if (loading) {
    return <>{loadingContent}</>;
  }

  if (!variant || !variants[variant]) {
    return <>{defaultContent}</>;
  }

  return <>{variants[variant]}</>;
};

/**
 * Feature Flags 提供者屬性
 */
interface FeatureFlagsProviderProps {
  /** 子組件 */
  children: React.ReactNode;
  /** 默認上下文 */
  context?: Partial<FeatureContext>;
  /** 用戶 ID */
  userId?: string;
  /** 用戶郵箱 */
  userEmail?: string;
  /** 用戶群組 */
  userGroups?: string[];
}

/**
 * Feature Flags 上下文
 */
const FeatureFlagsContext = React.createContext<Partial<FeatureContext>>({});

/**
 * Feature Flags 提供者組件
 * 為子組件提供默認的評估上下文
 *
 * @example
 * ```tsx
 * <FeatureFlagsProvider
 *   userId={user.id}
 *   userGroups={user.groups}
 * >
 *   <App />
 * </FeatureFlagsProvider>
 * ```
 */
export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({
  children,
  context = {},
  userId,
  userEmail,
  userGroups,
}) => {
  const contextValue = React.useMemo(
    () => ({
      ...context,
      userId: userId || context.userId,
      userEmail: userEmail || context.userEmail,
      userGroups: userGroups || context.userGroups,
    }),
    [context, userId, userEmail, userGroups]
  );

  return (
    <FeatureFlagsContext.Provider value={contextValue}>{children}</FeatureFlagsContext.Provider>
  );
};

/**
 * 使用 Feature Flags 上下文
 */
export const useFeatureFlagsContext = () => {
  return React.useContext(FeatureFlagsContext);
};

/**
 * 高階組件：添加 Feature Flag 條件
 *
 * @example
 * ```tsx
 * const EnhancedComponent = withFeatureFlag('new_feature')(MyComponent);
 * ```
 */
export function withFeatureFlag<P extends object>(
  flag: string,
  options?: {
    fallback?: React.ComponentType<P>;
    invert?: boolean;
  }
): (Component: React.ComponentType<P>) => React.ComponentType<P> {
  return (Component: React.ComponentType<P>) => {
    const WrappedComponent: React.FC<P> = props => {
      const context = useFeatureFlagsContext();
      const { enabled, loading } = useFeatureFlag(flag, context);

      if (loading) {
        return null;
      }

      const shouldRender = options?.invert ? !enabled : enabled;

      if (!shouldRender && options?.fallback) {
        const FallbackComponent = options.fallback;
        return <FallbackComponent {...props} />;
      }

      if (!shouldRender) {
        return null;
      }

      return <Component {...props} />;
    };

    WrappedComponent.displayName = `withFeatureFlag(${Component.displayName || Component.name})`;

    return WrappedComponent;
  };
}
