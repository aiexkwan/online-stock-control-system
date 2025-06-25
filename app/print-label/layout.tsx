export default function PrintLabelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Navigation removed - using dynamic action bar */}
      {children}
    </div>
  );
}