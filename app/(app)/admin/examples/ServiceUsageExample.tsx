'use client';

import React from 'react';
import { ServiceProvider, useServiceContainer, useServiceHealth } from '../context/ServiceContext';
import { MockServiceFactory } from '../services/mockServices';

/**
 * 基本服務使用示例
 */
function BasicServiceExample() {
  const container = useServiceContainer();
  const [response, setResponse] = React.useState<string>('');

  const handleTestChat = async () => {
    try {
      const chatService = container.chatService;
      const result = await chatService.sendMessage('Test message', false);
      const data = await result.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestSuggestions = () => {
    const suggestionService = container.suggestionService;
    const suggestions = suggestionService.generateContextualSuggestions({
      messageHistory: [],
    });
    setResponse(`Suggestions: ${JSON.stringify(suggestions, null, 2)}`);
  };

  return (
    <div className='space-y-4 p-4'>
      <h3 className='text-lg font-semibold'>Basic Service Usage</h3>
      <div className='space-x-2'>
        <button onClick={handleTestChat} className='rounded bg-blue-500 px-4 py-2 text-white'>
          Test Chat Service
        </button>
        <button
          onClick={handleTestSuggestions}
          className='rounded bg-green-500 px-4 py-2 text-white'
        >
          Test Suggestions
        </button>
      </div>
      {response && <pre className='overflow-auto rounded bg-gray-100 p-2 text-sm'>{response}</pre>}
    </div>
  );
}

/**
 * 服務健康檢查示例
 */
function ServiceHealthExample() {
  const { healthStatus, performHealthCheck, isReady } = useServiceHealth();

  return (
    <div className='space-y-4 p-4'>
      <h3 className='text-lg font-semibold'>Service Health Monitoring</h3>
      <div className='space-y-2'>
        <p>Ready: {isReady ? 'Yes' : 'No'}</p>
        <button
          onClick={performHealthCheck}
          disabled={!isReady}
          className='rounded bg-purple-500 px-4 py-2 text-white disabled:opacity-50'
        >
          Check Health
        </button>
        {healthStatus && (
          <div className='rounded bg-gray-100 p-2'>
            <p>
              <strong>Overall Health:</strong> {healthStatus.overall ? 'Good' : 'Issues'}
            </p>
            <p>
              <strong>Chat Service:</strong> {healthStatus.services.chat ? 'OK' : 'Error'}
            </p>
            <p>
              <strong>Suggestion Service:</strong>{' '}
              {healthStatus.services.suggestion ? 'OK' : 'Error'}
            </p>
            <p>
              <strong>Formatting Service:</strong>{' '}
              {healthStatus.services.formatting ? 'OK' : 'Error'}
            </p>
            {healthStatus.issues && healthStatus.issues.length > 0 && (
              <div>
                <strong>Issues:</strong>
                <ul className='list-inside list-disc'>
                  {healthStatus.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            {healthStatus.lastCheck && (
              <p>
                <strong>Last Check:</strong> {healthStatus.lastCheck.toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Mock 服務替換示例
 */
function MockServiceExample() {
  const container = useServiceContainer();
  const [mockEnabled, setMockEnabled] = React.useState(false);
  const [response, setResponse] = React.useState<string>('');

  const handleToggleMock = () => {
    if (!mockEnabled) {
      // 替換為 Mock 服務
      const mockChatService = MockServiceFactory.createChatService();
      mockChatService.setMockResponse('This is a mock response from injected service!');
      container.replaceChatService(mockChatService);

      const mockSuggestionService = MockServiceFactory.createSuggestionService();
      mockSuggestionService.setMockSuggestions(['Mock suggestion 1', 'Mock suggestion 2']);
      container.replaceSuggestionService(mockSuggestionService);

      setMockEnabled(true);
      setResponse('Mock services injected successfully!');
    } else {
      setResponse('Mock services are active. Refresh page to restore original services.');
    }
  };

  const handleTestMockService = async () => {
    try {
      const result = await container.chatService.sendMessage('Test mock message');
      const data = await result.json();
      setResponse(`Mock Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className='space-y-4 p-4'>
      <h3 className='text-lg font-semibold'>Mock Service Injection</h3>
      <div className='space-x-2'>
        <button
          onClick={handleToggleMock}
          className={`rounded px-4 py-2 text-white ${mockEnabled ? 'bg-orange-500' : 'bg-blue-500'}`}
        >
          {mockEnabled ? 'Mocks Active' : 'Inject Mock Services'}
        </button>
        {mockEnabled && (
          <button
            onClick={handleTestMockService}
            className='rounded bg-green-500 px-4 py-2 text-white'
          >
            Test Mock Service
          </button>
        )}
      </div>
      {response && <pre className='overflow-auto rounded bg-gray-100 p-2 text-sm'>{response}</pre>}
    </div>
  );
}

/**
 * 完整的服務使用示例
 */
export function ServiceUsageExamples() {
  return (
    <ServiceProvider
      config={{
        environment: 'development',
        enableMocking: false,
        logLevel: 'debug',
        chat: {
          apiEndpoint: '/api/ask-database',
          maxRetries: 2,
          cacheTimeout: 5 * 60 * 1000, // 5 minutes for demo
          enableStreaming: true,
        },
        suggestion: {
          maxSuggestions: 8,
          contextWindow: 5,
          enablePersonalization: true,
        },
        formatting: {
          maxListItems: 15,
          truncateLength: 500,
          showTimestamp: true,
          highlightKeywords: ['test', 'demo', 'example'],
        },
      }}
      enableDevTools={true}
      onError={error => {
        console.error('Example service error:', error);
      }}
      onServiceRecovery={serviceName => {
        console.log(`Example service ${serviceName} recovered`);
      }}
    >
      <div className='mx-auto max-w-4xl space-y-8 p-6'>
        <h2 className='text-center text-2xl font-bold'>Dependency Injection Service Examples</h2>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <div className='rounded-lg border'>
            <BasicServiceExample />
          </div>

          <div className='rounded-lg border'>
            <ServiceHealthExample />
          </div>

          <div className='rounded-lg border md:col-span-2'>
            <MockServiceExample />
          </div>
        </div>

        <div className='text-center text-sm text-gray-600'>
          <p>Open browser devtools to see debug logs and access __SERVICE_CONTAINER__</p>
          <p>This demonstrates loose coupling, testability, and service replacement</p>
        </div>
      </div>
    </ServiceProvider>
  );
}

export default ServiceUsageExamples;
