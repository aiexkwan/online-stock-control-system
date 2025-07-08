import { createClient } from '@/lib/supabase';
import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';

// Based on database structure
export interface VoidRecord {
  uuid: string;
  plt_num: string;
  time: string;
  reason: string;
  damage_qty: number | null;
  // Additional fields from joins
  product_code?: string;
  product_qty?: number;
  user_name?: string;
  user_id?: number;
  plt_loc?: string;
  // Computed fields
  void_qty: number;
}

// Interface for database record structure
interface ReportVoidRecord {
  uuid: string;
  plt_num: string;
  time: string;
  reason: string;
  damage_qty: number | null;
  record_palletinfo?: {
    product_code: string;
    product_qty: number;
  } | null;
}

export interface VoidReportFilters {
  startDate?: string;
  endDate?: string;
  voidReason?: string;
  productCode?: string;
  voidBy?: string;
}

export async function fetchVoidRecords(filters: VoidReportFilters): Promise<VoidRecord[]> {
  const supabase = await createClient();

  try {
    isNotProduction() &&
      isNotProduction() &&
      console.log('Fetching void records with filters:', filters);

    // First, let's check if report_void table has any data
    const { count: voidCount, error: countError } = await supabase
      .from('report_void')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting report_void records:', countError);
    } else {
      isNotProduction() &&
        isNotProduction() &&
        console.log('Total report_void records in database:', voidCount);
    }

    // Fetch void records with proper foreign key join
    let voidQuery = supabase
      .from('report_void')
      .select(
        `
        uuid,
        plt_num,
        time,
        reason,
        damage_qty,
        record_palletinfo!plt_num (
          product_code,
          product_qty
        )
      `
      )
      .order('time', { ascending: false });

    // Apply date filters
    if (filters.startDate) {
      voidQuery = voidQuery.gte('time', filters.startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      voidQuery = voidQuery.lt('time', endDate.toISOString().split('T')[0]);
    }
    if (filters.voidReason) {
      voidQuery = voidQuery.ilike('reason', `%${filters.voidReason}%`);
    }

    const { data: voidReports, error: voidError } = await voidQuery;

    if (voidError) {
      console.error('Error fetching from report_void:', voidError);
      console.error('Query details:', {
        startDate: filters.startDate,
        endDate: filters.endDate,
        reason: filters.voidReason,
      });

      // Try a simpler query without join to diagnose the issue
      const { data: simpleData, error: simpleError } = await supabase
        .from('report_void')
        .select('*')
        .limit(5);

      if (simpleError) {
        console.error('Even simple query failed:', simpleError);
      } else {
        isNotProduction() &&
          isNotProduction() &&
          console.log('Simple query succeeded with data:', simpleData);
      }

      throw voidError;
    }

    if (!voidReports || voidReports.length === 0) {
      isNotProduction() &&
        isNotProduction() &&
        console.log('No void records found with current filters');
      isNotProduction() &&
        isNotProduction() &&
        console.log('Filters applied:', filters);

      // Check if there are any records without filters
      const { data: allRecords, count } = await supabase
        .from('report_void')
        .select('*', { count: 'exact' })
        .limit(1);

      isNotProduction() &&
        isNotProduction() &&
        console.log('Total records in report_void (without filters):', count);
      if (allRecords && allRecords.length > 0) {
        isNotProduction() &&
          isNotProduction() &&
          console.log('Sample record:', allRecords[0]);
      }

      return [];
    }

    isNotProduction() &&
      isNotProduction() &&
      console.log(`Found ${voidReports.length} void records after filtering`);
    isNotProduction() &&
      isNotProduction() &&
      console.log('Sample void record:', JSON.stringify(voidReports[0], null, 2));

    // Step 2: Get unique pallet numbers for user lookup
    const palletNumbers = [...new Set(voidReports.map(v => v.plt_num))];

    // Step 3: Try to get user information from record_history (optional)
    let userMap = new Map<string, any>();

    try {
      if (palletNumbers.length > 0) {
        const { data: historyRecords } = await supabase
          .from('record_history')
          .select(
            `
            plt_num,
            time,
            id,
            loc,
            remark,
            data_id (
              id,
              name
            )
          `
          )
          .eq('action', 'Void Pallet')
          .in('plt_num', palletNumbers)
          .order('time', { ascending: false });

        if (historyRecords) {
          isNotProduction() &&
            isNotProduction() &&
            console.log(`Found ${historyRecords.length} history records`);
          historyRecords.forEach(h => {
            if (!userMap.has(h.plt_num)) {
              userMap.set(h.plt_num, {
                user: h.data_id,
                loc: h.loc,
                historyRemark: h.remark,
              });
            }
          });
        }
      }
    } catch (historyError) {
      isNotProduction() &&
        isNotProduction() &&
        console.warn('Could not fetch history records:', historyError);
    }

    // Step 4: Combine all data
    let combinedRecords: VoidRecord[] = voidReports.map((voidRecord: any) => {
      const palletInfo = voidRecord.record_palletinfo;
      const historyInfo = userMap.get(voidRecord.plt_num);

      // Log if palletInfo is missing
      if (!palletInfo) {
        isNotProduction() &&
          isNotProduction() &&
          console.warn(`No pallet info found for plt_num: ${voidRecord.plt_num}`);
      }

      return {
        uuid: voidRecord.uuid,
        plt_num: voidRecord.plt_num,
        time: voidRecord.time,
        reason: voidRecord.reason,
        damage_qty: voidRecord.damage_qty,
        product_code: palletInfo?.product_code || 'N/A',
        product_qty: palletInfo?.product_qty || 0,
        plt_loc: historyInfo?.loc || 'Voided',
        user_name: historyInfo?.user?.name || 'System',
        user_id: historyInfo?.user?.id || 0,
        void_qty:
          voidRecord.damage_qty !== null && voidRecord.damage_qty > 0
            ? voidRecord.damage_qty
            : palletInfo?.product_qty || 0,
      };
    });

    // Step 6: Apply additional filters
    if (filters.productCode) {
      combinedRecords = combinedRecords.filter(r =>
        r.product_code?.toLowerCase().includes(filters.productCode!.toLowerCase())
      );
    }

    if (filters.voidBy) {
      combinedRecords = combinedRecords.filter(r =>
        r.user_name?.toLowerCase().includes(filters.voidBy!.toLowerCase())
      );
    }

    isNotProduction() &&
      isNotProduction() &&
      console.log(`Returning ${combinedRecords.length} records after filtering`);
    return combinedRecords;
  } catch (error) {
    console.error('Error in fetchVoidRecords:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    throw error; // Re-throw to let the caller handle it
  }
}

export function generateVoidReportPDF(records: VoidRecord[], filters: VoidReportFilters): Blob {
  try {
    const doc = new jsPDF({ orientation: 'landscape' });

    // Title
    doc.setFontSize(20);
    doc.text('Void Pallet Report', 14, 20);

    // Date range
    doc.setFontSize(12);
    const dateRange = `${filters.startDate || 'All'} to ${filters.endDate || 'Today'}`;
    doc.text(`Period: ${dateRange}`, 14, 30);

    // Summary statistics
    const totalVoids = records.length;
    const totalQty = records.reduce((sum, r) => sum + (r.void_qty || 0), 0);
    const damageVoids = records.filter(r => r.damage_qty !== null && r.damage_qty > 0).length;
    const fullVoids = records.filter(r => r.damage_qty === null || r.damage_qty === 0).length;
    const voidReasons = [...new Set(records.map(r => r.reason).filter(Boolean))];
    const uniqueProducts = [...new Set(records.map(r => r.product_code).filter(Boolean))].length;

    doc.text(`Total Voids: ${totalVoids}`, 14, 40);
    doc.text(`Total Quantity: ${totalQty}`, 14, 47);
    doc.text(`Damage Voids: ${damageVoids} | Full Voids: ${fullVoids}`, 14, 54);
    doc.text(`Unique Products: ${uniqueProducts} | Unique Reasons: ${voidReasons.length}`, 14, 61);

    // Table headers
    const headers = [
      'Date/Time',
      'Pallet No.',
      'Product',
      'Qty',
      'Void Qty',
      'Reason',
      'User',
      'Location',
    ];
    const colWidths = [40, 30, 30, 20, 20, 40, 30, 30];
    let y = 75;

    // Draw header
    doc.setFillColor(66, 66, 66);
    doc.rect(14, y - 5, 270, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);

    let x = 14;
    headers.forEach((header, i) => {
      doc.text(header, x, y);
      x += colWidths[i];
    });

    // Draw data rows
    doc.setTextColor(0, 0, 0);
    y += 15;

    records.forEach((record, index) => {
      if (y > 180) {
        doc.addPage();
        y = 20;

        // Redraw headers on new page
        doc.setFillColor(66, 66, 66);
        doc.rect(14, y - 5, 270, 10, 'F');
        doc.setTextColor(255, 255, 255);
        x = 14;
        headers.forEach((header, i) => {
          doc.text(header, x, y);
          x += colWidths[i];
        });
        doc.setTextColor(0, 0, 0);
        y += 15;
      }

      x = 14;
      const rowData = [
        format(new Date(record.time), 'dd/MM/yyyy HH:mm'),
        record.plt_num,
        record.product_code || 'N/A',
        (record.product_qty || 0).toString(),
        record.void_qty.toString(),
        record.reason || 'N/A',
        record.user_name || 'Unknown',
        record.plt_loc || 'N/A',
      ];

      rowData.forEach((data, i) => {
        doc.text(data.substring(0, colWidths[i] / 3), x, y);
        x += colWidths[i];
      });

      y += 7;
    });

    // Add summary pages if we have data
    if (records.length > 0) {
      // Product Summary Page
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Product Code Summary', 14, 20);

      doc.setFontSize(10);
      y = 35;

      // Group by product
      const productStats = new Map<string, { count: number; qty: number }>();
      records.forEach(record => {
        const product = record.product_code || 'Unknown';
        if (!productStats.has(product)) {
          productStats.set(product, { count: 0, qty: 0 });
        }
        const stats = productStats.get(product)!;
        stats.count++;
        stats.qty += record.void_qty || 0;
      });

      // Sort and display top products
      const sortedProducts = Array.from(productStats.entries())
        .sort(([, a], [, b]) => b.qty - a.qty)
        .slice(0, 20); // Top 20 products

      // Headers
      doc.setFillColor(66, 66, 66);
      doc.rect(14, y - 5, 200, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('Product Code', 14, y);
      doc.text('Void Count', 100, y);
      doc.text('Total Quantity', 150, y);

      doc.setTextColor(0, 0, 0);
      y += 12;

      sortedProducts.forEach(([product, stats]) => {
        if (y > 180) {
          doc.addPage();
          y = 20;
        }
        doc.text(product, 14, y);
        doc.text(stats.count.toString(), 100, y);
        doc.text(stats.qty.toString(), 150, y);
        y += 7;
      });

      // Daily Summary Page
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Daily Void Summary', 14, 20);

      doc.setFontSize(10);
      y = 35;

      // Group by date
      const dailyStats = new Map<string, { count: number; qty: number }>();
      records.forEach(record => {
        const date = format(new Date(record.time), 'yyyy-MM-dd');
        if (!dailyStats.has(date)) {
          dailyStats.set(date, { count: 0, qty: 0 });
        }
        const stats = dailyStats.get(date)!;
        stats.count++;
        stats.qty += record.void_qty || 0;
      });

      // Sort by date descending
      const sortedDates = Array.from(dailyStats.entries()).sort(([a], [b]) => b.localeCompare(a));

      // Headers
      doc.setFillColor(66, 66, 66);
      doc.rect(14, y - 5, 200, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('Date', 14, y);
      doc.text('Void Count', 100, y);
      doc.text('Total Quantity', 150, y);

      doc.setTextColor(0, 0, 0);
      y += 12;

      sortedDates.forEach(([date, stats]) => {
        if (y > 180) {
          doc.addPage();
          y = 20;
        }
        doc.text(date, 14, y);
        doc.text(stats.count.toString(), 100, y);
        doc.text(stats.qty.toString(), 150, y);
        y += 7;
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${pageCount}`, 270, 200, { align: 'right' });
      doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 200);
    }

    return doc.output('blob');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(
      `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function generateVoidReportExcel(records: VoidRecord[], filters: VoidReportFilters): Promise<Blob> {
  try {
    // Create workbook
    const wb = new ExcelJS.Workbook();

    // Summary sheet
    const totalVoids = records.length;
    const totalQty = records.reduce((sum, r) => sum + (r.void_qty || 0), 0);
    const damageVoids = records.filter(r => r.damage_qty !== null && r.damage_qty > 0).length;
    const fullVoids = records.filter(r => r.damage_qty === null || r.damage_qty === 0).length;
    const uniqueProducts = [...new Set(records.map(r => r.product_code).filter(Boolean))].length;
    const uniqueReasons = [...new Set(records.map(r => r.reason).filter(Boolean))].length;

    const summaryData = [
      ['Void Pallet Report'],
      [''],
      ['Report Period:', `${filters.startDate || 'All'} to ${filters.endDate || 'Today'}`],
      [''],
      ['Summary Statistics:'],
      ['Total Voids:', totalVoids.toString()],
      ['Total Quantity Voided:', totalQty.toString()],
      ['Damage Voids:', damageVoids.toString()],
      ['Full Voids:', fullVoids.toString()],
      ['Unique Products:', uniqueProducts.toString()],
      ['Unique Void Reasons:', uniqueReasons.toString()],
      [''],
      ['Summary by Void Reason:'],
    ];

    // Calculate summary by reason
    const reasonSummary = records.reduce(
      (acc, record) => {
        const reason = record.reason || 'Unknown';
        if (!acc[reason]) {
          acc[reason] = { count: 0, qty: 0 };
        }
        acc[reason].count++;
        acc[reason].qty += record.void_qty || 0;
        return acc;
      },
      {} as Record<string, { count: number; qty: number }>
    );

    Object.entries(reasonSummary)
      .sort(([, a], [, b]) => b.qty - a.qty) // Sort by quantity descending
      .forEach(([reason, data]) => {
        summaryData.push([reason, `Count: ${data.count}`, `Qty: ${data.qty}`]);
      });

    // Add product summary
    summaryData.push([''], ['Summary by Product Code:']);
    const productSummary = records.reduce(
      (acc, record) => {
        const product = record.product_code || 'Unknown';
        if (!acc[product]) {
          acc[product] = { count: 0, qty: 0 };
        }
        acc[product].count++;
        acc[product].qty += record.void_qty || 0;
        return acc;
      },
      {} as Record<string, { count: number; qty: number }>
    );

    Object.entries(productSummary)
      .sort(([, a], [, b]) => b.qty - a.qty) // Sort by quantity descending
      .slice(0, 10) // Top 10 products
      .forEach(([product, data]) => {
        summaryData.push([product, `Count: ${data.count}`, `Qty: ${data.qty}`]);
      });

    const summarySheet = wb.addWorksheet('Summary');
    summaryData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        summarySheet.getCell(rowIndex + 1, colIndex + 1).value = cell;
      });
    });

    // Product Analysis Sheet
    const productAnalysisData = [
      ['Product Code Analysis'],
      [''],
      [
        'Product Code',
        'Total Voids',
        'Total Qty',
        'Damage Voids',
        'Full Voids',
        'Most Common Reason',
      ],
    ];

    // Calculate detailed product statistics
    const productDetailedStats = new Map<
      string,
      {
        count: number;
        qty: number;
        damageCount: number;
        fullCount: number;
        reasons: Map<string, number>;
      }
    >();

    records.forEach(record => {
      const product = record.product_code || 'Unknown';
      if (!productDetailedStats.has(product)) {
        productDetailedStats.set(product, {
          count: 0,
          qty: 0,
          damageCount: 0,
          fullCount: 0,
          reasons: new Map(),
        });
      }

      const stats = productDetailedStats.get(product)!;
      stats.count++;
      stats.qty += record.void_qty || 0;

      if (record.damage_qty && record.damage_qty > 0) {
        stats.damageCount++;
      } else {
        stats.fullCount++;
      }

      const reason = record.reason || 'Unknown';
      stats.reasons.set(reason, (stats.reasons.get(reason) || 0) + 1);
    });

    Array.from(productDetailedStats.entries())
      .sort(([, a], [, b]) => b.qty - a.qty)
      .forEach(([product, stats]) => {
        // Find most common reason
        let mostCommonReason = 'N/A';
        let maxCount = 0;
        stats.reasons.forEach((count, reason) => {
          if (count > maxCount) {
            maxCount = count;
            mostCommonReason = reason;
          }
        });

        productAnalysisData.push([
          product,
          stats.count.toString(),
          stats.qty.toString(),
          stats.damageCount.toString(),
          stats.fullCount.toString(),
          mostCommonReason,
        ]);
      });

    const productAnalysisSheet = wb.addWorksheet('Product Analysis');
    productAnalysisData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        productAnalysisSheet.getCell(rowIndex + 1, colIndex + 1).value = cell;
      });
    });
    
    // Set column widths
    productAnalysisSheet.getColumn(1).width = 20; // Product Code
    productAnalysisSheet.getColumn(2).width = 12; // Total Voids
    productAnalysisSheet.getColumn(3).width = 12; // Total Qty
    productAnalysisSheet.getColumn(4).width = 12; // Damage Voids
    productAnalysisSheet.getColumn(5).width = 12; // Full Voids
    productAnalysisSheet.getColumn(6).width = 20; // Most Common Reason

    // Daily Analysis Sheet
    const dailyAnalysisData = [
      ['Daily Void Analysis'],
      [''],
      [
        'Date',
        'Total Voids',
        'Total Qty',
        'Damage Voids',
        'Full Voids',
        'Top Product',
        'Top Reason',
      ],
    ];

    // Group records by date
    const dailyStats = new Map<
      string,
      {
        records: VoidRecord[];
        totalQty: number;
        damageCount: number;
        fullCount: number;
        products: Map<string, number>;
        reasons: Map<string, number>;
      }
    >();

    records.forEach(record => {
      const date = format(new Date(record.time), 'yyyy-MM-dd');
      if (!dailyStats.has(date)) {
        dailyStats.set(date, {
          records: [],
          totalQty: 0,
          damageCount: 0,
          fullCount: 0,
          products: new Map(),
          reasons: new Map(),
        });
      }

      const stats = dailyStats.get(date)!;
      stats.records.push(record);
      stats.totalQty += record.void_qty || 0;

      if (record.damage_qty && record.damage_qty > 0) {
        stats.damageCount++;
      } else {
        stats.fullCount++;
      }

      const product = record.product_code || 'Unknown';
      stats.products.set(product, (stats.products.get(product) || 0) + 1);

      const reason = record.reason || 'Unknown';
      stats.reasons.set(reason, (stats.reasons.get(reason) || 0) + 1);
    });

    Array.from(dailyStats.entries())
      .sort(([a], [b]) => b.localeCompare(a)) // Sort by date descending
      .forEach(([date, stats]) => {
        // Find top product and reason
        let topProduct = 'N/A';
        let topProductCount = 0;
        stats.products.forEach((count, product) => {
          if (count > topProductCount) {
            topProductCount = count;
            topProduct = product;
          }
        });

        let topReason = 'N/A';
        let topReasonCount = 0;
        stats.reasons.forEach((count, reason) => {
          if (count > topReasonCount) {
            topReasonCount = count;
            topReason = reason;
          }
        });

        dailyAnalysisData.push([
          date,
          stats.records.length.toString(),
          stats.totalQty.toString(),
          stats.damageCount.toString(),
          stats.fullCount.toString(),
          topProduct,
          topReason,
        ]);
      });

    const dailyAnalysisSheet = wb.addWorksheet('Daily Analysis');
    dailyAnalysisData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        dailyAnalysisSheet.getCell(rowIndex + 1, colIndex + 1).value = cell;
      });
    });
    
    // Set column widths
    dailyAnalysisSheet.getColumn(1).width = 15; // Date
    dailyAnalysisSheet.getColumn(2).width = 12; // Total Voids
    dailyAnalysisSheet.getColumn(3).width = 12; // Total Qty
    dailyAnalysisSheet.getColumn(4).width = 12; // Damage Voids
    dailyAnalysisSheet.getColumn(5).width = 12; // Full Voids
    dailyAnalysisSheet.getColumn(6).width = 20; // Top Product
    dailyAnalysisSheet.getColumn(7).width = 20; // Top Reason

    // Detail sheet
    const detailData = [
      [
        'Date/Time',
        'Pallet No.',
        'Product Code',
        'Original Qty',
        'Void Qty',
        'Reason',
        'Voided By',
        'Location',
        'Remarks',
      ],
    ];

    records.forEach(record => {
      detailData.push([
        format(new Date(record.time), 'dd/MM/yyyy HH:mm:ss'),
        record.plt_num,
        record.product_code || 'N/A',
        (record.product_qty || 0).toString(),
        record.void_qty.toString(),
        record.reason || 'N/A',
        record.user_name || 'Unknown',
        record.plt_loc || 'N/A',
        record.damage_qty ? `Damage: ${record.damage_qty}` : 'Full Void',
      ]);
    });

    const detailSheet = wb.addWorksheet('Detail');
    detailData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        detailSheet.getCell(rowIndex + 1, colIndex + 1).value = cell;
      });
    });

    // Set column widths
    detailSheet.getColumn(1).width = 20; // Date/Time
    detailSheet.getColumn(2).width = 15; // Pallet No.
    detailSheet.getColumn(3).width = 15; // Product Code
    detailSheet.getColumn(4).width = 12; // Original Qty
    detailSheet.getColumn(5).width = 10; // Void Qty
    detailSheet.getColumn(6).width = 20; // Reason
    detailSheet.getColumn(7).width = 15; // Voided By
    detailSheet.getColumn(8).width = 15; // Location
    detailSheet.getColumn(9).width = 30; // Remarks

    // Convert to blob
    const buffer = await wb.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw new Error(
      `Failed to generate Excel: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Add an alternative fetch method that doesn't rely on joins
export async function fetchVoidRecordsAlternative(
  filters: VoidReportFilters
): Promise<VoidRecord[]> {
  const supabase = await createClient();

  try {
    isNotProduction() &&
      isNotProduction() &&
      console.log('Using alternative fetch method without joins');

    // Step 1: Fetch void records without join
    let voidQuery = supabase.from('report_void').select('*').order('time', { ascending: false });

    // Apply date filters
    if (filters.startDate) {
      voidQuery = voidQuery.gte('time', filters.startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      voidQuery = voidQuery.lt('time', endDate.toISOString().split('T')[0]);
    }
    if (filters.voidReason) {
      voidQuery = voidQuery.ilike('reason', `%${filters.voidReason}%`);
    }

    const { data: voidReports, error: voidError } = await voidQuery;

    if (voidError) {
      console.error('Error fetching void records:', voidError);
      throw voidError;
    }

    if (!voidReports || voidReports.length === 0) {
      isNotProduction() &&
        isNotProduction() &&
        console.log('No void records found');
      return [];
    }

    isNotProduction() &&
      isNotProduction() &&
      console.log(`Found ${voidReports.length} void records`);

    // Step 2: Get pallet info separately
    const palletNumbers = [...new Set(voidReports.map(v => v.plt_num))];
    isNotProduction() &&
      isNotProduction() &&
      console.log(`Fetching info for ${palletNumbers.length} unique pallets`);

    const { data: palletInfos, error: palletError } = await supabase
      .from('record_palletinfo')
      .select('plt_num, product_code, product_qty')
      .in('plt_num', palletNumbers);

    if (palletError) {
      console.error('Error fetching pallet info:', palletError);
    }

    // Create a map for quick lookup
    const palletInfoMap = new Map();
    if (palletInfos) {
      palletInfos.forEach(p => palletInfoMap.set(p.plt_num, p));
    }

    // Step 3: Get history info for users and locations
    let userMap = new Map<string, any>();
    try {
      const { data: historyRecords } = await supabase
        .from('record_history')
        .select(
          `
          plt_num,
          time,
          id,
          loc,
          remark,
          data_id (
            id,
            name
          )
        `
        )
        .eq('action', 'Void Pallet')
        .in('plt_num', palletNumbers)
        .order('time', { ascending: false });

      if (historyRecords) {
        historyRecords.forEach(h => {
          if (!userMap.has(h.plt_num)) {
            userMap.set(h.plt_num, {
              user: h.data_id,
              loc: h.loc,
              historyRemark: h.remark,
            });
          }
        });
      }
    } catch (historyError) {
      isNotProduction() &&
        isNotProduction() &&
        console.warn('Could not fetch history records:', historyError);
    }

    // Step 4: Combine all data
    let combinedRecords: VoidRecord[] = voidReports.map((voidRecord: any) => {
      const palletInfo = palletInfoMap.get(voidRecord.plt_num);
      const historyInfo = userMap.get(voidRecord.plt_num);

      return {
        uuid: voidRecord.uuid,
        plt_num: voidRecord.plt_num,
        time: voidRecord.time,
        reason: voidRecord.reason,
        damage_qty: voidRecord.damage_qty,
        product_code: palletInfo?.product_code || 'N/A',
        product_qty: palletInfo?.product_qty || 0,
        plt_loc: historyInfo?.loc || 'Voided',
        user_name: historyInfo?.user?.name || 'System',
        user_id: historyInfo?.user?.id || 0,
        void_qty:
          voidRecord.damage_qty !== null && voidRecord.damage_qty > 0
            ? voidRecord.damage_qty
            : palletInfo?.product_qty || 0,
      };
    });

    // Apply additional filters
    if (filters.productCode) {
      combinedRecords = combinedRecords.filter(r =>
        r.product_code?.toLowerCase().includes(filters.productCode!.toLowerCase())
      );
    }

    if (filters.voidBy) {
      combinedRecords = combinedRecords.filter(r =>
        r.user_name?.toLowerCase().includes(filters.voidBy!.toLowerCase())
      );
    }

    isNotProduction() &&
      isNotProduction() &&
      console.log(`Returning ${combinedRecords.length} records after all filters`);
    return combinedRecords;
  } catch (error) {
    console.error('Error in fetchVoidRecordsAlternative:', error);
    throw error;
  }
}

// Debug function to check table structure and data
export async function debugVoidReportIssue(): Promise<void> {
  const supabase = await createClient();

  try {
    isNotProduction() &&
      isNotProduction() &&
      console.log('=== DEBUGGING VOID REPORT ISSUE ===');

    // 1. Check if report_void table has data
    const {
      data: voidSample,
      error: voidError,
      count,
    } = await supabase.from('report_void').select('*', { count: 'exact' }).limit(5);

    isNotProduction() &&
      isNotProduction() &&
      console.log('Report void table:');
    isNotProduction() &&
      isNotProduction() &&
      console.log('- Total count:', count);
    isNotProduction() &&
      isNotProduction() &&
      console.log('- Sample data:', voidSample);
    isNotProduction() &&
      isNotProduction() &&
      console.log('- Error:', voidError);

    if (voidSample && voidSample.length > 0) {
      // 2. Check if corresponding pallet info exists
      const samplePltNum = voidSample[0].plt_num;
      const { data: palletInfo, error: palletError } = await supabase
        .from('record_palletinfo')
        .select('*')
        .eq('plt_num', samplePltNum)
        .single();

      isNotProduction() &&
        isNotProduction() &&
        console.log(`\nPallet info for ${samplePltNum}:`);
      isNotProduction() &&
        isNotProduction() &&
        console.log('- Data:', palletInfo);
      isNotProduction() &&
        isNotProduction() &&
        console.log('- Error:', palletError);

      // 3. Test the join query
      isNotProduction() &&
        isNotProduction() &&
        console.log('\nTesting join query:');
      const { data: joinTest, error: joinError } = await supabase
        .from('report_void')
        .select(
          `
          plt_num,
          reason,
          record_palletinfo!plt_num (
            product_code,
            product_qty
          )
        `
        )
        .eq('plt_num', samplePltNum)
        .single();

      isNotProduction() &&
        isNotProduction() &&
        console.log('- Join result:', joinTest);
      isNotProduction() &&
        isNotProduction() &&
        console.log('- Join error:', joinError);
    }

    isNotProduction() &&
      isNotProduction() &&
      console.log('\n=== END DEBUG ===');
  } catch (error) {
    console.error('Debug error:', error);
  }
}

export async function generateBatchVoidSummary(batchId: string): Promise<string> {
  const supabase = await createClient();

  // Fetch batch void records
  const { data: records, error } = await supabase
    .from('record_history')
    .select('*')
    .eq('batch_id', batchId)
    .eq('status', 'void');

  if (error || !records || records.length === 0) {
    return 'No batch void records found.';
  }

  // Generate summary
  const totalItems = records.length;
  const totalQty = records.reduce((sum, r) => sum + (r.damage_qty || r.product_qty || 0), 0);
  const voidReason = records[0].remark || 'Unknown';
  const voidBy = 'System';
  const voidTime = format(new Date(records[0].time), 'dd/MM/yyyy HH:mm');

  let summary = `Batch Void Summary\n`;
  summary += `==================\n\n`;
  summary += `Batch ID: ${batchId}\n`;
  summary += `Void Time: ${voidTime}\n`;
  summary += `Voided By: ${voidBy}\n`;
  summary += `Void Reason: ${voidReason}\n\n`;
  summary += `Total Items: ${totalItems}\n`;
  summary += `Total Quantity: ${totalQty}\n\n`;
  summary += `Details:\n`;
  summary += `--------\n`;

  records.forEach(record => {
    summary += `${record.plt_num} - ${record.action} (${record.remark || 'N/A'})\n`;
  });

  return summary;
}
