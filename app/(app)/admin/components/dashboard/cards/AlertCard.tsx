'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useWidgetToast } from '@/app/(app)/admin/hooks/useWidgetToast';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Bell, BellOff, Clock, Filter, RefreshCw, X } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { 
  AlertCardData, 
  Alert as AlertType, 
  AlertSeverity, 
  AlertStatus, 
  AlertType as AlertTypeEnum,
  AlertSortBy 
} from '@/types/generated/graphql';

// GraphQL Queries
const ALERT_CARD_DATA_QUERY = gql`
  query AlertCardData($input: AlertCardInput!) {
    alertCardData(input: $input) {
      alerts {
        id
        type
        severity
        status
        title
        message
        source
        createdAt
        acknowledgedAt
        acknowledgedBy
        resolvedAt
        resolvedBy
        affectedEntities {
          entityType
          entityId
          entityName
          impact
        }
        actions {
          id
          type
          label
          confirmRequired
          icon
        }
        tags
      }
      summary {
        totalActive
        totalToday
        bySeverity {
          severity
          count
          percentage
        }
        byType {
          type
          count
          percentage
        }
        byStatus {
          status
          count
          percentage
        }
        recentCount
        criticalCount
      }
      statistics {
        averageResolutionTime
        averageAcknowledgeTime
        acknowledgeRate
        resolutionRate
        recurringAlerts
        performanceMetrics {
          mttr
          mtta
          alertVolume
          falsePositiveRate
        }
      }
      pagination {
        hasNextPage
        hasPreviousPage
        totalCount
        totalPages
        currentPage
      }
      lastUpdated
      refreshInterval
    }
  }
`;

// GraphQL Mutations
const ACKNOWLEDGE_ALERT_MUTATION = gql`
  mutation AcknowledgeAlert($alertId: ID!, $note: String) {
    acknowledgeAlert(alertId: $alertId, note: $note) {
      id
      status
      acknowledgedAt
      acknowledgedBy
    }
  }
`;

const RESOLVE_ALERT_MUTATION = gql`
  mutation ResolveAlert($alertId: ID!, $resolution: String!) {
    resolveAlert(alertId: $alertId, resolution: $resolution) {
      id
      status
      resolvedAt
      resolvedBy
    }
  }
`;

const DISMISS_ALERT_MUTATION = gql`
  mutation DismissAlert($alertId: ID!, $reason: String) {
    dismissAlert(alertId: $alertId, reason: $reason)
  }
`;

interface AlertCardProps {
  className?: string;
  defaultView?: 'compact' | 'full';
  allowBatchOperations?: boolean;
  showStatistics?: boolean;
  refreshInterval?: number;
}

// Helper to get severity icon and color
const getSeverityConfig = (severity: AlertSeverity) => {
  switch (severity) {
    case 'CRITICAL':
      return {
        icon: AlertCircle,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        borderColor: 'border-red-200 dark:border-red-800'
      };
    case 'ERROR':
      return {
        icon: X,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-950/20',
        borderColor: 'border-orange-200 dark:border-orange-800'
      };
    case 'WARNING':
      return {
        icon: AlertTriangle,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800'
      };
    case 'INFO':
    default:
      return {
        icon: Info,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        borderColor: 'border-blue-200 dark:border-blue-800'
      };
  }
};

