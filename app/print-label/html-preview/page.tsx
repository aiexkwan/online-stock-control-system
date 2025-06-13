'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function HtmlPreviewPage() {
  const searchParams = useSearchParams();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // 從 URL 參數獲取數據，如果沒有則使用測試數據
  const productCode = searchParams.get('productCode') || 'ME4545150';
  const description = searchParams.get('description') || 'Easy Stack 4 Full Wedges (300mm)';
  const quantity = searchParams.get('quantity') || '77';
  const date = searchParams.get('date') || '08-May-2025';
  const operatorClockNum = searchParams.get('operatorClockNum') || '5500';
  const qcClockNum = searchParams.get('qcClockNum') || '5997';
  const workOrderNumber = searchParams.get('workOrderNumber') || 'ACO Ref Order: 123456 1st PLT';
  const palletNum = searchParams.get('palletNum') || '080525/17';
  const qrValue = searchParams.get('qrValue') || `${productCode}-${palletNum}`;

  // 生成 QR 碼
  useEffect(() => {
    const generateQR = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(qrValue, { 
          errorCorrectionLevel: 'M', 
          margin: 1, 
          width: 140 
        });
        setQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    };

    if (qrValue) {
      generateQR();
    }
  }, [qrValue]);

  return (
    <div className="min-h-screen bg-white">
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          background: white;
          padding: 0;
        }
        
        .label {
          width: 210mm;
          height: 145mm;
          padding: 14px;
          position: relative;
          border: 1px solid #ccc;
          margin-bottom: 8px;
          background: white;
        }
        
        .logo {
          position: absolute;
          top: 14px;
          left: 14px;
          width: 180px;
          height: 48px;
        }
        
        .qr-code {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 140px;
          height: 140px;
        }
        
        .center-text {
          text-align: center;
          margin-top: 30px;
          margin-bottom: 10px;
        }
        
        .title {
          font-size: 16px;
          text-decoration: underline;
          margin-bottom: 10px;
        }
        
        .content {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 18px;
        }
        
        .description-title {
          font-size: 16px;
          text-decoration: underline;
          margin-bottom: 10px;
          margin-top: 20px;
        }
        
        .description-content {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 40px;
        }
        
        .main-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        .main-table th {
          background-color: #f0f0f0;
          padding: 8px 4px;
          font-size: 14px;
          font-weight: bold;
          text-align: center;
          border: 1px solid #ccc;
          height: 36px;
        }
        
        .main-table td {
          padding: 8px 4px;
          font-size: 22px;
          text-align: center;
          border: 1px solid #ccc;
          height: 48px;
        }
        
        .work-order-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 6px;
          margin-bottom: 4px;
        }
        
        .work-order-table td {
          padding: 8px 4px;
          font-size: 24px;
          text-align: center;
          border: 1px solid #ccc;
          height: 48px;
        }
        
        .pallet-num {
          position: absolute;
          bottom: 4px;
          right: 14px;
          font-size: 12px;
          text-align: right;
        }
        
        .dashed-line {
          width: 100%;
          height: 1px;
          background-color: #ccc;
          margin: 8px 0;
        }
        
        @media print {
          body { margin: 0; }
          .label { border: none; }
        }
      `}</style>

      {/* 第一個標籤 */}
      <div className="label">
        {/* Logo */}
        <img 
          src="https://bbmkuiplnzvpudszrend.supabase.co/storage/v1/object/public/web-ui/P_Logo_DB.PNG" 
          className="logo"
          alt="Company Logo"
        />
        
        {/* QR Code */}
        {qrCodeDataUrl && (
          <img 
            src={qrCodeDataUrl} 
            className="qr-code"
            alt="QR Code"
          />
        )}
        
        {/* Product Code */}
        <div className="center-text title">Product Code</div>
        <div className="center-text content">{productCode}</div>
        
        {/* Description */}
        <div className="center-text description-title">Description</div>
        <div className="center-text description-content">{description}</div>
        
        {/* Main Table */}
        <table className="main-table">
          <thead>
            <tr>
              <th>Quantity</th>
              <th>Date</th>
              <th>Operator Clock Num</th>
              <th>Q.C. Done By</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{quantity}</td>
              <td>{date}</td>
              <td>{operatorClockNum}</td>
              <td>{qcClockNum}</td>
            </tr>
          </tbody>
        </table>
        
        {/* Work Order Table */}
        <table className="work-order-table">
          <tbody>
            <tr>
              <td>Work Order Number</td>
              <td>{workOrderNumber}</td>
            </tr>
          </tbody>
        </table>
        
        {/* Pallet Number */}
        <div className="pallet-num">Pallet Num : {palletNum}</div>
      </div>
      
      {/* 虛線分隔 */}
      <div className="dashed-line"></div>
      
      {/* 第二個標籤（重複） */}
      <div className="label">
        {/* Logo */}
        <img 
          src="https://bbmkuiplnzvpudszrend.supabase.co/storage/v1/object/public/web-ui/P_Logo_DB.PNG" 
          className="logo"
          alt="Company Logo"
        />
        
        {/* QR Code */}
        {qrCodeDataUrl && (
          <img 
            src={qrCodeDataUrl} 
            className="qr-code"
            alt="QR Code"
          />
        )}
        
        {/* Product Code */}
        <div className="center-text title">Product Code</div>
        <div className="center-text content">{productCode}</div>
        
        {/* Description */}
        <div className="center-text description-title">Description</div>
        <div className="center-text description-content">{description}</div>
        
        {/* Main Table */}
        <table className="main-table">
          <thead>
            <tr>
              <th>Quantity</th>
              <th>Date</th>
              <th>Operator Clock Num</th>
              <th>Q.C. Done By</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{quantity}</td>
              <td>{date}</td>
              <td>{operatorClockNum}</td>
              <td>{qcClockNum}</td>
            </tr>
          </tbody>
        </table>
        
        {/* Work Order Table */}
        <table className="work-order-table">
          <tbody>
            <tr>
              <td>Work Order Number</td>
              <td>{workOrderNumber}</td>
            </tr>
          </tbody>
        </table>
        
        {/* Pallet Number */}
        <div className="pallet-num">Pallet Num : {palletNum}</div>
      </div>
    </div>
  );
} 