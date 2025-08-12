/**
 * Performance Test Script for StockTransferCard
 * Run with: k6 run scripts/performance-test-stock-transfer.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const searchLatency = new Trend('search_latency');
const transferLatency = new Trend('transfer_latency');
const searchErrors = new Rate('search_errors');
const transferErrors = new Rate('transfer_errors');
const successfulTransfers = new Counter('successful_transfers');

// Test configuration
export const options = {
  scenarios: {
    // Scenario 1: Constant load for search operations
    search_operations: {
      executor: 'constant-arrival-rate',
      rate: 50, // 50 requests per second
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 20,
      maxVUs: 50,
      exec: 'searchPalletTest',
      startTime: '0s',
    },
    
    // Scenario 2: Ramping load for transfer operations
    transfer_operations: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      stages: [
        { duration: '30s', target: 20 }, // Ramp up
        { duration: '1m', target: 30 },  // Stay at peak
        { duration: '30s', target: 10 }, // Ramp down
      ],
      preAllocatedVUs: 30,
      maxVUs: 60,
      exec: 'transferPalletTest',
      startTime: '10s',
    },
    
    // Scenario 3: Spike test for concurrent operations
    spike_test: {
      executor: 'shared-iterations',
      vus: 100,
      iterations: 500,
      maxDuration: '2m',
      exec: 'concurrentOperationsTest',
      startTime: '2m30s',
    },
    
    // Scenario 4: Stress test for batch operations
    batch_operations: {
      executor: 'constant-vus',
      vus: 10,
      duration: '1m',
      exec: 'batchTransferTest',
      startTime: '5m',
    },
  },
  
  thresholds: {
    'http_req_duration': ['p(95)<200', 'p(99)<500'], // 95% of requests under 200ms
    'search_latency': ['p(95)<150', 'p(99)<300'],
    'transfer_latency': ['p(95)<250', 'p(99)<500'],
    'search_errors': ['rate<0.01'], // Error rate under 1%
    'transfer_errors': ['rate<0.02'], // Error rate under 2%
    'http_req_failed': ['rate<0.05'], // Overall failure rate under 5%
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

const testPallets = [
  '241224/001',
  '241224/002',
  '241224/003',
  '241223/001',
  '241223/002',
  '241222/001',
  '241221/001',
  '241220/001',
];

const testSeries = [
  'ABC123',
  'DEF456',
  'GHI789',
  'JKL012',
  'MNO345',
];

const testLocations = [
  'A01', 'A02', 'A03', 'A04', 'A05',
  'B01', 'B02', 'B03', 'B04', 'B05',
  'C01', 'C02', 'C03', 'C04', 'C05',
  'Production', 'Ship', 'Await',
];

const testClockNumbers = ['1234', '5678', '9012', '3456'];

// Helper function to get headers
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'X-Test-Type': 'performance',
  };
}

// Test 1: Search Pallet Performance
export function searchPalletTest() {
  const searchValue = randomItem([...testPallets, ...testSeries]);
  const payload = JSON.stringify({
    searchValue: searchValue,
    searchType: searchValue.includes('/') ? 'pallet_num' : 'series',
  });

  const start = Date.now();
  const response = http.post(
    `${BASE_URL}/api/stock-transfer/search`,
    payload,
    {
      headers: getHeaders(),
      tags: { name: 'SearchPallet' },
    }
  );
  const duration = Date.now() - start;

  // Record metrics
  searchLatency.add(duration);
  searchErrors.add(response.status !== 200);

  // Validation checks
  check(response, {
    'search status is 200': (r) => r.status === 200,
    'search response has data': (r) => {
      const body = JSON.parse(r.body);
      return body.success && body.data;
    },
    'search latency < 150ms': () => duration < 150,
  });

  sleep(0.5); // Simulate user think time
}

// Test 2: Transfer Pallet Performance
export function transferPalletTest() {
  const palletNum = randomItem(testPallets);
  const destination = randomItem(testLocations);
  const clockNumber = randomItem(testClockNumbers);

  const payload = JSON.stringify({
    palletNumber: palletNum,
    toLocation: destination,
    clockNumber: clockNumber,
  });

  const start = Date.now();
  const response = http.post(
    `${BASE_URL}/api/stock-transfer/transfer`,
    payload,
    {
      headers: getHeaders(),
      tags: { name: 'TransferPallet' },
    }
  );
  const duration = Date.now() - start;

  // Record metrics
  transferLatency.add(duration);
  transferErrors.add(response.status !== 200);
  
  if (response.status === 200) {
    successfulTransfers.add(1);
  }

  // Validation checks
  check(response, {
    'transfer status is 200': (r) => r.status === 200,
    'transfer response valid': (r) => {
      const body = JSON.parse(r.body);
      return body.success === true || body.success === false;
    },
    'transfer latency < 250ms': () => duration < 250,
  });

  sleep(1); // Simulate user think time
}

// Test 3: Concurrent Operations (Search + Transfer)
export function concurrentOperationsTest() {
  const batch = [
    // Search operation
    {
      method: 'POST',
      url: `${BASE_URL}/api/stock-transfer/search`,
      body: JSON.stringify({
        searchValue: randomItem(testPallets),
        searchType: 'pallet_num',
      }),
      params: {
        headers: getHeaders(),
        tags: { name: 'ConcurrentSearch' },
      },
    },
    // Transfer operation
    {
      method: 'POST',
      url: `${BASE_URL}/api/stock-transfer/transfer`,
      body: JSON.stringify({
        palletNumber: randomItem(testPallets),
        toLocation: randomItem(testLocations),
        clockNumber: randomItem(testClockNumbers),
      }),
      params: {
        headers: getHeaders(),
        tags: { name: 'ConcurrentTransfer' },
      },
    },
    // Validate clock number
    {
      method: 'POST',
      url: `${BASE_URL}/api/stock-transfer/validate-clock`,
      body: JSON.stringify({
        clockNumber: randomItem(testClockNumbers),
      }),
      params: {
        headers: getHeaders(),
        tags: { name: 'ValidateClock' },
      },
    },
  ];

  const responses = http.batch(batch);
  
  // Check all responses
  check(responses[0], {
    'concurrent search OK': (r) => r.status === 200,
  });
  check(responses[1], {
    'concurrent transfer OK': (r) => r.status === 200,
  });
  check(responses[2], {
    'concurrent validation OK': (r) => r.status === 200,
  });
}

// Test 4: Batch Transfer Performance
export function batchTransferTest() {
  const batchSize = Math.floor(Math.random() * 5) + 2; // 2-6 transfers
  const transfers = [];
  
  for (let i = 0; i < batchSize; i++) {
    transfers.push({
      palletNumber: randomItem(testPallets),
      toLocation: randomItem(testLocations),
    });
  }

  const payload = JSON.stringify({
    transfers: transfers,
    clockNumber: randomItem(testClockNumbers),
  });

  const start = Date.now();
  const response = http.post(
    `${BASE_URL}/api/stock-transfer/batch-transfer`,
    payload,
    {
      headers: getHeaders(),
      tags: { name: 'BatchTransfer' },
      timeout: '10s',
    }
  );
  const duration = Date.now() - start;

  // Validation checks
  check(response, {
    'batch transfer status is 200': (r) => r.status === 200,
    'batch transfer completed': (r) => {
      const body = JSON.parse(r.body);
      return body.results && Array.isArray(body.results);
    },
    'batch latency reasonable': () => duration < (batchSize * 200), // 200ms per transfer
  });

  sleep(2); // Longer think time for batch operations
}

// Setup function (run once before tests)
export function setup() {
  // Warm up the system with a few requests
  console.log('Warming up the system...');
  
  for (let i = 0; i < 5; i++) {
    http.post(
      `${BASE_URL}/api/stock-transfer/search`,
      JSON.stringify({
        searchValue: testPallets[0],
        searchType: 'pallet_num',
      }),
      { headers: getHeaders() }
    );
    sleep(0.5);
  }
  
  console.log('Warm-up complete. Starting performance tests...');
  
  return {
    startTime: Date.now(),
    testConfig: {
      baseUrl: BASE_URL,
      totalPallets: testPallets.length,
      totalLocations: testLocations.length,
    },
  };
}

// Teardown function (run once after tests)
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Performance tests completed in ${duration} seconds`);
  
  // You could send summary to monitoring system here
  // e.g., send to Datadog, Grafana, etc.
}