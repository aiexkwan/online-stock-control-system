/**
 * Server-side Excel generation functions
 * These functions return buffers instead of triggering downloads
 */

import { format as formatDateFns } from 'date-fns';
import type {
  AcoProductData,
  GrnReportPageData,
  TransactionReportData,
} from '@/app/actions/DownloadCentre-Actions';

// Maximum number of product blocks for ACO report
const MAX_PRODUCT_BLOCKS = 4;

/**
 * Generate ACO Report Excel as buffer
 */
export async function exportAcoReportBuffer(
  reportData: AcoProductData[],
  orderRef: string
): Promise<Buffer> {
  if (!reportData || reportData.length === 0) {
    throw new Error('No data provided to generate the report.');
  }
  if (!orderRef) {
    throw new Error('Order Reference is missing for the report header.');
  }

  // Dynamic import ExcelJS
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('ACO Report');

  // === PAGE SETUP ===
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

  // === STYLED TITLE ===
  sheet.mergeCells('E1:L2');
  sheet.getRow(1).height = 25;
  sheet.getRow(2).height = 25;
  sheet.getRow(4).height = 25;
  sheet.getRow(5).height = 20;
  const titleCell = sheet.getCell('E1');
  titleCell.value = 'ACO Record';
  titleCell.font = { size: 48, bold: true, name: 'Arial', underline: true };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // === Merge cells for product blocks ===
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
      console.warn(`Could not merge cells for range ${range}:`, e);
    }
  });

  // === Order Ref & Report Date ===
  const m1Cell = sheet.getCell('P1');
  m1Cell.value = `ACO Order Ref. : ${orderRef}`;
  m1Cell.font = { size: 16, bold: true };
  m1Cell.alignment = { vertical: 'middle', horizontal: 'center' };

  const m2Cell = sheet.getCell('P2');
  const formattedDate = formatDateFns(new Date(), 'dd-MMM-yyyy').toUpperCase();
  m2Cell.value = `Print Date : ${formattedDate}`;
  m2Cell.font = { size: 16, bold: true };
  m2Cell.alignment = { vertical: 'middle', horizontal: 'center' };

  // === Column Widths ===
  const colWidthsConfig = [1.75, 15.15, 8.15, 15.75];
  for (let i = 0; i < MAX_PRODUCT_BLOCKS; i++) {
    sheet.getColumn(i * 4 + 1).width = colWidthsConfig[0];
    sheet.getColumn(i * 4 + 2).width = colWidthsConfig[1];
    sheet.getColumn(i * 4 + 3).width = colWidthsConfig[2];
    sheet.getColumn(i * 4 + 4).width = colWidthsConfig[3];
  }

  // === Header Row (Row 6) ===
  for (let i = 0; i < MAX_PRODUCT_BLOCKS; i++) {
    const baseCol = i * 4 + 1;
    sheet.getCell(6, baseCol + 1).value = 'Pallet No.';
    sheet.getCell(6, baseCol + 2).value = 'Qty';
    sheet.getCell(6, baseCol + 3).value = 'QC Date';

    for (let j = 1; j < 4; j++) {
      const headerCell = sheet.getCell(6, baseCol + j);
      headerCell.font = { size: 16 };
      headerCell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  }

  // === Apply borders and populate data ===
  const maxDataRows = 40;
  for (let r = 4; r <= maxDataRows; r++) {
    for (let c = 1; c <= MAX_PRODUCT_BLOCKS * 4; c++) {
      const cell = sheet.getCell(r, c);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      if (r >= 7) {
        cell.font = { size: 14 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    }
  }

  // === Populate Product Data ===
  const productGroups = reportData.reduce(
    (acc, item) => {
      if (!acc[item.product_code]) acc[item.product_code] = [];
      acc[item.product_code].push(item);
      return acc;
    },
    {} as Record<string, AcoProductData[]>
  );

  const productCodes = Object.keys(productGroups).slice(0, MAX_PRODUCT_BLOCKS);

  productCodes.forEach((productCode, blockIndex) => {
    const baseCol = blockIndex * 4 + 1;
    const items = productGroups[productCode];

    // Product Code Header
    const headerCell = sheet.getCell(4, baseCol);
    headerCell.value = productCode;
    headerCell.font = { size: 28, bold: true };
    headerCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Required Qty
    const qtyCell = sheet.getCell(5, baseCol);
    const totalRequiredQty = items.reduce((sum, item) => sum + (item.required_qty || 0), 0);
    qtyCell.value = `Required Qty : ${totalRequiredQty}`;
    qtyCell.font = { size: 14, bold: true };
    qtyCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Data Rows
    items.forEach((item, idx) => {
      const dataRow = 7 + idx;
      if (dataRow > maxDataRows) return;

      sheet.getCell(dataRow, baseCol).value = idx + 1;
      sheet.getCell(dataRow, baseCol + 1).value = (item.pallets && item.pallets[0]?.plt_num) || '';
      sheet.getCell(dataRow, baseCol + 2).value =
        (item.pallets && item.pallets[0]?.product_qty) || 0;
      sheet.getCell(dataRow, baseCol + 3).value =
        (item.pallets && item.pallets[0]?.generate_time) || '';
    });
  });

  // Return buffer instead of saving file
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Generate GRN Report Excel with multiple sheets as buffer
 */
export async function exportGrnReportMultiSheetBuffer(
  allReportsData: GrnReportPageData[],
  _grnRef: string
): Promise<Buffer> {
  if (!allReportsData || allReportsData.length === 0) {
    throw new Error('No data to export');
  }

  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();

  // Create a sheet for each material code
  for (const reportData of allReportsData) {
    const sheetName = reportData.material_code || 'Sheet';
    const sheet = workbook.addWorksheet(sheetName.substring(0, 31)); // Excel sheet name limit

    // Set column widths
    sheet.getColumn(1).width = 12;
    sheet.getColumn(2).width = 35;
    sheet.getColumn(3).width = 12;
    sheet.getColumn(4).width = 12;
    sheet.getColumn(5).width = 12;
    sheet.getColumn(6).width = 15;
    sheet.getColumn(7).width = 15;

    // Header
    sheet.addRow(['GRN Report']);
    sheet.getCell('A1').font = { size: 16, bold: true };
    sheet.mergeCells('A1:G1');

    // Report Info
    sheet.addRow(['GRN Ref:', reportData.grn_ref || '']);
    sheet.addRow(['Material Code:', reportData.material_code || '']);
    sheet.addRow(['Supplier:', reportData.supplier_name || '']);
    sheet.addRow([]);

    // Table Headers
    const headerRow = sheet.addRow([
      'Date',
      'Description',
      'Gross',
      'Net',
      'Count',
      'Pallet',
      'Package',
    ]);
    headerRow.font = { bold: true };
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Data Rows
    reportData.records.forEach(record => {
      const row = sheet.addRow([
        reportData.report_date,
        reportData.material_description,
        record.gross_weight,
        record.net_weight,
        record.pallet_count,
        record.pallet,
        record.package_type,
      ]);
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Totals
    sheet.addRow([]);
    const totalsRow = sheet.addRow([
      'Totals:',
      '',
      reportData.total_gross_weight,
      reportData.total_net_weight,
      reportData.records.reduce((sum, r) => sum + (r.pallet_count || 0), 0),
      '',
      '',
    ]);
    totalsRow.font = { bold: true };
    totalsRow.eachCell((cell, colNumber) => {
      if (colNumber >= 3) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFE0' },
        };
      }
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Generate Transaction Report Excel as buffer
 */
export async function buildTransactionReportBuffer(data: TransactionReportData): Promise<Buffer> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Transaction Report');

  // Set column widths
  sheet.getColumn(1).width = 15;
  sheet.getColumn(2).width = 15;
  sheet.getColumn(3).width = 15;
  sheet.getColumn(4).width = 10;
  sheet.getColumn(5).width = 15;
  sheet.getColumn(6).width = 15;
  sheet.getColumn(7).width = 20;

  // Title
  sheet.addRow(['Transaction Report']);
  sheet.getCell('A1').font = { size: 16, bold: true };
  sheet.mergeCells('A1:G1');

  // Date Range
  sheet.addRow(['Date Range:', `${data.date_range.start_date} to ${data.date_range.end_date}`]);
  sheet.addRow([]);

  // Summary Section
  sheet.addRow(['Summary']);
  sheet.getCell('A4').font = { size: 14, bold: true };
  sheet.addRow(['Total Transfers:', data.total_transfers]);
  sheet.addRow(['Total Pallets:', data.total_pallets]);
  sheet.addRow([]);

  // Location Summary
  sheet.addRow(['Location Summary']);
  sheet.getCell('A8').font = { size: 14, bold: true };

  const summaryHeaderRow = sheet.addRow([
    'Location',
    'Transfers In',
    'Transfers Out',
    'Net Change',
  ]);
  summaryHeaderRow.font = { bold: true };
  summaryHeaderRow.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
  });

  Object.entries(data.summary).forEach(([location, stats]) => {
    sheet.addRow([location, stats.transfers_in, stats.transfers_out, stats.net_change]);
  });

  sheet.addRow([]);
  sheet.addRow([]);

  // Transfer Details
  sheet.addRow(['Transfer Details']);
  const detailsTitleCell = sheet.getCell(`A${sheet.rowCount}`);
  detailsTitleCell.font = { size: 14, bold: true };

  const headerRow = sheet.addRow(['Date', 'Pallet', 'Product', 'Qty', 'From', 'To', 'Operator']);
  headerRow.font = { bold: true };
  headerRow.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // Data rows
  data.transfers.forEach(transfer => {
    const row = sheet.addRow([
      transfer.transfer_date,
      transfer.pallet_number,
      transfer.product_code,
      transfer.quantity,
      transfer.from_location,
      transfer.to_location,
      transfer.operatorname,
    ]);
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
