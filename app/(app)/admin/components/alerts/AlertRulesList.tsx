/**
 * Alert Rules List Component
 * 告警規則列表組件 - 顯示和管理告警規則
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  TestTube,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { AlertRule, AlertLevel } from '@/lib/alerts/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// Component not implemented yet
// // Component not implemented yet
// import { AlertRuleEditDialog } from './AlertRuleEditDialog';
// Component not implemented yet
// // Component not implemented yet
// import { AlertRuleTestDialog } from './AlertRuleTestDialog';

interface AlertRulesListProps {
  onRuleChange?: () => void;
}

export function AlertRulesList({ onRuleChange }: AlertRulesListProps) {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<AlertLevel | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [testingRule, setTestingRule] = useState<AlertRule | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/alerts/rules');
      const data = await response.json();

      if (data.success) {
        setRules(data.data);
      } else {
        console.error('Failed to load rules:', data.error);
      }
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async (rule: AlertRule) => {
    try {
      const response = await fetch(`/api/v1/alerts/rules/${rule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: !rule.enabled,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRules(
          rules.map((r: AlertRule) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r))
        );
        onRuleChange?.();
      } else {
        console.error('Failed to toggle rule:', data.error);
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleDeleteRule = async (rule: AlertRule) => {
    if (!confirm(`Are you sure you want to delete the rule "${rule.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/alerts/rules/${rule.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setRules(rules.filter((r: AlertRule) => r.id !== rule.id));
        onRuleChange?.();
      } else {
        console.error('Failed to delete rule:', data.error);
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleTestRule = async (rule: AlertRule) => {
    setTestingRule(rule);
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch =
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || rule.level === selectedLevel;
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'enabled' && rule.enabled) ||
      (selectedStatus === 'disabled' && !rule.enabled);

    return matchesSearch && matchesLevel && matchesStatus;
  });

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

  const getConditionDisplay = (condition: string) => {
    switch (condition) {
      case 'gt':
        return '>';
      case 'lt':
        return '<';
      case 'eq':
        return '=';
      case 'ne':
        return '≠';
      case 'contains':
        return 'contains';
      case 'regex':
        return 'regex';
      default:
        return condition;
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='h-2 w-8 rounded-full bg-blue-500 opacity-75'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Filter className='h-5 w-5' />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='relative'>
              <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Search rules...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>

            <Select
              value={selectedLevel}
              onValueChange={value => setSelectedLevel(value as AlertLevel | 'all')}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select level...' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Levels</SelectItem>
                <SelectItem value='info'>Info</SelectItem>
                <SelectItem value='warning'>Warning</SelectItem>
                <SelectItem value='error'>Error</SelectItem>
                <SelectItem value='critical'>Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedStatus}
              onValueChange={value => setSelectedStatus(value as 'enabled' | 'disabled' | 'all')}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select status...' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='enabled'>Enabled</SelectItem>
                <SelectItem value='disabled'>Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Rules ({filteredRules.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRules.length === 0 ? (
            <div className='py-8 text-center'>
              <AlertTriangle className='mx-auto mb-4 h-16 w-16 text-gray-400' />
              <p className='text-gray-600'>No alert rules found</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {filteredRules.map(rule => (
                <div
                  key={rule.id}
                  className='rounded-lg border p-4 transition-colors hover:bg-gray-50'
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='mb-2 flex items-center gap-3'>
                        <h3 className='text-lg font-semibold'>{rule.name}</h3>
                        <Badge className={getLevelColor(rule.level)}>
                          {rule.level.toUpperCase()}
                        </Badge>
                        <div className='flex items-center gap-2'>
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={() => handleToggleRule(rule)}
                          />
                          <span className='text-sm text-gray-600'>
                            {rule.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>

                      <p className='mb-3 text-gray-600'>{rule.description}</p>

                      <div className='grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-4'>
                        <div>
                          <span className='font-medium'>Metric:</span>
                          <span className='ml-2 rounded bg-gray-100 px-2 py-1 font-mono'>
                            {rule.metric}
                          </span>
                        </div>

                        <div>
                          <span className='font-medium'>Condition:</span>
                          <span className='ml-2 rounded bg-gray-100 px-2 py-1 font-mono'>
                            {getConditionDisplay(rule.condition)} {rule.threshold}
                          </span>
                        </div>

                        <div>
                          <span className='font-medium'>Time Window:</span>
                          <span className='ml-2'>{rule.timeWindow}s</span>
                        </div>

                        <div>
                          <span className='font-medium'>Evaluation:</span>
                          <span className='ml-2'>Every {rule.evaluationInterval}s</span>
                        </div>
                      </div>

                      {rule.tags && Object.keys(rule.tags).length > 0 && (
                        <div className='mt-3'>
                          <span className='text-sm font-medium'>Tags:</span>
                          <div className='mt-1 flex flex-wrap gap-1'>
                            {Object.entries(rule.tags).map(([key, value]) => (
                              <Badge key={key} variant='secondary' className='text-xs'>
                                {key}: {value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className='mt-3 text-xs text-gray-500'>
                        Created: {new Date(rule.createdAt).toLocaleString()} by {rule.createdBy}
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleTestRule(rule)}
                        className='flex items-center gap-1'
                      >
                        <TestTube className='h-4 w-4' />
                        Test
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='sm'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => setEditingRule(rule)}>
                            <Edit className='mr-2 h-4 w-4' />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteRule(rule)}>
                            <Trash2 className='mr-2 h-4 w-4' />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Rule Dialog */}
      {/* AlertRuleEditDialog component not implemented yet */}
      {/*
      {editingRule && (
        <AlertRuleEditDialog
          rule={editingRule}
          isOpen={!!editingRule}
          onClose={() => setEditingRule(null)}
          onRuleUpdated={() => {
            setEditingRule(null);
            loadRules();
            onRuleChange?.();
          }}
        />
      )}
      */}

      {/* Test Rule Dialog */}
      {/* AlertRuleTestDialog component not implemented yet */}
      {/*
      {testingRule && (
        <AlertRuleTestDialog
          rule={testingRule}
          isOpen={!!testingRule}
          onClose={() => setTestingRule(null)}
        />
      )}
      */}
    </div>
  );
}
