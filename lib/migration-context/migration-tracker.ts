/**
 * Card Migration Tracker System
 * Provides real-time tracking and context management for card migration
 */

import { createClient } from '@/app/utils/supabase/server';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type MigrationPhase = 1 | 2 | 3 | 4 | 5;
export type MigrationStatus = 'pending' | 'in-progress' | 'testing' | 'completed' | 'rolled-back';
export type DataSourceType = 'REST' | 'GraphQL' | 'Hybrid';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface PerformanceMetrics {
  renderTime: {
    p50: number;
    p75: number;
    p95: number;
  };
  apiLatency: {
    rest?: number;
    graphql?: number;
  };
  bundleSize: number;
  memoryUsage: {
    initial: number;
    peak: number;
    average: number;
  };
}

export interface MigrationIssue {
  id: string;
  severity: RiskLevel;
  description: string;
  resolvedAt?: Date;
  resolution?: string;
}

export interface CardMigrationRecord {
  componentId: string;
  componentName: string;
  oldPath: string;
  newPath: string;
  phase: MigrationPhase;
  status: MigrationStatus;
  dependencies: string[];
  dataSource: DataSourceType;
  migrationStartDate?: Date;
  migrationEndDate?: Date;
  performanceBaseline: PerformanceMetrics;
  performanceCurrent?: PerformanceMetrics;
  issues: MigrationIssue[];
  rollbackCount: number;
  lastUpdated: Date;
}

export interface PhaseContext {
  phaseNumber: MigrationPhase;
  startDate: Date;
  endDate?: Date;
  completedComponents: string[];
  inProgressComponents: string[];
  decisions: MigrationDecision[];
  patterns: DesignPattern[];
  breakingChanges: BreakingChange[];
  rollbackPoints: RollbackPoint[];
  performanceSummary: PhasePerformanceSummary;
}

export interface MigrationDecision {
  id: string;
  decision: string;
  rationale: string;
  impact: string[];
  madeBy: string;
  timestamp: Date;
  relatedComponents: string[];
}

export interface DesignPattern {
  name: string;
  description: string;
  implementation: string;
  usedIn: string[];
  benefits: string[];
  drawbacks?: string[];
}

export interface BreakingChange {
  id: string;
  type: 'API' | 'Component' | 'State' | 'Routing' | 'Styling';
  description: string;
  affectedComponents: string[];
  migrationGuide: string;
  communicatedAt?: Date;
}

export interface RollbackPoint {
  id: string;
  componentId: string;
  timestamp: Date;
  gitCommit: string;
  reason: string;
  automaticTrigger?: string;
}

export interface PhasePerformanceSummary {
  averageRenderTimeImprovement: number;
  apiLatencyReduction: number;
  bundleSizeChange: number;
  errorRateChange: number;
  userSatisfactionScore?: number;
}

// ============================================================================
// Card Migration Registry
// ============================================================================

