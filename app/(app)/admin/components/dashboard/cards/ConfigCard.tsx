'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Search,
  Settings,
  Save,
  Upload,
  Download,
  History,
  RotateCcw,
  MoreVertical,
  Copy,
  Trash2,
  Edit,
  Plus,
  FileText,
  AlertCircle,
  Check,
  X,
  ChevronDown,
  RefreshCw,
  Sparkles,
  Lock,
  Unlock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  GET_CONFIG_BY_CATEGORY,
  GET_CONFIG_HISTORY,
  GET_CONFIG_TEMPLATES,
  UPDATE_CONFIG,
  UPDATE_BATCH_CONFIG,
  REVERT_CONFIG,
  SAVE_CONFIG_TEMPLATE,
  EXPORT_CONFIG,
  IMPORT_CONFIG,
  VALIDATE_CONFIG,
  ConfigCategory,
  ConfigDataType,
  ConfigScope,
  ConfigAccessLevel,
  ConfigItem,
  ConfigUpdateInput,
  ConfigTemplate,
  ConfigHistoryEntry,
} from '@/lib/graphql/queries/config';
import { debounce } from 'lodash';
import dynamic from 'next/dynamic';

// Lazy load heavy components
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <Skeleton className='h-[200px] w-full' />,
});

const DatePicker = dynamic(
  () => import('@/components/ui/date-picker').then(mod => mod.DatePicker),
  {
    ssr: false,
    loading: () => <Skeleton className='h-10 w-full' />,
  }
);

interface ConfigCardProps {
  className?: string;
  defaultCategory?: ConfigCategory;
  showSearch?: boolean;
  showHistory?: boolean;
  showTemplates?: boolean;
  refreshInterval?: number;
  permissions?: string[];
}

// ConfigValue union type for type safety
type ConfigValue = string | number | boolean | Record<string, unknown> | unknown[] | Date | null;

// Type guard functions
const isStringValue = (value: ConfigValue): value is string => typeof value === 'string';

const isNumberValue = (value: ConfigValue): value is number => typeof value === 'number';

const isBooleanValue = (value: ConfigValue): value is boolean => typeof value === 'boolean';

const isObjectValue = (value: ConfigValue): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);

const isArrayValue = (value: ConfigValue): value is unknown[] => Array.isArray(value);

const isDateValue = (value: ConfigValue): value is Date => value instanceof Date;

interface EditingState {
  [key: string]: {
    value: ConfigValue;
    isEditing: boolean;
    originalValue: ConfigValue;
    hasError: boolean;
    errorMessage?: string;
  };
}

const CATEGORY_ICONS: Record<ConfigCategory, React.ReactNode> = {
  SYSTEM_CONFIG: <Settings className='h-4 w-4' />,
  USER_PREFERENCES: <FileText className='h-4 w-4' />,
  DEPARTMENT_CONFIG: <Building className='h-4 w-4' />,
  NOTIFICATION_CONFIG: <Bell className='h-4 w-4' />,
  API_CONFIG: <Link2 className='h-4 w-4' />,
  SECURITY_CONFIG: <Lock className='h-4 w-4' />,
  DISPLAY_CONFIG: <Monitor className='h-4 w-4' />,
  WORKFLOW_CONFIG: <GitBranch className='h-4 w-4' />,
};

// Import missing icons
import { Link2, Bell, Building, Monitor, GitBranch } from 'lucide-react';

