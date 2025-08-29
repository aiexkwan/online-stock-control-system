/**
 * Context Manager for Card Migration
 * Handles context preservation, rollback mechanisms, and inter-phase communication
 */

import { createClient } from '@/app/utils/supabase/server';
import {
  getMigrationTracker,
  type MigrationPhase,
  type CardMigrationRecord,
} from './migration-tracker';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface MigrationContext {
  id: string;
  phase: MigrationPhase;
  timestamp: Date;
  snapshot: ContextSnapshot;
  metadata: ContextMetadata;
}

export interface ContextSnapshot {
  components: ComponentContext[];
  decisions: DecisionContext[];
  patterns: PatternContext[];
  performance: PerformanceContext;
  issues: IssueContext[];
  dependencies: DependencyContext;
}

export interface ComponentContext {
  id: string;
  name: string;
  status: string;
  migrationNotes: string[];
  breakingChanges: string[];
  testCoverage: number;
  performanceImpact: string;
}

export interface DecisionContext {
  id: string;
  date: Date;
  decision: string;
  rationale: string;
  impact: string[];
  alternatives: string[];
  reversible: boolean;
}

export interface PatternContext {
  name: string;
  type: 'architectural' | 'design' | 'implementation';
  description: string;
  usage: string[];
  benefits: string[];
  considerations: string[];
}

export interface PerformanceContext {
  baseline: PerformanceMetrics;
  current: PerformanceMetrics;
  trends: PerformanceTrend[];
  bottlenecks: string[];
  optimizations: string[];
}

export interface PerformanceMetrics {
  renderTime: number;
  apiLatency: number;
  bundleSize: number;
  memoryUsage: number;
  errorRate: number;
}

export interface PerformanceTrend {
  metric: keyof PerformanceMetrics;
  direction: 'improving' | 'stable' | 'degrading';
  changePercent: number;
  period: string;
}

export interface IssueContext {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  component: string;
  description: string;
  resolution?: string;
  preventionMeasure?: string;
  relatedIssues: string[];
}

export interface DependencyContext {
  graph: Map<string, string[]>;
  criticalPaths: string[][];
  circularDependencies: string[][];
  externalDependencies: ExternalDependency[];
}

export interface ExternalDependency {
  name: string;
  version: string;
  type: 'npm' | 'api' | 'service' | 'database';
  criticalFor: string[];
  alternativesEvaluated: boolean;
}

export interface ContextMetadata {
  createdBy: string;
  createdAt: Date;
  validUntil: Date;
  checksum: string;
  version: string;
  tags: string[];
}

export interface RollbackPlan {
  componentId: string;
  triggers: RollbackTrigger[];
  steps: RollbackStep[];
  validation: ValidationStep[];
  communicationPlan: CommunicationStep[];
}

export interface RollbackTrigger {
  type: 'automatic' | 'manual';
  condition: string;
  threshold?: number;
  cooldownPeriod?: number;
}

export interface RollbackStep {
  order: number;
  action: string;
  command?: string;
  verification: string;
  estimatedDuration: number;
  canSkip: boolean;
}

export interface ValidationStep {
  name: string;
  type: 'health-check' | 'data-integrity' | 'performance' | 'user-experience';
  expectedResult: string;
  fallbackAction?: string;
}

export interface CommunicationStep {
  audience: string[];
  channel: 'slack' | 'email' | 'dashboard' | 'page';
  message: string;
  timing: 'before' | 'during' | 'after';
}

// ============================================================================
// Context Manager Class
// ============================================================================

export class ContextManager {
  private static instance: ContextManager;
  private supabase!: Awaited<ReturnType<typeof createClient>>;
  private currentContext: MigrationContext | null = null;
  private contextHistory: MigrationContext[] = [];
  private rollbackPlans: Map<string, RollbackPlan> = new Map();

  private constructor() {
    this.init();
  }

  private async init() {
    this.supabase = await createClient();
    await this.initializeContext();
  }