export const CARD_MIGRATION_REGISTRY: Record<string, Partial<CardMigrationRecord>> = {
  // Phase 1 - Operation Cards (Complete)
  'stock-count-card': {
    componentName: 'StockCountCard',
    oldPath: 'app/(app)/admin/widgets/StockCountWidget.tsx',
    newPath: 'app/(app)/admin/cards/StockCountCard.tsx',
    phase: 1,
    status: 'completed',
    dataSource: 'GraphQL',
    dependencies: ['stock-data-service', 'form-validation'],
  },
  'stock-transfer-card': {
    componentName: 'StockTransferCard',
    oldPath: 'app/(app)/admin/widgets/StockTransferWidget.tsx',
    newPath: 'app/(app)/admin/cards/StockTransferCard.tsx',
    phase: 1,
    status: 'completed',
    dataSource: 'GraphQL',
    dependencies: ['stock-data-service', 'location-service'],
  },
  'void-pallet-card': {
    componentName: 'VoidPalletCard',
    oldPath: 'app/(app)/admin/widgets/VoidPalletWidget.tsx',
    newPath: 'app/(app)/admin/cards/VoidPalletCard.tsx',
    phase: 1,
    status: 'completed',
    dataSource: 'GraphQL',
    dependencies: ['pallet-service', 'validation-service'],
  },

  // Phase 2 - Analysis Cards (In Progress)
  'stock-level-chart-card': {
    componentName: 'StockLevelListAndChartCard',
    oldPath: 'app/(app)/admin/widgets/StockLevelWidget.tsx',
    newPath: 'app/(app)/admin/cards/StockLevelListAndChartCard.tsx',
    phase: 2,
    status: 'in-progress',
    dataSource: 'Hybrid',
    dependencies: ['chart-library', 'stock-data-service', 'real-time-updates'],
  },
  'stock-history-card': {
    componentName: 'StockHistoryCard',
    oldPath: 'app/(app)/admin/widgets/StockHistoryWidget.tsx',
    newPath: 'app/(app)/admin/cards/StockHistoryCard.tsx',
    phase: 2,
    status: 'in-progress',
    dataSource: 'GraphQL',
    dependencies: ['timeline-component', 'stock-data-service'],
  },
  'work-level-card': {
    componentName: 'WorkLevelCard',
    oldPath: 'app/(app)/admin/widgets/WorkLevelWidget.tsx',
    newPath: 'app/(app)/admin/cards/WorkLevelCard.tsx',
    phase: 2,
    status: 'testing',
    dataSource: 'GraphQL',
    dependencies: ['warehouse-service', 'analytics-service'],
  },

  // Phase 3 - Data Management Cards (Pending)
  'data-update-card': {
    componentName: 'DataUpdateCard',
    phase: 3,
    status: 'pending',
    dataSource: 'GraphQL',
    dependencies: ['bulk-operations', 'validation-service'],
  },
  'order-load-card': {
    componentName: 'OrderLoadCard',
    phase: 3,
    status: 'pending',
    dataSource: 'Hybrid',
    dependencies: ['order-service', 'data-update-card'],
  },
  'upload-center-card': {
    componentName: 'UploadCenterCard',
    phase: 3,
    status: 'pending',
    dataSource: 'REST',
    dependencies: ['file-service', 'validation-service'],
  },
  'download-center-card': {
    componentName: 'DownloadCenterCard',
    phase: 3,
    status: 'pending',
    dataSource: 'REST',
    dependencies: ['file-service', 'report-generator'],
  },

  // Phase 4 - Department Cards (Pending)
  'depart-ware-card': {
    componentName: 'DepartWareCard',
    phase: 4,
    status: 'pending',
    dataSource: 'GraphQL',
    dependencies: ['warehouse-service', 'department-auth'],
  },
  'depart-pipe-card': {
    componentName: 'DepartPipeCard',
    phase: 4,
    status: 'pending',
    dataSource: 'GraphQL',
    dependencies: ['pipeline-service', 'department-auth'],
  },
  'depart-inj-card': {
    componentName: 'DepartInjCard',
    phase: 4,
    status: 'pending',
    dataSource: 'GraphQL',
    dependencies: ['injection-service', 'department-auth'],
  },

  // Phase 5 - Specialized Cards (Pending)
  'grn-label-card': {
    componentName: 'GRNLabelCard',
    phase: 5,
    status: 'pending',
    dataSource: 'Hybrid',
    dependencies: ['printing-service', 'label-generator'],
  },
  'qc-label-card': {
    componentName: 'QCLabelCard',
    phase: 5,
    status: 'pending',
    dataSource: 'Hybrid',
    dependencies: ['printing-service', 'qc-service'],
  },
  'chatbot-card': {
    componentName: 'ChatbotCard',
    phase: 5,
    status: 'pending',
    dataSource: 'REST',
    dependencies: ['ai-service', 'conversation-manager'],
  },
  'timeline-card': {
    componentName: 'VerticalTimelineCard',
    phase: 5,
    status: 'pending',
    dataSource: 'GraphQL',
    dependencies: ['visualization-library', 'event-service'],
  },
  'tab-selector-card': {
    componentName: 'TabSelectorCard',
    phase: 5,
    status: 'pending',
    dataSource: 'REST',
    dependencies: ['navigation-service', 'state-management'],
  },
  'analysis-selector-card': {
    componentName: 'AnalysisCardSelector',
    phase: 5,
    status: 'pending',
    dataSource: 'REST',
    dependencies: ['card-registry', 'permission-service'],
  },
};

// ============================================================================
// Migration Tracker Class
// ============================================================================

export class MigrationTracker {
  private static instance: MigrationTracker;
  private supabase!: Awaited<ReturnType<typeof createClient>>;
  private cache: Map<string, CardMigrationRecord> = new Map();

  private constructor() {
    this.init();
  }

  private async init() {
    this.supabase = await createClient();
    await this.loadFromDatabase();
  }

  public static getInstance(): MigrationTracker {
    if (!MigrationTracker.instance) {
      MigrationTracker.instance = new MigrationTracker();
    }
    return MigrationTracker.instance;
  }

