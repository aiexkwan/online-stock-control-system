'use client';

import React, { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';

interface GrnGroup {
  grn_ref: number;
  material_code: string;
  ttl_pallet: number;
}

const PAGE_SIZE = 5;
const MAX_RECORDS = 20;

export default function GrnHistory() {
  const [groups, setGroups] = useState<GrnGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGroups(0, true);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!tableRef.current || loading || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        fetchGroups(page + 1);
      }
    };
    const ref = tableRef.current;
    if (ref) ref.addEventListener('scroll', handleScroll);
    return () => { if (ref) ref.removeEventListener('scroll', handleScroll); };
  }, [loading, hasMore, page]);

  async function fetchGroups(pageNum: number, reset = false) {
    setLoading(true);
    // 直接查詢 100 筆，前端分組
    const { data, error } = await supabase
      .from('record_grn')
      .select('grn_ref, material_code')
      .order('grn_ref', { ascending: false })
      .limit(100);
    if (!error && data) {
      // 前端 group by grn_ref+material_code
      const groupMap = new Map<string, GrnGroup>();
      for (const row of data) {
        const key = `${row.grn_ref}_${row.material_code}`;
        if (!groupMap.has(key)) {
          groupMap.set(key, { grn_ref: row.grn_ref, material_code: row.material_code, ttl_pallet: 1 });
        } else {
          groupMap.get(key)!.ttl_pallet += 1;
        }
      }
      // 依 grn_ref desc 排序
      const allGroups = Array.from(groupMap.values()).sort((a, b) => b.grn_ref - a.grn_ref);
      const start = pageNum * PAGE_SIZE;
      const end = Math.min(start + PAGE_SIZE, MAX_RECORDS);
      const nextGroups = allGroups.slice(0, end);
      setGroups(reset ? nextGroups : [...groups, ...nextGroups.slice(groups.length)]);
      setPage(pageNum);
      setHasMore(nextGroups.length < allGroups.length && nextGroups.length < MAX_RECORDS);
    }
    setLoading(false);
  }

  return (
    <div ref={tableRef} className="overflow-x-auto max-h-96" style={{ minHeight: 220 }}>
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="sticky top-0 bg-gray-800 z-10">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              GRN Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Code
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              TTL Pallet
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {groups.map((group) => (
            <tr key={group.grn_ref + '-' + group.material_code} className="hover:bg-gray-700">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{group.grn_ref}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{group.material_code}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{group.ttl_pallet}</td>
            </tr>
          ))}
          {loading && (
            <tr><td colSpan={3} className="text-center py-4 text-gray-400">Loading...</td></tr>
          )}
        </tbody>
      </table>
      {!hasMore && groups.length >= MAX_RECORDS && (
        <div className="text-center text-xs text-gray-500 py-2">Max 20 records loaded</div>
      )}
    </div>
  );
} 