import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export async function exportAcoReport() {
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
    horizontalCentered: false,
    verticalCentered: false,
  };

  // === STYLED TITLE ===
  sheet.mergeCells('E1:L2');
  sheet.getRow(1).height = 25;
  sheet.getRow(2).height = 25;
  const titleCell = sheet.getCell('E1');
  titleCell.value = 'ACO Record';
  titleCell.font = { size: 48, bold: true, name: 'Arial', underline: true };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // === Column Widths ===
  const widths = [1.75, 15.15, 8.15, 15.75];
  for (let i = 0; i < 4; i++) {
    sheet.getColumn(i * 4 + 1).width = widths[0];
    sheet.getColumn(i * 4 + 2).width = widths[1];
    sheet.getColumn(i * 4 + 3).width = widths[2];
    sheet.getColumn(i * 4 + 4).width = widths[3];
  }

  // === Header Row ===
  for (let i = 0; i < 4; i++) {
    const base = i * 4 + 1;
    sheet.mergeCells(6, base, 6, base + 1);
    sheet.getCell(6, base).value = 'Pallet No.';
    sheet.getCell(6, base + 2).value = 'Qty';
    sheet.getCell(6, base + 3).value = 'QC Date';

    for (let j = 0; j < 4; j++) {
      const c = sheet.getCell(6, base + j);
      c.font = { size: 20 };
      c.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  }

  // === Table Rows (7–40) ===
  for (let row = 7; row <= 40; row++) {
    for (let i = 0; i < 4; i++) {
      const colIdx = i * 4 + 1;
      const cell = sheet.getCell(row, colIdx);
      cell.value = row - 6; // Placeholder data, will be replaced by actual data later
      cell.font = { size: 6 };
      cell.alignment = { vertical: 'top', horizontal: 'left' };
    }
  }

  // === Merge A4:P4, A5:D5... ===
  const mergeGroups = ['A4:D4', 'E4:H4', 'I4:L4', 'M4:P4', 'A5:D5', 'E5:H5', 'I5:L5', 'M5:P5'];
  mergeGroups.forEach((range) => sheet.mergeCells(range));

  // === Apply borders and style from A4:P40 ===
  for (let row = 4; row <= 40; row++) {
    for (let col = 1; col <= 16; col++) {
      const cell = sheet.getCell(row, col);
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
      if (row >= 4) { // Apply font and alignment to data rows and header rows for consistency in merged cells
        cell.font = { size: 16 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    }
  }
  
  // Re-apply specific font for the placeholder data in table rows if needed, as the above loop sets it to 16.
  // This part might need adjustment when actual data is populated.
  for (let row = 7; row <= 40; row++) {
    for (let i = 0; i < 4; i++) {
      const colIdx = i * 4 + 1;
      const cell = sheet.getCell(row, colIdx);
      // If the cell for row number should indeed be size 6, reset it here
      if (cell.value === row - 6) { // Check if it's the placeholder index cell
         cell.font = { size: 6 }; // Reset to size 6
         cell.alignment = { vertical: 'top', horizontal: 'left' }; // Reset alignment
      }
      // For other data cells (Pallet No., Qty, QC Date), they will inherit size 16 and center alignment from the loop above.
      // This needs to be decided based on how actual data should look.
    }
  }


  // === Download as Excel ===
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  saveAs(blob, 'ACO_Report.xlsx');
} 