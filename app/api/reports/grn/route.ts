import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { getMaterialCodesForGrnRef, getGrnReportData } from '@/app/actions/reportActions';
import { exportGrnReport } from '@/lib/exportReport';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference } = body;
    
    if (!reference) {
      return NextResponse.json(
        { error: 'GRN reference is required' },
        { status: 400 }
      );
    }
    
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.email) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Get material codes for the selected grn_ref
    const materialCodes = await getMaterialCodesForGrnRef(reference);
    
    if (materialCodes.length === 0) {
      return NextResponse.json(
        { error: 'No materials found for the selected GRN reference' },
        { status: 404 }
      );
    }
    
    // For API response, we'll generate a combined report
    // In the actual dialog, it generates separate files for each material
    const allReports = [];
    
    for (const materialCode of materialCodes) {
      const reportData = await getGrnReportData(reference, materialCode, user.email);
      if (reportData) {
        allReports.push({
          materialCode,
          data: reportData
        });
      }
    }
    
    if (allReports.length === 0) {
      return NextResponse.json(
        { error: 'No report data found' },
        { status: 404 }
      );
    }
    
    // If only one report, use the full exportGrnReport function
    // Otherwise, we need to handle multiple reports differently
    if (allReports.length === 1) {
      // Use the full GRN report format from exportGrnReport
      const ExcelJS = await import('exceljs');
      const { exportGrnReport } = await import('@/lib/exportReport');
      
      // The exportGrnReport function expects a GrnReportPageData object
      // but saves directly to file, so we need to create our own workbook
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('GRN Report');
      
      // Apply the same formatting as exportGrnReport
      const center = { horizontal: 'center', vertical: 'middle', wrapText: true } as const;
      const right = { horizontal: 'right', vertical: 'middle' } as const;
      const grayFill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDCDCDC' },
      } as const;
      const thinBorder = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      } as const;
      const thickBorder = {
        top: { style: 'thick' },
        bottom: { style: 'thick' },
        left: { style: 'thick' },
        right: { style: 'thick' },
      } as const;
      
      // Row heights
      const rowHeights: Record<number, number> = {
        ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i + 1, 24])),
        8: 14.25,
        9: 29.25,
        10: 14.25,
        ...Object.fromEntries(Array.from({ length: 32 }, (_, i) => [11 + i, 24])),
        43: 15,
        44: 20.25, 45: 20.25, 46: 20.25, 47: 20.25,
        48: 39.75,
      };
      Object.entries(rowHeights).forEach(([row, height]) => {
        sheet.getRow(Number(row)).height = height;
      });
      
      // Column widths
      const colWidths = [
        5.25, 9.75, 9.1, 7, 7, 7, 7, 7, // A-H
        8, 6.15, 6.15, 8,       // I-L
        5, 7, 5,             // M-O
        5.5, 5.5,                      // P-Q
        8.25, 9.5, 9.5,                // R-T
      ];
      colWidths.forEach((w, i) => {
        sheet.getColumn(i + 1).width = w;
      });
      
      // Merge blocks
      sheet.mergeCells('A44:E44');
      sheet.getCell('A44').value = 'Action For Material On Hold :';
      sheet.getCell('A44').font = { size: 14, bold: true, underline: 'double' };
      sheet.getCell('A44').alignment = center;
      
      sheet.mergeCells('A45:I48');
      sheet.getCell('A45').font = { size: 18, bold: true };
      sheet.getCell('A45').alignment = center;
      
      // Header info
      const reportData = allReports[0].data;
      for (let i = 2; i <= 6; i++) {
        sheet.getCell(`C${i}`).value = ['Code : ', 'Description : ', 'Supplier Name : ', 'Our Order No. : ', 'Date : '][i - 2];
        sheet.getCell(`C${i}`).alignment = right;
        sheet.getCell(`C${i}`).font = { size: 14, bold: true };
        sheet.mergeCells(`D${i}:J${i}`);
        const cell = sheet.getCell(`D${i}`);
        cell.border = { bottom: { style: 'thin' } };
        cell.alignment = center;
        cell.font = { size: i === 3 ? 12 : 14 };
      }
      
      // Fill in the data
      sheet.getCell('D2').value = reportData.material_code;
      sheet.getCell('D3').value = reportData.material_description;
      sheet.getCell('D4').value = reportData.supplier_name;
      sheet.getCell('D6').value = reportData.report_date;
      
      // Right side labels
      const rightLabels: Record<number, string> = {
        1: 'G.R.N. Number : ',
        3: 'Non-Conformance Report Ref No. : ',
        4: 'Delivery Note No. : ',
        5: 'Our Order No. : ',
        6: 'Completed By : ',
      };
      for (const [row, value] of Object.entries(rightLabels)) {
        sheet.getCell(`R${Number(row)}`).value = value;
        sheet.getCell(`R${Number(row)}`).font = { size: 14, bold: true };
        sheet.getCell(`R${Number(row)}`).alignment = right;
      }
      
      // GRN number
      sheet.mergeCells('S1:T1');
      const grnCell = sheet.getCell('S1');
      grnCell.value = reportData.grn_ref;
      grnCell.border = thickBorder;
      grnCell.alignment = center;
      grnCell.font = { size: 18, bold: true };
      
      // Pass/Fail boxes
      sheet.getCell('S2').border = thickBorder;
      sheet.getCell('S2').value = "PASS";
      sheet.getCell('T2').border = thickBorder;
      sheet.getCell('T2').value = "FAIL";
      sheet.getCell('S2').font = { size: 18, bold: true };
      sheet.getCell('T2').font = { size: 18, bold: true };
      sheet.getCell('S2').alignment = center;
      sheet.getCell('T2').alignment = center;
      
      // Table headers
      const headers = [
        ['Plt #', 2], ['Gross', 2], ['Tare', 2], ['Net', 2],
        ['Total Unit', 4], ['Product Code', 3], ['Package Qty', 3], ['QC Check', 3]
      ];
      let colIndex = 1;
      headers.forEach(([text, span]) => {
        const endCol = colIndex + span - 1;
        if (span > 1) {
          sheet.mergeCells(8, colIndex, 8, endCol);
        }
        const cell = sheet.getCell(8, colIndex);
        cell.value = text;
        cell.font = { size: 11, bold: true };
        cell.alignment = center;
        cell.fill = grayFill;
        cell.border = thinBorder;
        
        for (let c = colIndex; c <= endCol; c++) {
          sheet.getCell(8, c).border = thinBorder;
          sheet.getCell(8, c).fill = grayFill;
        }
        
        colIndex = endCol + 1;
      });
      
      // Data rows
      reportData.records.forEach((record, index) => {
        const row = 11 + index;
        sheet.getCell(row, 1).value = record.plt_num;
        sheet.getCell(row, 3).value = record.gross_weight;
        sheet.getCell(row, 5).value = record.gross_weight - record.net_weight;
        sheet.getCell(row, 7).value = record.net_weight;
        sheet.getCell(row, 9).value = record.units;
        sheet.getCell(row, 13).value = reportData.material_code;
        sheet.getCell(row, 16).value = record.package_count;
        
        // Apply borders
        for (let c = 1; c <= 20; c++) {
          sheet.getCell(row, c).border = thinBorder;
          sheet.getCell(row, c).alignment = center;
        }
      });
      
      // Footer summary
      const footer = [
        ['TOTAL GROSS WEIGHT', reportData.total_gross_weight],
        ['TOTAL NET WEIGHT', reportData.total_net_weight],
        ['TOTAL UNITS', reportData.total_units],
        ['TOTAL PALLETS', reportData.total_pallets],
      ];
      footer.forEach(([label, value], i) => {
        sheet.getCell(44 + i, 14).value = label;
        sheet.getCell(44 + i, 14).font = { size: 14, bold: true };
        sheet.getCell(44 + i, 14).alignment = right;
        
        sheet.mergeCells(44 + i, 17, 44 + i, 20);
        const valueCell = sheet.getCell(44 + i, 17);
        valueCell.value = value;
        valueCell.font = { size: 14, bold: true };
        valueCell.alignment = center;
        valueCell.border = { bottom: { style: 'thin' } };
      });
      
      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      
      // Return file
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="GRN_Report_${reference}_${allReports[0].materialCode}.xlsx"`
        }
      });
    } else {
      // Handle multiple material codes - for now just return the first one
      // In the actual UI, it would generate separate files for each
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      
      // Create a simple summary sheet
      const sheet = workbook.addWorksheet('GRN Summary');
      sheet.getCell('A1').value = 'Multiple Material Codes Found';
      sheet.getCell('A2').value = `GRN Reference: ${reference}`;
      sheet.getCell('A3').value = 'Material Codes:';
      
      allReports.forEach((report, index) => {
        sheet.getCell(`A${4 + index}`).value = `- ${report.materialCode}: ${report.data.material_desc || 'N/A'}`;
      });
      
      const buffer = await workbook.xlsx.writeBuffer();
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="GRN_Report_${reference}_Summary.xlsx"`
        }
      });
    }
  } catch (error) {
    console.error('Error generating GRN report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate report' },
      { status: 500 }
    );
  }
}