/**
 * Alert Management Dashboard
 * 告警管理儀表板 - 統一的告警管理界面
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Bell,
  Settings,
  Plus,
  Play,
  Square,
} from 'lucide-react';
import { Alert, AlertLevel, AlertState } from '@/lib/alerts/types';
import { AlertRulesList } from './AlertRulesList';
// Component not implemented yet
// // Component not implemented yet
// import { AlertHistoryView } from './AlertHistoryView';
// Component not implemented yet
// // Component not implemented yet
// import { NotificationSettings } from './NotificationSettings';
// Component not implemented yet
// // Component not implemented yet
// import { AlertSystemStatus } from './AlertSystemStatus';
// Component not implemented yet
// // Component not implemented yet
// import { CreateAlertRuleDialog } from './CreateAlertRuleDialog';

interface AlertStats {
  total: number;
  active: number;
  resolved: number;
  acknowledged: number;
  byLevel: Record<AlertLevel, number>;
}

interface SystemStatus {
  running: boolean;
  uptime: number;
  rulesCount: number;
  activeAlertsCount: number;
  lastEvaluation?: string;
}

interface TabOption {
  id: 'overview' | 'rules' | 'history' | 'notifications' | 'settings';
  label: string;
}

export function AlertDashboard() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'rules' | 'history' | 'notifications' | 'settings'
  >('overview');
  const [alertStats, setAlertStats] = useState<AlertStats>({
    total: 0,
    active: 0,
    resolved: 0,
    acknowledged: 0,
    byLevel: {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    },
  });
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    running: false,
    uptime: 0,
    rulesCount: 0,
    activeAlertsCount: 0,
  });
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 載入告警統計
  useEffect(() => {
    loadAlertStats();
    loadSystemStatus();

    // 每30秒更新一次
    const interval = setInterval(() => {
      loadAlertStats();
      loadSystemStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadAlertStats = async () => {
    try {
      const response = await fetch('/api/v1/alerts/history', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setAlertStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load alert stats:', error);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/api/v1/alerts/system/status');
      const data = await response.json();

      if (data.success) {
        setSystemStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to load system status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSystem = async () => {
    try {
      const response = await fetch('/api/v1/alerts/system/start', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        await loadSystemStatus();
      }
    } catch (error) {
      console.error('Failed to start system:', error);
    }
  };

  const handleStopSystem = async () => {
    try {
      const response = await fetch('/api/v1/alerts/system/stop', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        await loadSystemStatus();
      }
    } catch (error) {
      console.error('Failed to stop system:', error);
    }
  };

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getLevelColor = (level: AlertLevel) => {
    switch (level) {
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'critical':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (level: AlertLevel) => {
    switch (level) {
      case 'info':
        return <Bell className='h-4 w-4' />;
      case 'warning':
        return <AlertTriangle className='h-4 w-4' />;
      case 'error':
        return <AlertTriangle className='h-4 w-4' />;
      case 'critical':
        return <AlertTriangle className='h-4 w-4' />;
      default:
        return <Bell className='h-4 w-4' />;
    }
  };

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='h-2 w-8 rounded-full bg-blue-500 opacity-75'></div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Alert Management</h1>
          <p className='mt-2 text-gray-600'>Monitor and manage system alerts</p>
        </div>

        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={systemStatus.running ? handleStopSystem : handleStartSystem}
            className='flex items-center gap-2'
          >
            {systemStatus.running ? <Square className='h-4 w-4' /> : <Play className='h-4 w-4' />}
            {systemStatus.running ? 'Stop' : 'Start'} System
          </Button>

          <Button onClick={() => setIsCreateRuleOpen(true)} className='flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            Create Rule
          </Button>
        </div>
      </div>

      {/* System Status */}
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <div
              className={`h-3 w-3 rounded-full ${systemStatus.running ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>{systemStatus.rulesCount}</div>
              <div className='text-sm text-gray-600'>Active Rules</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-red-600'>
                {systemStatus.activeAlertsCount}
              </div>
              <div className='text-sm text-gray-600'>Active Alerts</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {formatUptime(systemStatus.uptime)}
              </div>
              <div className='text-sm text-gray-600'>Uptime</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-gray-600'>
                {systemStatus.lastEvaluation
                  ? new Date(systemStatus.lastEvaluation).toLocaleTimeString()
                  : 'Never'}
              </div>
              <div className='text-sm text-gray-600'>Last Check</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Statistics */}
      <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Total Alerts</p>
                <p className='text-2xl font-bold'>{alertStats.total}</p>
              </div>
              <Bell className='h-8 w-8 text-blue-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Active</p>
                <p className='text-2xl font-bold text-red-600'>{alertStats.active}</p>
              </div>
              <AlertTriangle className='h-8 w-8 text-red-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Resolved</p>
                <p className='text-2xl font-bold text-green-600'>{alertStats.resolved}</p>
              </div>
              <CheckCircle className='h-8 w-8 text-green-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Acknowledged</p>
                <p className='text-2xl font-bold text-yellow-600'>{alertStats.acknowledged}</p>
              </div>
              <Clock className='h-8 w-8 text-yellow-500' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Levels */}
      <Card className='mb-8'>
        <CardHeader>
          <CardTitle>Alert Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            {Object.entries(alertStats.byLevel).map(([level, count]) => (
              <div key={level} className='flex items-center gap-3'>
                <Badge className={getLevelColor(level as AlertLevel)}>
                  <div className='flex items-center gap-1'>
                    {getStatusIcon(level as AlertLevel)}
                    {level.toUpperCase()}
                  </div>
                </Badge>
                <span className='text-lg font-semibold'>{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className='mb-6 flex gap-2'>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'rules', label: 'Rules' },
          { id: 'history', label: 'History' },
          { id: 'notifications', label: 'Notifications' },
          { id: 'settings', label: 'Settings' },
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className='py-8 text-center'>
            <p className='text-muted-foreground'>AlertSystemStatus component not implemented yet</p>
          </div>
        )}

        {activeTab === 'rules' && <AlertRulesList />}

        {activeTab === 'history' && (
          <div className='py-8 text-center'>
            <p className='text-muted-foreground'>AlertHistoryView component not implemented yet</p>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className='py-8 text-center'>
            <p className='text-muted-foreground'>
              NotificationSettings component not implemented yet
            </p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className='py-8 text-center'>
            <Settings className='mx-auto mb-4 h-16 w-16 text-gray-400' />
            <p className='text-gray-600'>System settings coming soon...</p>
          </div>
        )}
      </div>

      {/* Create Alert Rule Dialog */}
      {/* CreateAlertRuleDialog component not implemented yet */}
      {/*
      <CreateAlertRuleDialog
        isOpen={isCreateRuleOpen}
        onClose={() => setIsCreateRuleOpen(false)}
        onRuleCreated={() => {
          setIsCreateRuleOpen(false);
          loadAlertStats();
          loadSystemStatus();
        }}
      />
      */}
    </div>
  );
}
