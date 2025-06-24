#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

// PDF 文件列表
const testPDFs = [
  '280813-Picking List.pdf',
  '280831-Picking List.pdf',
  '280832-Picking List.pdf',
  'ACO - 280761 Picking List.pdf'
];

// 預處理 PDF 文本（模擬 API 中嘅邏輯）
function preprocessPdfText(rawText) {
  console.log(`原始文本長度: ${rawText.length} 字符`);
  
  // 1. 提取訂單參考號碼
  const orderRefMatch = rawText.match(/\b\d{6,10}\b/);
  const orderRef = orderRefMatch ? orderRefMatch[0] : '';
  
  // 2. 提取 Account No
  let accountNum = '';
  const accountPatterns = [
    /Account\s*No\.?:?\s*([A-Z0-9]+)/i,
    /Account\s*Number:?\s*([A-Z0-9]+)/i,
    /Acc\s*No\.?:?\s*([A-Z0-9]+)/i,
    /Customer\s*No\.?:?\s*([A-Z0-9]+)/i
  ];
  
  for (const pattern of accountPatterns) {
    const match = rawText.match(pattern);
    if (match) {
      accountNum = match[1];
      break;
    }
  }
  
  // 如果沒找到，嘗試從文本中查找帳號模式
  if (!accountNum) {
    // 查找類似 "96154Customers" 或 "WP064386Customers" 的模式
    const customerMatch = rawText.match(/(\w+)Customers/);
    if (customerMatch) {
      accountNum = customerMatch[1];
      console.log('Found account from Customers pattern:', accountNum);
    }
  }
  
  // 如果還是沒找到，嘗試從文本中找到其他帳號模式
  if (!accountNum) {
    // 檢查是否有類似 "BQ01" 或其他短帳號的模式
    const shortAccountMatch = rawText.match(/\b([A-Z]{1,4}\d{1,6})\b(?!.*(?:Product|Code|Item|Tel|Email|www|http))/i);
    if (shortAccountMatch) {
      accountNum = shortAccountMatch[1];
      console.log('Found short account pattern:', accountNum);
    }
  }
  
  // 3. 提取 Delivery Address
  let deliveryAdd = '';
  const deliveryPatterns = [
    /Delivery\s*Address:?\s*([\s\S]*?)(?=\s*(?:Driver|Date|Order|Pallet\s*Information|Item\s*Code|Product|Price\s*Band|Account\s*Balance|Tel:|Email:|Credit\s*Position|Page|Requested\s*Delivery|Account\s*No|Customer|Notes|Goods\s*to|^\s*$))/i,
    /(?:Deliver\s*To|Ship\s*To):?\s*([\s\S]*?)(?=\s*(?:Driver|Date|Order|Pallet\s*Information|Item\s*Code|Product|Price\s*Band|Account\s*Balance|Tel:|Email:|Credit\s*Position|Page|Requested\s*Delivery|Account\s*No|Customer|Notes|^\s*$))/i
  ];
  
  for (const pattern of deliveryPatterns) {
    const match = rawText.match(pattern);
    if (match) {
      const rawAddress = match[1].trim();
      deliveryAdd = rawAddress
        .split('\n')
        .map(line => line.trim())
        .filter(line => {
          if (!line) return false;
          if (line.match(/^(Delivery Address:?|Invoice To:?|Deliver To:?|Ship To:?|Tel:?|Email:?|Site Tel No:?)$/i)) return false;
          if (line.match(/^\d+$/)) return false;
          if (line.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) return false;
          return true;
        })
        .slice(0, 5)
        .join(', ');
      
      if (deliveryAdd.length > 10) {
        break;
      }
    }
  }
  
  // 如果仍然沒有找到地址，嘗試查找包含郵政編碼的行
  if (!deliveryAdd) {
    // 英國郵政編碼格式
    const ukPostcodePattern = /\b([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})\b/g;
    const postcodeMatches = rawText.match(ukPostcodePattern);
    
    if (postcodeMatches) {
      // 找到第一個郵政編碼（通常是送貨地址）
      const firstPostcode = postcodeMatches[0];
      const lines = rawText.split('\n');
      
      // 查找包含郵政編碼的行
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(firstPostcode)) {
          // 收集地址相關行
          const addressParts = [];
          
          // 向前查找城市/地區名
          for (let j = Math.max(0, i - 3); j <= i; j++) {
            const line = lines[j].trim();
            if (line && 
                !line.match(/^(Tel:|Email:|Site Tel|Account|Customer|Invoice|Priority|Price Band|Weight|Pack|Booked)/i) &&
                !line.match(/^\d{5,}/) && // 不是電話號碼
                !line.match(/@/) && // 不是 email
                !line.match(/^(Item Code|Description|Qty Req|Pack Size)/i) // 不是表格標題
               ) {
              addressParts.push(line);
            }
          }
          
          if (addressParts.length > 0) {
            deliveryAdd = addressParts.join(', ');
            break;
          }
        }
      }
    }
    
    // 澳洲地址特殊處理（如 NSW 2750）
    if (!deliveryAdd) {
      const ausPostcodeMatch = rawText.match(/(NSW|VIC|QLD|SA|WA|TAS|ACT|NT)\s+\d{4}/);
      if (ausPostcodeMatch) {
        const lines = rawText.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(ausPostcodeMatch[0])) {
            const addressParts = [];
            // 向前查找（通常是 Australia）
            for (let j = Math.max(0, i - 2); j <= i; j++) {
              const line = lines[j].trim();
              if (line && !line.match(/^(Tel:|Email:|Pack|Weight|Booked)/i)) {
                addressParts.push(line);
              }
            }
            if (addressParts.length > 0) {
              deliveryAdd = addressParts.join(', ');
              break;
            }
          }
        }
      }
    }
  }
  
  // 4. 定位產品表格區域
  const tableStartMarkers = [
    'Item Code',
    'Product Code', 
    'Code',
    'Description',
    'Qty Req',
    'Pack Size',
    'Weight'
  ];
  
  const tableEndMarkers = [
    'Total Weight Of Order',
    'Total Number Of Pages',
    'Notes:',
    'Nett',
    'VAT',
    'TOTAL',
    'Parcel 1',
    'Height',
    'Length',
    'Width',
    'Requested Delivery Date:',
    'Driver:',
    'No Of Pallets:'
  ];
  
  let tableStart = -1;
  for (const marker of tableStartMarkers) {
    const index = rawText.indexOf(marker);
    if (index !== -1 && (tableStart === -1 || index < tableStart)) {
      tableStart = index;
    }
  }
  
  let tableEnd = rawText.length;
  for (const marker of tableEndMarkers) {
    const index = rawText.indexOf(marker, tableStart);
    if (index !== -1 && index < tableEnd) {
      tableEnd = index;
    }
  }
  
  // 5. 構建處理後嘅文本
  let processedText = '';
  
  if (orderRef) {
    processedText += `Order Reference: ${orderRef}\n`;
  }
  
  if (accountNum) {
    processedText += `Account No: ${accountNum}\n`;
  } else {
    processedText += `Account No: [EXTRACT_FROM_TEXT]\n`;
  }
  
  if (deliveryAdd) {
    processedText += `Delivery Address: ${deliveryAdd}\n`;
  } else {
    processedText += `Delivery Address: [EXTRACT_FROM_TEXT]\n`;
  }
  
  processedText += '\n';
  
  if (tableStart !== -1) {
    const tableContent = rawText.substring(tableStart, tableEnd);
    
    // 清理表格內容，只保留產品行
    const lines = tableContent.split('\n');
    const cleanedLines = [];
    let skipNext = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 跳過標題行
      if (trimmedLine.includes('Item Code') || 
          trimmedLine.includes('Pack Size') ||
          trimmedLine.includes('Description') ||
          trimmedLine.includes('Qty Req')) {
        cleanedLines.push(trimmedLine);
        continue;
      }
      
      // 跳過非產品行
      if (trimmedLine.match(/^(Weight|Pack|Booked|Tel:|Email:|Site Tel|Priority|Price Band|Credit Position|Account Balance|Pallet Qty|Parcel \d+|Lancashire|Ashton)/i)) {
        continue;
      }
      
      // 跳過純數字行（電話號碼）
      if (trimmedLine.match(/^\d{5,}\s+\d{3,}\s+\d{3,}$/)) {
        continue;
      }
      
      // 跳過純地址/郵編行
      if (trimmedLine.match(/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/) || // UK postcode
          trimmedLine.match(/^(NSW|VIC|QLD|SA|WA|TAS|ACT|NT)\s+\d{4}$/) || // AU postcode
          trimmedLine.match(/^\d{5,}$/) || // 純數字（電話）
          trimmedLine.match(/^[A-Za-z\s,]+$/) && trimmedLine.length < 30) { // 短地名
        continue;
      }
      
      // 保留可能是產品行的內容
      if (trimmedLine.length > 0) {
        cleanedLines.push(trimmedLine);
      }
    }
    
    processedText += `Product Table:\n${cleanedLines.join('\n')}`;
  }
  
  const reduction = ((rawText.length - processedText.length) / rawText.length * 100).toFixed(1);
  console.log(`處理後文本長度: ${processedText.length} 字符 (減少 ${reduction}%)`);
  
  return {
    processed: processedText,
    orderRef,
    accountNum,
    deliveryAdd,
    reduction
  };
}

