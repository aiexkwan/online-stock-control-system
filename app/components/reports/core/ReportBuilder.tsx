/**
 * 統一報表構建器組件
 * 提供統一的 UI 介面來配置和生成報表
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ReportConfig, FilterValues, ReportFormat, FilterConfig } from '../core/ReportConfig';
import { useToast } from '@/components/ui/use-toast';
import { dialogStyles } from '@/app/utils/dialogStyles';

interface ReportBuilderProps {
  _config: ReportConfig;
  onGenerate: (format: ReportFormat, filters: FilterValues) => Promise<void>;
  className?: string;
}

export function ReportBuilder({ _config, onGenerate, className }: ReportBuilderProps) {
  const [filters, setFilters] = useState<FilterValues>({});
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>(_config.defaultFormat);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // 初始化默認值
  useEffect(() => {
    const defaultFilters: FilterValues = {};
    _config.filters.forEach(filter => {
      if (filter.defaultValue !== undefined) {
        defaultFilters[filter.id] = filter.defaultValue;
      }
    });
    setFilters(defaultFilters);
  }, [_config]);

  const handleFilterChange = (filterId: string, value: unknown) => {
    // 策略 4: unknown + type narrowing - 安全的 filter 值轉換
    const safeValue: string | number | boolean | string[] | Date = (() => {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
      }
      if (value instanceof Date) {
        return value;
      }
      if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
        return value as string[];
      }
      return String(value); // 回退到字符串
    })();

    setFilters(prev => ({
      ...prev,
      [filterId]: safeValue,
    }));
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      await onGenerate(selectedFormat, filters);
      toast({
        title: 'Report Generated',
        description: `Your ${_config._name} has been generated successfully.`,
      });
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderFilter = (filter: FilterConfig) => {
    const rawValue = filters[filter.id];

    // 策略 4: unknown + type narrowing - 安全的值轉換
    const getStringValue = (): string => {
      if (typeof rawValue === 'string') return rawValue;
      if (typeof rawValue === 'number') return String(rawValue);
      if (typeof rawValue === 'boolean') return String(rawValue);
      return '';
    };

    switch (filter.type) {
      case 'text':
        return (
          <div key={filter.id} className='space-y-2'>
            <Label htmlFor={filter.id} className='text-slate-200'>
              {filter.label}
              {filter.required && <span className='ml-1 text-red-500'>*</span>}
            </Label>
            <Input
              id={filter.id}
              type='text'
              value={getStringValue()}
              onChange={e => handleFilterChange(filter.id, e.target.value)}
              placeholder={filter.placeholder}
              className={dialogStyles.input}
            />
          </div>
        );

      case 'number':
        const getNumberValue = (): string => {
          if (typeof rawValue === 'number') return String(rawValue);
          if (typeof rawValue === 'string') return rawValue;
          return '';
        };

        return (
          <div key={filter.id} className='space-y-2'>
            <Label htmlFor={filter.id} className='text-slate-200'>
              {filter.label}
              {filter.required && <span className='ml-1 text-red-500'>*</span>}
            </Label>
            <Input
              id={filter.id}
              type='number'
              value={getNumberValue()}
              onChange={e =>
                handleFilterChange(filter.id, e.target.value ? Number(e.target.value) : '')
              }
              placeholder={filter.placeholder}
              min={filter.validation?.min}
              max={filter.validation?.max}
              className={dialogStyles.input}
            />
          </div>
        );

      case 'date':
        const getDateValue = (): string => {
          if (typeof rawValue === 'string') return rawValue;
          if (rawValue instanceof Date) return format(rawValue, 'yyyy-MM-dd');
          return '';
        };

        const dateValue = getDateValue();

        return (
          <div key={filter.id} className='space-y-2'>
            <Label>
              {filter.label}
              {filter.required && <span className='ml-1 text-red-500'>*</span>}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className={cn(
                    dialogStyles.secondaryButton,
                    'w-full justify-start text-left font-normal',
                    !dateValue && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {dateValue ? format(new Date(dateValue), 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0'>
                <Calendar
                  mode='single'
                  selected={dateValue ? new Date(dateValue) : undefined}
                  onSelect={date =>
                    handleFilterChange(filter.id, date ? format(date, 'yyyy-MM-dd') : '')
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
        );

      case 'dateRange':
        const getRangeValue = (): string => {
          if (typeof rawValue === 'string') return rawValue;
          return '';
        };

        const rangeValue = getRangeValue();
        const [startDate, endDate] = rangeValue ? rangeValue.split('|') : ['', ''];
        return (
          <div key={filter.id} className='space-y-2'>
            <Label>
              {filter.label}
              {filter.required && <span className='ml-1 text-red-500'>*</span>}
            </Label>
            <div className='grid grid-cols-2 gap-2'>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className={cn(
                      dialogStyles.secondaryButton,
                      'justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {startDate ? format(new Date(startDate), 'PP') : 'Start'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={startDate ? new Date(startDate) : undefined}
                    onSelect={date => {
                      const newStart = date ? format(date, 'yyyy-MM-dd') : '';
                      handleFilterChange(filter.id, `${newStart}|${endDate}`);
                    }}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className={cn(
                      dialogStyles.secondaryButton,
                      'justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {endDate ? format(new Date(endDate), 'PP') : 'End'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={endDate ? new Date(endDate) : undefined}
                    onSelect={date => {
                      const newEnd = date ? format(date, 'yyyy-MM-dd') : '';
                      handleFilterChange(filter.id, `${startDate}|${newEnd}`);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );

      case 'select':
        const getSelectValue = (): string => {
          if (typeof rawValue === 'string') return rawValue;
          return '';
        };

        return (
          <div key={filter.id} className='space-y-2'>
            <Label htmlFor={filter.id}>
              {filter.label}
              {filter.required && <span className='ml-1 text-red-500'>*</span>}
            </Label>
            <Select
              value={getSelectValue()}
              onValueChange={value => handleFilterChange(filter.id, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={filter.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {filter.options?.map(option => (
                  <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={cn(dialogStyles.card, 'w-full', className)}>
      <CardHeader>
        <CardTitle className='text-white'>{_config._name}</CardTitle>
        <CardDescription className='text-slate-400'>{_config.description}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Filters Section */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold text-white'>Report Filters</h3>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {_config.filters.map(renderFilter)}
          </div>
        </div>

        {/* Format Selection */}
        <div className='space-y-2'>
          <Label>Export Format</Label>
          <Select
            value={selectedFormat}
            onValueChange={value => setSelectedFormat(value as ReportFormat)}
          >
            <SelectTrigger className='w-full md:w-[200px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {_config.formats.map(format => (
                <SelectItem key={format} value={format}>
                  {format.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Generate Button */}
        <div className='flex justify-end'>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            size='lg'
            className={dialogStyles.primaryButton}
          >
            {isGenerating ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Generating...
              </>
            ) : (
              <>
                <Download className='mr-2 h-4 w-4' />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
