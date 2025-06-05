const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually load .env.local file
function loadEnvLocal() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          process.env[key] = value;
        }
      }
    });
    
    console.log('✅ Successfully loaded .env.local file');
  } catch (error) {
    console.error('❌ Failed to load .env.local file:', error.message);
    process.exit(1);
  }
}

// Load environment variables
loadEnvLocal();

// Test script to verify PDF upload functionality
console.log('\nPDF Upload Test');
console.log('===============');

// Check environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log('- SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('- SERVICE_KEY:', supabaseServiceKey ? '✅ Found' : '❌ Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Missing Supabase environment variables');
  console.log('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('\n✅ Supabase environment variables found');

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testBucketAccess() {
  try {
    console.log('\n🔍 Testing orderpdf bucket access...');
    
    // List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError.message);
      return false;
    }
    
    console.log('📦 Available buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    // Check if orderpdf bucket exists
    const orderpdfBucket = buckets.find(bucket => bucket.name === 'orderpdf');
    
    if (!orderpdfBucket) {
      console.log('\n⚠️  orderpdf bucket not found');
      console.log('💡 You may need to create the orderpdf bucket in Supabase Dashboard');
      return false;
    }
    
    console.log('\n✅ orderpdf bucket found');
    
    // Test bucket access by listing files
    const { data: files, error: listError } = await supabase.storage
      .from('orderpdf')
      .list('', { limit: 1 });
    
    if (listError) {
      console.error('❌ Failed to access orderpdf bucket:', listError.message);
      return false;
    }
    
    console.log(`✅ orderpdf bucket accessible (${files.length} files found)`);
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function testPDFUpload() {
  try {
    console.log('\n🔍 Testing PDF upload functionality...');
    
    // Create a simple test PDF content (minimal PDF structure)
    const testPDFContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF`;
    
    const testFileName = `test-upload-${Date.now()}.pdf`;
    const blob = new Blob([testPDFContent], { type: 'application/pdf' });
    
    console.log(`📄 Uploading test PDF: ${testFileName}`);
    
    // Upload test PDF
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('orderpdf')
      .upload(testFileName, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      return false;
    }
    
    console.log('✅ Upload successful:', uploadData.path);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('orderpdf')
      .getPublicUrl(uploadData.path);
    
    if (urlData && urlData.publicUrl) {
      console.log('✅ Public URL generated:', urlData.publicUrl);
    }
    
    // Clean up - delete test file
    const { error: deleteError } = await supabase.storage
      .from('orderpdf')
      .remove([uploadData.path]);
    
    if (deleteError) {
      console.log('⚠️  Failed to clean up test file:', deleteError.message);
    } else {
      console.log('🧹 Test file cleaned up successfully');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function runTests() {
  try {
    const bucketAccess = await testBucketAccess();
    const pdfUpload = bucketAccess ? await testPDFUpload() : false;
    
    console.log('\n📋 Test Results:');
    console.log(`Bucket access: ${bucketAccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`PDF upload: ${pdfUpload ? '✅ PASS' : '❌ FAIL'}`);
    
    if (bucketAccess && pdfUpload) {
      console.log('\n🎉 All tests passed! PDF upload functionality is working.');
      console.log('\n💡 The Upload Order PDF feature should work correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the following:');
      if (!bucketAccess) {
        console.log('1. Create orderpdf bucket in Supabase Dashboard');
        console.log('2. Set appropriate bucket policies for PDF files');
        console.log('3. Ensure bucket allows application/pdf MIME type');
      }
      if (!pdfUpload) {
        console.log('4. Check storage permissions and policies');
        console.log('5. Verify service role key has storage access');
      }
    }
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
  }
}

runTests(); 