export default function HtmlPreviewLayout({ children }: { children?: React.ReactNode }) {
  const safeChildren = children || null;
  
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <title>Pallet Label Preview</title>
      </head>
      <body>{safeChildren}</body>
    </html>
  );
}
