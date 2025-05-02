'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface PrintRecord {
  generate_time: string;
  plt_num: string;
  product_code: string;
  product_qty: number;
}

const PAGE_SIZE = 15;
const MAX_RECORDS = 100;

export default function PrintHistory() {
  const [records, setRecords] = useState<PrintRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [debug, setDebug] = useState<string[]>([]);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDebug(d => [...d, 'useEffect: fetchRecords(0, true)']);
    console.log('PrintHistory useEffect: fetchRecords(0, true)');
    fetchRecords(0, true);
    // eslint-disable-next-line
  }, []);

  // 滾動載入
  useEffect(() => {
    const handleScroll = () => {
      if (!tableRef.current || loading || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setDebug(d => [...d, `handleScroll: fetchRecords(${page + 1})`]);
        fetchRecords(page + 1);
      }
    };
    const ref = tableRef.current;
    if (ref) ref.addEventListener('scroll', handleScroll);
    return () => { if (ref) ref.removeEventListener('scroll', handleScroll); };
  }, [loading, hasMore, page]);

  async function fetchRecords(pageNum: number, reset = false) {
    setDebug(d => [...d, `fetchRecords called: pageNum=${pageNum}, reset=${reset}`]);
    setLoading(true);
    const from = pageNum * PAGE_SIZE;
    const to = Math.min(from + PAGE_SIZE - 1, MAX_RECORDS - 1);
    setDebug(d => [...d, `supabase query: from=${from}, to=${to}`]);
    console.log('PrintHistory fetchRecords: querying supabase', { from, to });
    const { data, error } = await supabase
      .from('record_palletinfo')
      .select('generate_time, plt_num, product_code, product_qty')
      .order('generate_time', { ascending: false })
      .range(from, to);
    setDebug(d => [...d, `supabase result: error=${!!error}, data.length=${data?.length}`]);
    console.log('PrintHistory fetchRecords: result', { error, data });
    if (!error && data) {
      setRecords(prev => reset ? data : [...prev, ...data]);
      setPage(pageNum);
      setHasMore(data.length === PAGE_SIZE && to < MAX_RECORDS - 1);
    }
    setLoading(false);
  }

  return (
    <div ref={tableRef} className="overflow-x-auto max-h-96" style={{ minHeight: 220 }}>
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="sticky top-0 bg-gray-800 z-10">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Pallet Num</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Product Code</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Qty</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {records.map((record) => (
            <tr key={record.generate_time + record.plt_num} className="hover:bg-gray-700">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                {format(new Date(record.generate_time), 'dd-MMM-yy HH:mm')}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{record.plt_num}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{record.product_code}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{record.product_qty}</td>
            </tr>
          ))}
          {loading && (
            <tr><td colSpan={4} className="text-center py-4 text-gray-400">Loading...</td></tr>
          )}
        </tbody>
      </table>
      {!hasMore && records.length >= MAX_RECORDS && (
        <div className="text-center text-xs text-gray-500 py-2">Max 100 records loaded</div>
      )}
    </div>
  );
} 