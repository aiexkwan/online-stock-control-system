# Widget Typography Migration Guide

## Overview
This guide shows how to update existing widgets to use the new unified typography component with subtle glow effects.

## Import the Typography Components

```typescript
import { WidgetTitle, WidgetText, WidgetLabel, WidgetValue } from '@/app/components/dashboard/WidgetTypography';
```

## Migration Examples

### 1. Widget Titles

**Before:**
```typescript
<h3 className="text-xs text-slate-400 mb-1">ACO Orders</h3>
```

**After:**
```typescript
<WidgetTitle size="xs" glow="gray" className="mb-1">ACO Orders</WidgetTitle>
```

### 2. Value Display

**Before:**
```typescript
<div className="text-2xl font-medium text-white">{incompleteOrders.length}</div>
```

**After:**
```typescript
<WidgetValue size="large" glow="strong">{incompleteOrders.length}</WidgetValue>
```

### 3. Labels and Descriptions

**Before:**
```typescript
<p className="text-xs text-slate-400 mt-0.5">Incomplete</p>
```

**After:**
```typescript
<WidgetLabel size="xs" glow="gray" className="mt-0.5">Incomplete</WidgetLabel>
```

### 4. Body Text

**Before:**
```typescript
<span className="text-sm text-purple-300">• {record.action}</span>
```

**After:**
```typescript
<WidgetText size="small" glow="purple">• {record.action}</WidgetText>
```

## Available Glow Colors

- `white` - White glow (default for most text)
- `blue` - Blue glow
- `green` - Green glow  
- `purple` - Purple glow
- `red` - Red glow
- `yellow` - Yellow glow
- `orange` - Orange glow
- `gray` - No glow (for subtle labels)
- `subtle` - Light glow (good for small text)
- `strong` - Strong glow (good for important values)

## Size Options

### WidgetTitle
- `large` (text-xl)
- `medium` (text-lg) 
- `small` (text-sm)
- `xs` (text-xs)

### WidgetText
- `large` (text-base)
- `medium` (text-sm)
- `small` (text-xs) 
- `xs` (text-[10px])

### WidgetLabel
- `large` (text-sm)
- `medium` (text-xs)
- `small` (text-[10px])
- `xs` (text-[9px])

### WidgetValue
- `xxl` (text-4xl)
- `xl` (text-3xl)
- `large` (text-2xl)
- `medium` (text-xl)
- `small` (text-lg)

## Complete Widget Example

```typescript
// 1x1 Widget
<WidgetCard widgetType="ACO_ORDER_PROGRESS" isEditMode={isEditMode}>
  <CardContent className="p-2 h-full flex flex-col justify-center items-center">
    <WidgetTitle size="xs" glow="gray" className="mb-1">
      ACO Orders
    </WidgetTitle>
    <WidgetValue size="large" glow="orange">
      {incompleteOrders.length}
    </WidgetValue>
    <WidgetLabel size="xs" glow="gray" className="mt-0.5">
      Incomplete
    </WidgetLabel>
  </CardContent>
</WidgetCard>
```

## Helper Functions

### Auto Color Selection
```typescript
import { getGlowColorForWidget } from '@/app/components/dashboard/WidgetTypography';

const glowColor = getGlowColorForWidget('ACO_ORDER_PROGRESS'); // returns 'orange'
```

### Auto Font Size
```typescript
import { getAutoFontSize } from '@/app/components/dashboard/WidgetTypography';

const fontSize = getAutoFontSize(value, 'small'); // auto-adjusts based on value
```