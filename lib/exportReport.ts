import { saveAs } from 'file-saver';
import { format as formatDateFns } from 'date-fns'; // 重新命名以避免與可能的內部 format 衝突
import { toast } from 'sonner';
// import { DatabaseRecord } from '@/types/database/tables'; // Unused
import {
  AcoProductData,
  GrnReportPageData,
  TransactionReportData,
} from '../app/actions/DownloadCentre-Actions';

// 最大處理的產品代碼數量 (對應 A-D, E-H, I-L, M-P 四個區塊)
const MAX_PRODUCT_BLOCKS = 4;

// Helper function to convert column letter to number (A=1, B=2, ...)
// This function is currently unused but kept for potential future use
// function columnLetterToNumber(letter: string): number {
//   let column = 0;
//   const length = letter.length;
//   for (let i = 0; i < length; i++) {
//     column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
//   }
//   return column;
// }

export async function exportAcoReport(reportData: AcoProductData[], orderRef: string) {
  if (!reportData || reportData.length === 0) {
    alert('No data provided to generate the report.');
    console.warn('exportAcoReport called with no data.');
    return;
  }
  if (!orderRef) {
    alert('Order Reference is missing for the report header.');
    console.warn('exportAcoReport called without orderRef.');
    return;
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
    horizontalCentered: false, // 根據原設定
    verticalCentered: false, // 根據原設定
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

  // === Merge A4:P4, A5:D5... === (這些是產品代碼標題行和其下方可能的分隔行)
  // 這部分可能需要根據實際資料動態調整，或者如果只是固定樣式則保留
  // 您的描述是產品代碼在 A4, E4, I4, M4
  // 所以 A4:D4 合併似乎不對，應該是單獨的 A4, E4 等
  // 這部分先註解，根據數據填充邏輯來處理
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
      // 如果合併失敗，可以選擇忽略或記錄，以避免整個報表生成失敗
    }
  });

  //=== Order Ref. Report Date ===
  const m1Cell = sheet.getCell('P1');
  m1Cell.value = `ACO Order Ref. : ${orderRef}`;
  m1Cell.font = { size: 16, bold: true };
  m1Cell.alignment = { vertical: 'middle', horizontal: 'center' };

  const m2Cell = sheet.getCell('P2');
  const today = new Date();
  // 使用 toLocaleDateString 獲得類似 '23-Jul-2024' 的格式，但月份名稱取決於地區設定
  // 或者使用 date-fns 進行精確格式化
  const formattedDate = formatDateFns(today, 'dd-MMM-yyyy').toUpperCase(); // DD-MMM-YYYY, e.g., 23-JUL-2024
  m2Cell.value = `Print Date : ${formattedDate}`;
  m2Cell.font = { size: 16, bold: true };
  m2Cell.alignment = { vertical: 'middle', horizontal: 'center' };

  // === Column Widths ===
  const colWidthsConfig = [1.75, 15.15, 8.15, 15.75]; // 每個產品區塊內4欄的寬度
  for (let i = 0; i < MAX_PRODUCT_BLOCKS; i++) {
    sheet.getColumn(i * 4 + 1).width = colWidthsConfig[0]; // Product Code / Index/Spacer
    sheet.getColumn(i * 4 + 2).width = colWidthsConfig[1]; // Pallet No.
    sheet.getColumn(i * 4 + 3).width = colWidthsConfig[2]; // Qty
    sheet.getColumn(i * 4 + 4).width = colWidthsConfig[3]; // QC Date
  }

  // === Header Row (Row 6) ===
  for (let i = 0; i < MAX_PRODUCT_BLOCKS; i++) {
    const baseCol = i * 4 + 1; // A=1, E=5, I=9, M=13

    // 移除衝突的合併儲存格操作
    // sheet.mergeCells(6, baseCol + 1, 6, baseCol + 2); // 之前嘗試合併 Pallet No. 的兩欄
    // sheet.mergeCells(6, baseCol + 1, 6, baseCol + 1); // 之前嘗試合併單個 Pallet No. 儲存格 (多餘)

    // 設定表頭文字
    // 產品代碼欄的表頭 (可選，如果A6, E6等需要文字)
    // sheet.getCell(6, baseCol).value = "Product Code";
    // sheet.getCell(6, baseCol).font = { size: 16, bold: true };
    // sheet.getCell(6, baseCol).alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.getCell(6, baseCol + 1).value = 'Pallet No.'; // B, F, J, N 欄
    sheet.getCell(6, baseCol + 2).value = 'Qty'; // C, G, K, O 欄
    sheet.getCell(6, baseCol + 3).value = 'QC Date'; // D, H, L, P 欄

    // 格式化表頭 (Pallet No., Qty, QC Date)
    for (let j = 1; j < 4; j++) {
      // j=1 (Pallet No.), j=2 (Qty), j=3 (QC Date)
      const headerCell = sheet.getCell(6, baseCol + j);
      headerCell.font = { size: 16 };
      headerCell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  }
  // === Apply borders from A4:P40 and data font/alignment ===
  const maxDataRows = 40;
  for (let r = 4; r <= maxDataRows; r++) {
    for (let c = 1; c <= MAX_PRODUCT_BLOCKS * 4; c++) {
      const cell = sheet.getCell(r, c);
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
      if (r >= 7) {
        cell.font = { size: 16 };
        cell.alignment = { vertical: 'middle' as const, horizontal: 'center' as const };
      }
    }
  }

  // === Fill Data ===
  reportData.slice(0, MAX_PRODUCT_BLOCKS).forEach((productData, blockIndex) => {
    const baseCol = blockIndex * 4 + 1;
    const productCodeCell = sheet.getCell(4, baseCol);
    productCodeCell.value = productData.product_code;
    productCodeCell.font = { size: 16, bold: true };
    productCodeCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // 新增：在第5行添加 required_qty
    const requiredQtyCell = sheet.getCell(5, baseCol);
    requiredQtyCell.value =
      productData.required_qty !== null
        ? `Required Qty: ${productData.required_qty}`
        : 'Required Qty: N/A';
    requiredQtyCell.font = { size: 12, bold: true, color: { argb: 'FF0066CC' } }; // 藍色字體
    requiredQtyCell.alignment = { vertical: 'middle', horizontal: 'center' };

    productData.pallets.forEach((pallet, palletIndex) => {
      const currentRow = 7 + palletIndex;
      if (currentRow > maxDataRows) {
        console.warn(`Data for product ${productData.product_code} exceeds max display rows.`);
        return;
      }
      sheet.getCell(currentRow, baseCol + 0).value = palletIndex + 1;
      sheet.getCell(currentRow, baseCol + 0).font = { size: 9 };
      sheet.getCell(currentRow, baseCol + 1).value = pallet.plt_num;
      sheet.getCell(currentRow, baseCol + 2).value = pallet.product_qty;
      sheet.getCell(currentRow, baseCol + 3).value = pallet.generate_time;
    });
  });

  // 移除原本的佔位資料填寫邏輯
  // for (let row = 7; row <= 40; row++) { ... }
  // 移除原本的 placeholder data re-apply font 邏輯
  // for (let row = 7; row <= 40; row++) { ... }

  // === Download as Excel ===
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  saveAs(blob, `ACO_${orderRef}_Report.xlsx`);
}

