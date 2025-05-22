"use client";

import React from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  palletsDone: number;      // This now represents 'Pallets Generated'
  palletsTransferred: number; // This remains 'Pallets Transferred'
}

export default function PalletDonutChart({ palletsDone, palletsTransferred }: Props) {
  // palletsDone is now effectively 'palletsGenerated' for calculation purposes
  const palletsGenerated = palletsDone;
  
  // Calculate percentage: (Pallets Transferred / Pallets Generated) * 100
  // Ensure palletsGenerated is not zero to avoid division by zero errors.
  const percent = palletsGenerated > 0 ? Math.round((palletsTransferred / palletsGenerated) * 100) : 0;
  const radius = 120;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // Progress should also reflect Transferred / Generated
  const progress = palletsGenerated > 0 ? palletsTransferred / palletsGenerated : 0;
  const offset = circumference * (1 - progress);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative flex flex-col items-center justify-center mt-4 overflow-visible cursor-pointer" style={{ width: radius * 2, height: radius * 2 }}>
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-32">
              <div className="text-xl font-bold text-white">{percent}%</div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-800 text-white border-gray-700 p-3 rounded-md shadow-lg">
          <div className="space-y-1">
            <p className="text-sm">Pallets Generated: <span className="font-semibold">{palletsGenerated}</span></p>
            <p className="text-sm">Pallets Transferred: <span className="font-semibold">{palletsTransferred}</span></p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 