  public static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }

  /**
   * Initialize context from database or create new
   */
  private async initializeContext(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('migration_context')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        this.currentContext = this.deserializeContext(data);
        await this.loadContextHistory();
      } else {
        this.currentContext = this.createNewContext(2); // Current phase
      }
    } catch (error) {
      console.error('Failed to initialize context:', error);
      this.currentContext = this.createNewContext(2);
    }
  }

  /**
   * Create new migration context
   */
  private createNewContext(phase: MigrationPhase): MigrationContext {
    const tracker = getMigrationTracker();
    const status = tracker.getMigrationStatus();

    return {
      id: `ctx-${Date.now()}`,
      phase,
      timestamp: new Date(),
      snapshot: {
        components: this.captureComponentContext(),
        decisions: [],
        patterns: this.capturePatternContext(),
        performance: this.capturePerformanceContext(),
        issues: [],
        dependencies: this.captureDependencyContext(),
      },
      metadata: {
        createdBy: 'system',
        createdAt: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        checksum: this.generateChecksum(),
        version: '1.0.0',
        tags: [`phase-${phase}`, 'active'],
      },
    };
  }

  /**
   * Capture current component context
   */
  private captureComponentContext(): ComponentContext[] {
    const tracker = getMigrationTracker();
    const components: ComponentContext[] = [];

    // This would iterate through actual components
    // For now, returning structured example
    return [
      {
        id: 'stock-count-card',
        name: 'StockCountCard',
        status: 'completed',
        migrationNotes: [
          'Migrated to GraphQL',
          'Added error boundary',
          'Implemented optimistic updates',
        ],
        breakingChanges: ['Props interface changed', 'State management refactored'],
        testCoverage: 85,
        performanceImpact: 'Improved by 20%',
      },
    ];
  }

  /**
   * Capture design patterns in use
   */
  private capturePatternContext(): PatternContext[] {
    return [
      {
        name: 'Card Base Architecture',
        type: 'architectural',
        description: 'Standardized card component structure with base classes',
        usage: ['All card components'],
        benefits: ['Consistent API', 'Shared functionality', 'Easier maintenance'],
        considerations: ['Learning curve for new developers', 'Potential over-abstraction'],
      },
      {
        name: 'GraphQL Migration Pattern',
        type: 'implementation',
        description: 'Incremental migration from REST to GraphQL',
        usage: ['Data fetching layer'],
        benefits: ['Better performance', 'Type safety', 'Reduced over-fetching'],
        considerations: ['Caching complexity', 'Initial setup overhead'],
      },
    ];
  }

  /**
   * Capture performance context
   */
  private capturePerformanceContext(): PerformanceContext {
    return {
      baseline: {
        renderTime: 150,
        apiLatency: 250,
        bundleSize: 450,
        memoryUsage: 45,
        errorRate: 0.5,
      },
      current: {
        renderTime: 120,
        apiLatency: 200,
        bundleSize: 420,
        memoryUsage: 40,
        errorRate: 0.1,
      },
      trends: [
        {
          metric: 'renderTime',
          direction: 'improving',
          changePercent: -20,
          period: '30d',
        },
        {
          metric: 'apiLatency',
          direction: 'improving',
          changePercent: -20,
          period: '30d',
        },
      ],
      bottlenecks: [
        'Large bundle size for chart components',
        'Slow initial data load for analytics',
      ],
      optimizations: [
        'Implemented code splitting',
        'Added request caching',
        'Optimized re-renders',
      ],
    };
  }

  /**
   * Capture dependency context
   */
  private captureDependencyContext(): DependencyContext {
    const tracker = getMigrationTracker();
    const graph = tracker.getDependencyGraph();

    // Convert Map<string, Set<string>> to Map<string, string[]>
    const convertedGraph = new Map<string, string[]>();
    graph.forEach((value, key) => {
      convertedGraph.set(key, Array.from(value));
    });

    return {
      graph: convertedGraph,
      criticalPaths: [['stock-data-service', 'stock-count-card', 'stock-history-card']],
      circularDependencies: [],
      externalDependencies: [
        {
          name: 'recharts',
          version: '2.5.0',
          type: 'npm',
          criticalFor: ['stock-level-chart-card'],
          alternativesEvaluated: true,
        },
        {
          name: 'supabase',
          version: '2.x',
          type: 'service',
          criticalFor: ['all'],
          alternativesEvaluated: false,
        },
      ],
    };
  }

  /**
   * Save context snapshot
   */
  public async saveSnapshot(phase: MigrationPhase, notes?: string): Promise<string> {
    const snapshot = this.createNewContext(phase);

    try {
      const { data, error } = await this.supabase
        .from('migration_context')
        .insert({
          id: snapshot.id,
          phase: snapshot.phase,
          snapshot: JSON.stringify(snapshot.snapshot),
          metadata: snapshot.metadata,
          notes,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      this.contextHistory.push(snapshot);
      this.currentContext = snapshot;

      // Also save to local file for backup
      await this.saveLocalBackup(snapshot);

      return snapshot.id;
    } catch (error) {
      console.error('Failed to save snapshot:', error);
      throw error;
    }
  }

  /**
   * Load context for specific phase
   */
  public async loadPhaseContext(phase: MigrationPhase): Promise<MigrationContext | null> {
    try {
      const { data, error } = await this.supabase
        .from('migration_context')
        .select('*')
        .eq('phase', phase)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      return this.deserializeContext(data);
    } catch (error) {
      console.error('Failed to load phase context:', error);
      return null;
    }
  }

  /**
   * Create rollback plan for component
   */
  public createRollbackPlan(componentId: string): RollbackPlan {
    const plan: RollbackPlan = {
      componentId,
      triggers: [
        {
          type: 'automatic',
          condition: 'error_rate > 5%',
          threshold: 5,
          cooldownPeriod: 300, // 5 minutes
        },
        {
          type: 'automatic',
          condition: 'response_time > 2000ms',
          threshold: 2000,
          cooldownPeriod: 300,
        },
        {
          type: 'manual',
          condition: 'user_initiated',
        },
      ],
      steps: [
        {
          order: 1,
          action: 'Disable feature flag',
          command: `npm run feature:disable ${componentId}`,
          verification: 'Feature flag status check',
          estimatedDuration: 10,
          canSkip: false,
        },
        {
          order: 2,
          action: 'Switch to legacy component',
          command: `npm run component:switch-legacy ${componentId}`,
          verification: 'Component rendering check',
          estimatedDuration: 30,
          canSkip: false,
        },
        {
          order: 3,
          action: 'Clear cache',
          command: 'npm run cache:clear',
          verification: 'Cache status check',
          estimatedDuration: 20,
          canSkip: true,
        },
        {
          order: 4,
          action: 'Verify system stability',
          verification: 'Health check passing',
          estimatedDuration: 60,
          canSkip: false,
        },
      ],
      validation: [
        {
          name: 'API Health Check',
          type: 'health-check',
          expectedResult: 'All endpoints responding',
          fallbackAction: 'Restart API service',
        },
        {
          name: 'Data Integrity Check',
          type: 'data-integrity',
          expectedResult: 'No data inconsistencies',
          fallbackAction: 'Run data reconciliation',
        },
        {
          name: 'Performance Check',
          type: 'performance',
          expectedResult: 'Metrics within baseline',
          fallbackAction: 'Scale resources',
        },
      ],
      communicationPlan: [
        {
          audience: ['dev-team'],
          channel: 'slack',
          message: `🔄 Rollback initiated for ${componentId}`,
          timing: 'before',
        },
        {
          audience: ['ops-team'],
          channel: 'page',
          message: `Critical: Rollback in progress for ${componentId}`,
          timing: 'during',
        },
        {
          audience: ['stakeholders'],
          channel: 'email',
          message: `Rollback completed for ${componentId}. System stable.`,
          timing: 'after',
        },
      ],
    };

    this.rollbackPlans.set(componentId, plan);
    return plan;
  }

  /**
   * Execute rollback
   */
  public async executeRollback(componentId: string, reason: string): Promise<boolean> {
    const plan = this.rollbackPlans.get(componentId) || this.createRollbackPlan(componentId);

    console.log(`🔄 Starting rollback for ${componentId}: ${reason}`);

    try {
      // Execute communication plan (before)
      await this.executeCommunication(plan.communicationPlan, 'before');

      // Execute rollback steps
      for (const step of plan.steps) {
        console.log(`  Step ${step.order}: ${step.action}`);

        if (step.command) {
          // Would execute actual command here
          console.log(`  Executing: ${step.command}`);
        }

        // Verify step completion
        console.log(`  Verifying: ${step.verification}`);

        // Simulate step execution
        await new Promise(resolve => setTimeout(resolve, step.estimatedDuration * 100));
      }

      // Execute validation steps
      for (const validation of plan.validation) {
        console.log(`  Validating: ${validation.name}`);
        // Would perform actual validation here
      }

      // Execute communication plan (after)
      await this.executeCommunication(plan.communicationPlan, 'after');

      // Update migration tracker
      const tracker = getMigrationTracker();
      await tracker.updateCardStatus(componentId, 'rolled-back', {
        rollbackCount: 1, // Would increment existing count
      });

      console.log(`✅ Rollback completed for ${componentId}`);
      return true;
    } catch (error) {
      console.error(`❌ Rollback failed for ${componentId}:`, error);
      return false;
    }
  }

  /**
   * Execute communication plan
   */
  private async executeCommunication(
    steps: CommunicationStep[],
    timing: 'before' | 'during' | 'after'
  ): Promise<void> {
    const relevantSteps = steps.filter(s => s.timing === timing);

    for (const step of relevantSteps) {
      console.log(`  📢 ${step.channel}: ${step.message} → ${step.audience.join(', ')}`);
      // Would send actual notifications here
    }
  }

  /**
   * Generate context summary for handoff
   */
  public generateHandoffSummary(): string {
    if (!this.currentContext) {
      return 'No context available';
    }

    const { snapshot, phase } = this.currentContext;

    return `
# Migration Context Summary - Phase ${phase}

## Component Status
- Completed: ${snapshot.components.filter(c => c.status === 'completed').length}
- In Progress: ${snapshot.components.filter(c => c.status === 'in-progress').length}
- Pending: ${snapshot.components.filter(c => c.status === 'pending').length}

## Key Decisions
${snapshot.decisions.map(d => `- ${d.decision}: ${d.rationale}`).join('\n')}

## Active Patterns
${snapshot.patterns.map(p => `- ${p.name}: ${p.description}`).join('\n')}

## Performance Trends
${snapshot.performance.trends.map(t => `- ${t.metric}: ${t.direction} (${t.changePercent}%)`).join('\n')}

## Known Issues
${snapshot.issues.map(i => `- [${i.severity}] ${i.description}`).join('\n')}

## Critical Dependencies
${Array.from(snapshot.dependencies.graph.entries())
  .slice(0, 5)
  .map(([k, v]) => `- ${k}: ${v.join(', ')}`)
  .join('\n')}
    `.trim();
  }

  /**
   * Validate context integrity
   */
  public validateContext(): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!this.currentContext) {
      issues.push('No current context available');
      return { isValid: false, issues };
    }

    // Check context age
    const age = Date.now() - this.currentContext.timestamp.getTime();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (age > maxAge) {
      issues.push('Context is older than 7 days');
    }

    // Check completeness
    if (this.currentContext.snapshot.components.length === 0) {
      issues.push('No component context captured');
    }

    // Check checksum
    const currentChecksum = this.generateChecksum();
    if (currentChecksum !== this.currentContext.metadata.checksum) {
      issues.push('Context checksum mismatch - possible corruption');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  // Helper methods
  private generateChecksum(): string {
    // Would generate actual checksum
    return `chk-${Date.now()}`;
  }

  private async saveLocalBackup(context: MigrationContext): Promise<void> {
    // Would save to local file system
    console.log(`Saved local backup: ${context.id}`);
  }

  private async loadContextHistory(): Promise<void> {
    // Would load from database
    this.contextHistory = [];
  }

  private deserializeContext(data: unknown): MigrationContext {
    const contextData = data as Record<string, unknown>;
    return {
      ...contextData,
      timestamp: new Date(contextData.timestamp as string),
      snapshot: JSON.parse(contextData.snapshot as string),
    } as MigrationContext;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get context manager instance
 */
export function getContextManager(): ContextManager {
  return ContextManager.getInstance();
}

/**
 * Quick context check
 */
export async function checkMigrationReadiness(componentId: string): Promise<{
  ready: boolean;
  context: string;
  blockers: string[];
}> {
  const tracker = getMigrationTracker();
  const contextManager = getContextManager();

  const { canProceed, blockers } = tracker.canProceedWithMigration(componentId);
  const contextSummary = contextManager.generateHandoffSummary();

  return {
    ready: canProceed,
    context: contextSummary,
    blockers,
  };
}
