"use client";

import React from "react";

interface Props {
  done: number;
  transferred: number;
}

export default function PalletDonutChart({ done, transferred }: Props) {
  const percent = transferred > 0 ? Math.round((done / transferred) * 100) : 0;
  const radius = 40;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = Math.min(done / (transferred || 1), 1);
  const offset = circumference * (1 - progress);

  return (
    <div className="relative flex flex-col items-center justify-center mt-4" style={{ width: radius * 2, height: radius * 2 }}>
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="#334155" // slate-800
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#3b82f6" // blue-500
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          style={{ transition: 'stroke-dashoffset 0.5s' }}
        />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-20">
        <div className="text-xl font-bold text-white">{percent}%</div>
        <div className="text-xs text-slate-400">Done/Transferred</div>
      </div>
    </div>
  );
} 