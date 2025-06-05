const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually load .env.local file
function loadEnvLocal() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    console.log('Looking for .env.local at:', envPath);
    
    if (!fs.existsSync(envPath)) {
      console.error('❌ .env.local file not found at:', envPath);
      process.exit(1);
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📄 .env.local file content length:', envContent.length);
    
    const lines = envContent.split('\n');
    console.log('📄 Total lines in .env.local:', lines.length);
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          process.env[key] = value;
          console.log(`✅ Loaded: ${key} = ${value.substring(0, 10)}...`);
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

// Test script to verify data_id table access
console.log('\nData ID Table Access Test');
console.log('=========================');

// Check environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Environment check:');
console.log('- SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('- ANON_KEY:', supabaseAnonKey ? '✅ Found' : '❌ Missing');

// Debug: Show all environment variables that start with NEXT_PUBLIC or SUPABASE
console.log('\n🔍 All relevant environment variables:');
Object.keys(process.env).forEach(key => {
  if (key.includes('SUPABASE') || key.includes('OPENAI')) {
    console.log(`${key}: ${process.env[key] ? 'SET' : 'NOT SET'}`);
  }
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ Missing Supabase environment variables');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('Make sure .env.local file exists and contains these variables');
  process.exit(1);
}

console.log('\n✅ Supabase environment variables found');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDataIdAccess() {
  try {
    console.log('\n🔍 Testing data_id table access...');
    
    // Test basic query
    const { data, error, count } = await supabase
      .from('data_id')
      .select('id, email', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.error('❌ Query failed:', error.message);
      console.log('Error details:', error);
      return false;
    }
    
    console.log('✅ Query successful');
    console.log(`📊 Total records accessible: ${count}`);
    
    if (data && data.length > 0) {
      console.log('📝 Sample record:', {
        id: data[0].id,
        email: data[0].email ? data[0].email.substring(0, 3) + '***' : 'null'
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function testSpecificUserLookup() {
  try {
    console.log('\n🔍 Testing specific user lookup...');
    
    // Test lookup by email (using a common test pattern)
    const { data, error } = await supabase
      .from('data_id')
      .select('id, email')
      .eq('email', 'akwan@pennineindustries.com')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('ℹ️  No user found with that email (this is normal for testing)');
      } else {
        console.error('❌ Lookup failed:', error.message);
        console.log('Error code:', error.code);
        return false;
      }
    } else if (data) {
      console.log('✅ User found:', {
        id: data.id,
        email: data.email
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function runTests() {
  try {
    const basicAccess = await testDataIdAccess();
    const userLookup = await testSpecificUserLookup();
    
    console.log('\n📋 Test Results:');
    console.log(`Basic table access: ${basicAccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`User lookup: ${userLookup ? '✅ PASS' : '❌ FAIL'}`);
    
    if (basicAccess && userLookup) {
      console.log('\n🎉 All tests passed! data_id table is accessible.');
      console.log('\n💡 The Upload Order PDF feature should work correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Check RLS policies for data_id table.');
      console.log('\n🔧 Possible solutions:');
      console.log('1. Ensure RLS policies allow authenticated users to read data_id');
      console.log('2. Check if the user exists in the data_id table');
      console.log('3. Verify Supabase connection and permissions');
    }
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
  }
}

runTests(); 