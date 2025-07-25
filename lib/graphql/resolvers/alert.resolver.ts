import { GraphQLResolveInfo } from 'graphql';
import { Context } from '@/lib/graphql/context';
import { AlertMonitoringService } from '@/lib/alerts/AlertMonitoringService';
import { NotificationService } from '@/lib/alerts/NotificationService';
import { AlertStateManager } from '@/lib/alerts/AlertStateManager';
import { AlertRuleEngine } from '@/lib/alerts/AlertRuleEngine';
import { withRetry, withCache } from '@/lib/utils/error-handling';
import { v4 as uuidv4 } from 'uuid';

// Type definitions based on GraphQL schema
type AlertType =
  | 'SYSTEM_ALERT'
  | 'INVENTORY_ALERT'
  | 'ORDER_ALERT'
  | 'TRANSFER_ALERT'
  | 'QUALITY_ALERT'
  | 'PERFORMANCE_ALERT'
  | 'SECURITY_ALERT'
  | 'CUSTOM_ALERT';
type AlertSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'EXPIRED' | 'DISMISSED';

// Database Alert interface (raw database format)
interface DatabaseAlert {
  id: string;
  type?: AlertType;
  severity?: AlertSeverity;
  status?: AlertStatus;
  title: string;
  message: string;
  details?: Record<string, unknown>;
  source?: string;
  created_at: Date;
  acknowledged_at?: Date;
  acknowledged_by?: string;
  resolved_at?: Date;
  resolved_by?: string;
  expires_at?: Date;
  affected_entities?: AffectedEntity[];
  actions?: AlertAction[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

// GraphQL Input types
interface AlertCardInput {
  types?: AlertType[];
  severities?: AlertSeverity[];
  statuses?: AlertStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeAcknowledged?: boolean;
  includeResolved?: boolean;
  limit?: number;
  sortBy?: string;
}

interface CreateAlertInput {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  details?: Record<string, unknown>;
  affectedEntities?: AffectedEntity[];
  expiresIn?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface UpdateAlertRuleInput {
  name?: string;
  enabled?: boolean;
  conditions?: Record<string, unknown>;
  actions?: AlertAction[];
  severity?: AlertSeverity;
  throttle?: number;
}

// Supporting types
interface AffectedEntity {
  entityType: string;
  entityId: string;
  entityName: string;
  impact?: string;
  entityUrl?: string;
}

interface AlertAction {
  id: string;
  type: string;
  label: string;
  url?: string;
  confirmRequired: boolean;
  icon?: string;
}

// Initialize services
const alertMonitoringService = AlertMonitoringService.getInstance();
const notificationService = NotificationService.getInstance();
const alertStateManager = AlertStateManager.getInstance();
const alertRuleEngine = AlertRuleEngine.getInstance();

// Helper function to map database alerts to GraphQL type
function mapAlertToGraphQL(alert: DatabaseAlert) {
  return {
    id: alert.id,
    type: alert.type || 'CUSTOM_ALERT',
    severity: alert.severity || 'INFO',
    status: alert.status || 'ACTIVE',
    title: alert.title,
    message: alert.message,
    details: alert.details || {},
    source: alert.source || 'SYSTEM',
    createdAt: alert.created_at || new Date(),
    acknowledgedAt: alert.acknowledged_at,
    acknowledgedBy: alert.acknowledged_by,
    resolvedAt: alert.resolved_at,
    resolvedBy: alert.resolved_by,
    expiresAt: alert.expires_at,
    affectedEntities: alert.affected_entities || [],
    actions: alert.actions || [],
    tags: alert.tags || [],
    metadata: alert.metadata || {},
  };
}

export const alertResolvers = {
  Query: {
    alertCardData: async (
      _parent: unknown,
      args: { input: AlertCardInput },
      context: Context,
      _info: GraphQLResolveInfo
    ) => {
      try {
        const { input } = args;
        const cacheKey = `alert-card-data:${JSON.stringify(input)}`;

        return await withCache(
          cacheKey,
          async () => {
            // Get alerts from monitoring service
            const alerts = await alertMonitoringService.getAlerts({
              types: input.types,
              severities: input.severities,
              statuses: input.statuses,
              dateRange: input.dateRange,
              includeAcknowledged: input.includeAcknowledged,
              includeResolved: input.includeResolved,
              limit: input.limit,
              sortBy: input.sortBy,
            });

            // Get statistics
            const statistics = await alertMonitoringService.getAlertStatistics({
              dateRange: input.dateRange,
            });

            // Calculate summary
            const summary = {
              totalActive: alerts.filter(a => a.status === 'ACTIVE').length,
              totalToday: alerts.filter(a => {
                const createdAt = new Date(a.created_at);
                const today = new Date();
                return createdAt.toDateString() === today.toDateString();
              }).length,
              bySeverity: calculateSeverityDistribution(alerts),
              byType: calculateTypeDistribution(alerts),
              byStatus: calculateStatusDistribution(alerts),
              recentCount: alerts.filter(a => {
                const createdAt = new Date(a.created_at);
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                return createdAt > oneHourAgo;
              }).length,
              criticalCount: alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE')
                .length,
            };

            // Calculate pagination
            const pagination = {
              hasNextPage: alerts.length === input.limit,
              hasPreviousPage: false,
              totalCount: alerts.length,
              totalPages: Math.ceil(alerts.length / input.limit),
              currentPage: 1,
            };

            return {
              alerts: alerts.map(mapAlertToGraphQL),
              summary,
              statistics,
              pagination,
              lastUpdated: new Date(),
              refreshInterval: 30,
              dataSource: 'alert-monitoring-service',
            };
          },
          60 // Cache for 60 seconds
        );
      } catch (error) {
        console.error('Error fetching alert card data:', error);
        throw new Error('Failed to fetch alert card data');
      }
    },

    alertDetails: async (_parent: unknown, args: { alertId: string }, context: Context) => {
      try {
        const alert = await alertMonitoringService.getAlertById(args.alertId);
        return alert ? mapAlertToGraphQL(alert) : null;
      } catch (error) {
        console.error('Error fetching alert details:', error);
        throw new Error('Failed to fetch alert details');
      }
    },

    alertHistory: async (
      _parent: unknown,
      args: { entityId?: string; dateRange?: { start: Date; end: Date }; limit?: number },
      context: Context
    ) => {
      try {
        const alerts = await alertMonitoringService.getAlertHistory({
          entityId: args.entityId,
          dateRange: args.dateRange,
          limit: args.limit || 100,
        });
        return alerts.map(mapAlertToGraphQL);
      } catch (error) {
        console.error('Error fetching alert history:', error);
        throw new Error('Failed to fetch alert history');
      }
    },

    alertRules: async (_parent: unknown, _args: unknown, context: Context) => {
      try {
        const rules = await alertRuleEngine.getRules();
        return rules;
      } catch (error) {
        console.error('Error fetching alert rules:', error);
        throw new Error('Failed to fetch alert rules');
      }
    },

    alertChannels: async (_parent: unknown, _args: unknown, context: Context) => {
      try {
        const channels = await notificationService.getChannels();
        return channels;
      } catch (error) {
        console.error('Error fetching alert channels:', error);
        throw new Error('Failed to fetch alert channels');
      }
    },
  },

  Mutation: {
    acknowledgeAlert: async (
      _parent: unknown,
      args: { alertId: string; note?: string },
      context: Context
    ) => {
      try {
        const result = await alertStateManager.acknowledgeAlert(
          args.alertId,
          context.user?.id || 'system',
          args.note
        );
        return mapAlertToGraphQL(result);
      } catch (error) {
        console.error('Error acknowledging alert:', error);
        throw new Error('Failed to acknowledge alert');
      }
    },

    resolveAlert: async (
      _parent: unknown,
      args: { alertId: string; resolution: string },
      context: Context
    ) => {
      try {
        const result = await alertStateManager.resolveAlert(
          args.alertId,
          context.user?.id || 'system',
          args.resolution
        );
        return mapAlertToGraphQL(result);
      } catch (error) {
        console.error('Error resolving alert:', error);
        throw new Error('Failed to resolve alert');
      }
    },

    dismissAlert: async (
      _parent: unknown,
      args: { alertId: string; reason?: string },
      context: Context
    ) => {
      try {
        await alertStateManager.dismissAlert(
          args.alertId,
          context.user?.id || 'system',
          args.reason
        );
        return true;
      } catch (error) {
        console.error('Error dismissing alert:', error);
        throw new Error('Failed to dismiss alert');
      }
    },

    batchAcknowledgeAlerts: async (
      _parent: unknown,
      args: { alertIds: string[]; note?: string },
      context: Context
    ) => {
      try {
        const results = await Promise.allSettled(
          args.alertIds.map(id =>
            alertStateManager.acknowledgeAlert(id, context.user?.id || 'system', args.note)
          )
        );

        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        return {
          succeeded,
          failed,
          errors: results
            .map((r, i) => {
              if (r.status === 'rejected') {
                return {
                  alertId: args.alertIds[i],
                  error: r.reason?.message || 'Unknown error',
                };
              }
              return null;
            })
            .filter(Boolean),
        };
      } catch (error) {
        console.error('Error batch acknowledging alerts:', error);
        throw new Error('Failed to batch acknowledge alerts');
      }
    },

    batchResolveAlerts: async (
      _parent: unknown,
      args: { alertIds: string[]; resolution: string },
      context: Context
    ) => {
      try {
        const results = await Promise.allSettled(
          args.alertIds.map(id =>
            alertStateManager.resolveAlert(id, context.user?.id || 'system', args.resolution)
          )
        );

        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        return {
          succeeded,
          failed,
          errors: results
            .map((r, i) => {
              if (r.status === 'rejected') {
                return {
                  alertId: args.alertIds[i],
                  error: r.reason?.message || 'Unknown error',
                };
              }
              return null;
            })
            .filter(Boolean),
        };
      } catch (error) {
        console.error('Error batch resolving alerts:', error);
        throw new Error('Failed to batch resolve alerts');
      }
    },

    createCustomAlert: async (
      _parent: unknown,
      args: { input: CreateAlertInput },
      context: Context
    ) => {
      try {
        const alert = await alertMonitoringService.createAlert({
          ...args.input,
          id: uuidv4(),
          createdBy: context.user?.id || 'system',
          createdAt: new Date(),
          status: 'ACTIVE',
        });
        return mapAlertToGraphQL(alert);
      } catch (error) {
        console.error('Error creating custom alert:', error);
        throw new Error('Failed to create custom alert');
      }
    },

    updateAlertRule: async (
      _parent: unknown,
      args: { ruleId: string; input: UpdateAlertRuleInput },
      context: Context
    ) => {
      try {
        const rule = await alertRuleEngine.updateRule(args.ruleId, args.input);
        return rule;
      } catch (error) {
        console.error('Error updating alert rule:', error);
        throw new Error('Failed to update alert rule');
      }
    },

    testAlertChannel: async (_parent: unknown, args: { channelId: string }, context: Context) => {
      try {
        const result = await notificationService.testChannel(args.channelId);
        return result;
      } catch (error) {
        console.error('Error testing alert channel:', error);
        throw new Error('Failed to test alert channel');
      }
    },
  },

  Subscription: {
    newAlert: {
      subscribe: async (
        _parent: unknown,
        args: { types?: string[]; severities?: string[] },
        context: Context
      ) => {
        // Implementation depends on your subscription mechanism
        // This is a placeholder for the subscription logic
        return alertMonitoringService.subscribeToNewAlerts({
          types: args.types,
          severities: args.severities,
          userId: context.user?.id,
        });
      },
    },

    alertStatusChanged: {
      subscribe: async (_parent: unknown, args: { alertId?: string }, context: Context) => {
        // Implementation depends on your subscription mechanism
        // This is a placeholder for the subscription logic
        return alertStateManager.subscribeToStatusChanges({
          alertId: args.alertId,
          userId: context.user?.id,
        });
      },
    },

    alertStatisticsUpdated: {
      subscribe: async (_parent: unknown, _args: unknown, context: Context) => {
        // Implementation depends on your subscription mechanism
        // This is a placeholder for the subscription logic
        return alertMonitoringService.subscribeToStatisticsUpdates({
          userId: context.user?.id,
        });
      },
    },
  },
};

// Helper functions
function calculateSeverityDistribution(alerts: DatabaseAlert[]) {
  const severities = ['INFO', 'WARNING', 'ERROR', 'CRITICAL'];
  const total = alerts.length || 1;

  return severities.map(severity => {
    const count = alerts.filter(a => a.severity === severity).length;
    return {
      severity,
      count,
      percentage: (count / total) * 100,
    };
  });
}

function calculateTypeDistribution(alerts: DatabaseAlert[]) {
  const types = [
    'SYSTEM_ALERT',
    'INVENTORY_ALERT',
    'ORDER_ALERT',
    'TRANSFER_ALERT',
    'QUALITY_ALERT',
    'PERFORMANCE_ALERT',
    'SECURITY_ALERT',
    'CUSTOM_ALERT',
  ];
  const total = alerts.length || 1;

  return types.map(type => {
    const count = alerts.filter(a => a.type === type).length;
    return {
      type,
      count,
      percentage: (count / total) * 100,
    };
  });
}

function calculateStatusDistribution(alerts: DatabaseAlert[]) {
  const statuses = ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'EXPIRED', 'DISMISSED'];
  const total = alerts.length || 1;

  return statuses.map(status => {
    const count = alerts.filter(a => a.status === status).length;
    return {
      status,
      count,
      percentage: (count / total) * 100,
    };
  });
}