// Alert Item Component
const AlertItem: React.FC<{
  alert: AlertType;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onDismiss: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}> = ({ alert, onAcknowledge, onResolve, onDismiss, isSelected, onSelect }) => {
  const severityConfig = getSeverityConfig(alert.severity);
  const Icon = severityConfig.icon;

  return (
    <div className={cn(
      "p-4 rounded-lg border transition-all",
      severityConfig.borderColor,
      isSelected && "ring-2 ring-primary"
    )} data-testid="alert-item">
      <div className="flex items-start gap-3">
        {onSelect && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(alert.id)}
            className="mt-1"
            data-testid="alert-checkbox"
          />
        )}
        
        <div className={cn("p-2 rounded-full", severityConfig.bgColor)} data-testid={`severity-${alert.severity.toLowerCase()}`}>
          <Icon className={cn("h-4 w-4", severityConfig.color)} />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium">{alert.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={alert.status === 'ACTIVE' ? 'destructive' : 'secondary'} data-testid="alert-status">
                {alert.status}
              </Badge>
              <Badge variant="outline">{alert.type.replace('_', ' ')}</Badge>
            </div>
          </div>
          
          {alert.affectedEntities && alert.affectedEntities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {alert.affectedEntities.map((entity, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {entity.entityType}: {entity.entityName}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{format(new Date(alert.createdAt), 'MMM d, HH:mm')}</span>
              <span>{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</span>
              <span>Source: {alert.source}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {alert.status === 'ACTIVE' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAcknowledge(alert.id)}
                    aria-label="Acknowledge alert"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Acknowledge
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onResolve(alert.id)}
                  >
                    Resolve
                  </Button>
                </>
              )}
              
              {alert.status === 'ACKNOWLEDGED' && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onResolve(alert.id)}
                >
                  Resolve
                </Button>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDismiss(alert.id)}
                aria-label="Dismiss"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {alert.acknowledgedAt && (
            <p className="text-xs text-muted-foreground">
              Acknowledged by {alert.acknowledgedBy} at {format(new Date(alert.acknowledgedAt), 'MMM d, HH:mm')}
            </p>
          )}
          
          {alert.resolvedAt && (
            <p className="text-xs text-muted-foreground">
              Resolved by {alert.resolvedBy} at {format(new Date(alert.resolvedAt), 'MMM d, HH:mm')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Main AlertCard Component
export function AlertCard({
  className,
  defaultView = 'full',
  allowBatchOperations = true,
  showStatistics = true,
  refreshInterval = 30
}: AlertCardProps) {
  const { showSuccess, showError } = useWidgetToast();
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    types: [] as AlertTypeEnum[],
    severities: [] as AlertSeverity[],
    statuses: ['ACTIVE', 'ACKNOWLEDGED'] as AlertStatus[],
    includeAcknowledged: true,
    includeResolved: false,
    sortBy: 'CREATED_AT_DESC' as AlertSortBy
  });

  // Query
  const { data, loading, error, refetch } = useQuery<{ alertCardData: AlertCardData }>(
    ALERT_CARD_DATA_QUERY,
    {
      variables: {
        input: {
          ...filters,
          limit: 50
        }
      },
      pollInterval: refreshInterval * 1000
    }
  );

  // Mutations
  const [acknowledgeAlert] = useMutation(ACKNOWLEDGE_ALERT_MUTATION, {
    onCompleted: () => {
      showSuccess({ title: 'Alert acknowledged successfully' });
      refetch();
    },
    onError: (error) => {
      showError({ title: 'Failed to acknowledge alert', error });
    }
  });

  const [resolveAlert] = useMutation(RESOLVE_ALERT_MUTATION, {
    onCompleted: () => {
      showSuccess({ title: 'Alert resolved successfully' });
      refetch();
    },
    onError: (error) => {
      showError({ title: 'Failed to resolve alert', error });
    }
  });

  const [dismissAlert] = useMutation(DISMISS_ALERT_MUTATION, {
    onCompleted: () => {
      showSuccess({ title: 'Alert dismissed' });
      refetch();
    },
    onError: (error) => {
      showError({ title: 'Failed to dismiss alert', error });
    }
  });

  // Handlers
  const handleAcknowledge = useCallback((alertId: string) => {
    acknowledgeAlert({ variables: { alertId } });
  }, [acknowledgeAlert]);

  const handleResolve = useCallback((alertId: string) => {
    const resolution = prompt('Please provide a resolution:');
    if (resolution) {
      resolveAlert({ variables: { alertId, resolution } });
    }
  }, [resolveAlert]);

  const handleDismiss = useCallback((alertId: string) => {
    if (confirm('Are you sure you want to dismiss this alert?')) {
      dismissAlert({ variables: { alertId } });
    }
  }, [dismissAlert]);

  const handleSelectAlert = useCallback((alertId: string) => {
    setSelectedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  }, []);

  // Loading state
  if (loading && !data) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const alertData = data?.alertCardData;
  if (!alertData) return null;

  return (
    <Card className={className} data-testid="alert-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alert Management
            </CardTitle>
            <CardDescription>
              Monitor and manage system alerts
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
              data-testid="refresh-button"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} data-testid={loading ? "loading-spinner" : undefined} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="grid w-full grid-cols-3" role="tablist">
            <TabsTrigger value="alerts" role="tab">
              Alerts
              {alertData.summary.totalActive > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {alertData.summary.totalActive}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="filters">Filters</TabsTrigger>
          </TabsList>
          
          <TabsContent value="alerts" className="space-y-4">
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium text-muted-foreground">Active Alerts</div>
                <div className="text-2xl font-bold" data-testid="active-alert-count">{alertData.summary.totalActive}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium text-muted-foreground">Critical</div>
                <div className="text-2xl font-bold text-red-600">{alertData.summary.criticalCount}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium text-muted-foreground">Today</div>
                <div className="text-2xl font-bold">{alertData.summary.totalToday}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium text-muted-foreground">Recent (1hr)</div>
                <div className="text-2xl font-bold">{alertData.summary.recentCount}</div>
              </div>
            </div>
            
            <Separator />
            
            {/* Alert List */}
            <ScrollArea className="h-[500px] pr-4" data-testid="alert-scroll-area">
              <div className="space-y-3">
                {alertData.alerts.map(alert => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={handleAcknowledge}
                    onResolve={handleResolve}
                    onDismiss={handleDismiss}
                    isSelected={selectedAlerts.has(alert.id)}
                    onSelect={allowBatchOperations ? handleSelectAlert : undefined}
                  />
                ))}
                
                {alertData.alerts.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <BellOff className="h-12 w-12 mx-auto mb-4" data-testid="empty-state-icon" />
                    <p>No alerts matching your filters</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="statistics" className="space-y-4">
            {showStatistics && alertData.statistics && (
              <div className="space-y-6">
                {/* Performance Metrics */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <div className="text-sm font-medium text-muted-foreground">Mean Time to Acknowledge</div>
                      <div className="text-2xl font-bold">
                        {Math.round(alertData.statistics.performanceMetrics.mtta)} min
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-sm font-medium text-muted-foreground">Mean Time to Resolution</div>
                      <div className="text-2xl font-bold">
                        {Math.round(alertData.statistics.performanceMetrics.mttr)} min
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-sm font-medium text-muted-foreground">Acknowledge Rate</div>
                      <div className="text-2xl font-bold">
                        {(alertData.statistics.acknowledgeRate * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-sm font-medium text-muted-foreground">Resolution Rate</div>
                      <div className="text-2xl font-bold">
                        {(alertData.statistics.resolutionRate * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Distribution by Severity */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Distribution by Severity</h3>
                  <div className="space-y-2">
                    {alertData.summary.bySeverity.map(item => {
                      const config = getSeverityConfig(item.severity);
                      return (
                        <div key={item.severity} className="flex items-center gap-4">
                          <div className="flex items-center gap-2 w-24">
                            <div className={cn("p-1 rounded", config.bgColor)}>
                              <config.icon className={cn("h-3 w-3", config.color)} />
                            </div>
                            <span className="text-sm font-medium">{item.severity}</span>
                          </div>
                          <div className="flex-1">
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={cn("h-full", config.bgColor)}
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {item.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="filters" className="space-y-4">
            <div className="space-y-4">
              {/* Sort By */}
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value as AlertSortBy }))}
                >
                  <SelectTrigger data-testid="sort-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREATED_AT_DESC">Newest First</SelectItem>
                    <SelectItem value="CREATED_AT_ASC">Oldest First</SelectItem>
                    <SelectItem value="SEVERITY_DESC">Severity (High to Low)</SelectItem>
                    <SelectItem value="SEVERITY_ASC">Severity (Low to High)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Include Options */}
              <div className="space-y-2">
                <Label>Include</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-acknowledged"
                      checked={filters.includeAcknowledged}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, includeAcknowledged: !!checked }))
                      }
                    />
                    <Label htmlFor="include-acknowledged" className="font-normal">
                      Acknowledged Alerts
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-resolved"
                      checked={filters.includeResolved}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, includeResolved: !!checked }))
                      }
                    />
                    <Label htmlFor="include-resolved" className="font-normal">
                      Resolved Alerts
                    </Label>
                  </div>
                </div>
              </div>
              
              <Button onClick={() => refetch()} className="w-full">
                Apply Filters
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}