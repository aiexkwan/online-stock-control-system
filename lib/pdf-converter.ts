import puppeteer from 'puppeteer';

interface ConvertToPDFOptions {
  html: string;
  outputPath?: string;
}

export async function convertToPDF({ html, outputPath }: ConvertToPDFOptions): Promise<Uint8Array> {
  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();

    // 設置頁面大小為標籤尺寸
    await page.setViewport({
      width: 793, // 210mm in pixels at 96 DPI
      height: 547, // 145mm in pixels at 96 DPI
    });

    // 注入自定義字體
    await page.addStyleTag({
      content: `
        @font-face {
          font-family: 'Times';
          src: url('/fonts/times.ttf') format('truetype');
        }
        @font-face {
          font-family: 'Times';
          src: url('/fonts/timesbold.ttf') format('truetype');
          font-weight: bold;
        }
      `,
    });

    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    const pdf = await page.pdf({
      width: '210mm',
      height: '145mm',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
    });

    if (outputPath) {
      const fs = require('fs');
      await fs.promises.writeFile(outputPath, pdf);
    }

    return pdf;
  } finally {
    await browser.close();
  }
}