// 分析單個 PDF
async function analyzePDF(pdfFile) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📄 分析 PDF: ${pdfFile}`);
  console.log(`${'='.repeat(80)}\n`);
  
  try {
    const pdfPath = path.join(process.cwd(), 'public/pdf', pdfFile);
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(dataBuffer);
    
    console.log(`PDF 信息:`);
    console.log(`- 頁數: ${pdfData.numpages}`);
    console.log(`- PDF 版本: ${pdfData.version}`);
    console.log(`- 創建者: ${pdfData.info?.Creator || 'Unknown'}`);
    console.log(`\n`);
    
    // 預處理文本
    const result = preprocessPdfText(pdfData.text);
    
    console.log(`\n提取嘅關鍵信息:`);
    console.log(`- 訂單號: ${result.orderRef || '未找到'}`);
    console.log(`- 帳號: ${result.accountNum || '未找到'}`);
    console.log(`- 送貨地址: ${result.deliveryAdd || '未找到'}`);
    
    console.log(`\n處理後嘅文本（發送給 OpenAI）:`);
    console.log('-'.repeat(80));
    console.log(result.processed);
    console.log('-'.repeat(80));
    
    // 嘗試識別產品行
    const productLines = result.processed.split('\n').filter(line => {
      // 簡單嘅產品行識別邏輯
      return line.match(/^[A-Z0-9]+\s+/) && !line.includes('Product Table:') && !line.includes('Item Code');
    });
    
    if (productLines.length > 0) {
      console.log(`\n識別到嘅產品行 (${productLines.length} 行):`);
      productLines.slice(0, 5).forEach(line => {
        console.log(`  - ${line}`);
      });
      if (productLines.length > 5) {
        console.log(`  ... 還有 ${productLines.length - 5} 行`);
      }
    }
    
  } catch (error) {
    console.error(`❌ 分析失敗: ${error.message}`);
  }
}

// 主函數
async function main() {
  console.log('🚀 開始本地 PDF 分析...\n');
  
  for (const pdfFile of testPDFs) {
    await analyzePDF(pdfFile);
  }
  
  console.log(`\n✅ 分析完成！`);
  console.log(`\n💡 建議:`);
  console.log(`1. 檢查每個 PDF 嘅提取結果是否正確`);
  console.log(`2. 如果有遺漏或錯誤，調整 preprocessPdfText 函數中嘅規則`);
  console.log(`3. 更新 docs/openAI_pdf_prompt 文件以改進 OpenAI 嘅識別準確性`);
}

// 運行
main().catch(console.error);