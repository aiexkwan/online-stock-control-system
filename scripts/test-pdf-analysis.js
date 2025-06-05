const fs = require('fs');
const path = require('path');

// Test script to verify PDF analysis functionality
console.log('PDF Analysis Test Script');
console.log('========================');

// Check if OpenAI API key is available
const openaiKey = process.env.OPENAI_API_KEY;
if (!openaiKey) {
  console.error('❌ OPENAI_API_KEY environment variable is not set');
  console.log('Please add OPENAI_API_KEY to your .env.local file');
  process.exit(1);
} else {
  console.log('✅ OpenAI API key is configured');
}

// Check if Supabase credentials are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials are not properly configured');
  process.exit(1);
} else {
  console.log('✅ Supabase credentials are configured');
}

// Check if the API route exists
const apiPath = path.join(__dirname, '../app/api/analyze-order-pdf/route.ts');
if (fs.existsSync(apiPath)) {
  console.log('✅ analyze-order-pdf API route exists');
} else {
  console.error('❌ analyze-order-pdf API route not found');
  process.exit(1);
}

// Check if OpenAI package is installed
try {
  require('openai');
  console.log('✅ OpenAI package is installed');
} catch (error) {
  console.error('❌ OpenAI package is not installed');
  console.log('Run: npm install openai');
  process.exit(1);
}

console.log('\n🎉 All checks passed! PDF analysis functionality should work correctly.');
console.log('\nTo test the functionality:');
console.log('1. Start the development server: npm run dev');
console.log('2. Go to Admin panel > Upload Documents');
console.log('3. Switch to "AI Order Analysis" tab');
console.log('4. Upload a PDF order document');
console.log('5. Click "Analyze with AI" to extract order data');

console.log('\nNote: Make sure your PDF contains order information with:');
console.log('- Account numbers');
console.log('- Order references');
console.log('- Customer information');
console.log('- Product details');
console.log('- Quantities and prices'); 