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
  palletNum = '060525/34',
}: ReviewTemplateProps) {
  return (
    <div className='relative flex h-[297mm] w-[210mm] flex-col items-center justify-between bg-white'>
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
      <hr
        className='my-2 w-full border-t border-dashed border-black'
        style={{ borderTopWidth: 2 }}
      />
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
    <div className='relative h-[145mm] w-[210mm] bg-white p-[5mm]'>
      {/* Logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className='absolute left-[5mm] top-[5mm] h-[55px] w-[210px]'
        src='https://wonderful-icecream-2e5.notion.site/image/attachment%3Acc29babe-4a18-4f90-82ac-80ab639d2fdb%3AP_Logo_DB.jpg?table=block&id=1ecea6a0-a03e-80ec-ad56-cf3d49ff147b&spaceId=8b44b340-b032-4818-8d92-a05586933829&width=310&userId=&cache=v2'
        alt='Logo'
      />

      {/* QR Code */}
      <div className='absolute right-[5mm] top-[5mm] h-[200px] w-[200px]'>
        <QRCodeSVG value={productCode || ''} size={170} />
      </div>

      {/* Center Text */}
      <div className='mb-[5px] mt-[10px] py-1 text-center text-[20px] underline'>Product Code</div>
      <div className='mb-[12px] py-1 text-center text-[30px] font-bold'>{productCode}</div>
      <div className='mb-[55px] py-1 text-center text-[20px] underline'>Description</div>
      <div className='mb-[60px] py-1 text-center text-[30px] font-bold'>{description}</div>

      {/* Main Table */}
      <table className='mt-[25px] w-full border-collapse'>
        <thead>
          <tr>
            <th className='h-[10px] border border-black bg-[#f0f0f0] p-2 text-[16px] font-bold'>
              Quantity
            </th>
            <th className='h-[10px] border border-black bg-[#f0f0f0] p-2 text-[16px] font-bold'>
              Date
            </th>
            <th className='h-[10px] border border-black bg-[#f0f0f0] p-2 text-[16px] font-bold'>
              Operator Clock Num
            </th>
            <th className='h-[10px] border border-black bg-[#f0f0f0] p-2 text-[16px] font-bold'>
              Q.C. Clock Num
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className='h-[36px] border border-black p-2 text-center text-[25px]'>{quantity}</td>
            <td className='h-[36px] border border-black p-2 text-center text-[25px]'>{date}</td>
            <td className='h-[36px] border border-black p-2 text-center text-[25px]'>
              {operatorClockNum}
            </td>
            <td className='h-[36px] border border-black p-2 text-center text-[25px]'>
              {qcClockNum}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Work Order Table */}
      <table className='mb-[10px] mt-[14px] w-full border-collapse'>
        <tbody>
          <tr>
            <td className='h-[40px] border border-black p-[6px_10px] text-center align-middle text-[24px]'>
              Work Order Number
            </td>
            <td className='h-[40px] border border-black p-[6px_10px] text-center align-middle text-[26px]'>
              {workOrderNumber}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Pallet Number */}
      <div
        className='absolute bottom-[5mm] right-[5mm] text-right text-[16px] font-bold leading-none'
        style={{ margin: 0, padding: 0 }}
      >
        Pallet Num : {palletNum}
      </div>
    </div>
  );
}
