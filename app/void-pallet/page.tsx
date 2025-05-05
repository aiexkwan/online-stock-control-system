'use client';

import React from 'react';

export default function VoidPalletPage() {
  return (
    <div className="pl-12 pt-16 min-h-screen bg-[#232532]">
      <div className="flex flex-col w-full max-w-6xl ml-0 px-0">
        {/* 橙色區域：標題靠左上 */}
        <div className="flex items-center mb-12 mt-2">
          <h1 className="text-3xl font-bold text-orange-400" style={{letterSpacing: 1}}>Void Pallet</h1>
        </div>
        {/* 兩個 inputbox 水平排列 */}
        <div className="flex flex-row gap-12 w-full">
          {/* 左側 Series input */}
          <div className="flex items-center w-1/2 max-w-xl">
            <label htmlFor="series" className="text-lg text-white font-semibold mr-4 min-w-[90px] text-right">Series</label>
            <input
              id="series"
              type="text"
              placeholder="Please Use Scanner To Start"
              className="flex-1 px-4 py-3 rounded-md bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              style={{minWidth: 0}}
            />
          </div>
          {/* 右側 Pallet Number input */}
          <div className="flex items-center w-1/2 max-w-xl">
            <label htmlFor="palletNum" className="text-lg text-white font-semibold mr-4 min-w-[130px] text-right">Pallet Number</label>
            <input
              id="palletNum"
              type="text"
              placeholder="Please Type In Pallet Number"
              className="flex-1 px-4 py-3 rounded-md bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              style={{minWidth: 0}}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 