import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import pdf from 'pdf-parse';

export interface ExtractedPDFData {
  fileName: string;
  orderRef?: string;
  accountNum?: string;
  deliveryAddress?: string;
  products: Array<{
    code: string;
    description: string;
    quantity: number;
  }>;
  rawText: string;
}

export interface ExpectedPDFData {
  [fileName: string]: {
    orderRef: string;
    accountNum: string;
    deliveryAddress: string;
    products: Array<{
      code: string;
      description: string;
      quantity: number;
    }>;
  };
}

// 預定義嘅期望數據（根據實際 PDF 內容）
export const expectedData: ExpectedPDFData = {
  '280813-Picking List.pdf': {
    orderRef: '280813',
    accountNum: 'BQ01',
    deliveryAddress: 'B&Q, UNIT 19 CENTRAL PARK, MOSLEY ROAD, TRAFFORD PARK, MANCHESTER, M17 1PG',
    products: [
      { code: 'S3027D', description: 'EnviroCrate Connectors (Pack of 3) Black', quantity: 1 },
      { code: 'S3027S', description: 'Single Connectors (White)', quantity: 2 },
      { code: 'ME6045150', description: 'Heavy Duty Blue Modular 600mm x 400mm x 150mm', quantity: 140 },
      { code: 'ME6045195', description: 'Heavy Duty Blue Modular 600mm x 400mm x 195mm', quantity: 180 },
      { code: 'Trans', description: 'Transport Charge', quantity: 1 }
    ]
  },
  '280831-Picking List.pdf': {
    orderRef: '280831',
    accountNum: '472341',
    deliveryAddress: 'Amazon, BHX4, PLOT 6 LOGISTICS NORTH, JUNCTION 9 M42, STATION ROAD, COLESHILL, B46 1AL',
    products: [
      { code: 'MBSB01', description: 'Standard Wooden Push Stick - 70mm x 20mm x 405mm - Birch', quantity: 95 }
    ]
  },
  'ACO - 280761 Picking List.pdf': {
    orderRef: '280761',
    accountNum: 'AC01',
    deliveryAddress: 'Aco Technologies plc, HITCHIN ROAD, SHEFFORD, BEDFORDSHIRE, SG17 5TE',
    products: [
      { code: 'MHALFWG', description: 'Half Wedge Grid - Grey', quantity: 12 },
      { code: 'MHWEDGE', description: 'Wedge Grid - Grey', quantity: 24 }
    ]
  }
  // 添加更多 PDF 嘅預期數據...
};

export async function extractPDFData(pdfPath: string): Promise<ExtractedPDFData> {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdf(dataBuffer);
  
  const fileName = path.basename(pdfPath);
  const rawText = data.text;
  
  // 簡單嘅文本提取邏輯（實際應該更複雜）
  const orderRefMatch = rawText.match(/\b(\d{6})\b/);
  const accountNumMatch = rawText.match(/Account\s*No\.?\s*:?\s*([A-Z0-9]+)/i);
  const deliveryAddressMatch = rawText.match(/Delivery\s*Address\s*:?\s*([\s\S]*?)(?=Tel:|Email:|$)/i);
  
  return {
    fileName,
    orderRef: orderRefMatch ? orderRefMatch[1] : undefined,
    accountNum: accountNumMatch ? accountNumMatch[1] : undefined,
    deliveryAddress: deliveryAddressMatch ? deliveryAddressMatch[1].trim() : undefined,
    products: [], // 需要更複雜嘅邏輯來提取產品
    rawText
  };
}

export function compareResults(
  actual: any,
  expected: any
): {
  success: boolean;
  accuracy: number;
  errors: string[];
} {
  const errors: string[] = [];
  let correctCount = 0;
  let totalCount = 0;
  
  // 比較訂單號
  totalCount++;
  if (actual.order_ref?.toString() === expected.orderRef) {
    correctCount++;
  } else {
    errors.push(`訂單號不匹配: 期望 ${expected.orderRef}, 實際 ${actual.order_ref}`);
  }
  
  // 比較帳號
  totalCount++;
  if (actual.account_num === expected.accountNum) {
    correctCount++;
  } else {
    errors.push(`帳號不匹配: 期望 ${expected.accountNum}, 實際 ${actual.account_num}`);
  }
  
  // 比較送貨地址
  totalCount++;
  if (actual.delivery_add?.includes(expected.deliveryAddress.split(',')[0])) {
    correctCount++;
  } else {
    errors.push(`送貨地址不完整: 期望包含 ${expected.deliveryAddress.split(',')[0]}`);
  }
  
  // 比較產品
  expected.products.forEach((expectedProduct: any) => {
    totalCount++;
    const actualProduct = actual.products?.find((p: any) => 
      p.product_code === expectedProduct.code
    );
    
    if (actualProduct) {
      correctCount++;
      
      // 比較數量
      totalCount++;
      if (parseInt(actualProduct.product_qty) === expectedProduct.quantity) {
        correctCount++;
      } else {
        errors.push(`產品 ${expectedProduct.code} 數量不匹配: 期望 ${expectedProduct.quantity}, 實際 ${actualProduct.product_qty}`);
      }
    } else {
      errors.push(`缺少產品: ${expectedProduct.code}`);
    }
  });
  
  const accuracy = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
  
  return {
    success: errors.length === 0,
    accuracy,
    errors
  };
}