#!/usr/bin/env node

/**
 * Monitor API calls to dashboard endpoint
 * 監控儀表板 API 調用次數
 */

const http = require('http');
const url = require('url');

let callCount = 0;
let startTime = Date.now();
const callLog = [];

// Create a proxy server to monitor API calls
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // Only monitor dashboard API calls
  if (parsedUrl.pathname.includes('/api/admin/dashboard')) {
    callCount++;
    const timestamp = new Date().toISOString();
    const logEntry = {
      id: callCount,
      timestamp,
      url: req.url,
      method: req.method,
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer,
    };
    
    callLog.push(logEntry);
    
    console.log(`🔥 API CALL #${callCount} at ${timestamp}`);
    console.log(`   URL: ${req.url}`);
    console.log(`   Method: ${req.method}`);
    console.log(`   Referer: ${req.headers.referer || 'N/A'}`);
    console.log('');
    
    // Alert if too many calls
    if (callCount > 20) {
      console.log(`🚨 WARNING: ${callCount} API calls detected! This is excessive.`);
    }
  }
  
  // Proxy the request to the actual Next.js server
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };
  
  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  
  req.pipe(proxy, { end: true });
  
  proxy.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(500);
    res.end('Proxy error');
  });
});

// Report every 30 seconds
setInterval(() => {
  const elapsed = (Date.now() - startTime) / 1000;
  const callsPerMinute = (callCount / elapsed) * 60;
  
  console.log(`📊 REPORT (${elapsed.toFixed(0)}s elapsed):`);
  console.log(`   Total API calls: ${callCount}`);
  console.log(`   Calls per minute: ${callsPerMinute.toFixed(1)}`);
  console.log(`   Target: < 20 total calls`);
  console.log('');
  
  if (callCount > 50) {
    console.log('🚨 CRITICAL: API calls exceeded 50! Please check the code.');
    process.exit(1);
  }
}, 30000);

server.listen(3001, () => {
  console.log('🔍 API Monitor started on http://localhost:3001');
  console.log('📈 Monitoring dashboard API calls...');
  console.log('🎯 Target: < 20 API calls total');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  const elapsed = (Date.now() - startTime) / 1000;
  console.log('\n📊 FINAL REPORT:');
  console.log(`   Total API calls: ${callCount}`);
  console.log(`   Duration: ${elapsed.toFixed(0)}s`);
  console.log(`   Calls per minute: ${((callCount / elapsed) * 60).toFixed(1)}`);
  console.log('');
  
  if (callCount <= 15) {
    console.log('✅ SUCCESS: API calls within acceptable range!');
  } else if (callCount <= 30) {
    console.log('⚠️  WARNING: API calls slightly elevated but acceptable');
  } else {
    console.log('❌ FAILURE: Too many API calls detected');
  }
  
  process.exit(0);
});