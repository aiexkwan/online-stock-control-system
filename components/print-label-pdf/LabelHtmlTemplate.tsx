import React from 'react';

export interface LabelHtmlTemplateProps {
  productCode: string;
  description: string;
  quantity: string | number;
  date: string;
  operatorClockNum: string;
  qcClockNum: string;
  workOrderNumber: string;
  palletNum: string;
  qrValue?: string;
}

export default function LabelHtmlTemplate({
  productCode,
  description,
  quantity,
  date,
  operatorClockNum,
  qcClockNum,
  workOrderNumber,
  palletNum,
  qrValue,
}: LabelHtmlTemplateProps) {
  return (
    <div className="relative w-[210mm] h-[145mm] bg-white p-4 font-sans">
      {/* LOGO */}
      <img
        src="https://bbmkuiplnzvpudszrend.supabase.co/storage/v1/object/public/web-ui/P_Logo_DB.PNG"
        alt="Logo"
        className="absolute top-4 left-4 w-[90px] h-[24px]"
      />
      {/* QR Code */}
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrValue || productCode)}&size=200x200`}
        alt="QR Code"
        className="absolute top-4 right-4 w-[60px] h-[60px]"
      />
      {/* Product Code */}
      <div className="text-center mt-12 text-[16px] underline">Product Code</div>
      <div className="text-center text-[24px] font-bold mb-2">{productCode}</div>
      {/* Description */}
      <div className="text-center text-[16px] underline mb-2">Description</div>
      <div className="text-center text-[24px] font-bold mb-6">{description}</div>
      {/* Main Table */}
      <table className="w-full border border-black mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 text-[10px] font-bold">Quantity</th>
            <th className="border border-black p-2 text-[10px] font-bold">Date</th>
            <th className="border border-black p-2 text-[10px] font-bold">Operator Clock Num</th>
            <th className="border border-black p-2 text-[10px] font-bold">Q.C. Clock Num</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-2 text-[16px] text-center">{quantity}</td>
            <td className="border border-black p-2 text-[16px] text-center">{date}</td>
            <td className="border border-black p-2 text-[16px] text-center">{operatorClockNum}</td>
            <td className="border border-black p-2 text-[16px] text-center">{qcClockNum}</td>
          </tr>
        </tbody>
      </table>
      {/* Work Order Table */}
      <table className="w-full border border-black mb-4">
        <tbody>
          <tr>
            <td className="border border-black p-2 text-[14px] font-bold text-center">Work Order Number</td>
            <td className="border border-black p-2 text-[16px] text-center">{workOrderNumber}</td>
          </tr>
        </tbody>
      </table>
      {/* Pallet Num */}
      <div className="absolute bottom-4 right-4 text-[12px] font-bold">
        Pallet Num : {palletNum}
      </div>
    </div>
  );
} 