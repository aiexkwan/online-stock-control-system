import React, { useState, useEffect } from 'react';
import { useResourceCleanup } from '@/lib/hooks/useResourceCleanup';
import { useResourceLeakDetector } from '@/lib/monitoring/resource-leak-detector';

interface ExampleComponentProps {
  enableDebugging?: boolean;
  simulateLeaks?: boolean;
}

export const ResourceCleanupExample: React.FC<ExampleComponentProps> = ({
  enableDebugging = false,
  simulateLeaks = false,
}) => {
  const resourceCleanup = useResourceCleanup('ResourceCleanupExample', enableDebugging);
  const leakDetector = useResourceLeakDetector('ResourceCleanupExample');

  const [counter, setCounter] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  const addLog = (message: string) => {
    setLogs(prev => [`${new Date().toISOString()}: ${message}`, ...prev.slice(0, 9)]);
  };

  useEffect(() => {
    if (enableDebugging) {
      leakDetector.startMonitoring(report => {
        addLog(`LEAK DETECTED: ${report.leakType} in ${report.componentName} (${report.severity})`);
        console.warn('Leak detected:', report);
      });
    }

    return () => {
      leakDetector.stopMonitoring();
    };
  }, [enableDebugging, leakDetector]);

  useEffect(() => {
    const updateMetrics = () => {
      if (resourceCleanup.isMounted()) {
        setMetrics(resourceCleanup.getMetrics());
      }
    };

    const metricsInterval = resourceCleanup.createInterval(updateMetrics, 1000, 'metricsUpdate');

    updateMetrics();
  }, [resourceCleanup]);

  const startCountdown = () => {
    addLog('Starting 5-second countdown...');

    let count = 5;
    const countdownInterval = resourceCleanup.createInterval(
      () => {
        if (count > 0) {
          addLog(`Countdown: ${count}`);
          count--;
        } else {
          addLog('Countdown completed!');
          resourceCleanup.clearInterval(countdownInterval);
        }
      },
      1000,
      'countdown'
    );
  };

  const setupEventListeners = () => {
    addLog('Setting up window event listeners...');

    const handleResize = () => {
      addLog(`Window resized: ${window.innerWidth}x${window.innerHeight}`);
    };

    const handleKeyPress = (e: Event) => {
      const keyEvent = e as KeyboardEvent;
      addLog(`Key pressed: ${keyEvent.key}`);
    };

    resourceCleanup.addEventListener(window, 'resize', handleResize, false, 'windowResize');
    resourceCleanup.addEventListener(window, 'keydown', handleKeyPress, false, 'keydown');
  };

  const startDataPolling = async () => {
    if (isPolling) return;

    setIsPolling(true);
    addLog('Starting data polling...');

    const pollData = async () => {
      const abortController = resourceCleanup.createAbortController('dataPolling');

      try {
        const response = await fetch('/api/data', {
          signal: abortController.signal,
        });

        if (!abortController.signal.aborted) {
          addLog('Data polling response received');
          setCounter(prev => prev + 1);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          addLog('Data polling aborted');
        } else {
          addLog(`Polling error: ${error.message}`);
        }
      }
    };

    const pollInterval = resourceCleanup.createInterval(pollData, 2000, 'dataPoll');
  };

  const stopDataPolling = () => {
    setIsPolling(false);
    addLog('Stopping data polling...');
  };

  const simulateMemoryLeak = () => {
    addLog('Simulating memory leak (creating unmanaged resources)...');

    if (simulateLeaks) {
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          console.log('Leaked timeout executed:', i);
        }, 5000);
      }

      for (let i = 0; i < 5; i++) {
        setInterval(() => {
          console.log('Leaked interval executed:', i);
        }, 3000);
      }
    } else {
      addLog('Leak simulation disabled in props');
    }
  };

  const forceCleanup = () => {
    addLog('Forcing resource cleanup...');
    resourceCleanup.forceCleanup();
    setIsPolling(false);
    addLog('All resources cleaned up');
  };

  const checkForLeaks = () => {
    const leakCheck = resourceCleanup.checkForLeaks();
    if (leakCheck.hasLeaks) {
      addLog(`LEAKS DETECTED: ${leakCheck.warnings.join(', ')}`);
    } else {
      addLog('No leaks detected');
    }
  };

  return (
    <div className='mx-auto max-w-4xl p-6'>
      <div className='rounded-lg bg-white p-6 shadow-lg'>
        <h2 className='mb-4 text-2xl font-bold text-gray-800'>Resource Cleanup System Example</h2>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <div>
            <h3 className='mb-3 text-lg font-semibold'>Controls</h3>
            <div className='space-y-2'>
              <button
                onClick={startCountdown}
                className='w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600'
              >
                Start Countdown Timer
              </button>

              <button
                onClick={setupEventListeners}
                className='w-full rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600'
              >
                Setup Event Listeners
              </button>

              <button
                onClick={isPolling ? stopDataPolling : startDataPolling}
                className={`w-full rounded px-4 py-2 text-white ${
                  isPolling ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-500 hover:bg-purple-600'
                }`}
              >
                {isPolling ? 'Stop' : 'Start'} Data Polling
              </button>

              <button
                onClick={simulateMemoryLeak}
                className='w-full rounded bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600'
                disabled={!simulateLeaks}
              >
                Simulate Memory Leak
              </button>

              <button
                onClick={checkForLeaks}
                className='w-full rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600'
              >
                Check for Leaks
              </button>

              <button
                onClick={forceCleanup}
                className='w-full rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600'
              >
                Force Cleanup
              </button>
            </div>
          </div>

          <div>
            <h3 className='mb-3 text-lg font-semibold'>Status</h3>
            <div className='space-y-2 text-sm'>
              <div>Counter: {counter}</div>
              <div>Polling: {isPolling ? 'Active' : 'Inactive'}</div>
              <div>Component Mounted: {resourceCleanup.isMounted() ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>

        {metrics && (
          <div className='mt-6'>
            <h3 className='mb-3 text-lg font-semibold'>Resource Metrics</h3>
            <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
              <div className='rounded bg-blue-100 p-3'>
                <div className='font-medium'>Timeouts</div>
                <div>Active: {metrics.timeouts.active}</div>
                <div>Created: {metrics.timeouts.totalCreated}</div>
                <div>Cleaned: {metrics.timeouts.cleaned}</div>
              </div>
              <div className='rounded bg-green-100 p-3'>
                <div className='font-medium'>Intervals</div>
                <div>Active: {metrics.intervals.active}</div>
                <div>Created: {metrics.intervals.totalCreated}</div>
                <div>Cleaned: {metrics.intervals.cleaned}</div>
              </div>
              <div className='rounded bg-yellow-100 p-3'>
                <div className='font-medium'>Event Listeners</div>
                <div>Active: {metrics.eventListeners.active}</div>
                <div>Created: {metrics.eventListeners.totalCreated}</div>
                <div>Cleaned: {metrics.eventListeners.cleaned}</div>
              </div>
              <div className='rounded bg-purple-100 p-3'>
                <div className='font-medium'>AbortControllers</div>
                <div>Active: {metrics.abortControllers.active}</div>
                <div>Created: {metrics.abortControllers.totalCreated}</div>
                <div>Aborted: {metrics.abortControllers.aborted}</div>
              </div>
            </div>
            <div className='mt-2'>
              <span
                className={`rounded px-2 py-1 text-xs ${
                  metrics.memoryLeakRisk === 'low'
                    ? 'bg-green-200 text-green-800'
                    : metrics.memoryLeakRisk === 'medium'
                      ? 'bg-yellow-200 text-yellow-800'
                      : metrics.memoryLeakRisk === 'high'
                        ? 'bg-orange-200 text-orange-800'
                        : 'bg-red-200 text-red-800'
                }`}
              >
                Memory Leak Risk: {metrics.memoryLeakRisk.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        <div className='mt-6'>
          <h3 className='mb-3 text-lg font-semibold'>Activity Log</h3>
          <div className='max-h-60 overflow-y-auto rounded bg-gray-50 p-4'>
            {logs.length === 0 ? (
              <div className='italic text-gray-500'>No activity yet...</div>
            ) : (
              <div className='space-y-1'>
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`text-xs ${
                      log.includes('LEAK')
                        ? 'font-bold text-red-600'
                        : log.includes('error') || log.includes('Error')
                          ? 'text-red-600'
                          : log.includes('completed') || log.includes('success')
                            ? 'text-green-600'
                            : 'text-gray-700'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceCleanupExample;
