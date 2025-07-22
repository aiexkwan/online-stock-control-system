'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BarChart3, Database, Package } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const navItems: NavItem[] = [
  {
    href: '/admin/operations',
    label: 'Operations & Production',
    icon: <Package className="h-4 w-4" />,
    description: 'Monitor production, warehouse operations, and inventory levels',
  },
  {
    href: '/admin/data-management',
    label: 'Data Management',
    icon: <Database className="h-4 w-4" />,
    description: 'Upload files, update data, and generate system reports',
  },
  {
    href: '/admin/analytics',
    label: 'Analytics & Reports',
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'Comprehensive analytics, insights, and performance metrics',
  },
];

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex space-x-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
                title={item.description}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}