import { UniversalContainer } from '@/components/layout/universal';

export default function PrintLabelLayout({ children }: { children?: React.ReactNode }) {
  const safeChildren = children || null;

  return (
    <UniversalContainer variant='page' background='transparent' padding='none'>
      {/* Navigation removed - using dynamic action bar */}
      {safeChildren}
    </UniversalContainer>
  );
}
