/**
 * 告警管理界面組件
 * 顯示系統告警、通知管理、告警趨勢等
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  Bell,
  XCircle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  AlertCircle,
  Info,
  Zap,
  TrendingUp,
  Calendar,
  User,
  ChevronRight,
  Database,
  Shield,
} from 'lucide-react';

interface AlertData {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'active' | 'acknowledged' | 'resolved';
  category: 'system' | 'database' | 'business' | 'security';
  timestamp: string;
  source: string;
  assignedTo?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  actions: string[];
}

interface AlertManagementData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  summary: {
    totalAlerts: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    acknowledgedCount: number;
    resolvedCount: number;
  };
  recentAlerts: AlertData[];
  alertTrends: {
    period: string;
    data: Array<{
      timestamp: string;
      critical: number;
      warning: number;
      info: number;
    }>;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    webhook: boolean;
    slackChannel?: string;
  };
}

interface AlertManagementCardProps {
  data: AlertManagementData | null;
  compact?: boolean;
  onRefresh?: () => void;
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onDelete?: (alertId: string) => void;
}

/**
 * 告警管理卡片
 *
 * 特點：
 * - 告警分類和過濾
 * - 告警狀態管理
 * - 通知設定
 * - 告警趨勢分析
 */
export default function AlertManagementCard({
  data,
  compact = false,
  onRefresh,
  onAcknowledge,
  onResolve,
  onDelete,
}: AlertManagementCardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  if (!data) {
    return (
      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <AlertTriangle className='h-5 w-5' />
            <span>Alert Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex h-32 items-center justify-center'>
            <div className='text-center'>
              <RefreshCw className='mx-auto mb-2 h-8 w-8 text-gray-400' />
              <p className='text-sm text-gray-500'>Loading alert data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className='h-4 w-4 text-red-500' />;
      case 'warning':
        return <AlertTriangle className='h-4 w-4 text-yellow-500' />;
      case 'info':
        return <Info className='h-4 w-4 text-blue-500' />;
      default:
        return <AlertCircle className='h-4 w-4 text-gray-500' />;
    }
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'destructive';
      case 'acknowledged':
        return 'secondary';
      case 'resolved':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system':
        return <Settings className='h-4 w-4' />;
      case 'database':
        return <Database className='h-4 w-4' />;
      case 'business':
        return <TrendingUp className='h-4 w-4' />;
      case 'security':
        return <Shield className='h-4 w-4' />;
      default:
        return <AlertCircle className='h-4 w-4' />;
    }
  };

  const filteredAlerts = data.recentAlerts.filter(alert => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || alert.category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity;
    const matchesStatus =
      selectedStatus === 'all' || (alert as { status: string }).status === selectedStatus;

    return matchesSearch && matchesCategory && matchesSeverity && matchesStatus;
  });

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  // Compact 模式 - 用於總覽頁面
  if (compact) {
    return (
      <Card className='w-full'>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center justify-between text-base'>
            <div className='flex items-center space-x-2'>
              <AlertTriangle className='h-4 w-4' />
              <span>Alerts</span>
            </div>
            {data.summary.criticalCount > 0 && (
              <Badge variant='destructive' className='h-4 w-4 p-0 text-xs'>
                {data.summary.criticalCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-2'>
          <div className='space-y-2'>
            <div className='grid grid-cols-3 gap-2 text-center'>
              <div>
                <p className='text-lg font-bold text-red-600'>{data.summary.criticalCount}</p>
                <p className='text-xs text-gray-500'>Critical</p>
              </div>
              <div>
                <p className='text-lg font-bold text-yellow-600'>{data.summary.warningCount}</p>
                <p className='text-xs text-gray-500'>Warning</p>
              </div>
              <div>
                <p className='text-lg font-bold text-blue-600'>{data.summary.infoCount}</p>
                <p className='text-xs text-gray-500'>Info</p>
              </div>
            </div>
            {data.summary.totalAlerts > 0 && (
              <div className='text-center'>
                <p className='text-sm font-medium'>{data.summary.totalAlerts} Active Alerts</p>
                <p className='text-xs text-gray-500'>
                  {data.summary.acknowledgedCount} acknowledged, {data.summary.resolvedCount}{' '}
                  resolved
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // 完整模式 - 用於詳細頁面
  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <AlertTriangle className='h-5 w-5' />
            <span>Alert Management</span>
          </div>
          <div className='flex items-center space-x-2'>
            <Badge
              variant={
                (data as { status: string }).status === 'healthy' ? 'default' : 'destructive'
              }
            >
              {(data as { status: string }).status}
            </Badge>
            {onRefresh && (
              <Button variant='outline' size='sm' onClick={onRefresh}>
                <RefreshCw className='h-4 w-4' />
              </Button>
            )}
          </div>
        </CardTitle>
        <CardDescription>Monitor and manage system alerts and notifications</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* 告警摘要 */}
        <div>
          <h3 className='mb-3 text-lg font-medium'>Alert Summary</h3>
          <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6'>
            <div className='rounded-lg border p-3 text-center'>
              <p className='text-2xl font-bold'>{data.summary.totalAlerts}</p>
              <p className='text-sm text-gray-500'>Total</p>
            </div>
            <div className='rounded-lg border p-3 text-center'>
              <p className='text-2xl font-bold text-red-600'>{data.summary.criticalCount}</p>
              <p className='text-sm text-gray-500'>Critical</p>
            </div>
            <div className='rounded-lg border p-3 text-center'>
              <p className='text-2xl font-bold text-yellow-600'>{data.summary.warningCount}</p>
              <p className='text-sm text-gray-500'>Warning</p>
            </div>
            <div className='rounded-lg border p-3 text-center'>
              <p className='text-2xl font-bold text-blue-600'>{data.summary.infoCount}</p>
              <p className='text-sm text-gray-500'>Info</p>
            </div>
            <div className='rounded-lg border p-3 text-center'>
              <p className='text-2xl font-bold text-gray-600'>{data.summary.acknowledgedCount}</p>
              <p className='text-sm text-gray-500'>Acknowledged</p>
            </div>
            <div className='rounded-lg border p-3 text-center'>
              <p className='text-2xl font-bold text-green-600'>{data.summary.resolvedCount}</p>
              <p className='text-sm text-gray-500'>Resolved</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* 告警管理 */}
        <div>
          <Tabs defaultValue='active' className='w-full'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='active'>Active Alerts</TabsTrigger>
              <TabsTrigger value='history'>Alert History</TabsTrigger>
              <TabsTrigger value='settings'>Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value='active' className='space-y-4'>
              {/* 過濾控制 */}
              <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
                <div className='relative'>
                  <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                  <Input
                    placeholder='Search alerts...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder='Category' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Categories</SelectItem>
                    <SelectItem value='system'>System</SelectItem>
                    <SelectItem value='database'>Database</SelectItem>
                    <SelectItem value='business'>Business</SelectItem>
                    <SelectItem value='security'>Security</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger>
                    <SelectValue placeholder='Severity' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Severities</SelectItem>
                    <SelectItem value='critical'>Critical</SelectItem>
                    <SelectItem value='warning'>Warning</SelectItem>
                    <SelectItem value='info'>Info</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder='Status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Status</SelectItem>
                    <SelectItem value='active'>Active</SelectItem>
                    <SelectItem value='acknowledged'>Acknowledged</SelectItem>
                    <SelectItem value='resolved'>Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 告警清單 */}
              <ScrollArea className='h-96'>
                <div className='space-y-2'>
                  {filteredAlerts.map(alert => (
                    <div key={alert.id} className='rounded-lg border p-4'>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='mb-2 flex items-center space-x-2'>
                            {getSeverityIcon(alert.severity)}
                            <Badge variant={getSeverityVariant(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <Badge variant='outline'>
                              {getCategoryIcon(alert.category)}
                              <span className='ml-1 capitalize'>{alert.category}</span>
                            </Badge>
                            <Badge variant={getStatusVariant((alert as { status: string }).status)}>
                              {(alert as { status: string }).status}
                            </Badge>
                          </div>
                          <h4 className='font-medium'>{alert.title}</h4>
                          <p className='mt-1 text-sm text-gray-600'>{alert.description}</p>
                          <div className='mt-2 flex items-center space-x-4 text-xs text-gray-500'>
                            <span className='flex items-center space-x-1'>
                              <Calendar className='h-3 w-3' />
                              <span>{formatTimeAgo(alert.timestamp)}</span>
                            </span>
                            <span className='flex items-center space-x-1'>
                              <Settings className='h-3 w-3' />
                              <span>{alert.source}</span>
                            </span>
                            {alert.assignedTo && (
                              <span className='flex items-center space-x-1'>
                                <User className='h-3 w-3' />
                                <span>{alert.assignedTo}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className='flex space-x-2'>
                          {(alert as { status: string }).status === 'active' && onAcknowledge && (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => onAcknowledge(alert.id)}
                            >
                              <Eye className='h-4 w-4' />
                            </Button>
                          )}
                          {(alert as { status: string }).status !== 'resolved' && onResolve && (
                            <Button variant='outline' size='sm' onClick={() => onResolve(alert.id)}>
                              <CheckCircle className='h-4 w-4' />
                            </Button>
                          )}
                          {onDelete && (
                            <Button variant='outline' size='sm' onClick={() => onDelete(alert.id)}>
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value='history' className='space-y-4'>
              <div className='py-8 text-center'>
                <Clock className='mx-auto mb-4 h-12 w-12 text-gray-400' />
                <p className='text-gray-500'>Alert history will be displayed here</p>
              </div>
            </TabsContent>

            <TabsContent value='settings' className='space-y-4'>
              <div>
                <h3 className='mb-3 text-lg font-medium'>Notification Settings</h3>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between rounded-lg border p-3'>
                    <div className='flex items-center space-x-3'>
                      <Bell className='h-5 w-5 text-blue-500' />
                      <div>
                        <p className='font-medium'>Email Notifications</p>
                        <p className='text-sm text-gray-500'>Receive alerts via email</p>
                      </div>
                    </div>
                    <Badge variant={data.notifications.email ? 'default' : 'outline'}>
                      {data.notifications.email ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>

                  <div className='flex items-center justify-between rounded-lg border p-3'>
                    <div className='flex items-center space-x-3'>
                      <Zap className='h-5 w-5 text-yellow-500' />
                      <div>
                        <p className='font-medium'>SMS Notifications</p>
                        <p className='text-sm text-gray-500'>Receive critical alerts via SMS</p>
                      </div>
                    </div>
                    <Badge variant={data.notifications.sms ? 'default' : 'outline'}>
                      {data.notifications.sms ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>

                  <div className='flex items-center justify-between rounded-lg border p-3'>
                    <div className='flex items-center space-x-3'>
                      <Settings className='h-5 w-5 text-green-500' />
                      <div>
                        <p className='font-medium'>Webhook Notifications</p>
                        <p className='text-sm text-gray-500'>Send alerts to external systems</p>
                      </div>
                    </div>
                    <Badge variant={data.notifications.webhook ? 'default' : 'outline'}>
                      {data.notifications.webhook ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>

                  {data.notifications.slackChannel && (
                    <div className='flex items-center justify-between rounded-lg border p-3'>
                      <div className='flex items-center space-x-3'>
                        <AlertCircle className='h-5 w-5 text-purple-500' />
                        <div>
                          <p className='font-medium'>Slack Integration</p>
                          <p className='text-sm text-gray-500'>
                            #{data.notifications.slackChannel}
                          </p>
                        </div>
                      </div>
                      <Badge variant='default'>Active</Badge>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* 最後更新時間 */}
        <div className='text-xs text-gray-500'>
          Last updated: {new Date(data.timestamp).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