  /**
   * Load migration records from database
   */
  private async loadFromDatabase(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('migration_tracking')
        .select('*');

      if (error) throw error;

      data?.forEach((record: Record<string, unknown>) => {
        const migrationRecord: CardMigrationRecord = {
          componentId: record.component_id as string,
          componentName: record.component_name as string,
          oldPath: record.old_path as string,
          newPath: record.new_path as string,
          phase: record.phase as MigrationPhase,
          status: record.status as MigrationStatus,
          dependencies: record.dependencies as string[] || [],
          dataSource: record.data_source as DataSourceType,
          migrationStartDate: record.migration_start_date ? new Date(record.migration_start_date as string) : undefined,
          migrationEndDate: record.migration_end_date ? new Date(record.migration_end_date as string) : undefined,
          performanceBaseline: record.performance_baseline as PerformanceMetrics || { 
            renderTime: 0,
            bundleSize: 0,
            memoryUsage: 0,
            loadTime: 0
          },
          performanceCurrent: record.performance_current as PerformanceMetrics | undefined,
          issues: record.issues as MigrationIssue[] || [],
          rollbackCount: record.rollback_count as number || 0,
          lastUpdated: new Date(record.last_updated as string),
        };
        this.cache.set(record.component_id as string, migrationRecord);
      });
    } catch (error) {
      console.error('Failed to load migration records:', error);
    }
  }

  /**
   * Get current migration status
   */
  public getMigrationStatus(): {
    overall: number;
    byPhase: Record<MigrationPhase, number>;
    byStatus: Record<MigrationStatus, number>;
  } {
    const records = Array.from(this.cache.values());
    const total = Object.keys(CARD_MIGRATION_REGISTRY).length;
    const completed = records.filter(r => r.status === 'completed').length;

    const byPhase: Record<MigrationPhase, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const byStatus: Record<MigrationStatus, number> = {
      'pending': 0,
      'in-progress': 0,
      'testing': 0,
      'completed': 0,
      'rolled-back': 0,
    };

    Object.values(CARD_MIGRATION_REGISTRY).forEach(card => {
      if (card.phase) {
        const status = card.status || 'pending';
        byPhase[card.phase]++;
        byStatus[status]++;
      }
    });

    return {
      overall: (completed / total) * 100,
      byPhase,
      byStatus,
    };
  }

  /**
   * Update card migration status
   */
  public async updateCardStatus(
    componentId: string,
    status: MigrationStatus,
    additionalData?: Partial<CardMigrationRecord>
  ): Promise<void> {
    const existingRecord = this.cache.get(componentId) || {
      ...CARD_MIGRATION_REGISTRY[componentId],
      componentId,
      issues: [],
      rollbackCount: 0,
    } as CardMigrationRecord;

    const updatedRecord: CardMigrationRecord = {
      ...existingRecord,
      ...additionalData,
      status,
      lastUpdated: new Date(),
    };

    if (status === 'in-progress' && !updatedRecord.migrationStartDate) {
      updatedRecord.migrationStartDate = new Date();
    }

    if (status === 'completed' && !updatedRecord.migrationEndDate) {
      updatedRecord.migrationEndDate = new Date();
    }

    this.cache.set(componentId, updatedRecord);
    await this.persistToDatabase(updatedRecord);
  }

  /**
   * Persist record to database
   */
  private async persistToDatabase(record: CardMigrationRecord): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('migration_tracking')
        .upsert({
          component_id: record.componentId,
          component_name: record.componentName,
          old_path: record.oldPath,
          new_path: record.newPath,
          phase: record.phase,
          status: record.status,
          dependencies: record.dependencies,
          data_source: record.dataSource,
          migration_start_date: record.migrationStartDate?.toISOString(),
          migration_end_date: record.migrationEndDate?.toISOString(),
          performance_baseline: record.performanceBaseline,
          performance_current: record.performanceCurrent,
          issues: record.issues,
          rollback_count: record.rollbackCount,
          last_updated: record.lastUpdated.toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to persist migration record:', error);
    }
  }

  /**
   * Get dependency graph
   */
  public getDependencyGraph(): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();

    Object.entries(CARD_MIGRATION_REGISTRY).forEach(([id, card]) => {
      if (card.dependencies) {
        graph.set(id, new Set(card.dependencies));
      }
    });

    return graph;
  }

  /**
   * Calculate migration order based on dependencies
   */
  public getMigrationOrder(): string[] {
    const graph = this.getDependencyGraph();
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (node: string) => {
      if (visited.has(node)) return;
      visited.add(node);

      const deps = graph.get(node);
      if (deps) {
        deps.forEach(dep => {
          // Check if dep is another card
          if (CARD_MIGRATION_REGISTRY[dep]) {
            visit(dep);
          }
        });
      }

      order.push(node);
    };

    Object.keys(CARD_MIGRATION_REGISTRY).forEach(visit);
    return order;
  }

  /**
   * Get risk assessment for a specific card
   */
  public getRiskAssessment(componentId: string): {
    level: RiskLevel;
    factors: string[];
    mitigations: string[];
  } {
    const card = CARD_MIGRATION_REGISTRY[componentId];
    if (!card) {
      return {
        level: 'low',
        factors: ['Unknown component'],
        mitigations: ['Verify component exists'],
      };
    }

    const factors: string[] = [];
    const mitigations: string[] = [];
    let riskScore = 0;

    // Check dependencies
    if (card.dependencies && card.dependencies.length > 5) {
      factors.push('High number of dependencies');
      mitigations.push('Thorough integration testing');
      riskScore += 2;
    }

    // Check data source
    if (card.dataSource === 'Hybrid') {
      factors.push('Multiple data sources');
      mitigations.push('Data consistency validation');
      riskScore += 1;
    }

    // Check phase
    if (card.phase === 5) {
      factors.push('Specialized functionality');
      mitigations.push('Extended testing period');
      riskScore += 1;
    }

    // Special cases
    if (componentId.includes('label') || componentId.includes('print')) {
      factors.push('Hardware integration required');
      mitigations.push('Hardware compatibility testing');
      riskScore += 3;
    }

    if (componentId.includes('chatbot')) {
      factors.push('AI service dependency');
      mitigations.push('Fallback mechanisms');
      riskScore += 2;
    }

    // Determine risk level
    let level: RiskLevel = 'low';
    if (riskScore >= 5) level = 'critical';
    else if (riskScore >= 3) level = 'high';
    else if (riskScore >= 1) level = 'medium';

    return { level, factors, mitigations };
  }

  /**
   * Generate phase report
   */
  public async generatePhaseReport(phase: MigrationPhase): Promise<PhaseContext> {
    const phaseCards = Object.entries(CARD_MIGRATION_REGISTRY)
      .filter(([_, card]) => card.phase === phase);

    const completedComponents = phaseCards
      .filter(([_, card]) => card.status === 'completed')
      .map(([id]) => id);

    const inProgressComponents = phaseCards
      .filter(([_, card]) => card.status === 'in-progress' || card.status === 'testing')
      .map(([id]) => id);

    // Calculate performance summary
    const performanceMetrics = await this.calculatePhasePerformance(phase);

    return {
      phaseNumber: phase,
      startDate: new Date(), // Would fetch from DB
      completedComponents,
      inProgressComponents,
      decisions: [], // Would fetch from decision log
      patterns: [], // Would fetch from pattern registry
      breakingChanges: [], // Would fetch from change log
      rollbackPoints: [], // Would fetch from rollback history
      performanceSummary: performanceMetrics,
    };
  }

  /**
   * Calculate phase performance metrics
   */
  private async calculatePhasePerformance(phase: MigrationPhase): Promise<PhasePerformanceSummary> {
    // This would aggregate real performance data
    // For now, returning mock data
    return {
      averageRenderTimeImprovement: 15.5,
      apiLatencyReduction: 22.3,
      bundleSizeChange: -5.2,
      errorRateChange: -0.05,
      userSatisfactionScore: 4.6,
    };
  }

  /**
   * Check if migration can proceed
   */
  public canProceedWithMigration(componentId: string): {
    canProceed: boolean;
    blockers: string[];
  } {
    const card = CARD_MIGRATION_REGISTRY[componentId];
    if (!card) {
      return {
        canProceed: false,
        blockers: ['Component not found in registry'],
      };
    }

    const blockers: string[] = [];

    // Check if dependencies are migrated
    if (card.dependencies) {
      card.dependencies.forEach(dep => {
        if (CARD_MIGRATION_REGISTRY[dep]) {
          const depCard = this.cache.get(dep) || CARD_MIGRATION_REGISTRY[dep];
          if (depCard.status !== 'completed') {
            blockers.push(`Dependency ${dep} not completed`);
          }
        }
      });
    }

    // Check phase prerequisites
    if (card.phase && card.phase > 1) {
      const previousPhase = (card.phase - 1) as MigrationPhase;
      const previousPhaseCards = Object.entries(CARD_MIGRATION_REGISTRY)
        .filter(([_, c]) => c.phase === previousPhase);
      
      const incompletePrevious = previousPhaseCards
        .filter(([_, c]) => c.status !== 'completed');
      
      if (incompletePrevious.length > 0) {
        blockers.push(`Previous phase ${previousPhase} not complete`);
      }
    }

    return {
      canProceed: blockers.length === 0,
      blockers,
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get migration tracker instance
 */
export function getMigrationTracker(): MigrationTracker {
  return MigrationTracker.getInstance();
}

/**
 * Export migration status for monitoring
 */
export async function exportMigrationMetrics() {
  const tracker = getMigrationTracker();
  const status = tracker.getMigrationStatus();
  
  return {
    timestamp: new Date().toISOString(),
    overall_completion: status.overall,
    phase_breakdown: status.byPhase,
    status_breakdown: status.byStatus,
    next_components: tracker.getMigrationOrder().slice(0, 5),
  };
}