export async function exportGrnReport(data: GrnReportPageData) {
  if (!data) {
    toast.error('No data provided for GRN report generation.');
    console.error('exportGrnReport called without data.');
    return;
  }

  // Dynamic import ExcelJS
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('GRN Report');

  // Define styles
  const center = {
    horizontal: 'center' as const,
    vertical: 'middle' as const,
    wrapText: true,
  };
  const right = { horizontal: 'right' as const, vertical: 'middle' as const };
  // Strategy 2: DTO/自定義 type interface - 修復 ExcelJS Fill 類型定義
  const grayFill = {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FFDCDCDC' },
  };
  const thinBorder = {
    top: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
    left: { style: 'thin' as const },
    right: { style: 'thin' as const },
  };
  const thickBorder = {
    top: { style: 'thick' as const },
    bottom: { style: 'thick' as const },
    left: { style: 'thick' as const },
    right: { style: 'thick' as const },
  };

  // === Row heights
  const rowHeights: Record<number, number> = {
    ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i + 1, 24])),
    8: 14.25,
    9: 29.25,
    10: 14.25,
    ...Object.fromEntries(Array.from({ length: 32 }, (_, i) => [11 + i, 24])),
    43: 15,
    44: 20.25,
    45: 20.25,
    46: 20.25,
    47: 20.25,
    48: 39.75,
  };
  Object.entries(rowHeights).forEach(([row, height]) => {
    sheet.getRow(Number(row)).height = height;
  });

  // === Column widths A to T
  const colWidths = [
    5.25,
    9.75,
    9.1,
    7,
    7,
    7,
    7,
    7, // A-H
    8,
    6.15,
    6.15,
    8, // I-L
    5,
    7,
    5, // M-O
    5.5,
    5.5, // P-Q
    8.25,
    9.5,
    9.5, // R-T
  ];
  colWidths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });

  // === Merge blocks
  sheet.mergeCells('A44:E44');
  sheet.getCell('A44').value = 'Action For Material On Hold :';
  sheet.getCell('A44').font = { size: 14, bold: true, underline: 'double' };
  sheet.getCell('A44').alignment = center;

  sheet.mergeCells('A45:I48');
  sheet.getCell('A45').font = { size: 18, bold: true };
  sheet.getCell('A45').alignment = center;

  for (let i = 2; i <= 6; i++) {
    sheet.getCell(`C${i}`).value = [
      'Code : ',
      'Description : ',
      'Supplier Name : ',
      'Our Order No. : ',
      'Date : ',
    ][i - 2];
    sheet.getCell(`C${i}`).alignment = right;
    sheet.getCell(`C${i}`).font = { size: 14, bold: true };
    sheet.mergeCells(`D${i}:J${i}`);
    const cell = sheet.getCell(`D${i}`);
    cell.border = { bottom: { style: 'thin' as const } };
    cell.alignment = center;
    cell.font = { size: i === 3 ? 12 : 14 };
  }

  for (let i = 4; i <= 6; i++) {
    sheet.mergeCells(`S${i}:T${i}`);
    const cell = sheet.getCell(`S${i}`);
    cell.border = { bottom: { style: 'thin' as const } };
    cell.alignment = center;
    cell.font = { size: 16 };
  }
  // === Right side labels R1–R6
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

  // === Merge + border for S1:T1, S3:T3
  ['S1:T1', 'S3:T3'].forEach(range => {
    sheet.mergeCells(range);
    const cell = sheet.getCell(range.split(':')[0]);
    cell.border = thickBorder;
    cell.alignment = center;
    cell.font = { size: 18, bold: true };
  });
  // S2 border (not merged in the provided code, but usually part of a 3-row box)
  sheet.getCell('S2').border = thickBorder;
  sheet.getCell('S2').value = 'PASS';
  sheet.getCell('T2').border = thickBorder;
  sheet.getCell('T2').value = 'FAIL';
  sheet.getCell('S2').font = { size: 18, bold: true };
  sheet.getCell('T2').font = { size: 18, bold: true };
  sheet.getCell('S2').alignment = center;
  sheet.getCell('T2').alignment = center;

  // === Footer summary rows N44:T48
  const footer = [
    'Total Material Delivered',
    'Total Material On Hold',
    'Total Material Accepted',
    'Total Material To Be Sent Back',
    'Signed Off All Complete And Booked In',
  ];
  footer.forEach((label, i) => {
    const row = 44 + i;
    sheet.mergeCells(`L${row}:R${row}`);
    sheet.mergeCells(`S${row}:T${row}`);
    const cell = sheet.getCell(`L${row}`);
    cell.value = label;
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'right' as const, vertical: 'middle' as const };
    for (let c = 14; c <= 20; c++) {
      sheet.getCell(row, c).border = thickBorder;
    }
  });

  // === Merge S11:T42
  for (let row = 11; row <= 42; row++) {
    sheet.mergeCells(`S${row}:T${row}`);
  }

  // === Gray fill
  const grayCols = [1, 3, 9, 10, 11, 12, 16, 17, 19]; // A, C, I, P, S (column numbers)
  for (let row = 11; row <= 42; row++) {
    grayCols.forEach(col => {
      const cell = sheet.getCell(row, col);
      cell.fill = grayFill;
    });
  }

  // === Borders + Alignment A9:T42 (This might override previous specific borders/alignments)
  // Consider applying this more selectively or before specific cell styling if overlap is an issue.
  for (let row = 10; row <= 42; row++) {
    for (let col = 1; col <= 20; col++) {
      const cell = sheet.getCell(row, col);
      // Apply thin border if not already thick (e.g. S1:T3 box)
      if (!cell.border || JSON.stringify(cell.border) !== JSON.stringify(thickBorder)) {
        // Check individual border sides if necessary for more complex scenarios
        let applyThin = true;
        if (cell.border) {
          const currentBorder = cell.border as Record<string, Record<string, unknown>>;
          if (
            currentBorder.top?.style === 'thick' &&
            currentBorder.bottom?.style === 'thick' &&
            currentBorder.left?.style === 'thick' &&
            currentBorder.right?.style === 'thick'
          ) {
            applyThin = false;
          }
        }
        if (applyThin) cell.border = thinBorder;
      }
      cell.alignment = center; // This will center align all cells in A9:T42
      cell.font = { size: 12 }; // This sets font size for all cells in A9:T42
    }
  }

  // Pallet sub-labels from previous version (D9:M10 area)
  // This part was in your previous exportGrnReport but not in the new provided code.
  // Assuming it's still needed for GRN Report.
  const arrPalletLabels = [
    'White Dry',
    'White Wet',
    'Chep Dry',
    'Chep Wet',
    'Euro Pallet',
    'Stillage',
    'Bag',
    'Tote Bag',
    'Octobin',
    'Sunk',
  ];
  const arrPalletWeights = [
    '14kg',
    '18kg',
    '26kg',
    '30kg',
    '22kg',
    '50kg',
    '0kg',
    '6kg',
    '14kg',
    '%',
  ];
  for (let i = 0; i < arrPalletLabels.length; i++) {
    const cellLabel = sheet.getCell(9, 4 + i);
    cellLabel.value = arrPalletLabels[i];
    cellLabel.alignment = center; // Ensure these are centered as per A9:T42 rule
    cellLabel.font = { size: 10 }; // Ensure font size is 12 as per A9:T42 rule
    cellLabel.border = thinBorder;
    // Borders should be handled by the A9:T42 loop

    const cellWeight = sheet.getCell(10, 4 + i);
    cellWeight.value = arrPalletWeights[i];
    cellWeight.alignment = center;
    cellWeight.fill = grayFill;
    cellWeight.font = { size: 10, bold: true, italic: true };
  }

  // Group Headers for Pallets, Packaging, Water Tests, Trial (D8:Q8)
  // This also was in the previous GRN report, assuming still needed.
  const groupHeaders: Record<string, string> = {
    'D8:H8': 'Pallets',
    'I8:L8': 'Packaging',
    'M8:O8': 'Water Tests',
    'P8:Q8': 'Trial',
  };
  Object.entries(groupHeaders).forEach(([range, title]) => {
    sheet.mergeCells(range);
    const cell = sheet.getCell(range.split(':')[0]);
    cell.value = title;
    cell.font = { bold: true, size: 10 }; // Original font size was 10, bold
    cell.alignment = center;
    cell.fill = grayFill;
    cell.border = thinBorder; // Apply thin border, consistent with A9:T42 loop for row 8 if it were included
  });

  const group2Headers: Record<string, string> = {
    'N9:O9': 'per 100g Tested',
    'P9:Q9': 'Production Trial',
    'S10:T10': 'Comments',
  };

  Object.entries(group2Headers).forEach(([range, title]) => {
    sheet.mergeCells(range);
    const cell = sheet.getCell(range.split(':')[0]);
    cell.value = title;
    cell.font = { size: 10 }; // Original font size was 10, bold
    cell.alignment = center;
    cell.border = thinBorder;
    if (title === 'Comments') {
      cell.fill = grayFill;
      cell.font = { bold: true, italic: true };
    }
  });

  const group3Headers: Record<string, string> = {
    N10: 'Pass',
    O10: 'Fail',
    P10: 'Pass',
    Q10: 'Fail',
    R10: 'On Hold',
  };

  Object.entries(group3Headers).forEach(([range, title]) => {
    const cell = sheet.getCell(range.split(':')[0]);
    cell.value = title;
    cell.font = { bold: true, size: 10, italic: true }; // Original font size was 10, bold
    cell.alignment = center;
    cell.fill = grayFill;
    cell.border = thinBorder; // Apply thin border, consistent with A9:T42 loop for row 8 if it were included
  });

  const group4Headers: Record<string, string> = {
    'A9:A10': 'PLT Ct.',
    'B9:B10': 'Gross Weight',
    'C9:C10': 'Net Weight',
  };

  Object.entries(group4Headers).forEach(([range, title]) => {
    sheet.mergeCells(range);
    const cell = sheet.getCell(range.split(':')[0]);
    cell.value = title;
    cell.font = { bold: true, size: 11 }; // Original font size was 10, bold
    cell.alignment = center;
    cell.border = thinBorder; // Apply thin border, consistent with A9:T42 loop for row 8 if it were included
  });
  // === Page setup (applied again, ensure consistency or remove duplication if settings are identical)
  sheet.pageSetup = {
    paperSize: 9, // A4
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0, // Allow multiple pages vertically if content exceeds one page
    orientation: 'portrait',
    margins: {
      // Added margins here as they were separate in the provided code
      left: 0.2,
      right: 0.2,
      top: 0.4,
      bottom: 0.2,
      header: 0.3,
      footer: 0.3,
    },
  };
  // sheet.pageMargins was used in new code, but ExcelJS uses pageSetup.margins.
  // The line below might be redundant if printArea is not strictly needed or handled by fitToPage.
  // sheet.printArea = 'A1:T49'; // Setting print area
  // Sheet Font
  sheet.eachRow(row => {
    row.eachCell(cell => {
      const originalFont = cell.font || {};
      cell.font = {
        ...originalFont,
        name: 'Aptos Narrow',
      };
    });
  });
  // ---- START DATA FILLING ----
  sheet.getCell('S1').value = data.grn_ref;
  sheet.getCell('S6').value = data.user_id; // User ID
  sheet.getCell('D2').value = data.material_code;
  sheet.getCell('D3').value = data.material_description;
  sheet.getCell('D4').value = data.supplier_name;
  sheet.getCell('D6').value = data.report_date; // Already formatted dd-MMM-yyyy

  // --- Data filling section ---
  let currentRowNum = 11; // Starting row for GRN records
  console.log('[exportGrnReport] Data received for records (first 5):', data.records.slice(0, 5)); // Log first 5 records

  data.records.forEach((record, index) => {
    if (currentRowNum > 42) {
      // Limit to row 42 as per template
      console.warn(`Data for record ${index} exceeds max display rows.`);
      return;
    }
    const row = sheet.getRow(currentRowNum);
    row.getCell('A').value = index + 1;
    row.getCell('B').value = record.gross_weight;
    row.getCell('C').value = record.net_weight;

    // Columns H-L: Pallet Numbers (P1 to P5) - 這是根據 record.pallet (棧板號) 和 record.package_type 來填寫的
    const palletCol = getPalletColumn(record.pallet);
    if (palletCol) {
      row.getCell(palletCol).value = record.pallet_count;
    }

    // Columns M-Q: Package Counts (C1 to C5) - 這是根據 record.package_type 和 record.package_count 來填寫的
    const packageColumn = getPackageColumn(record.package_type);
    console.log(
      `[exportGrnReport] Record ${index}, package_type: ${record.package_type}, package_count: ${record.package_count}, mapped packageColumn: ${packageColumn}`
    );
    if (packageColumn && record.package_count !== null && record.package_count !== undefined) {
      row.getCell(packageColumn).value = record.package_count;
    }

    currentRowNum++;
  });

  // Totals in A45
  const totalsText = `Total Gross Weight >> ${data.total_gross_weight}
Total NetWeight >> ${data.total_net_weight}
Difference >> ${data.weight_difference}`;
  sheet.getCell('A45').value = totalsText;
  sheet.getCell('A45').alignment = {
    ...center,
    horizontal: 'left',
    vertical: 'top',
    wrapText: true,
  }; // Align left, top, wrap
  // Ensure A45 merged area (A45:K48) has appropriate font/styling if needed
  sheet.getCell('A45').font = { size: 20, bold: false }; // Example: Reset font from previous bold

  // ---- END DATA FILLING ----

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  // Filename format: GRN_Report_{grn_ref}.xlsx
  saveAs(blob, `GRN_Report_${data.grn_ref}.xlsx`);
}

