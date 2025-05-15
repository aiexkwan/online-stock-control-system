import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { AcoProductData } from '../app/actions/reportActions'; // 引入類型
import { format as formatDateFns } from 'date-fns'; // 重新命名以避免與可能的內部 format 衝突

// 最大處理的產品代碼數量 (對應 A-D, E-H, I-L, M-P 四個區塊)
const MAX_PRODUCT_BLOCKS = 4;

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