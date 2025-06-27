import { UniversalContainer } from '@/components/layout/universal';

export default function PrintGrnLabelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full">
      {/* Navigation removed - using dynamic action bar */}
      {children}
    </div>
  );
}