// Helper function to determine column for pallet type
function getPalletColumn(palletType: string | null): string | null {
  if (!palletType) return null;
  const type = palletType.trim().toLowerCase().replace(/\s+/g, ''); // Normalize to lowercase and remove spaces
  switch (type) {
    case 'whitedry':
      return 'D';
    case 'whitewet':
      return 'E';
    case 'chepdry':
      return 'F';
    case 'chepwet':
      return 'G';
    case 'euro':
      return 'H';
    // case 'notincludedpallet': return null; // This case can be removed as default handles unmapped types
    default:
      // Optionally log unmapped pallet types for debugging
      console.warn(
        `[getPalletColumn] Unmapped palletType: '${palletType}' (normalized: '${type}'). No column assigned.`
      );
      return null;
  }
}

// Helper function to determine which column (I-L) to put the package count based on package type
function getPackageColumn(packageType: string | null): string | null {
  if (!packageType) return null;
  const type = packageType.trim().toLowerCase(); // Normalize to lowercase and trim whitespace

  if (type.includes('still')) return 'I'; // Stillage
  if (type.includes('bag')) return 'J'; // Bag
  if (type.includes('tote')) return 'K'; // Tote Bag
  if (type.includes('octo')) return 'L'; // Octobin

  // If no match, log a warning and return null so no count is placed in an incorrect column
  console.warn(
    `[getPackageColumn] Unmapped packageType: '${packageType}' (normalized: '${type}'). No column assigned.`
  );
  return null;
}

