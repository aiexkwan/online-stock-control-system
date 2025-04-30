import './globals.css';

export const metadata = {
  title: 'Pennine Stock Control',
  description: 'Online warehouse stock control system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">{children}</body>
    </html>
  )
}
