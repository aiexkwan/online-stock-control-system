const fs = require('fs');
const path = require('path');

// Test extraction directly
async function testExtraction() {
  try {
    const pdfPath = '/Users/chun/Downloads/281513-Picking List.pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.error('PDF file not found at:', pdfPath);
      return;
    }
    
    const fileBuffer = fs.readFileSync(pdfPath);
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    
    formData.append('file', blob, '281513-Picking List.pdf');
    formData.append('fileName', '281513-Picking List.pdf');
    
    console.log('Testing PDF extraction for 281513-Picking List.pdf...');
    console.log('File size:', fileBuffer.length, 'bytes');
    
    const response = await fetch('http://localhost:3001/api/pdf-extract', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      console.error('API request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error:', errorText);
      return;
    }
    
    const result = await response.json();
    
    console.log('\n=== EXTRACTION RESULTS ===');
    console.log('Success:', result.success);
    console.log('Order Ref:', result.data?.order_ref);
    console.log('Total Products:', result.data?.products?.length);
    
    console.log('\n=== PRODUCT DETAILS ===');
    console.log('%-15s %-50s %10s', 'Product Code', 'Description', 'Quantity');
    console.log('-'.repeat(80));
    
    if (result.data?.products) {
      result.data.products.forEach(p => {
        console.log('%-15s %-50s %10d', 
          p.product_code, 
          (p.product_desc || '').substring(0, 50),
          p.product_qty
        );
      });
      
      // Check specific products
      console.log('\n=== VERIFICATION ===');
      const expectedQty = {
        'MHL10': 72,
        'MHL15G': 1,
        'MHL18G': 1,
        'MHL21G': 1,
        'MHL36G': 8,
        'MHL39G': 2,
        'MHL42G': 3,
        'MHL45G': 2,
        'MHL48G': 4,
        'MHL51G': 8
      };
      
      let correctCount = 0;
      let wrongCount = 0;
      
      result.data.products.forEach(p => {
        const expected = expectedQty[p.product_code];
        if (expected !== undefined) {
          if (p.product_qty === expected) {
            console.log(`✓ ${p.product_code}: ${p.product_qty} (correct)`);
            correctCount++;
          } else {
            console.log(`✗ ${p.product_code}: ${p.product_qty} (expected: ${expected})`);
            wrongCount++;
          }
        }
      });
      
      console.log(`\nSummary: ${correctCount} correct, ${wrongCount} wrong`);
    }
    
    // Save raw response for debugging
    fs.writeFileSync('extraction-result.json', JSON.stringify(result, null, 2));
    console.log('\nFull result saved to extraction-result.json');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testExtraction();