// Sheet Font
// ... existing code ...

export async function exportGrnReportMultiSheet(reportsData: GrnReportPageData[], grnRef: string) {
  if (!reportsData || reportsData.length === 0) {
    toast.error('No data provided for GRN report generation.');
    console.error('exportGrnReportMultiSheet called without data.');
    return;
  }

  // Dynamic import ExcelJS
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();

  // Create a sheet for each material code
  for (const data of reportsData) {
    // Use material code as sheet name (Excel limits sheet names to 31 characters)
    const sheetName =
      data.material_code.length > 31 ? data.material_code.substring(0, 31) : data.material_code;

    const sheet = workbook.addWorksheet(sheetName);

    // Apply the same formatting as exportGrnReport
    // Define styles
    const center = {
      horizontal: 'center' as const,
      vertical: 'middle' as const,
      wrapText: true,
    };
    const right = { horizontal: 'right' as const, vertical: 'middle' as const };
    const grayFill = {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FFDCDCDC' },
    };
    const thinBorder = {
      top: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      left: { style: 'thin' as const },
      right: { style: 'thin' as const },
    };
    const thickBorder = {
      top: { style: 'thick' as const },
      bottom: { style: 'thick' as const },
      left: { style: 'thick' as const },
      right: { style: 'thick' as const },
    };

    // === Row heights
    const rowHeights: Record<number, number> = {
      ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i + 1, 24])),
      8: 14.25,
      9: 29.25,
      10: 14.25,
      ...Object.fromEntries(Array.from({ length: 32 }, (_, i) => [11 + i, 24])),
      43: 15,
      44: 20.25,
      45: 20.25,
      46: 20.25,
      47: 20.25,
      48: 39.75,
    };
    Object.entries(rowHeights).forEach(([row, height]) => {
      sheet.getRow(Number(row)).height = height;
    });

    // === Column widths A to T
    const colWidths = [
      5.25,
      9.75,
      9.1,
      7,
      7,
      7,
      7,
      7, // A-H
      8,
      6.15,
      6.15,
      8, // I-L
      5,
      7,
      5, // M-O
      5.5,
      5.5, // P-Q
      8.25,
      9.5,
      9.5, // R-T
    ];
    colWidths.forEach((w, i) => {
      sheet.getColumn(i + 1).width = w;
    });

    // === Merge blocks
    sheet.mergeCells('A44:E44');
    sheet.getCell('A44').value = 'Action For Material On Hold :';
    sheet.getCell('A44').font = { size: 14, bold: true, underline: 'double' };
    sheet.getCell('A44').alignment = center;

    sheet.mergeCells('A45:I48');
    sheet.getCell('A45').font = { size: 18, bold: true };
    sheet.getCell('A45').alignment = center;

    for (let i = 2; i <= 6; i++) {
      sheet.getCell(`C${i}`).value = [
        'Code : ',
        'Description : ',
        'Supplier Name : ',
        'Our Order No. : ',
        'Date : ',
      ][i - 2];
      sheet.getCell(`C${i}`).alignment = right;
      sheet.getCell(`C${i}`).font = { size: 14, bold: true };
      sheet.mergeCells(`D${i}:J${i}`);
      const cell = sheet.getCell(`D${i}`);
      cell.border = { bottom: { style: 'thin' as const } };
      cell.alignment = center;
      cell.font = { size: i === 3 ? 12 : 14 };
    }

    for (let i = 4; i <= 6; i++) {
      sheet.mergeCells(`S${i}:T${i}`);
      const cell = sheet.getCell(`S${i}`);
      cell.border = { bottom: { style: 'thin' as const } };
      cell.alignment = center;
      cell.font = { size: 16 };
    }

    // === Right side labels R1–R6
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

    // === Merge + border for S1:T1, S3:T3
    ['S1:T1', 'S3:T3'].forEach(range => {
      sheet.mergeCells(range);
      const cell = sheet.getCell(range.split(':')[0]);
      cell.border = thickBorder;
      cell.alignment = center;
      cell.font = { size: 18, bold: true };
    });

    // S2 border
    sheet.getCell('S2').border = thickBorder;
    sheet.getCell('S2').value = 'PASS';
    sheet.getCell('T2').border = thickBorder;
    sheet.getCell('T2').value = 'FAIL';
    sheet.getCell('S2').font = { size: 18, bold: true };
    sheet.getCell('T2').font = { size: 18, bold: true };
    sheet.getCell('S2').alignment = center;
    sheet.getCell('T2').alignment = center;

    // === Footer summary rows N44:T48
    const footer = [
      'Total Material Delivered',
      'Total Material On Hold',
      'Total Material Accepted',
      'Total Material To Be Sent Back',
      'Signed Off All Complete And Booked In',
    ];
    footer.forEach((label, i) => {
      const row = 44 + i;
      sheet.mergeCells(`L${row}:R${row}`);
      sheet.mergeCells(`S${row}:T${row}`);
      const cell = sheet.getCell(`L${row}`);
      cell.value = label;
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'right' as const, vertical: 'middle' as const };
      for (let c = 14; c <= 20; c++) {
        sheet.getCell(row, c).border = thickBorder;
      }
    });

    // === Merge S11:T42
    for (let row = 11; row <= 42; row++) {
      sheet.mergeCells(`S${row}:T${row}`);
    }

    // === Gray fill
    const grayCols = [1, 3, 9, 10, 11, 12, 16, 17, 19]; // A, C, I, P, S (column numbers)
    for (let row = 11; row <= 42; row++) {
      grayCols.forEach(col => {
        const cell = sheet.getCell(row, col);
        cell.fill = grayFill;
      });
    }

    // === Borders + Alignment A9:T42
    for (let row = 10; row <= 42; row++) {
      for (let col = 1; col <= 20; col++) {
        const cell = sheet.getCell(row, col);
        let applyThin = true;
        if (cell.border) {
          const currentBorder = cell.border as Record<string, Record<string, unknown>>;
          if (
            currentBorder.top?.style === 'thick' &&
            currentBorder.bottom?.style === 'thick' &&
            currentBorder.left?.style === 'thick' &&
            currentBorder.right?.style === 'thick'
          ) {
            applyThin = false;
          }
        }
        if (applyThin) cell.border = thinBorder;
        cell.alignment = center;
        cell.font = { size: 12 };
      }
    }

    // Pallet sub-labels
    const arrPalletLabels = [
      'White Dry',
      'White Wet',
      'Chep Dry',
      'Chep Wet',
      'Euro Pallet',
      'Stillage',
      'Bag',
      'Tote Bag',
      'Octobin',
      'Sunk',
    ];
    const arrPalletWeights = [
      '14kg',
      '18kg',
      '26kg',
      '30kg',
      '22kg',
      '50kg',
      '0kg',
      '6kg',
      '14kg',
      '%',
    ];
    for (let i = 0; i < arrPalletLabels.length; i++) {
      const cellLabel = sheet.getCell(9, 4 + i);
      cellLabel.value = arrPalletLabels[i];
      cellLabel.alignment = center;
      cellLabel.font = { size: 10 };
      cellLabel.border = thinBorder;

      const cellWeight = sheet.getCell(10, 4 + i);
      cellWeight.value = arrPalletWeights[i];
      cellWeight.alignment = center;
      cellWeight.fill = grayFill;
      cellWeight.font = { size: 10, bold: true, italic: true };
    }

    // Group Headers
    const groupHeaders: Record<string, string> = {
      'D8:H8': 'Pallets',
      'I8:L8': 'Packaging',
      'M8:O8': 'Water Tests',
      'P8:Q8': 'Trial',
    };
    Object.entries(groupHeaders).forEach(([range, title]) => {
      sheet.mergeCells(range);
      const cell = sheet.getCell(range.split(':')[0]);
      cell.value = title;
      cell.font = { bold: true, size: 10 };
      cell.alignment = center;
      cell.fill = grayFill;
      cell.border = thinBorder;
    });

    const group2Headers: Record<string, string> = {
      'N9:O9': 'per 100g Tested',
      'P9:Q9': 'Production Trial',
      'S10:T10': 'Comments',
    };
    Object.entries(group2Headers).forEach(([range, title]) => {
      sheet.mergeCells(range);
      const cell = sheet.getCell(range.split(':')[0]);
      cell.value = title;
      cell.font = { size: 10 };
      cell.alignment = center;
      cell.border = thinBorder;
      if (title === 'Comments') {
        cell.fill = grayFill;
        cell.font = { bold: true, italic: true };
      }
    });

    const group3Headers: Record<string, string> = {
      N10: 'Pass',
      O10: 'Fail',
      P10: 'Pass',
      Q10: 'Fail',
      R10: 'On Hold',
    };
    Object.entries(group3Headers).forEach(([range, title]) => {
      const cell = sheet.getCell(range.split(':')[0]);
      cell.value = title;
      cell.font = { bold: true, size: 10, italic: true };
      cell.alignment = center;
      cell.fill = grayFill;
      cell.border = thinBorder;
    });

    const group4Headers: Record<string, string> = {
      'A9:A10': 'PLT Ct.',
      'B9:B10': 'Gross Weight',
      'C9:C10': 'Net Weight',
    };
    Object.entries(group4Headers).forEach(([range, title]) => {
      sheet.mergeCells(range);
      const cell = sheet.getCell(range.split(':')[0]);
      cell.value = title;
      cell.font = { bold: true, size: 11 };
      cell.alignment = center;
      cell.border = thinBorder;
    });

    // === Page setup
    sheet.pageSetup = {
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      orientation: 'portrait',
      margins: {
        left: 0.2,
        right: 0.2,
        top: 0.4,
        bottom: 0.2,
        header: 0.3,
        footer: 0.3,
      },
    };

    // Sheet Font
    sheet.eachRow(row => {
      row.eachCell(cell => {
        const originalFont = cell.font || {};
        cell.font = {
          ...originalFont,
          name: 'Aptos Narrow',
        };
      });
    });

    // ---- DATA FILLING ----
    sheet.getCell('S1').value = data.grn_ref;
    sheet.getCell('S6').value = data.user_id;
    sheet.getCell('D2').value = data.material_code;
    sheet.getCell('D3').value = data.material_description;
    sheet.getCell('D4').value = data.supplier_name;
    sheet.getCell('D6').value = data.report_date;

    // Data filling section
    let currentRowNum = 11;
    data.records.forEach((record, index) => {
      if (currentRowNum > 42) {
        console.warn(`Data for record ${index} exceeds max display rows.`);
        return;
      }
      const row = sheet.getRow(currentRowNum);
      row.getCell('A').value = index + 1;
      row.getCell('B').value = record.gross_weight;
      row.getCell('C').value = record.net_weight;

      // Pallet columns
      const palletCol = getPalletColumn(record.pallet);
      if (palletCol) {
        row.getCell(palletCol).value = record.pallet_count;
      }

      // Package columns
      const packageColumn = getPackageColumn(record.package_type);
      if (packageColumn && record.package_count !== null && record.package_count !== undefined) {
        row.getCell(packageColumn).value = record.package_count;
      }

      currentRowNum++;
    });

    // Totals in A45
    const totalsText = `Total Gross Weight >> ${data.total_gross_weight}
Total NetWeight >> ${data.total_net_weight}
Difference >> ${data.weight_difference}`;
    sheet.getCell('A45').value = totalsText;
    sheet.getCell('A45').alignment = {
      ...center,
      horizontal: 'left',
      vertical: 'top',
      wrapText: true,
    };
    sheet.getCell('A45').font = { size: 20, bold: false };
  }

  // Download the workbook
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `GRN_Report_${grnRef}.xlsx`);
}

