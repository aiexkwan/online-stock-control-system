import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export const runtime = 'nodejs'; // 確保 Vercel 用 node 環境

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // 組裝 query string
    const params = new URLSearchParams({
      productCode: data.productCode,
      description: data.description,
      quantity: String(data.quantity),
      date: data.date,
      operatorClockNum: data.operatorClockNum,
      qcClockNum: data.qcClockNum,
      workOrderNumber: data.workOrderNumber,
      palletNum: data.palletNum,
      qrValue: data.qrValue || data.productCode,
    }).toString();

    // 動態取得 Vercel domain
    const host = request.headers.get('host');
    const protocol = host?.startsWith('localhost') ? 'http' : 'https';
    const url = `${protocol}://${host}/print-label/html-preview?${params}`;

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    // 產生 PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=label.pdf',
      },
    });
  } catch (error) {
    console.error('Puppeteer PDF error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
} 