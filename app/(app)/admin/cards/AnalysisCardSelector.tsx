/**
 * Analysis Card Selector - Card selection system for analytics
 * Replaced card-based terminology with card-based architecture
 *
 * Migration from Card to Card (2025-01-30):
 * - Renamed from AnalysisDisplayContainer to AnalysisCardSelector
 * - Removed all card terminology
 * - Updated to use Card architecture consistently
 */

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
// Removed design-system import - using direct Tailwind classes
import { ChartType } from '@/types/generated/graphql';

// Card Props type definition
interface CardProps {
  title?: string;
  description?: string;
  isEditMode?: boolean;
  [key: string]: unknown;
}

// Whitelist of allowed components for security
const ALLOWED_CARDS = [
  'StockLevelListAndChartCard',
  'StockHistoryCard',
  'WorkLevelCard',
  'VerticalTimelineCard',
  'UploadCenterCard',
  'DownloadCenterCard',
  'PerformanceDashboard',
  'DataUpdateCard',
  'DepartInjCard',
  'DepartPipeCard',
  'DepartWareCard',
  'VoidPalletCard',
  'ChatbotCard',
] as const;

type AllowedCardType = typeof ALLOWED_CARDS[number];

interface AnalysisCardSelectorProps {
  selectedCard: AllowedCardType; // 使用類型安全的組件名稱
  onCardError?: (component: string, error: Error) => void;
  className?: string;
}

/**
 * Dynamic Card loader component
 */
