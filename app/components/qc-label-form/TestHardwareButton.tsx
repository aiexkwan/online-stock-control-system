'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { getHardwareAbstractionLayer } from '@/lib/hardware/hardware-abstraction-layer';

export function TestHardwareButton() {
  const handleTestHardware = async () => {
    console.log('=== Testing Hardware Services ===');
    
    try {
      const hal = getHardwareAbstractionLayer();
      console.log('1. HAL instance created');
      
      await hal.initialize();
      console.log('2. HAL initialized successfully');
      
      const health = await hal.healthCheck();
      console.log('3. Health check:', health);
      
      console.log('4. Hardware services are READY!');
    } catch (error) {
      console.error('Hardware test failed:', error);
    }
  };
  
  return (
    <Button 
      onClick={handleTestHardware}
      variant="outline"
      className="mb-4"
    >
      Test Hardware Services
    </Button>
  );
}