#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common UI components that should NOT have underscore prefixes
const UI_COMPONENTS = [
  'Button',
  'Loader2',
  'Database',
  'Card',
  'Input',
  'Select',
  'Dialog',
  'AlertDialog',
  'Popover',
  'Tooltip',
  'Badge',
  'Avatar',
  'Separator',
  'Progress',
  'Skeleton',
  'Toast',
  'Sheet',
  'Tabs',
  'Accordion',
  'ScrollArea',
  'Command',
  'Calendar',
  'Checkbox',
  'RadioGroup',
  'Switch',
  'Textarea',
  'Label',
  'Form',
  'Table',
  'DropdownMenu',
  'NavigationMenu',
  'Menubar',
  'ContextMenu',
  'HoverCard',
  'AlertDialog',
  'AspectRatio',
  'Collapsible',
  'Toggle',
  'ToggleGroup',
  'Slider',
  'ResizablePanelGroup',
  'ResizablePanel',
  'ResizableHandle',
  'Drawer',
  'Sonner',
];

// Lucide React icons that should NOT have underscore prefixes
const LUCIDE_ICONS = [
  'Loader2',
  'Database',
  'Search',
  'Plus',
  'Minus',
  'X',
  'Check',
  'ChevronUp',
  'ChevronDown',
  'ChevronLeft',
  'ChevronRight',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Settings',
  'User',
  'Home',
  'Menu',
  'Heart',
  'Star',
  'Bell',
  'Mail',
  'Phone',
  'Calendar',
  'Clock',
  'MapPin',
  'Eye',
  'EyeOff',
  'Edit',
  'Trash',
  'Copy',
  'Share',
  'Download',
  'Upload',
  'Refresh',
  'Play',
  'Pause',
  'Stop',
  'Volume',
  'VolumeX',
  'Wifi',
  'Battery',
  'Signal',
  'AlertCircle',
  'AlertTriangle',
  'Info',
  'CheckCircle',
  'XCircle',
  'HelpCircle',
  'MessageCircle',
  'Package',
  'Truck',
  'ShoppingCart',
  'CreditCard',
  'DollarSign',
  'TrendingUp',
  'TrendingDown',
  'BarChart',
  'PieChart',
  'Activity',
  'Zap',
  'Sun',
  'Moon',
  'Cloud',
  'Umbrella',
  'Camera',
  'Image',
  'File',
  'Folder',
  'Archive',
  'Lock',
  'Unlock',
  'Key',
  'Shield',
  'UserCheck',
  'Users',
  'UserPlus',
  'UserMinus',
  'Globe',
  'Bookmark',
  'Tag',
  'Flag',
  'Gift',
  'Award',
  'Target',
  'Layers',
  'Grid',
  'List',
  'Filter',
  'Sort',
  'Move',
  'Maximize',
  'Minimize',
  'MoreHorizontal',
  'MoreVertical',
  'ExternalLink',
  'Link',
  'Unlink',
  'Code',
  'Terminal',
  'Command',
  'Cpu',
  'HardDrive',
  'Server',
  'Monitor',
  'Smartphone',
  'Tablet',
  'Laptop',
  'Watch',
  'Headphones',
  'Mic',
  'MicOff',
  'Video',
  'VideoOff',
  'PrinterIcon',
  'Scanner',
  'Wifi',
  'Bluetooth',
  'Radio',
  'Tv',
  'Speaker',
  'Volume1',
  'Volume2',
  'VolumeX',
];

const ALL_COMPONENTS = [...UI_COMPONENTS, ...LUCIDE_ICONS];

function fixImportsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    let newContent = content;

    // Fix import statements - remove underscores from UI components and icons
    ALL_COMPONENTS.forEach(component => {
      // Fix direct imports like: import { _Button } from
      const importRegex = new RegExp(`import\\s*\\{([^}]*),?\\s*_${component}([^}]*)\\}`, 'g');
      newContent = newContent.replace(importRegex, (match, before, after) => {
        hasChanges = true;
        return `import {${before},${before ? ' ' : ''}${component}${after}}`;
      });

      // Fix imports at start of list: import { _Button, ... }
      const startImportRegex = new RegExp(`import\\s*\\{\\s*_${component}\\s*,`, 'g');
      newContent = newContent.replace(startImportRegex, match => {
        hasChanges = true;
        return `import { ${component},`;
      });

      // Fix single imports: import { _Button }
      const singleImportRegex = new RegExp(`import\\s*\\{\\s*_${component}\\s*\\}`, 'g');
      newContent = newContent.replace(singleImportRegex, match => {
        hasChanges = true;
        return `import { ${component} }`;
      });
    });

    if (hasChanges) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Fixed imports in: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findTSXFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules and .next directories
          if (!item.startsWith('.') && item !== 'node_modules') {
            traverse(fullPath);
          }
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${currentDir}:`, error.message);
    }
  }

  traverse(dir);
  return files;
}

// Main execution
const projectRoot = process.cwd();
const tsxFiles = findTSXFiles(projectRoot);

console.log(`🔍 Found ${tsxFiles.length} TypeScript files`);
console.log('🚀 Fixing import statements...\n');

let fixedCount = 0;

tsxFiles.forEach(file => {
  if (fixImportsInFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✨ Import fix completed!`);
console.log(`📊 Fixed imports in ${fixedCount} files`);
console.log('🎯 Run npm run lint again to check remaining issues');
