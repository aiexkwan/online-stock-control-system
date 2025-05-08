'use client';

import { QRCodeSVG } from 'qrcode.react';

interface ReviewTemplateProps {
  productCode?: string;
  description?: string;
  quantity?: number;
  date?: string;
  operatorClockNum?: string;
  qcClockNum?: string;
  workOrderNumber?: string;
  palletNum?: string;
}

export default function ReviewTemplate({
  productCode = 'SA40-10',
  description = 'Envirocrate Heavy 40-10',
  quantity = 6,
  date = '06-May-2025',
  operatorClockNum = '5500/5579',
  qcClockNum = '5997',
  workOrderNumber = 'ACO Ref : 123456  (Plt : 1)',
  palletNum = '060525/34'
}: ReviewTemplateProps) {
  return (
    <div className="w-[210mm] h-[297mm] bg-white flex flex-col items-center justify-between relative">
      <LabelBlock
        productCode={productCode}
        description={description}
        quantity={quantity}
        date={date}
        operatorClockNum={operatorClockNum}
        qcClockNum={qcClockNum}
        workOrderNumber={workOrderNumber}
        palletNum={palletNum}
      />
      <hr className="w-full border-t border-dashed border-black my-2" style={{ borderTopWidth: 2 }} />
      <LabelBlock
        productCode={productCode}
        description={description}
        quantity={quantity}
        date={date}
        operatorClockNum={operatorClockNum}
        qcClockNum={qcClockNum}
        workOrderNumber={workOrderNumber}
        palletNum={palletNum}
      />
    </div>
  );
}

function LabelBlock(props: ReviewTemplateProps) {
  const {
    productCode,
    description,
    quantity,
    date,
    operatorClockNum,
    qcClockNum,
    workOrderNumber,
    palletNum,
  } = props;

  return (
    <div className="w-[210mm] h-[145mm] p-[5mm] relative bg-white">
      {/* Logo */}
      <img 
        className="absolute top-[5mm] left-[5mm] w-[210px] h-[55px]"
        src="https://wonderful-icecream-2e5.notion.site/image/attachment%3Acc29babe-4a18-4f90-82ac-80ab639d2fdb%3AP_Logo_DB.jpg?table=block&id=1ecea6a0-a03e-80ec-ad56-cf3d49ff147b&spaceId=8b44b340-b032-4818-8d92-a05586933829&width=310&userId=&cache=v2"
        alt="Logo"
      />

      {/* QR Code */}
      <div className="absolute top-[5mm] right-[5mm] w-[200px] h-[200px]">
      <QRCodeSVG value={productCode || ''} size={170} />
      </div>

      {/* Center Text */}
      <div className="text-center py-1 text-[20px] mt-[10px] mb-[5px] underline">Product Code</div>
      <div className="text-center py-1 text-[30px] font-bold mb-[12px]">{productCode}</div>
      <div className="text-center py-1 text-[20px] mb-[55px] underline">Description</div>
      <div className="text-center py-1 text-[30px] mb-[60px] font-bold">{description}</div>

      {/* Main Table */}
      <table className="w-full border-collapse mt-[25px]">
        <thead>
          <tr>
            <th className="border border-black p-2 h-[10px] text-[16px] bg-[#f0f0f0] font-bold">Quantity</th>
            <th className="border border-black p-2 h-[10px] text-[16px] bg-[#f0f0f0] font-bold">Date</th>
            <th className="border border-black p-2 h-[10px] text-[16px] bg-[#f0f0f0] font-bold">Operator Clock Num</th>
            <th className="border border-black p-2 h-[10px] text-[16px] bg-[#f0f0f0] font-bold">Q.C. Clock Num</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-2 h-[36px] text-[25px] text-center">{quantity}</td>
            <td className="border border-black p-2 h-[36px] text-[25px] text-center">{date}</td>
            <td className="border border-black p-2 h-[36px] text-[25px] text-center">{operatorClockNum}</td>
            <td className="border border-black p-2 h-[36px] text-[25px] text-center">{qcClockNum}</td>
          </tr>
        </tbody>
      </table>

      {/* Work Order Table */}
      <table className="w-full border-collapse mt-[14px] mb-[10px]">
        <tr>
          <td className="border border-black p-[6px_10px] h-[40px] text-[24px] text-center align-middle">Work Order Number</td>
          <td className="border border-black p-[6px_10px] h-[40px] text-[26px] text-center align-middle">{workOrderNumber}</td>
        </tr>
      </table>

      {/* Pallet Number */}
      <div
        className="absolute bottom-[5mm] right-[5mm] font-bold text-[16px] leading-none text-right"
        style={{ margin: 0, padding: 0 }}
      >
        Pallet Num : {palletNum}
      </div>
    </div>
  );
} 

