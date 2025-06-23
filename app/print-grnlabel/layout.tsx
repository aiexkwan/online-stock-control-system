'use client';

import { usePathname, useRouter } from 'next/navigation';
import { MenuBar } from '@/components/ui/glow-menu';
import { 
  DocumentTextIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

// Print label navigation themes (shared with print-label layout)
const PRINT_LABEL_THEMES = [
  { 
    id: 'qc-label', 
    label: 'Q.C. LABEL', 
    path: '/print-label',
    icon: ClipboardDocumentCheckIcon,
    gradient: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-500"
  },
  { 
    id: 'grn-label', 
    label: 'GRN LABEL', 
    path: '/print-grnlabel',
    icon: DocumentTextIcon,
    gradient: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "text-orange-500"
  }
];

export default function PrintGrnLabelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Determine current page
  const currentPage = pathname === '/print-grnlabel' ? 'grn-label' : 'qc-label';
  
  return (
    <div className="min-h-screen">
      {/* Print Label Navigation Bar */}
      <div className="sticky top-0 z-30 mb-6">
        <div className="flex items-center justify-center h-16 px-4 sm:px-6 lg:px-8">
          <MenuBar
            items={PRINT_LABEL_THEMES.map(theme => ({
              ...theme,
              href: theme.path
            }))}
            activeItem={PRINT_LABEL_THEMES.find(t => t.id === currentPage)?.label || 'GRN LABEL'}
            onItemClick={(label) => {
              const theme = PRINT_LABEL_THEMES.find(t => t.label === label);
              if (theme) router.push(theme.path);
            }}
          />
        </div>
      </div>
      
      {/* Page Content */}
      {children}
    </div>
  );
}