import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // 在開始時讀取並保存 data
  const data = await request.json();
  const isDevelopment = process.env.NODE_ENV === 'development';

  isDevelopment && console.log('[Print Label PDF API] Received data:', data);

  try {
    // 直接使用 Puppeteer 方法，因為我們已經有工作的 HTML API
    const puppeteer = await import('puppeteer');

    const params = new URLSearchParams({
      productCode: data.productCode,
      description: data.description,
      quantity: String(data.quantity),
      date: data.date,
      operatorClockNum: data.operatorClockNum,
      qcClockNum: data.qcClockNum,
      workOrderNumber: data.workOrderNumber || '-',
      palletNum: data.palletNum,
      qrValue: data.qrValue || `${data.productCode}-${data.palletNum}`,
    }).toString();

    const host = request.headers.get('host');
    const protocol = host?.startsWith('localhost') ? 'http' : 'https';
    const url = `${protocol}://${host}/api/print-label-html?${params}`;

    isDevelopment && console.log('[Print Label PDF API] Generating PDF from URL:', url);

    const browser = await puppeteer.default.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    await browser.close();

    isDevelopment &&
      console.log('[Print Label PDF API] PDF generated successfully, size:', pdfBuffer.length);

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=pallet-label.pdf',
      },
    });
  } catch (error) {
    console.error('[Print Label PDF API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: (error as Error).message },
      { status: 500 }
    );
  }
}