export function ConfigCard({
  className,
  defaultCategory = ConfigCategory.SYSTEM_CONFIG,
  showSearch = true,
  showHistory = true,
  showTemplates = true,
  refreshInterval = 30000,
  permissions = [],
}: ConfigCardProps) {
  const [selectedCategory, setSelectedCategory] = useState<ConfigCategory>(defaultCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingState, setEditingState] = useState<EditingState>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ConfigItem | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'env'>('json');

  // GraphQL queries
  const { data, loading, error, refetch } = useQuery(GET_CONFIG_BY_CATEGORY, {
    variables: {
      input: {
        category: selectedCategory,
        includeDefaults: true,
        includeInherited: true,
        search: searchQuery || undefined,
      },
    },
    pollInterval: refreshInterval,
  });

  const { data: historyData, loading: historyLoading } = useQuery(GET_CONFIG_HISTORY, {
    variables: { configId: selectedConfig?.id },
    skip: !selectedConfig || !showHistory,
  });

  const { data: templateData, loading: templateLoading } = useQuery(GET_CONFIG_TEMPLATES, {
    variables: { category: selectedCategory },
    skip: !showTemplates,
  });

  // GraphQL mutations
  const [updateConfig] = useMutation(UPDATE_CONFIG);
  const [updateBatchConfig] = useMutation(UPDATE_BATCH_CONFIG);
  const [revertConfig] = useMutation(REVERT_CONFIG);
  const [saveTemplate] = useMutation(SAVE_CONFIG_TEMPLATE);
  const [exportConfig] = useMutation(EXPORT_CONFIG);
  const [importConfig] = useMutation(IMPORT_CONFIG);
  const [validateConfig] = useMutation(VALIDATE_CONFIG);

  // Get configs from the response
  const filteredConfigs = useMemo(() => {
    if (!data?.configCardData?.configs) return [];
    return data.configCardData.configs;
  }, [data]);

  // Get permissions from the response
  const userPermissions = useMemo(() => {
    return (
      data?.configCardData?.permissions || {
        canView: true,
        canEdit: false,
        canCreate: false,
        canDelete: false,
        canImport: false,
        canExport: false,
        restrictedKeys: [],
      }
    );
  }, [data]);

  // Permission helpers
  const canEdit = useCallback(
    (key: string) => {
      if (!userPermissions.canEdit) return false;
      if (userPermissions.restrictedKeys?.includes(key)) return false;
      if (!permissions.length) return userPermissions.canEdit;
      return permissions.includes('config.edit') || permissions.includes(`config.edit.${key}`);
    },
    [permissions, userPermissions]
  );

  const canDelete = useCallback(
    (key: string) => {
      if (!userPermissions.canDelete) return false;
      if (userPermissions.restrictedKeys?.includes(key)) return false;
      if (!permissions.length) return userPermissions.canDelete;
      return permissions.includes('config.delete') || permissions.includes(`config.delete.${key}`);
    },
    [permissions, userPermissions]
  );

  // Debounced search with proper memoization
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchQuery(value);
      }, 300),
    [] // Empty dependencies as setSearchQuery is stable
  );

  // Handle config update with proper dependencies
  const handleUpdate = useCallback(
    async (config: ConfigItem) => {
      const editing = editingState[config.id];
      if (!editing || !editing.isEditing) return;

      try {
        // Validate before saving
        const { data: validationData } = await validateConfig({
          variables: {
            key: config.key,
            value: editing.value,
            dataType: config.dataType,
          },
        });

        if (!validationData.validateConfig.isValid) {
          setEditingState(prev => ({
            ...prev,
            [config.id]: {
              ...prev[config.id],
              hasError: true,
              errorMessage: validationData.validateConfig.errors.join(', '),
            },
          }));
          return;
        }

        await updateConfig({
          variables: {
            id: config.id,
            input: {
              value: editing.value,
            },
          },
          optimisticResponse: {
            updateConfig: {
              ...config,
              value: editing.value,
              updatedAt: new Date().toISOString(),
            },
          },
        });

        setEditingState(prev => {
          const newState = { ...prev };
          delete newState[config.id];
          return newState;
        });

        toast.success(`Updated ${config.key}`);
      } catch (error) {
        toast.error('Failed to update configuration');
        console.error('Update error:', error);
      }
    },
    [editingState, validateConfig, updateConfig]
  );

  // Handle batch update
  const handleBatchUpdate = async () => {
    const updates = Array.from(selectedItems)
      .map(id => {
        const config = filteredConfigs.find((c: ConfigItem) => c.id === id);
        const editing = editingState[id];
        if (!config || !editing) return null;

        return {
          id,
          value: editing.value,
        };
      })
      .filter(Boolean);

    if (!updates.length) return;

    try {
      await updateBatchConfig({
        variables: { updates },
      });

      setEditingState({});
      setSelectedItems(new Set());
      toast.success(`Updated ${updates.length} configurations`);
    } catch (error) {
      toast.error('Failed to update configurations');
      console.error('Batch update error:', error);
    }
  };

  // Handle revert
  const handleRevert = async (configId: string, version: number) => {
    try {
      await revertConfig({
        variables: { configId, version },
      });

      await refetch();
      setShowHistoryDialog(false);
      toast.success('Configuration reverted successfully');
    } catch (error) {
      toast.error('Failed to revert configuration');
      console.error('Revert error:', error);
    }
  };

  // Handle template save
  const handleSaveTemplate = async (name: string, description?: string) => {
    const selectedConfigs = Array.from(selectedItems)
      .map(id => filteredConfigs.find((c: ConfigItem) => c.id === id))
      .filter(Boolean);

    if (!selectedConfigs.length) return;

    try {
      await saveTemplate({
        variables: {
          name,
          description,
          category: selectedCategory,
          configs: selectedConfigs.map(c => ({
            key: c.key,
            value: c.value,
            dataType: c.dataType,
          })),
        },
      });

      toast.success('Template saved successfully');
      setShowTemplateDialog(false);
    } catch (error) {
      toast.error('Failed to save template');
      console.error('Save template error:', error);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const { data: exportData } = await exportConfig({
        variables: {
          category: selectedCategory,
          format: exportFormat,
        },
      });

      // Create download link
      const blob = new Blob([exportData.exportConfig], {
        type: exportFormat === 'json' ? 'application/json' : 'text/plain',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `config-${selectedCategory.toLowerCase()}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Configuration exported successfully');
    } catch (error) {
      toast.error('Failed to export configuration');
      console.error('Export error:', error);
    }
  };

  // Handle import
  const handleImport = async (file: File) => {
    try {
      const content = await file.text();

      await importConfig({
        variables: {
          category: selectedCategory,
          data: content,
          format: file.name.endsWith('.json') ? 'json' : file.name.endsWith('.csv') ? 'csv' : 'env',
        },
      });

      await refetch();
      setImportDialogOpen(false);
      toast.success('Configuration imported successfully');
    } catch (error) {
      toast.error('Failed to import configuration');
      console.error('Import error:', error);
    }
  };

  // Render value editor based on data type
  const renderValueEditor = (config: ConfigItem) => {
    const editing = editingState[config.id];
    const value = editing?.value ?? config.value;
    const isEditing = editing?.isEditing ?? false;

    if (!isEditing) {
      return (
        <div className='flex items-center gap-2'>
          <span className='font-mono text-sm'>{JSON.stringify(value)}</span>
          {canEdit(config.key) && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                setEditingState(prev => ({
                  ...prev,
                  [config.id]: {
                    value: config.value,
                    isEditing: true,
                    originalValue: config.value,
                    hasError: false,
                  },
                }));
              }}
            >
              <Edit className='h-3 w-3' />
            </Button>
          )}
        </div>
      );
    }

    switch (config.dataType) {
      case ConfigDataType.STRING:
        const stringValue =
          typeof value === 'string'
            ? value
            : value === null || value === undefined
              ? ''
              : String(value);
        return (
          <Input
            value={stringValue}
            onChange={e => {
              setEditingState(prev => ({
                ...prev,
                [config.id]: {
                  ...prev[config.id],
                  value: e.target.value,
                  hasError: false,
                },
              }));
            }}
            className={cn(editing?.hasError && 'border-red-500')}
          />
        );

      case ConfigDataType.NUMBER:
        const numberValue =
          typeof value === 'number'
            ? value
            : typeof value === 'string'
              ? value
              : value === null || value === undefined
                ? ''
                : String(value);
        return (
          <Input
            type='number'
            value={numberValue}
            onChange={e => {
              setEditingState(prev => ({
                ...prev,
                [config.id]: {
                  ...prev[config.id],
                  value: parseFloat(e.target.value) || 0,
                  hasError: false,
                },
              }));
            }}
            min={config.validation?.min}
            max={config.validation?.max}
            className={cn(editing?.hasError && 'border-red-500')}
          />
        );

      case ConfigDataType.BOOLEAN:
        const booleanValue =
          typeof value === 'boolean'
            ? value
            : typeof value === 'string'
              ? value === 'true' || value === '1'
              : typeof value === 'number'
                ? Boolean(value)
                : value === null || value === undefined
                  ? false
                  : Boolean(value);
        return (
          <Switch
            checked={booleanValue}
            onCheckedChange={checked => {
              setEditingState(prev => ({
                ...prev,
                [config.id]: {
                  ...prev[config.id],
                  value: checked,
                  hasError: false,
                },
              }));
            }}
          />
        );

      case ConfigDataType.JSON:
      case ConfigDataType.OBJECT:
        return (
          <div className='space-y-2'>
            <MonacoEditor
              height='200px'
              language='json'
              value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
              onChange={newValue => {
                try {
                  const parsed = JSON.parse(newValue || '{}');
                  setEditingState(prev => ({
                    ...prev,
                    [config.id]: {
                      ...prev[config.id],
                      value: parsed,
                      hasError: false,
                    },
                  }));
                } catch (e) {
                  setEditingState(prev => ({
                    ...prev,
                    [config.id]: {
                      ...prev[config.id],
                      value: newValue || '',
                      hasError: true,
                      errorMessage: 'Invalid JSON',
                    },
                  }));
                }
              }}
              options={{
                minimap: { enabled: false },
                lineNumbers: 'off',
              }}
            />
            {editing?.hasError && <p className='text-xs text-red-500'>{editing.errorMessage}</p>}
          </div>
        );

      case ConfigDataType.ARRAY:
        return (
          <div className='space-y-2'>
            {(Array.isArray(value) ? value : []).map((item, index) => (
              <div key={index} className='flex items-center gap-2'>
                <Input
                  value={typeof item === 'string' ? item : String(item || '')}
                  onChange={e => {
                    const newArray = [...(Array.isArray(value) ? value : [])];
                    newArray[index] = e.target.value;
                    setEditingState(prev => ({
                      ...prev,
                      [config.id]: {
                        ...prev[config.id],
                        value: newArray,
                        hasError: false,
                      },
                    }));
                  }}
                />
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    const newArray = (Array.isArray(value) ? value : []).filter(
                      (_, i) => i !== index
                    );
                    setEditingState(prev => ({
                      ...prev,
                      [config.id]: {
                        ...prev[config.id],
                        value: newArray,
                        hasError: false,
                      },
                    }));
                  }}
                >
                  <X className='h-3 w-3' />
                </Button>
              </div>
            ))}
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                const newArray = [...(Array.isArray(value) ? value : []), ''];
                setEditingState(prev => ({
                  ...prev,
                  [config.id]: {
                    ...prev[config.id],
                    value: newArray,
                    hasError: false,
                  },
                }));
              }}
            >
              <Plus className='mr-1 h-3 w-3' />
              Add Item
            </Button>
          </div>
        );

      case ConfigDataType.DATE:
        const dateValue =
          value instanceof Date
            ? value
            : typeof value === 'string' || typeof value === 'number'
              ? new Date(value)
              : new Date();
        return (
          <DatePicker
            date={dateValue}
            onDateChange={date => {
              setEditingState(prev => ({
                ...prev,
                [config.id]: {
                  ...prev[config.id],
                  value: date?.toISOString() || '',
                  hasError: false,
                },
              }));
            }}
          />
        );

      case ConfigDataType.COLOR:
        return (
          <div className='flex items-center gap-2'>
            <Input
              type='color'
              value={typeof value === 'string' ? value : String(value || '#000000')}
              onChange={e => {
                setEditingState(prev => ({
                  ...prev,
                  [config.id]: {
                    ...prev[config.id],
                    value: e.target.value,
                    hasError: false,
                  },
                }));
              }}
              className='h-10 w-16'
            />
            <Input
              value={typeof value === 'string' ? value : String(value || '')}
              onChange={e => {
                setEditingState(prev => ({
                  ...prev,
                  [config.id]: {
                    ...prev[config.id],
                    value: e.target.value,
                    hasError: false,
                  },
                }));
              }}
              placeholder='#000000'
              className='flex-1'
            />
          </div>
        );

      case ConfigDataType.URL:
        return (
          <Input
            type='url'
            value={typeof value === 'string' ? value : String(value || '')}
            onChange={e => {
              setEditingState(prev => ({
                ...prev,
                [config.id]: {
                  ...prev[config.id],
                  value: e.target.value,
                  hasError: false,
                },
              }));
            }}
            placeholder='https://example.com'
            className={cn(editing?.hasError && 'border-red-500')}
          />
        );

      default:
        return null;
    }
  };

  // Render config item
  const renderConfigItem = (config: ConfigItem) => {
    const editing = editingState[config.id];
    const isSelected = selectedItems.has(config.id);

    return (
      <div
        key={config.id}
        className={cn(
          'space-y-3 rounded-lg border p-4',
          isSelected && 'border-primary bg-primary/5',
          editing?.isEditing && 'border-blue-500'
        )}
      >
        <div className='flex items-start justify-between'>
          <div className='flex-1 space-y-1'>
            <div className='flex items-center gap-2'>
              <h4 className='font-medium'>{config.key}</h4>
              {config.accessLevel === ConfigAccessLevel.ADMIN && (
                <Badge variant='secondary' className='text-xs'>
                  <Lock className='mr-1 h-3 w-3' />
                  Admin
                </Badge>
              )}
              {!config.isEditable && (
                <Badge variant='outline' className='text-xs'>
                  Read Only
                </Badge>
              )}
            </div>
            {config.description && (
              <p className='text-sm text-muted-foreground'>{config.description}</p>
            )}
          </div>

          <div className='flex items-center gap-2'>
            {editing?.isEditing ? (
              <>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handleUpdate(config)}
                  disabled={editing.hasError}
                >
                  <Check className='h-4 w-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    setEditingState(prev => {
                      const newState = { ...prev };
                      delete newState[config.id];
                      return newState;
                    });
                  }}
                >
                  <X className='h-4 w-4' />
                </Button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='sm'>
                    <MoreVertical className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {canEdit(config.key) && config.isEditable && (
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingState(prev => ({
                          ...prev,
                          [config.id]: {
                            value: config.value,
                            isEditing: true,
                            originalValue: config.value,
                            hasError: false,
                          },
                        }));
                      }}
                    >
                      <Edit className='mr-2 h-4 w-4' />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(config.value));
                      toast.success('Value copied to clipboard');
                    }}
                  >
                    <Copy className='mr-2 h-4 w-4' />
                    Copy Value
                  </DropdownMenuItem>
                  {showHistory && (
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedConfig(config);
                        setShowHistoryDialog(true);
                      }}
                    >
                      <History className='mr-2 h-4 w-4' />
                      View History
                    </DropdownMenuItem>
                  )}
                  {canDelete(config.key) && config.scope !== ConfigScope.GLOBAL && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className='text-red-600'>
                        <Trash2 className='mr-2 h-4 w-4' />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <Badge variant='outline'>{config.dataType}</Badge>
            {config.tags?.map(tag => (
              <Badge key={tag} variant='secondary' className='text-xs'>
                {tag}
              </Badge>
            ))}
          </div>
          {renderValueEditor(config)}
        </div>
      </div>
    );
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const editingConfigs = Object.keys(editingState).filter(id => editingState[id].isEditing);
        if (editingConfigs.length === 1) {
          const config = filteredConfigs.find((c: ConfigItem) => c.id === editingConfigs[0]);
          if (config) handleUpdate(config);
        }
      }

      // Escape to cancel editing
      if (e.key === 'Escape') {
        setEditingState({});
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingState, filteredConfigs, handleUpdate]);

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <Skeleton className='h-8 w-32' />
          <Skeleton className='h-4 w-64' />
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className='h-32 w-full' />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-red-600'>
            <AlertCircle className='h-5 w-5' />
            Error Loading Configuration
          </CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <Settings className='h-5 w-5' />
              Configuration Management
            </CardTitle>
            <CardDescription>Manage system configurations and settings</CardDescription>
          </div>

          <div className='flex items-center gap-2'>
            {selectedItems.size > 0 && (
              <>
                <Badge variant='secondary'>{selectedItems.size} selected</Badge>
                <Button variant='outline' size='sm' onClick={handleBatchUpdate}>
                  <Save className='mr-2 h-4 w-4' />
                  Save All
                </Button>
                <Separator orientation='vertical' className='h-6' />
              </>
            )}

            <Button variant='outline' size='sm' onClick={() => refetch()}>
              <RefreshCw className='h-4 w-4' />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm'>
                  <MoreVertical className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                  <Upload className='mr-2 h-4 w-4' />
                  Import
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  <Download className='mr-2 h-4 w-4' />
                  Export
                </DropdownMenuItem>
                {showTemplates && (
                  <DropdownMenuItem onClick={() => setShowTemplateDialog(true)}>
                    <FileText className='mr-2 h-4 w-4' />
                    Templates
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {showSearch && (
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground' />
            <Input
              placeholder='Search configurations...'
              className='pl-10'
              onChange={e => debouncedSearch(e.target.value)}
            />
          </div>
        )}

        <Tabs
          value={selectedCategory}
          onValueChange={v => setSelectedCategory(v as ConfigCategory)}
        >
          <TabsList className='grid grid-cols-4 lg:grid-cols-8'>
            {Object.values(ConfigCategory).map(category => (
              <TabsTrigger key={category} value={category}>
                <div className='flex items-center gap-1'>
                  {CATEGORY_ICONS[category]}
                  <span className='hidden lg:inline'>{category}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.values(ConfigCategory).map(category => (
            <TabsContent key={category} value={category}>
              <ScrollArea className='h-[600px] pr-4'>
                <div className='space-y-4'>
                  {filteredConfigs.length === 0 ? (
                    <div className='py-8 text-center text-muted-foreground'>
                      No configurations found
                    </div>
                  ) : (
                    filteredConfigs.map((config: ConfigItem) => renderConfigItem(config))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Configuration History</DialogTitle>
            <DialogDescription>
              View and revert to previous versions of {selectedConfig?.key}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className='h-[400px]'>
            {historyLoading ? (
              <div className='space-y-2'>
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className='h-20 w-full' />
                ))}
              </div>
            ) : (
              <div className='space-y-2'>
                {historyData?.getConfigHistory.map((entry: ConfigHistoryEntry) => (
                  <div key={entry.version} className='space-y-2 rounded-lg border p-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium'>Version {entry.version}</p>
                        <p className='text-sm text-muted-foreground'>
                          {new Date(entry.changedAt).toLocaleString()} by {entry.changedBy}
                        </p>
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleRevert(selectedConfig!.id, entry.version)}
                      >
                        <RotateCcw className='mr-2 h-4 w-4' />
                        Revert
                      </Button>
                    </div>
                    <div className='rounded bg-muted p-2 font-mono text-sm'>
                      {JSON.stringify(entry.value, null, 2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Configuration Templates</DialogTitle>
            <DialogDescription>Save and apply configuration templates</DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {templateLoading ? (
              <div className='space-y-2'>
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className='h-16 w-full' />
                ))}
              </div>
            ) : (
              <ScrollArea className='h-[300px]'>
                <div className='space-y-2'>
                  {templateData?.getConfigTemplates.map((template: ConfigTemplate) => (
                    <div key={template.id} className='rounded-lg border p-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='font-medium'>{template.name}</p>
                          {template.description && (
                            <p className='text-sm text-muted-foreground'>{template.description}</p>
                          )}
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            // Apply template logic
                            toast.success('Template applied');
                            setShowTemplateDialog(false);
                          }}
                        >
                          <Sparkles className='mr-2 h-4 w-4' />
                          Apply
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {selectedItems.size > 0 && (
              <>
                <Separator />
                <div className='space-y-2'>
                  <Label>Save as Template</Label>
                  <div className='flex gap-2'>
                    <Input placeholder='Template name' id='template-name' />
                    <Button
                      onClick={() => {
                        const name = (document.getElementById('template-name') as HTMLInputElement)
                          ?.value;
                        if (name) handleSaveTemplate(name);
                      }}
                    >
                      Save Template
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Configuration</DialogTitle>
            <DialogDescription>Upload a configuration file to import</DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='rounded-lg border-2 border-dashed p-8 text-center'>
              <input
                type='file'
                accept='.json,.csv,.env'
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleImport(file);
                }}
                className='hidden'
                id='import-file'
              />
              <label htmlFor='import-file' className='cursor-pointer'>
                <Upload className='mx-auto mb-2 h-8 w-8 text-muted-foreground' />
                <p className='text-sm text-muted-foreground'>Click to upload or drag and drop</p>
                <p className='mt-1 text-xs text-muted-foreground'>JSON, CSV, or ENV files</p>
              </label>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
