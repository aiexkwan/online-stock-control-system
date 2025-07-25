import { UniversalContainer } from '@/components/layout/universal';

export default function PrintGrnLabelLayout({ children }: { children?: React.ReactNode }) {
  const safeChildren = children || null;

  return (
    <div className='h-full'>
      {/* Navigation removed - using dynamic action bar */}
      {safeChildren}
    </div>
  );
}