const DynamicCardLoader: React.FC<{
  cardId: string;
  cardName: string;
}> = ({ cardId, cardName }) => {
  const [CardComponent, setCardComponent] = React.useState<React.ComponentType<CardProps> | null>(null);
  const [loadError, setLoadError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    // Validate card ID is in whitelist
    if (!ALLOWED_CARDS.includes(cardId as AllowedCardType)) {
      setLoadError(new Error(`Unauthorized card type: ${cardId}`));
      return;
    }

    // Load corresponding Card component based on card ID
    const loadCard = async () => {
      try {
        let cardModule: { default?: React.ComponentType<unknown>; [key: string]: React.ComponentType<unknown> | undefined };
        switch (cardId) {
          case 'StockLevelListAndChartCard':
            const stockModule = await import('../cards/StockLevelListAndChartCard');
            cardModule = { default: (stockModule as { StockLevelListAndChartCard?: React.ComponentType<unknown>; default?: React.ComponentType<unknown> }).StockLevelListAndChartCard || (stockModule as { StockLevelListAndChartCard?: React.ComponentType<unknown>; default?: React.ComponentType<unknown> }).default };
            break;
          case 'StockHistoryCard':
            const stockHistoryModule = await import('../cards/StockHistoryCard');
            cardModule = { default: (stockHistoryModule as { default?: React.ComponentType<unknown>; StockHistoryCard?: React.ComponentType<unknown> }).default || (stockHistoryModule as { default?: React.ComponentType<unknown>; StockHistoryCard?: React.ComponentType<unknown> }).StockHistoryCard };
            break;
          case 'WorkLevelCard':
            const workLevelModule = await import('../cards/WorkLevelCard');
            cardModule = { default: (workLevelModule as { default?: React.ComponentType<unknown>; WorkLevelCard?: React.ComponentType<unknown> }).default || (workLevelModule as { default?: React.ComponentType<unknown>; WorkLevelCard?: React.ComponentType<unknown> }).WorkLevelCard };
            break;
          case 'VerticalTimelineCard':
            cardModule = await import('../cards/VerticalTimelineCard') as { default?: React.ComponentType<unknown>; [key: string]: React.ComponentType<unknown> | undefined };
            break;
          case 'UploadCenterCard':
            cardModule = await import('../cards/UploadCenterCard') as { default?: React.ComponentType<unknown>; [key: string]: React.ComponentType<unknown> | undefined };
            break;
          case 'DownloadCenterCard':
            cardModule = await import('../cards/DownloadCenterCard') as { default?: React.ComponentType<unknown>; [key: string]: React.ComponentType<unknown> | undefined };
            break;
          case 'PerformanceDashboard':
            const perfModule = await import('@/lib/performance/components/PerformanceDashboardSimple');
            cardModule = { default: (perfModule as { default?: React.ComponentType<unknown>; PerformanceDashboard?: React.ComponentType<unknown> }).default || (perfModule as { default?: React.ComponentType<unknown>; PerformanceDashboard?: React.ComponentType<unknown> }).PerformanceDashboard };
            break;
          case 'DataUpdateCard':
            cardModule = await import('../cards/DataUpdateCard') as { default?: React.ComponentType<unknown>; [key: string]: React.ComponentType<unknown> | undefined };
            break;
          case 'DepartInjCard':
            cardModule = await import('../cards/DepartInjCard') as { default?: React.ComponentType<unknown>; [key: string]: React.ComponentType<unknown> | undefined };
            break;
          case 'DepartPipeCard':
            cardModule = await import('../cards/DepartPipeCard') as { default?: React.ComponentType<unknown>; [key: string]: React.ComponentType<unknown> | undefined };
            break;
          case 'DepartWareCard':
            cardModule = await import('../cards/DepartWareCard') as { default?: React.ComponentType<unknown>; [key: string]: React.ComponentType<unknown> | undefined };
            break;
          case 'VoidPalletCard':
            cardModule = await import('../cards/VoidPalletCard') as { default?: React.ComponentType<unknown>; [key: string]: React.ComponentType<unknown> | undefined };
            break;
          case 'ChatbotCard':
            cardModule = await import('../cards/ChatbotCard') as { default?: React.ComponentType<unknown>; [key: string]: React.ComponentType<unknown> | undefined };
            break;
          default:
            throw new Error(`No card mapping for: ${cardId}`);
        }
        
        if (isMounted && cardModule) {
          // Handle different export formats with type checking
          const Component = cardModule.default || 
                          (cardName && cardModule[cardName]) ||
                          null;
          
          if (Component && typeof Component === 'function') {
            setCardComponent(() => Component as React.ComponentType<unknown>);
          } else {
            throw new Error(`Invalid component module for ${cardId}`);
          }
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error as Error);
          console.error(`Failed to load card for ${cardId}:`, error);
        }
      }
    };

    loadCard();

    return () => {
      isMounted = false;
    };
  }, [cardId, cardName]);

  if (loadError) {
    return (
      <div className='flex h-full items-center justify-center text-destructive'>
        <div className='text-center'>
          <AlertTriangle className='mx-auto mb-2 h-8 w-8' />
          <p className='text-sm'>Failed to load card component</p>
          <p className='mt-1 text-xs text-muted-foreground'>{cardId}</p>
        </div>
      </div>
    );
  }

  if (!CardComponent) {
    return (
      <div className='flex h-full items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  // Prepare appropriate props based on cardId
  const getComponentProps = () => {
    // Map cardId to display name
    const displayName = cardId === 'StockLevelListAndChartCard' ? 'Stock Level' :
                       cardId === 'StockHistoryCard' ? 'Stock History' :
                       cardId === 'VoidPalletCard' ? 'Void Pallet' :
                       cardId === 'VerticalTimelineCard' ? 'Transfer History' :
                       cardId === 'WorkLevelCard' ? 'Work Level' :
                       cardId === 'DownloadCenterCard' ? 'Download Center' :
                       cardId === 'UploadCenterCard' ? 'Upload Center' :
                       cardId === 'PerformanceDashboard' ? 'System Performance' :
                       cardId === 'DataUpdateCard' ? 'Data Update' :
                       cardId === 'DepartInjCard' ? 'Injection Department' :
                       cardId === 'DepartPipeCard' ? 'Pipe Line Department' :
                       cardId === 'DepartWareCard' ? 'Warehouse Department' :
                       cardId === 'ChatbotCard' ? 'Chat with Database' :
                       cardId;
    
    const baseProps = {
      title: displayName,
      isEditMode: false,
    };


    // Add specific configuration for StockLevelListAndChartCard
    if (cardId === 'StockLevelListAndChartCard') {
      return {
        ...baseProps,
        description: 'Product inventory analysis with type filtering',
      };
    }

    // Add specific configuration for StockHistoryCard
    if (cardId === 'StockHistoryCard') {
      return {
        ...baseProps,
        description: 'Search pallet history by product code',
        warehouse: undefined,
        limit: 50,
      };
    }

    // Add specific configuration for VoidPalletCard
    if (cardId === 'VoidPalletCard') {
      return {
        ...baseProps,
        description: 'Void pallets from the system',
      };
    }

    // Add specific configuration for WorkLevelCard
    if (cardId === 'WorkLevelCard') {
      return {
        ...baseProps,
        chartTypes: [ChartType.Line],
        showLegend: true,
        showTooltip: true,
        animationEnabled: true,
        filters: {
          chartId: 'WorkLevelCard',
          dataSource: 'work_level'
        },
        height: 605, // 使用整個card可使用的空間，增加10%
      };
    }

    // Add specific configuration for VerticalTimelineCard
    if (cardId === 'VerticalTimelineCard') {
      return {
        ...baseProps,
        description: 'Vertical timeline of warehouse transfers',
        limit: 20,
        height: '100%',
      };
    }

    // Add specific configuration for DownloadCenterCard
    if (cardId === 'DownloadCenterCard') {
      return {
        ...baseProps,
        showHeader: true,
        height: 'auto',
      };
    }

    // Add specific configuration for PerformanceDashboard
    if (cardId === 'PerformanceDashboard') {
      return {
        ...baseProps,
        description: 'Real-time system performance monitoring',
        autoStart: true,
        reportInterval: 2000,
      };
    }

    // Add specific configuration for DataUpdateCard
    if (cardId === 'DataUpdateCard') {
      return {
        ...baseProps,
        description: 'Update product and supplier data',
      };
    }

    // Add specific configuration for ChatbotCard
    if (cardId === 'ChatbotCard') {
      return {
        ...baseProps,
        description: 'Chat with database using natural language',
      };
    }

    return baseProps;
  };

  // Pass appropriate props to Card component
  return <CardComponent {...getComponentProps()} />;
};

/**
 * Card error boundary component
 */
const CardErrorBoundary: React.FC<{
  cardId: string;
  children: React.ReactNode;
  onError?: (cardId: string, error: Error) => void;
}> = ({ cardId, children, onError }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      setHasError(true);
      onError?.(cardId, new Error(error.message));
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [cardId, onError]);

  if (hasError) {
    return (
      <div
        className={cn(
          'flex h-48 flex-col items-center justify-center',
          'rounded-lg border border-destructive/20 bg-destructive/5',
          'text-destructive'
        )}
      >
        <AlertTriangle className='mb-2 h-8 w-8' />
        <p className={cn('text-sm font-medium leading-normal')}>Card Load Error</p>
        <p className={cn('text-xs font-normal leading-tight', 'mt-1 opacity-70')}>{cardId}</p>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Animation variants configuration
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

export const AnalysisCardSelector: React.FC<AnalysisCardSelectorProps> = ({
  selectedCard,
  onCardError,
  className,
}) => {
  // Validate selected card configuration
  const cardConfig = useMemo(() => {
    // Check if it's a supported analysis card
    // No longer needed - all cards are valid
    
    // Use direct Card mapping with proper type checking
    let cardName: string | null = null;
    let displayName: string = selectedCard;
    
    switch (selectedCard) {
      case 'StockLevelListAndChartCard':
        cardName = 'StockLevelListAndChartCard';
        displayName = 'Stock Level';
        break;
      case 'VerticalTimelineCard':
        cardName = 'VerticalTimelineCard';
        displayName = 'Transfer History';
        break;
      case 'WorkLevelCard':
        cardName = 'WorkLevelCard';
        displayName = 'Work Level';
        break;
      case 'StockHistoryCard':
        cardName = 'StockHistoryCard';
        displayName = 'Stock History';
        break;
      case 'UploadCenterCard':
        cardName = 'UploadCenterCard';
        displayName = 'Upload Center';
        break;
      case 'DownloadCenterCard':
        cardName = 'DownloadCenterCard';
        displayName = 'Download Center';
        break;
      case 'PerformanceDashboard':
        cardName = 'PerformanceDashboard';
        displayName = 'System Performance';
        break;
      case 'DataUpdateCard':
        cardName = 'DataUpdateCard';
        displayName = 'Data Update';
        break;
      case 'DepartInjCard':
        cardName = 'DepartInjCard';
        displayName = 'Injection Department';
        break;
      case 'DepartPipeCard':
        cardName = 'DepartPipeCard';
        displayName = 'Pipe Line Department';
        break;
      case 'DepartWareCard':
        cardName = 'DepartWareCard';
        displayName = 'Warehouse Department';
        break;
      case 'VoidPalletCard':
        cardName = 'VoidPalletCard';
        displayName = 'Void Pallet';
        break;
      case 'ChatbotCard':
        cardName = 'ChatbotCard';
        displayName = 'Chat with Database';
        break;
      default:
        cardName = null;
    }
    
    if (!cardName) return null;
    
    // Create a config for compatibility
    return {
      config: {
        name: displayName,
        cardType: cardName,
        description: ''
      }
    };
  }, [selectedCard]);

  // If card configuration is invalid
  if (!cardConfig) {
    return (
      <div
        className={cn(
          'flex h-64 flex-col items-center justify-center',
          'text-muted-foreground',
          className
        )}
      >
        <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
          <AlertTriangle className='h-6 w-6' />
        </div>
        <h3 className={cn('text-base font-medium leading-normal', 'mb-2')}>
          Card Configuration Error
        </h3>
        <p className={cn('text-sm font-normal leading-normal', 'max-w-sm text-center')}>
          The selected card &quot;{selectedCard}&quot; is not properly configured.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn('flex h-full w-full flex-col', className)}
      initial='hidden'
      animate='visible'
      variants={containerVariants}
    >
      {/* Title area - 移除雙重標題，由各Card組件自行處理 */}

      {/* Single Card display area - 使用響應式高度，移除多層包裝 */}
      <motion.div className='min-h-0 flex-1' variants={itemVariants}>
        <CardErrorBoundary cardId={selectedCard} onError={onCardError}>
          <React.Suspense
            fallback={
              <div className='flex h-full items-center justify-center'>
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
              </div>
            }
          >
            {/* Dynamically load corresponding Card component - 直接載入，無額外包裝 */}
            <DynamicCardLoader 
              cardId={selectedCard}
              cardName={cardConfig.config.name}
            />
          </React.Suspense>
        </CardErrorBoundary>
      </motion.div>
    </motion.div>
  );
};

export default AnalysisCardSelector;

/**
 * Usage example:
 *
 * ```tsx
 * const [selectedCard, setSelectedCard] = useState<AnalysisCardId>('StockDistributionChartV2');
 *
 * <AnalysisCardSelector
 *   selectedCard={selectedCard}
 *   onCardError={(cardId, error) => {
 *     console.error(`Card ${cardId} failed:`, error);
 *   }}
 * />
 * ```
 */