export async function buildTransactionReport(reportData?: TransactionReportData): Promise<Buffer> {
  // Dynamic import ExcelJS
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Transaction Report');

  // A1:AH27 base format
  for (let row = 1; row <= 27; row++) {
    const excelRow = worksheet.getRow(row);
    excelRow.height = row <= 4 ? [14.25, 45, 26.25, 145][row - 1] : 30;

    for (let col = 1; col <= 34; col++) {
      const cell = excelRow.getCell(col);
      cell.font = { name: 'Arial', size: 16 };
      cell.alignment = { vertical: 'middle' as const, horizontal: 'center' as const };
    }
  }

  const colWidths = [
    3.4, 3.15, 0.6, 3.15, 0.6, 3.15, 0.6, 3.15, 0.6, 3.15, 0.6, 3.15, 0.6, 3.15, 0.6, 3.15, 0.6,
    3.15, 0.6, 3.15, 0.6, 3.15, 0.6, 3.15, 2.6, 33.15, 0.6, 6, 0.6, 6, 0.6, 17.15, 0.6, 17.15,
  ];
  worksheet.columns = colWidths.map(w => ({ width: w }));

  // Title
  worksheet.mergeCells('B2:AH2');
  worksheet.getCell('B2').value = 'Product Movement Sheet';
  worksheet.getCell('B2').font = { size: 36, bold: true };

  // 移除頂部 Report Period 資訊

  worksheet.mergeCells('B3:L3');
  worksheet.getCell('B3').value = 'From';
  worksheet.mergeCells('N3:X3');
  worksheet.getCell('N3').value = 'To';
  ['B3', 'N3'].forEach(addr => {
    const cell = worksheet.getCell(addr);
    cell.font = { size: 20, bold: true };
    cell.border = {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      right: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
    };
  });

  // 🆕 修改為顯示 Report Period
  if (
    reportData &&
    reportData.date_range &&
    reportData.date_range.start_date &&
    reportData.date_range.end_date
  ) {
    worksheet.getCell('AF3').value =
      `Report Period: ${reportData.date_range.start_date} to ${reportData.date_range.end_date}`;
  } else {
    worksheet.getCell('AF3').value = 'Report Period: ';
  }
  worksheet.getCell('AF3').alignment = { horizontal: 'right' };

  // Label row
  ['B4:L4', 'N4:X4'].forEach(range => {
    const startCellAddress = range.split(':')[0];
    const start = worksheet.getCell(startCellAddress);
    if (start && typeof start.col === 'number') {
      start.font = { size: 11 };
      for (let col = start.col; col <= start.col + 10; col++) {
        const cell = worksheet.getRow(4).getCell(col);
        cell.alignment = { textRotation: 90, vertical: 'bottom' };
        cell.border = {
          top: { style: 'thin' as const },
          left: { style: 'thin' as const },
          right: { style: 'thin' as const },
          bottom: { style: 'thin' as const },
        };
      }
    } else {
      console.warn(`Could not find starting cell or its column for range: ${range}`);
    }
  });

  const locations = [
    'Fold Mill',
    'Extrusion Room',
    'Pipe Extrusion',
    'Production',
    'Back Car Park',
    'Bulk Room',
  ];
  locations.forEach((loc, i) => {
    worksheet.getRow(4).getCell(2 + i * 2).value = loc;
    worksheet.getRow(4).getCell(2 + i * 2).font = { size: 11 };
    worksheet.getRow(4).getCell(14 + i * 2).value = loc;
    worksheet.getRow(4).getCell(14 + i * 2).font = { size: 11 };
  });

  worksheet.getCell('Z4').value = 'Product Code';
  worksheet.getCell('AB4').value = 'TTL\nQty';
  worksheet.getCell('AD4').value = 'TTL\nPLT';
  worksheet.getCell('AF4').value = 'Pallet Ref. No\nGoods In No';
  worksheet.getCell('AH4').value = 'Clock Card No';
  worksheet.getCell('AF4').font = { size: 11 };
  worksheet.getCell('AH4').font = { size: 11 };
  worksheet.getCell('AF4').alignment = { wrapText: true };
  worksheet.getCell('AH4').alignment = { wrapText: true };
  ['Z4', 'AB4', 'AD4', 'AF4', 'AH4'].forEach(addr => {
    const cell = worksheet.getCell(addr);
    cell.font = { size: 11 };
    cell.alignment = { vertical: 'bottom' };
  });

  worksheet.getCell('Z4').alignment = { horizontal: 'center', vertical: 'bottom' };
  worksheet.getCell('AD4').alignment = { textRotation: 90, vertical: 'bottom' };
  worksheet.getCell('AF4').alignment = { wrapText: true, vertical: 'bottom' };

  // 🆕 數據填充邏輯
  if (reportData && reportData.transfers && reportData.transfers.length > 0) {
    let currentRow = 5;
    const maxRows = 27;

    // 🆕 計算相同條件的總板數和總數量
    const groupedTransfers = new Map<string, number>();
    const groupedQuantitiesByEmployee = new Map<string, number>(); // 🆕 按員工+產品代碼分組

    reportData.transfers.forEach(transfer => {
      // 🆕 處理 f_loc 為 "Await" 或 "await_grn" 的特殊條件
      let actualFromLocation = transfer.from_location;
      if (transfer.from_location.toLowerCase() === 'await') {
        actualFromLocation = 'Production';
      } else if (transfer.from_location.toLowerCase() === 'await_grn') {
        actualFromLocation = 'Fold Mill';
      } else if (transfer.from_location.toLowerCase() === 'pipeline') {
        actualFromLocation = 'Pipe Extrusion';
      }

      const transferKey = `${transfer.product_code}|${transfer.operatorname}|${actualFromLocation}|${transfer.to_location}`;
      const employeeProductKey = `${transfer.operatorname}|${transfer.product_code}`; // 🆕 員工+產品代碼組合

      // 計算板數（按轉移路線分組）
      groupedTransfers.set(transferKey, (groupedTransfers.get(transferKey) || 0) + 1);

      // 🆕 計算總數量（按員工+產品代碼分組）- 這才是 TTL Qty 應該顯示的數值
      groupedQuantitiesByEmployee.set(
        employeeProductKey,
        (groupedQuantitiesByEmployee.get(employeeProductKey) || 0) + Number(transfer.quantity)
      );
    });

    // 🆕 去重並填充數據
    const uniqueTransfers = new Map<string, Record<string, unknown>>();

    reportData.transfers.forEach(transfer => {
      // 🆕 處理 f_loc 為 "Await" 或 "await_grn" 的特殊條件
      let actualFromLocation = transfer.from_location;
      if (transfer.from_location.toLowerCase() === 'await') {
        actualFromLocation = 'Production';
      } else if (transfer.from_location.toLowerCase() === 'await_grn') {
        actualFromLocation = 'Fold Mill';
      } else if (transfer.from_location.toLowerCase() === 'pipeline') {
        actualFromLocation = 'Pipe Extrusion';
      }

      const transferKey = `${transfer.product_code}|${transfer.operatorname}|${actualFromLocation}|${transfer.to_location}`;
      const employeeProductKey = `${transfer.operatorname}|${transfer.product_code}`;

      if (!uniqueTransfers.has(transferKey)) {
        uniqueTransfers.set(transferKey, {
          ...transfer,
          actualFromLocation, // 🆕 保存處理後的位置
          totalPallets: groupedTransfers.get(transferKey) || 1,
          totalQuantity:
            groupedQuantitiesByEmployee.get(employeeProductKey) || Number(transfer.quantity), // 🆕 該員工該產品代碼的總數量
        });
      }
    });

    Array.from(uniqueTransfers.values()).forEach((transfer, _index) => {
      if (currentRow > maxRows) return; // 防止超出表格範圍

      const row = worksheet.getRow(currentRow);

      // 根據處理後的 from_location 在 B-L 欄位標記（藍色 ✓）
      const fromIndex = locations.indexOf(transfer.actualFromLocation as string);
      if (fromIndex >= 0) {
        const fromCol = 2 + fromIndex * 2; // B, D, F, H, J, L
        row.getCell(fromCol).value = '✓';
        row.getCell(fromCol).font = { size: 14, bold: true, color: { argb: 'FF0066CC' } };
      }

      // 根據 to_location 在 N-X 欄位標記（綠色 ✓）
      // 處理 PipeLine -> Pipe Extrusion 的映射
      let actualToLocation = transfer.to_location;
      if ((transfer.to_location as string).toLowerCase() === 'pipeline') {
        actualToLocation = 'Pipe Extrusion';
      }

      const toIndex = locations.indexOf(actualToLocation as string);
      if (toIndex >= 0) {
        const toCol = 14 + toIndex * 2; // N, P, R, T, V, X
        row.getCell(toCol).value = '✓';
        row.getCell(toCol).font = { size: 14, bold: true, color: { argb: 'FF009900' } };
      }

      // 填充產品資訊
      row.getCell('Z').value = String(transfer.product_code); // Product Code

      // TTL Qty - 顯示該員工該產品代碼的 Transfer 總數量
      row.getCell('AB').value = Number(transfer.totalQuantity); // 🆕 該員工該產品代碼的總數量
      row.getCell('AB').font = { size: 14 };

      row.getCell('AD').value = Number(transfer.totalPallets); // 🆕 相同條件的總板數
      row.getCell('AD').font = { size: 14 };
      // AF 欄位留空（Pallet Reference No）

      // 🆕 修改 AH 欄：顯示操作員姓名和 clock number，格式為 "Alex[換行]（5997）"
      const operatorDisplayText = `${transfer.operatorname}\n（${transfer.operator_id}）`;
      row.getCell('AH').value = operatorDisplayText; // Operator Name + Clock Number
      row.getCell('AH').font = { size: 12 };
      row.getCell('AH').alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true, // 啟用文字換行
      };

      currentRow++;
    });
  }

  // 添加邊框到數據區域
  for (let i = 5; i <= 27; i++) {
    const cols = [
      'B',
      'D',
      'F',
      'H',
      'J',
      'L',
      'N',
      'P',
      'R',
      'T',
      'V',
      'X',
      'Z',
      'AB',
      'AD',
      'AF',
      'AH',
    ];
    cols.forEach(letter => {
      const cell = worksheet.getCell(`${letter}${i}`);
      cell.border = {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        right: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
      };
    });
  }

  worksheet.pageSetup = {
    margins: {
      left: 0.2,
      right: 0.2,
      top: 0.2,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3,
    },
    orientation: 'portrait',
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: false,
    verticalCentered: false,
    blackAndWhite: false,
    printArea: 'A1:AH27',
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
