'use server';

import { createClient } from '@/app/utils/supabase/server';

// Generate Code List report
export const generateCodeListReport = async () => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('data_code')
    .select('*')
    .order('code', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No product codes found');

  const headers = ['Product Code', 'Description', 'Type', 'Colour', 'Standard Quantity'];
  const csvContent = [
    headers.join(','),
    ...data.map(item => [
      item.code || '',
      `"${(item.description || '').replace(/"/g, '""')}"`,
      item.type || '',
      item.colour || '',
      item.standard_qty || 0
    ].join(','))
  ].join('\n');

  return csvContent;
};

// Generate Inventory Transaction report
export const generateInventoryTransactionReport = async (startDate: string, endDate: string) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('record_transfer')
    .select(`*, record_palletinfo!inner(plt_num, product_code, product_qty, generate_time)`)
    .gte('time', startDate)
    .lte('time', endDate + 'T23:59:59')
    .order('time', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No inventory transaction data available');

  const headers = ['Date', 'Time', 'Pallet Number', 'Product Code', 'Quantity', 'From Location', 'To Location', 'Operator'];
  const csvContent = [
    headers.join(','),
    ...data.map(item => [
      new Date(item.time).toLocaleDateString(),
      new Date(item.time).toLocaleTimeString(),
      item.plt_num || '',
      item.record_palletinfo?.product_code || '',
      item.record_palletinfo?.product_qty || 0,
      item.from_loc || '',
      item.to_loc || '',
      item.id || ''
    ].join(','))
  ].join('\n');

  return csvContent;
};

// Generate All Data report
export const generateAllDataReport = async () => {
  const supabase = createClient();
  
  const tables = ['data_code', 'record_palletinfo', 'record_transfer', 'record_history', 'record_inventory', 'record_aco'];
  const allData: Record<string, any[]> = {};

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').order('id', { ascending: true });
    allData[table] = error ? [] : (data || []);
  }

  return JSON.stringify(allData, null, 2);
}; 