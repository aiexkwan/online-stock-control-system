import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { AcoProductData } from '../app/actions/reportActions'; // 引入類型
import { format as formatDateFns } from 'date-fns'; // 重新命名以避免與可能的內部 format 衝突
import type { GrnReportPageData } from '../app/actions/reportActions'; // Added for GRN Report
import { toast } from 'sonner';

// 最大處理的產品代碼數量 (對應 A-D, E-H, I-L, M-P 四個區塊)
const MAX_PRODUCT_BLOCKS = 4;

// Helper function to convert column letter to number (A=1, B=2, ...)
function columnLetterToNumber(letter: string): number {
  let column = 0;
  const length = letter.length;
  for (let i = 0; i < length; i++) {
    column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
  }
  return column;
}

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

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('ACO Report');

  // === PAGE SETUP ===
  sheet.pageSetup = {
    margins: {
      left: 0.2, right: 0.2,
      top: 0.2, bottom: 0.75,
      header: 0.3, footer: 0.3,
    },
    orientation: 'portrait',
    paperSize: 9, // A4
    fitToPage: true,
    fitToWidth: 1,
    horizontalCentered: false, // 根據原設定
    verticalCentered: false,   // 根據原設定
  };

  // === STYLED TITLE ===
  sheet.mergeCells('E1:L2');
  sheet.getRow(1).height = 25;
  sheet.getRow(2).height = 25;
  const titleCell = sheet.getCell('E1');
  titleCell.value = 'ACO Record';
  titleCell.font = { size: 48, bold: true, name: 'Arial', underline: true };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  //=== Order Ref. Report Date ===
  const m1Cell = sheet.getCell('M1');
  m1Cell.value = `ACO Order Ref. : ${orderRef}`;
  m1Cell.font = { size: 16, bold: true };
  m1Cell.alignment = { vertical: 'middle', horizontal: 'left' };

  const m2Cell = sheet.getCell('M2');
  const today = new Date();
  // 使用 toLocaleDateString 獲得類似 '23-Jul-2024' 的格式，但月份名稱取決於地區設定
  // 或者使用 date-fns 進行精確格式化
  const formattedDate = formatDateFns(today, 'dd-MMM-yyyy').toUpperCase(); // DD-MMM-YYYY, e.g., 23-JUL-2024
  m2Cell.value = `File Generate Date : ${formattedDate}`;
  m2Cell.font = { size: 16, bold: true };
  m2Cell.alignment = { vertical: 'middle', horizontal: 'left' };

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
    sheet.getCell(6, baseCol + 2).value = 'Qty';       // C, G, K, O 欄
    sheet.getCell(6, baseCol + 3).value = 'QC Date';   // D, H, L, P 欄

    // 格式化表頭 (Pallet No., Qty, QC Date)
    for (let j = 1; j < 4; j++) { // j=1 (Pallet No.), j=2 (Qty), j=3 (QC Date)
      const headerCell = sheet.getCell(6, baseCol + j);
      headerCell.font = { size: 16 };
      headerCell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  }
  
  // === Merge A4:P4, A5:D5... === (這些是產品代碼標題行和其下方可能的分隔行)
  // 這部分可能需要根據實際資料動態調整，或者如果只是固定樣式則保留
  // 您的描述是產品代碼在 A4, E4, I4, M4
  // 所以 A4:D4 合併似乎不對，應該是單獨的 A4, E4 等
  // 這部分先註解，根據數據填充邏輯來處理
  const mergeGroups = ['A4:D4', 'E4:H4', 'I4:L4', 'M4:P4', 'A5:D5', 'E5:H5', 'I5:L5', 'M5:P5'];
  mergeGroups.forEach((range) => {
      try {
        sheet.mergeCells(range);
      } catch (e) {
        console.warn(`Could not merge cells for range ${range}:`, e);
        // 如果合併失敗，可以選擇忽略或記錄，以避免整個報表生成失敗
      }
  });

  // === Apply borders from A4:P40 and data font/alignment ===
  const maxDataRows = 40;
  for (let r = 4; r <= maxDataRows; r++) {
    for (let c = 1; c <= MAX_PRODUCT_BLOCKS * 4; c++) {
      const cell = sheet.getCell(r, c);
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
      if (r >= 7) {
          cell.font = { size: 16 };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
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

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('GRN Report');

  // Define styles
  const center: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle', wrapText: true };
  const right: Partial<ExcelJS.Alignment> = { horizontal: 'right', vertical: 'middle' };
  const grayFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFDCDCDC' },
  };
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin' },
    bottom: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
  };
  const thickBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thick' },
    bottom: { style: 'thick' },
    left: { style: 'thick' },
    right: { style: 'thick' },
  };

  // === Row heights
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

  // === Column widths A to T
  const colWidths = [
    5.25, 9.75, 9.1, 7, 7, 7, 7, 7, // A-H
    8, 6.15, 6.15, 8,       // I-L
    5, 5, 5,             // M-O
    5.5, 5.5,                      // P-Q
    8.25, 9.5, 9.5,                // R-T
  ];
  colWidths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });

  // === Merge blocks
  sheet.mergeCells('A44:E44');
  sheet.getCell('A44').value = 'Action For Material On Hold :';
  sheet.getCell('A44').font = { size: 14, bold: true, underline: 'double' };
  sheet.getCell('A44').alignment = center;

  sheet.mergeCells('A45:K48');
  sheet.getCell('A45').font = { size: 18, bold: true };
  sheet.getCell('A45').alignment = center;

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

  for(let i = 4; i <= 6; i++){
    sheet.mergeCells(`S${i}:T${i}`);
    const cell = sheet.getCell(`S${i}`);
    cell.border = { bottom: { style: 'thin' } };
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
  ['S1:T1', 'S3:T3'].forEach((range) => {
    sheet.mergeCells(range);
    const cell = sheet.getCell(range.split(':')[0]);
    cell.border = thickBorder;
    cell.alignment = center;
    cell.font = { size: 18, bold: true };
  });
  // S2 border (not merged in the provided code, but usually part of a 3-row box)
  sheet.getCell('S2').border = thickBorder;
  sheet.getCell('S2').value = "PASS";
  sheet.getCell('T2').border = thickBorder;
  sheet.getCell('T2').value = "FAIL";
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
    sheet.mergeCells(`N${row}:R${row}`);
    sheet.mergeCells(`S${row}:T${row}`);
    const cell = sheet.getCell(`N${row}`);
    cell.value = label;
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
    for (let c = 14; c <= 20; c++) {
      sheet.getCell(row, c).border = thickBorder;
    }
  });

  // === Merge S11:T42
  for (let row = 11; row <= 42; row++) {
    sheet.mergeCells(`S${row}:T${row}`);
  }

  // === Gray fill
  const grayCols = [1, 3, 9,10,11,12, 16,17, 19]; // A, C, I, P, S (column numbers)
  for (let row = 11; row <= 42; row++) {
    grayCols.forEach((col) => {
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
         if(cell.border){
            const currentBorder = cell.border as ExcelJS.Borders;
            if(currentBorder.top?.style === 'thick' && currentBorder.bottom?.style === 'thick' && currentBorder.left?.style === 'thick' && currentBorder.right?.style === 'thick'){
                applyThin = false;
            }
         }
         if(applyThin) cell.border = thinBorder; 
      }
      cell.alignment = center; // This will center align all cells in A9:T42
      cell.font = { size: 12 }; // This sets font size for all cells in A9:T42
    }
  }

  // Pallet sub-labels from previous version (D9:M10 area)
  // This part was in your previous exportGrnReport but not in the new provided code.
  // Assuming it's still needed for GRN Report.
  const arrPalletLabels = ['White Dry', 'White Wet', 'Chep Dry', 'Chep Wet', 'Euro Pallet', 'Stillage', 'Bag', 'Tote Bag', 'Octobin', 'Sunk'];
  const arrPalletWeights = ['14kg', '18kg', '26kg', '30kg', '22kg', '50kg', '0kg', '6kg', '14kg', '%'];
  for (let i = 0; i < arrPalletLabels.length; i++) {
    const cellLabel = sheet.getCell(9, 4 + i);
    cellLabel.value = arrPalletLabels[i];
    cellLabel.alignment = center; // Ensure these are centered as per A9:T42 rule
    cellLabel.font = { size: 10 };     // Ensure font size is 12 as per A9:T42 rule
    cellLabel.border = thinBorder
    // Borders should be handled by the A9:T42 loop

    const cellWeight = sheet.getCell(10, 4 + i);
    cellWeight.value = arrPalletWeights[i];
    cellWeight.alignment = center;
    cellWeight.fill = grayFill
    cellWeight.font = { size: 10, bold: true,italic: true  };
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
    cell.fill = grayFill
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
    cell.font = { size: 10}; // Original font size was 10, bold
    cell.alignment = center;
    cell.border = thinBorder;
    if(title === 'Comments'){
      cell.fill = grayFill;
      cell.font = { bold: true,italic: true  };
    }
  });

  const group3Headers: Record<string, string> = {
    'N10': 'Pass',
    'O10': 'Fail',
    'P10': 'Pass',
    'Q10': 'Fail',
    'R10': 'On Hold',
  };

  Object.entries(group3Headers).forEach(([range, title]) => {
    const cell = sheet.getCell(range.split(':')[0]);
    cell.value = title;
    cell.font = { bold: true,size: 10 ,italic: true }; // Original font size was 10, bold
    cell.alignment = center;
    cell.fill = grayFill
    cell.border = thinBorder; // Apply thin border, consistent with A9:T42 loop for row 8 if it were included
  });

  const group4Headers: Record<string, string> = {
    'A9:A10': 'PLT Num',
    'B9:B10': 'Gross Weight',
    'C9:C10': 'Net Weight',
  };

  Object.entries(group4Headers).forEach(([range, title]) => {
    sheet.mergeCells(range);
    const cell = sheet.getCell(range.split(':')[0]);
    cell.value = title;
    cell.font = { bold: true,size: 11 }; // Original font size was 10, bold
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
    margins: { // Added margins here as they were separate in the provided code
      left: 0.2,
      right: 0.2,
      top: 0.4,
      bottom: 0.2,
      header: 0.3,
      footer: 0.3,
    }
  };
  // sheet.pageMargins was used in new code, but ExcelJS uses pageSetup.margins.
  // The line below might be redundant if printArea is not strictly needed or handled by fitToPage.
  // sheet.printArea = 'A1:T49'; // Setting print area
 // Sheet Font
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
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

  // Fill Gross and Net Weights
  data.records.forEach((record, index) => {
    const rowIndex = 11 + index;
    if (rowIndex <= 42) { // Ensure we don't write past row 42 for these details
      sheet.getCell(`A${rowIndex}`).value = rowIndex-10;
      sheet.getCell(`B${rowIndex}`).value = record.gross_weight;
      sheet.getCell(`C${rowIndex}`).value = record.net_weight;

      // Pallet Type
      const palletCol = getPalletColumn(record.pallet);
      if (palletCol) {
        sheet.getCell(`${palletCol}${rowIndex}`).value = '✓'; // Or 1, or 'X'
      }

      // Package Type
      const packageCol = getPackageColumn(record.package_type);
      if (packageCol) {
        sheet.getCell(`${packageCol}${rowIndex}`).value = '✓'; // Or 1, or 'X'
      }
    }
  });

  // Totals in A45
  const totalsText = 
`Total Gross Weight >> ${data.total_gross_weight}
Total NetWeight >> ${data.total_net_weight}
Difference >> ${data.weight_difference}`;
  sheet.getCell('A45').value = totalsText;
  sheet.getCell('A45').alignment = { ...center, horizontal: 'left', vertical: 'top', wrapText: true }; // Align left, top, wrap
  // Ensure A45 merged area (A45:K48) has appropriate font/styling if needed
  sheet.getCell('A45').font = { size: 12, bold: false }; // Example: Reset font from previous bold


  // ---- END DATA FILLING ----

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  // Ensure the filename is 'GRN_Report.xlsx' - perhaps make it dynamic with grn_ref and material_code
  saveAs(blob, `GRN_Report_${data.grn_ref}_${data.material_code}.xlsx`);
}

// Helper function to determine column for pallet type
function getPalletColumn(palletType: string | null): string | null {
  if (!palletType) return null;
  switch (palletType.trim()) {
    case 'White_Dry': return 'D';
    case 'White_Wet': return 'E';
    case 'Chep_Dry': return 'F';
    case 'Chep_Wet': return 'G';
    case 'Euro': return 'H';
    case 'Not_Included_Pallet': return null;
    default: return null; // Or a specific column for 'Other'
  }
}

// Helper function to determine column for package type
function getPackageColumn(packageType: string | null): string | null {
  if (!packageType) return null;
  switch (packageType.trim()) {
    case 'Still': return 'I';
    case 'Bag': return 'J';
    case 'Tote': return 'K';
    // Octobin was in previous template cell I9, but not in your new mapping. Assuming K for Tote is correct.
    // case 'Octobin': return 'L'; // Or map to another column if still needed
    case 'Not_Included_Package': return null;
    default: return null; // Or a specific column for 'Other'
  }
}

// Sheet Font
// ... existing code ...
 