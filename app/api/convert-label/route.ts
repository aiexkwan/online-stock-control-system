import { NextRequest, NextResponse } from 'next/server';
import { convertToPDF } from '@/lib/pdf-converter';
import { renderToString } from 'react-dom/server';
import { LabelTemplate } from '@/components/label/label-template';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // 渲染 React 組件為 HTML 字符串
    const html = renderToString(
      LabelTemplate({
        productCode: data.productCode,
        description: data.description,
        quantity: data.quantity,
        date: data.date,
        operatorClockNum: data.operatorClockNum,
        qcClockNum: data.qcClockNum,
        workOrder: data.workOrder,
        palletNumber: data.palletNumber
      })
    );

    // 轉換為 PDF
    const pdf = await convertToPDF({ html });

    // 返回 PDF 文件
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=label.pdf'
      }
    });
  } catch (error) {
    console.error('PDF conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert label to PDF' },
      { status: 500 }
    );
  }
} 