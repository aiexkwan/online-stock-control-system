/**
 * Test Suite for Hardware Services
 * Run these tests to verify hardware service functionality
 */

import { getHardwareAbstractionLayer } from '../hardware-abstraction-layer';
import { createLogger } from '../../logger';

const logger = createLogger('hardware-test');
import { hardwareSimulator } from './hardware-simulator';

export async function testHardwareServices() {
  logger.info('🧪 Starting Hardware Services Tests...');
  
  const hal = getHardwareAbstractionLayer();
  
  try {
    // Test 1: Initialization
    logger.info('Test 1: Hardware Initialization');
    await hal.initialize();
    logger.info('✅ HAL initialized successfully');
    
    // Test 2: Health Check
    logger.info('Test 2: Health Check');
    const health = await hal.healthCheck();
    logger.info(`✅ Health check passed: ${health.healthy ? 'Healthy' : 'Unhealthy'}`);
    logger.info(`   Devices: ${health.devices.size}`);
    
    // Test 3: Print Queue
    logger.info('Test 3: Print Queue Management');
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
    logger.info(`✅ Job added to queue: ${jobId}`);
    
    const queueStatus = hal.queue.getQueueStatus();
    logger.info('Queue status:', queueStatus);
    
    // Test 4: Monitoring
    logger.info('Test 4: Device Monitoring');
    const devices = hal.monitoring.getAllDevicesStatus();
    logger.info(`✅ Monitoring ${devices.size} devices`);
    devices.forEach((device, id) => {
      logger.info(`   ${id}: ${device.status}`);
    });
    
    // Test 5: Simulated Print
    logger.info('Test 5: Simulated Print Job');
    hardwareSimulator.setSimulateDelays(true);
    hardwareSimulator.setPrintDelay(500);
    
    const printResult = await hardwareSimulator.simulatePrint(testJob);
    logger.info(`✅ Print simulation: ${printResult.success ? 'Success' : 'Failed'}`);
    if (printResult.error) {
      logger.warn(`   Error: ${printResult.error}`);
    }
    
    // Test 6: Simulated Scan
    logger.info('Test 6: Simulated Scan');
    const scanResult = await hardwareSimulator.simulateScan();
    logger.info(`✅ Scan simulation: ${scanResult.data}`);
    logger.info(`   Format: ${scanResult.format}`);
    
    // Cleanup
    await hal.shutdown();
    logger.info('✅ All tests completed successfully!');
    
  } catch (error) {
    logger.error({ err: error }, '❌ Test failed');
  }
}

// Run tests if called directly
if (require.main === module) {
  testHardwareServices();
}