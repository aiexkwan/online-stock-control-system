import { createClient } from '@/lib/supabase';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export interface LoadingRecord {
  uuid: string;
  order_ref: string;
  pallet_num: string;
  product_code: string;
  quantity: number;
  action_type: string;
  action_by: string;
  action_time: string;
  remark?: string;
  // Additional fields from joins
  product_desc?: string;
  order_qty?: number;
  loaded_qty?: number;
}

export interface LoadingReportFilters {
  startDate?: string;
  endDate?: string;
  orderRef?: string;
  productCode?: string;
  actionBy?: string;
  actionType?: string; // 'load' or 'unload'
}

export async function fetchLoadingRecords(filters: LoadingReportFilters): Promise<LoadingRecord[]> {
  const supabase = createClient();
  
  try {
    console.log('Fetching loading records with filters:', filters);
    
    // Fetch loading history records
    let query = supabase
      .from('order_loading_history')
      .select(`
        uuid,
        order_ref,
        pallet_num,
        product_code,
        quantity,
        action_type,
        action_by,
        action_time,
        remark
      `)
      .order('action_time', { ascending: false });

    // Apply filters
    if (filters.startDate) {
      query = query.gte('action_time', filters.startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt('action_time', endDate.toISOString().split('T')[0]);
    }
    if (filters.orderRef) {
      query = query.ilike('order_ref', `%${filters.orderRef}%`);
    }
    if (filters.productCode) {
      query = query.ilike('product_code', `%${filters.productCode}%`);
    }
    if (filters.actionBy) {
      query = query.ilike('action_by', `%${filters.actionBy}%`);
    }
    if (filters.actionType) {
      query = query.eq('action_type', filters.actionType);
    }

    const { data: loadingRecords, error } = await query;

    if (error) {
      console.error('Error fetching loading records:', error);
      throw error;
    }

    if (!loadingRecords || loadingRecords.length === 0) {
      console.log('No loading records found');
      return [];
    }

    console.log(`Found ${loadingRecords.length} loading records`);

    // Get unique order references for additional data
    const uniqueOrderRefs = [...new Set(loadingRecords.map(r => r.order_ref))];
    
    // Fetch order data for product descriptions
    let orderDataMap = new Map<string, any>();
    
    if (uniqueOrderRefs.length > 0) {
      const { data: orderData } = await supabase
        .from('data_order')
        .select('order_ref, product_code, product_desc, product_qty, loaded_qty')
        .in('order_ref', uniqueOrderRefs);
        
      if (orderData) {
        orderData.forEach(order => {
          const key = `${order.order_ref}-${order.product_code}`;
          orderDataMap.set(key, order);
        });
      }
    }

    // Combine data
    const enrichedRecords: LoadingRecord[] = loadingRecords.map(record => {
      const orderKey = `${record.order_ref}-${record.product_code}`;
      const orderData = orderDataMap.get(orderKey);
      
      return {
        ...record,
        product_desc: orderData?.product_desc || 'N/A',
        order_qty: orderData ? parseInt(orderData.product_qty || '0') : 0,
        loaded_qty: orderData ? parseInt(orderData.loaded_qty || '0') : 0
      };
    });

    return enrichedRecords;
    
  } catch (error) {
    console.error('Error in fetchLoadingRecords:', error);
    return [];
  }
}

export function generateLoadingReportPDF(records: LoadingRecord[], filters: LoadingReportFilters): Blob {
  try {
    const doc = new jsPDF({ orientation: 'landscape' });
    
    // Title
    doc.setFontSize(20);
    doc.text('Order Loading Report', 14, 20);
    
    // Date range
    doc.setFontSize(12);
    const dateRange = `${filters.startDate || 'All'} to ${filters.endDate || 'Today'}`;
    doc.text(`Period: ${dateRange}`, 14, 30);
    
    // Summary statistics
    const totalLoads = records.filter(r => r.action_type === 'load').length;
    const totalUnloads = records.filter(r => r.action_type === 'unload').length;
    const totalQtyLoaded = records
      .filter(r => r.action_type === 'load')
      .reduce((sum, r) => sum + r.quantity, 0);
    const totalQtyUnloaded = records
      .filter(r => r.action_type === 'unload')
      .reduce((sum, r) => sum + r.quantity, 0);
    const uniqueOrders = [...new Set(records.map(r => r.order_ref))].length;
    const uniqueProducts = [...new Set(records.map(r => r.product_code))].length;
    
    doc.text(`Total Loads: ${totalLoads} (${totalQtyLoaded} units)`, 14, 40);
    doc.text(`Total Unloads: ${totalUnloads} (${totalQtyUnloaded} units)`, 14, 47);
    doc.text(`Net Loaded: ${totalQtyLoaded - totalQtyUnloaded} units`, 14, 54);
    doc.text(`Unique Orders: ${uniqueOrders} | Unique Products: ${uniqueProducts}`, 14, 61);
    
    // Table headers
    const headers = ['Date/Time', 'Order Ref', 'Pallet No.', 'Product', 'Qty', 'Action', 'User'];
    const colWidths = [40, 30, 35, 50, 20, 25, 40];
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
    
    records.forEach((record) => {
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
        format(new Date(record.action_time), 'dd/MM/yyyy HH:mm'),
        record.order_ref,
        record.pallet_num,
        record.product_code,
        record.quantity.toString(),
        record.action_type === 'load' ? '↑ Load' : '↓ Unload',
        record.action_by
      ];
      
      // Set color based on action type
      if (record.action_type === 'load') {
        doc.setTextColor(0, 128, 0); // Green for load
      } else {
        doc.setTextColor(255, 0, 0); // Red for unload
      }
      
      rowData.forEach((data, i) => {
        doc.text(data.substring(0, colWidths[i] / 3), x, y);
        x += colWidths[i];
      });
      
      doc.setTextColor(0, 0, 0); // Reset color
      y += 7;
    });
    
    // Add summary by order page
    if (records.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Order Summary', 14, 20);
      
      doc.setFontSize(10);
      y = 35;
      
      // Group by order
      const orderStats = new Map<string, { loads: number; unloads: number; netQty: number; products: Set<string> }>();
      records.forEach(record => {
        const orderRef = record.order_ref;
        if (!orderStats.has(orderRef)) {
          orderStats.set(orderRef, { loads: 0, unloads: 0, netQty: 0, products: new Set() });
        }
        const stats = orderStats.get(orderRef)!;
        stats.products.add(record.product_code);
        
        if (record.action_type === 'load') {
          stats.loads += record.quantity;
          stats.netQty += record.quantity;
        } else {
          stats.unloads += record.quantity;
          stats.netQty -= record.quantity;
        }
      });
      
      // Headers
      doc.setFillColor(66, 66, 66);
      doc.rect(14, y - 5, 200, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('Order Reference', 14, y);
      doc.text('Products', 60, y);
      doc.text('Loaded', 90, y);
      doc.text('Unloaded', 120, y);
      doc.text('Net Quantity', 150, y);
      
      doc.setTextColor(0, 0, 0);
      y += 12;
      
      Array.from(orderStats.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([orderRef, stats]) => {
          if (y > 180) {
            doc.addPage();
            y = 20;
          }
          
          doc.text(orderRef, 14, y);
          doc.text(stats.products.size.toString(), 60, y);
          doc.text(stats.loads.toString(), 90, y);
          doc.text(stats.unloads.toString(), 120, y);
          doc.text(stats.netQty.toString(), 150, y);
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
    throw new Error(`Failed to generate PDF: ${error.message || 'Unknown error'}`);
  }
}

export function generateLoadingReportExcel(records: LoadingRecord[], filters: LoadingReportFilters): Blob {
  try {
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const totalLoads = records.filter(r => r.action_type === 'load').length;
    const totalUnloads = records.filter(r => r.action_type === 'unload').length;
    const totalQtyLoaded = records
      .filter(r => r.action_type === 'load')
      .reduce((sum, r) => sum + r.quantity, 0);
    const totalQtyUnloaded = records
      .filter(r => r.action_type === 'unload')
      .reduce((sum, r) => sum + r.quantity, 0);
    const uniqueOrders = [...new Set(records.map(r => r.order_ref))].length;
    const uniqueProducts = [...new Set(records.map(r => r.product_code))].length;
    
    const summaryData = [
      ['Order Loading Report'],
      [''],
      ['Report Period:', `${filters.startDate || 'All'} to ${filters.endDate || 'Today'}`],
      [''],
      ['Summary Statistics:'],
      ['Total Load Actions:', totalLoads.toString()],
      ['Total Unload Actions:', totalUnloads.toString()],
      ['Total Quantity Loaded:', totalQtyLoaded.toString()],
      ['Total Quantity Unloaded:', totalQtyUnloaded.toString()],
      ['Net Quantity Loaded:', (totalQtyLoaded - totalQtyUnloaded).toString()],
      ['Unique Orders:', uniqueOrders.toString()],
      ['Unique Products:', uniqueProducts.toString()]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
    
    // Detail sheet
    const detailData = [
      ['Date/Time', 'Order Ref', 'Pallet No.', 'Product Code', 'Product Description', 'Quantity', 'Action Type', 'Action By', 'Remarks']
    ];
    
    records.forEach(record => {
      detailData.push([
        format(new Date(record.action_time), 'dd/MM/yyyy HH:mm:ss'),
        record.order_ref,
        record.pallet_num,
        record.product_code,
        record.product_desc || 'N/A',
        record.quantity.toString(),
        record.action_type,
        record.action_by,
        record.remark || ''
      ]);
    });
    
    const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
    
    // Set column widths
    detailSheet['!cols'] = [
      { width: 20 }, // Date/Time
      { width: 15 }, // Order Ref
      { width: 15 }, // Pallet No.
      { width: 15 }, // Product Code
      { width: 30 }, // Product Description
      { width: 10 }, // Quantity
      { width: 12 }, // Action Type
      { width: 15 }, // Action By
      { width: 30 }  // Remarks
    ];
    
    XLSX.utils.book_append_sheet(wb, detailSheet, 'Details');
    
    // Order Summary sheet
    const orderSummaryData = [
      ['Order Reference', 'Total Products', 'Quantity Loaded', 'Quantity Unloaded', 'Net Quantity', 'Completion %']
    ];
    
    // Group by order
    const orderStats = new Map<string, { 
      products: Set<string>; 
      loaded: number; 
      unloaded: number; 
      orderQty?: number;
      loadedQty?: number;
    }>();
    
    records.forEach(record => {
      const orderRef = record.order_ref;
      if (!orderStats.has(orderRef)) {
        orderStats.set(orderRef, { 
          products: new Set(), 
          loaded: 0, 
          unloaded: 0,
          orderQty: record.order_qty,
          loadedQty: record.loaded_qty
        });
      }
      const stats = orderStats.get(orderRef)!;
      stats.products.add(record.product_code);
      
      if (record.action_type === 'load') {
        stats.loaded += record.quantity;
      } else {
        stats.unloaded += record.quantity;
      }
    });
    
    Array.from(orderStats.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([orderRef, stats]) => {
        const netQty = stats.loaded - stats.unloaded;
        const completion = stats.orderQty ? ((stats.loadedQty || 0) / stats.orderQty * 100).toFixed(1) : 'N/A';
        
        orderSummaryData.push([
          orderRef,
          stats.products.size.toString(),
          stats.loaded.toString(),
          stats.unloaded.toString(),
          netQty.toString(),
          completion + '%'
        ]);
      });
    
    const orderSummarySheet = XLSX.utils.aoa_to_sheet(orderSummaryData);
    orderSummarySheet['!cols'] = [
      { width: 20 }, // Order Reference
      { width: 15 }, // Total Products
      { width: 15 }, // Quantity Loaded
      { width: 15 }, // Quantity Unloaded
      { width: 15 }, // Net Quantity
      { width: 15 }  // Completion %
    ];
    
    XLSX.utils.book_append_sheet(wb, orderSummarySheet, 'Order Summary');
    
    // Convert to blob
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw new Error(`Failed to generate Excel: ${error.message || 'Unknown error'}`);
  }
}