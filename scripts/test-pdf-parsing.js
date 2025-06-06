// Test script to debug PDF parsing issue
const fs = require('fs');

// Simulate OpenAI response examples
const testResponses = [
  // Case 1: Valid JSON array
  `[{"account_num":12345,"order_ref":67890,"customer_ref":11111,"invoice_to":"ABC Ltd","delivery_add":"123 Street","product_code":"PROD001","product_desc":"Product Name","product_qty":10,"unit_price":1250}]`,
  
  // Case 2: JSON with markdown
  `\`\`\`json
[{"account_num":12345,"order_ref":67890,"customer_ref":11111,"invoice_to":"ABC Ltd","delivery_add":"123 Street","product_code":"PROD001","product_desc":"Product Name","product_qty":10,"unit_price":1250}]
\`\`\``,
  
  // Case 3: JSON with explanation
  `Here is the extracted data:
[{"account_num":12345,"order_ref":67890,"customer_ref":11111,"invoice_to":"ABC Ltd","delivery_add":"123 Street","product_code":"PROD001","product_desc":"Product Name","product_qty":10,"unit_price":1250}]`,
  
  // Case 4: Wrapped in object
  `{"orders":[{"account_num":12345,"order_ref":67890,"customer_ref":11111,"invoice_to":"ABC Ltd","delivery_add":"123 Street","product_code":"PROD001","product_desc":"Product Name","product_qty":10,"unit_price":1250}]}`,
  
  // Case 5: Invalid format
  `I found the following order information:
- Account: 12345
- Order: 67890
- Customer: 11111`,
  
  // Case 6: Empty response
  ``,
  
  // Case 7: Text only response
  `I couldn't find any order information in the provided document.`
];

function parseResponse(extractedContent) {
  console.log('\n=== Testing Response ===');
  console.log('Original:', extractedContent.substring(0, 100) + '...');
  
  try {
    // 嘗試多種清理方式
    let cleanContent = extractedContent.trim();
    
    // 移除 markdown 代碼塊標記
    cleanContent = cleanContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    
    // 移除可能的 BOM 或其他不可見字符
    cleanContent = cleanContent.replace(/^\uFEFF/, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
    
    // 如果內容包含多餘的文字說明，嘗試提取 JSON 部分
    const jsonMatch = cleanContent.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (jsonMatch) {
      cleanContent = jsonMatch[1];
    }
    
    console.log('Cleaned:', cleanContent.substring(0, 100) + '...');
    
    let orderData;
    
    // 如果內容被包裹在對象中，嘗試提取數組
    if (cleanContent.startsWith('{')) {
      const parsed = JSON.parse(cleanContent);
      console.log('Parsed as object, keys:', Object.keys(parsed));
      
      if (parsed.orders && Array.isArray(parsed.orders)) {
        orderData = parsed.orders;
      } else if (parsed.data && Array.isArray(parsed.data)) {
        orderData = parsed.data;
      } else if (parsed.items && Array.isArray(parsed.items)) {
        orderData = parsed.items;
      } else if (parsed.records && Array.isArray(parsed.records)) {
        orderData = parsed.records;
      } else {
        // 查找任何數組屬性
        const arrayProp = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
        if (arrayProp) {
          console.log('Found array property:', arrayProp);
          orderData = parsed[arrayProp];
        } else {
          throw new Error('No array found in response object');
        }
      }
    } else if (cleanContent.startsWith('[')) {
      // 直接解析為數組
      orderData = JSON.parse(cleanContent);
    } else {
      // 如果不是標準 JSON 格式，嘗試其他方法
      console.error('Content is not valid JSON format');
      throw new Error('Response is not valid JSON format');
    }
    
    if (!Array.isArray(orderData)) {
      console.error('Parsed result is not an array:', typeof orderData);
      throw new Error('Response is not an array');
    }
    
    console.log(`✅ Success! Parsed ${orderData.length} records`);
    console.log('First record:', JSON.stringify(orderData[0], null, 2));
    
  } catch (error) {
    console.error('❌ Failed to parse:', error.message);
  }
}

// Test all responses
testResponses.forEach((response, index) => {
  console.log(`\n\n========== Test Case ${index + 1} ==========`);
  parseResponse(response);
});

console.log('\n\n=== Testing with actual problematic response ===');
// Add any actual response that's failing here
const problematicResponse = `Based on the provided document, I'll extract the order information and return it in the requested JSON format:

[
  {
    "account_num": 0,
    "order_ref": 0,
    "customer_ref": 0,
    "invoice_to": "NOT_FOUND",
    "delivery_add": "NOT_FOUND",
    "product_code": "NOT_FOUND",
    "product_desc": "NOT_FOUND",
    "product_qty": 0,
    "unit_price": 0
  }
]`;

parseResponse(problematicResponse); 