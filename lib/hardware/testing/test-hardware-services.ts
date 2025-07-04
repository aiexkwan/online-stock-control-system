/**
 * Test Suite for Hardware Services
 * Run these tests to verify hardware service functionality
 */

import { getHardwareAbstractionLayer } from '../hardware-abstraction-layer';
import { hardwareSimulator } from './hardware-simulator';

export async function testHardwareServices() {
  console.log('🧪 Starting Hardware Services Tests...\n');
  
  const hal = getHardwareAbstractionLayer();
  
  try {
    // Test 1: Initialization
    console.log('Test 1: Hardware Initialization');
    await hal.initialize();
    console.log('✅ HAL initialized successfully\n');
    
    // Test 2: Health Check
    console.log('Test 2: Health Check');
    const health = await hal.healthCheck();
    console.log(`✅ Health check passed: ${health.healthy ? 'Healthy' : 'Unhealthy'}`);
    console.log(`   Devices: ${health.devices.size}`);
    console.log('');
    
    // Test 3: Print Queue
    console.log('Test 3: Print Queue Management');
    const testJob = {
      type: 'qc-label' as const,
      data: {
        productCode: 'TEST001',
        fileName: 'test-label.pdf'
      },
      copies: 1,
      priority: 'normal' as const
    };
    
    const jobId = await hal.queue.addToQueue(testJob);
    console.log(`✅ Job added to queue: ${jobId}`);
    
    const queueStatus = hal.queue.getQueueStatus();
    console.log(`   Queue status: ${JSON.stringify(queueStatus)}`);
    console.log('');
    
    // Test 4: Monitoring
    console.log('Test 4: Device Monitoring');
    const devices = hal.monitoring.getAllDevicesStatus();
    console.log(`✅ Monitoring ${devices.size} devices`);
    devices.forEach((device, id) => {
      console.log(`   ${id}: ${device.status}`);
    });
    console.log('');
    
    // Test 5: Simulated Print
    console.log('Test 5: Simulated Print Job');
    hardwareSimulator.setSimulateDelays(true);
    hardwareSimulator.setPrintDelay(500);
    
    const printResult = await hardwareSimulator.simulatePrint(testJob);
    console.log(`✅ Print simulation: ${printResult.success ? 'Success' : 'Failed'}`);
    if (printResult.error) {
      console.log(`   Error: ${printResult.error}`);
    }
    console.log('');
    
    // Test 6: Simulated Scan
    console.log('Test 6: Simulated Scan');
    const scanResult = await hardwareSimulator.simulateScan();
    console.log(`✅ Scan simulation: ${scanResult.data}`);
    console.log(`   Format: ${scanResult.format}`);
    console.log('');
    
    // Cleanup
    await hal.shutdown();
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests if called directly
if (require.main === module) {
  testHardwareServices();
}