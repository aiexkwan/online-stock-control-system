import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { getAcoReportData } from '@/app/actions/reportActions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json({ error: 'ACO Order reference is required' }, { status: 400 });
    }

    // Verify user authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user?.email) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get ACO report data using the existing action
    const reportData = await getAcoReportData(reference);

    if (!reportData || reportData.length === 0) {
      return NextResponse.json(
        { error: 'No data found for the selected ACO order' },
        { status: 404 }
      );
    }

    // Import ExcelJS for full formatting
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('ACO Report');

    // Page setup
    sheet.pageSetup = {
      margins: {
        left: 0.2,
        right: 0.2,
        top: 0.2,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3,
      },
      orientation: 'portrait',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      horizontalCentered: false,
      verticalCentered: false,
    };

    // Title
    sheet.mergeCells('E1:L2');
    sheet.getRow(1).height = 25;
    sheet.getRow(2).height = 25;
    sheet.getRow(4).height = 25;
    sheet.getRow(5).height = 20;
    const titleCell = sheet.getCell('E1');
    titleCell.value = 'ACO Record';
    titleCell.font = { size: 48, bold: true, name: 'Arial', underline: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Merge groups
    const mergeGroups = [
      'A4:D4',
      'E4:H4',
      'I4:L4',
      'M4:P4',
      'A5:D5',
      'E5:H5',
      'I5:L5',
      'M5:P5',
      'M1:P1',
      'M2:P2',
    ];
    mergeGroups.forEach(range => {
      try {
        sheet.mergeCells(range);
      } catch (e) {
        const isDevelopment = process.env.NODE_ENV === 'development';
        isDevelopment && console.warn(`Could not merge cells for range ${range}:`, e);
      }
    });

    // Order Ref and Report Date
    const m1Cell = sheet.getCell('P1');
    m1Cell.value = `ACO Order Ref. : ${reference}`;
    m1Cell.font = { size: 16, bold: true };
    m1Cell.alignment = { vertical: 'middle', horizontal: 'center' };

    const m2Cell = sheet.getCell('P2');
    const today = new Date();
    const formattedDate = today
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .toUpperCase();
    m2Cell.value = `Print Date : ${formattedDate}`;
    m2Cell.font = { size: 16, bold: true };
    m2Cell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Column widths
    const colWidthsConfig = [1.75, 15.15, 8.15, 15.75];
    for (let i = 0; i < 4; i++) {
      sheet.getColumn(i * 4 + 1).width = colWidthsConfig[0];
      sheet.getColumn(i * 4 + 2).width = colWidthsConfig[1];
      sheet.getColumn(i * 4 + 3).width = colWidthsConfig[2];
      sheet.getColumn(i * 4 + 4).width = colWidthsConfig[3];
    }

    // Header row (Row 6)
    const headerRow = sheet.getRow(6);
    headerRow.height = 17.25;
    const headers = [
      ['Pallet No.', 'Qty', 'QC Date'],
      ['Pallet No.', 'Qty', 'QC Date'],
      ['Pallet No.', 'Qty', 'QC Date'],
      ['Pallet No.', 'Qty', 'QC Date'],
    ];

    headers.forEach((group, groupIndex) => {
      const baseCol = groupIndex * 4 + 2;
      group.forEach((header, colIndex) => {
        const cell = headerRow.getCell(baseCol + colIndex);
        cell.value = header;
        cell.font = { size: 10, name: 'Arial' };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Process data by product code
    const productGroups = new Map<string, any[]>();
    reportData.forEach(item => {
      if (!productGroups.has(item.product_code)) {
        productGroups.set(item.product_code, []);
      }
      productGroups.get(item.product_code)!.push(item);
    });

    // Fill data
    let productIndex = 0;
    let currentRow = 7;
    const maxRows = 36;

    Array.from(productGroups.entries()).forEach(([productCode, items]) => {
      if (productIndex < 4) {
        const baseCol = productIndex * 4 + 1;

        // Product code in row 4
        const productCell = sheet.getCell(4, baseCol);
        productCell.value = productCode;
        productCell.font = { size: 18, bold: true };
        productCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // Fill pallet data
        items.forEach((item, itemIndex) => {
          if (currentRow + itemIndex <= 6 + maxRows) {
            const row = currentRow + itemIndex;
            sheet.getCell(row, baseCol + 1).value = item.palletNum;
            sheet.getCell(row, baseCol + 2).value = item.quantity;
            sheet.getCell(row, baseCol + 3).value = item.qcDate || '';

            // Apply borders
            for (let c = 0; c < 3; c++) {
              const cell = sheet.getCell(row, baseCol + 1 + c);
              cell.font = { size: 10, name: 'Arial' };
              cell.alignment = { vertical: 'middle', horizontal: 'center' };
              cell.border = {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
              };
            }
          }
        });

        productIndex++;
      }
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="ACO_${reference}_Report.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error generating ACO order report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
