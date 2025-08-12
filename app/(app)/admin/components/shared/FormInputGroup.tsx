/**
 * FormInputGroup Component
 * Generic form input group with configurable options and validation
 * Extracted from TransferDestinationSelector and other form components
 * 
 * Features:
 * - Radio group, checkbox group, select dropdown support
 * - Configurable options with icons and descriptions
 * - Built-in validation and error display
 * - Responsive layout (horizontal/vertical)
 * - Custom styling support
 * - Loading and disabled states
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Check } from 'lucide-react';

export type FormInputType = 'radio' | 'checkbox' | 'select' | 'text' | 'textarea' | 'number';

export interface FormOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  color?: string;
  bgColor?: string;
  borderColor?: string;
}

export interface FormInputGroupProps {
  /** Input type */
  type: FormInputType;
  /** Group label */
  label?: string;
  /** Help text */
  description?: string;
  /** Available options (for radio, checkbox, select) */
  options?: FormOption[];
  /** Current value(s) */
  value?: string | string[];
  /** Default value */
  defaultValue?: string | string[];
  /** Placeholder text */
  placeholder?: string;
  /** Change handler */
  onChange?: (value: string | string[]) => void;
  /** Validation error message */
  error?: string;
  /** Required field */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Layout direction */
  layout?: 'horizontal' | 'vertical';
  /** Custom className */
  className?: string;
  /** Option className */
  optionClassName?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Allow multiple selection (for checkbox type) */
  multiple?: boolean;
  /** Show validation icons */
  showValidationIcons?: boolean;
}

export const FormInputGroup: React.FC<FormInputGroupProps> = ({
  type,
  label,
  description,
  options = [],
  value,
  defaultValue,
  placeholder,
  onChange,
  error,
  required,
  disabled,
  loading,
  layout = 'vertical',
  className,
  optionClassName,
  size = 'md',
  multiple = false,
  showValidationIcons = false,
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          label: 'text-xs',
          description: 'text-xs',
          input: 'text-sm h-8',
          option: 'p-2 text-xs',
          spacing: 'space-y-1',
        };
      case 'lg':
        return {
          label: 'text-base',
          description: 'text-base',
          input: 'text-base h-12',
          option: 'p-4 text-base',
          spacing: 'space-y-3',
        };
      default:
        return {
          label: 'text-sm',
          description: 'text-sm',
          input: 'text-sm h-10',
          option: 'p-3 text-sm',
          spacing: 'space-y-2',
        };
    }
  };

  const sizeClasses = getSizeClasses();

  const handleRadioChange = (newValue: string) => {
    onChange?.(newValue);
  };

  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    const currentValues = Array.isArray(value) ? value : [];
    const newValues = checked
      ? [...currentValues, optionValue]
      : currentValues.filter(v => v !== optionValue);
    onChange?.(newValues);
  };

  const renderLabel = () => {
    if (!label) return null;
    
    return (
      <div className="flex items-center gap-2">
        <Label className={cn('font-medium text-gray-300', sizeClasses.label)}>
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </Label>
        {showValidationIcons && value && !error && (
          <Check className="h-4 w-4 text-green-400" />
        )}
      </div>
    );
  };

  const renderDescription = () => {
    if (!description) return null;
    
    return (
      <p className={cn('text-gray-400', sizeClasses.description)}>
        {description}
      </p>
    );
  };

  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className="flex items-center gap-2 text-red-400">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span className={cn('text-red-400', sizeClasses.description)}>{error}</span>
      </div>
    );
  };

  const renderRadioGroup = () => (
    <RadioGroup
      value={typeof value === 'string' ? value : ''}
      onValueChange={handleRadioChange}
      disabled={disabled || loading}
      className={cn(
        layout === 'horizontal' ? 'flex flex-wrap gap-2' : sizeClasses.spacing
      )}
    >
      {options.map(option => {
        const Icon = option.icon;
        
        return (
          <div key={option.value} className="relative">
            <RadioGroupItem
              value={option.value}
              id={option.value}
              className="peer sr-only"
              disabled={option.disabled}
            />
            <Label
              htmlFor={option.value}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-lg border transition-all duration-200',
                sizeClasses.option,
                option.bgColor || 'bg-gray-800',
                option.borderColor || 'border-gray-700',
                'hover:border-opacity-80',
                'peer-checked:border-gray-500',
                'peer-checked:bg-gray-700',
                'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                optionClassName
              )}
            >
              {Icon && (
                <div className={cn('rounded-full p-1', option.bgColor || 'bg-gray-700')}>
                  <Icon className={cn('h-3 w-3', option.color || 'text-gray-400')} />
                </div>
              )}
              <div className="flex-1">
                <div className={cn('font-medium', option.color || 'text-gray-300')}>
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-xs text-gray-400 mt-1">
                    {option.description}
                  </div>
                )}
              </div>
              <div
                className={cn(
                  'h-3 w-3 rounded-full border-2',
                  value === option.value
                    ? `${option.borderColor || 'border-gray-500'} bg-white`
                    : 'border-gray-600'
                )}
              />
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );

  const renderCheckboxGroup = () => (
    <div className={cn(
      layout === 'horizontal' ? 'flex flex-wrap gap-2' : sizeClasses.spacing
    )}>
      {options.map(option => {
        const isChecked = Array.isArray(value) ? value.includes(option.value) : false;
        const Icon = option.icon;
        
        return (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={option.value}
              checked={isChecked}
              onCheckedChange={(checked) => handleCheckboxChange(option.value, checked as boolean)}
              disabled={disabled || loading || option.disabled}
            />
            <Label
              htmlFor={option.value}
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                sizeClasses.label,
                option.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {Icon && (
                <Icon className={cn('h-4 w-4', option.color || 'text-gray-400')} />
              )}
              <span>{option.label}</span>
              {option.description && (
                <span className="text-xs text-gray-400">({option.description})</span>
              )}
            </Label>
          </div>
        );
      })}
    </div>
  );

  const renderSelect = () => (
    <Select
      value={typeof value === 'string' ? value : ''}
      onValueChange={(newValue) => onChange?.(newValue)}
      disabled={disabled || loading}
    >
      <SelectTrigger className={sizeClasses.input}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            <div className="flex items-center gap-2">
              {option.icon && (
                <option.icon className={cn('h-4 w-4', option.color)} />
              )}
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const renderTextInput = () => (
    <Input
      type={type === 'number' ? 'number' : 'text'}
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled || loading}
      className={cn(sizeClasses.input, error && 'border-red-500')}
    />
  );

  const renderTextarea = () => (
    <Textarea
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled || loading}
      className={cn(error && 'border-red-500')}
      rows={3}
    />
  );

  const renderInput = () => {
    switch (type) {
      case 'radio':
        return renderRadioGroup();
      case 'checkbox':
        return renderCheckboxGroup();
      case 'select':
        return renderSelect();
      case 'textarea':
        return renderTextarea();
      case 'text':
      case 'number':
      default:
        return renderTextInput();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {renderLabel()}
      {renderDescription()}
      
      <div className="relative">
        {renderInput()}
        {loading && (
          <div className="absolute inset-0 bg-black/20 rounded flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          </div>
        )}
      </div>
      
      {renderError()}
    </div>
  );
};

export default FormInputGroup;