'use client';

import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface LabelTemplateProps {
  productCode: string;
  description: string;
  quantity: number;
  date: string;
  operatorClockNum: string;
  qcClockNum: string;
  workOrder: string;
  palletNumber: string;
  className?: string;
}

export const LabelTemplate = ({
  productCode,
  description,
  quantity,
  date,
  operatorClockNum,
  qcClockNum,
  workOrder,
  palletNumber,
  className
}: LabelTemplateProps) => {
  return (
    <div 
      className={cn(
        'relative w-[210mm] h-[145mm] p-5 font-times bg-white',
        className
      )}
    >
      {/* Logo */}
      <div className="absolute top-5 left-5">
        <Image
          src="/images/logo.png"
          alt="Company Logo"
          width={210}
          height={55}
          priority
        />
      </div>

      {/* QR Code */}
      <div className="absolute top-5 right-5">
        <QRCodeSVG
          value={`${productCode}-${palletNumber}`}
          size={200}
        />
      </div>

      {/* Product Information */}
      <div className="mt-24 text-center">
        <h1 className="text-[40px] font-bold">{productCode}</h1>
        <p className="text-2xl mt-2">{description}</p>
      </div>

      {/* Main Data Table */}
      <div className="mt-8 border border-black">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black">
              <th className="p-2 text-base font-bold border-r border-black">Quantity</th>
              <th className="p-2 text-base font-bold border-r border-black">Date</th>
              <th className="p-2 text-base font-bold border-r border-black">Operator Clock Num</th>
              <th className="p-2 text-base font-bold">Q.C. Clock Num</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 text-[25px] text-center border-r border-black">{quantity}</td>
              <td className="p-2 text-[25px] text-center border-r border-black">{date}</td>
              <td className="p-2 text-[25px] text-center border-r border-black">{operatorClockNum}</td>
              <td className="p-2 text-[25px] text-center">{qcClockNum}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Work Order */}
      <div className="mt-8 text-center">
        <p className="text-2xl">Work Order: {workOrder}</p>
      </div>

      {/* Pallet Number */}
      <div className="absolute bottom-5 right-5">
        <p className="text-base font-bold">Pallet Number: {palletNumber}</p>
      </div>
    </div>
  );
}; 