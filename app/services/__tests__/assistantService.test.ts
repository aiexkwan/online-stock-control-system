/**
 * AssistantService 測試文件
 * 驗證 OpenAI SDK v4.104.0 兼容性
 */

import { AssistantService } from '../assistantService';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      beta: {
        vectorStores: {
          create: jest.fn().mockResolvedValue({
            id: 'vs_test123',
            name: 'Test Vector Store',
            object: 'vector_store',
            created_at: Math.floor(Date.now() / 1000),
            usage_bytes: 0,
            file_counts: { in_progress: 0, completed: 0, failed: 0, cancelled: 0, total: 0 },
            status: 'completed'
          }),
          files: {
            create: jest.fn().mockResolvedValue({
              id: 'vsf_test123',
              object: 'vector_store.file',
              created_at: Math.floor(Date.now() / 1000),
              vector_store_id: 'vs_test123',
              status: 'in_progress',
              last_error: null,
              usage_bytes: 0,
              chunking_strategy: { type: 'static', static: { max_chunk_size_tokens: 800, chunk_overlap_tokens: 400 } }
            }),
            retrieve: jest.fn().mockResolvedValue({
              id: 'vsf_test123',
              status: 'completed',
              created_at: Math.floor(Date.now() / 1000),
              bytes: 1024
            }),
            del: jest.fn().mockResolvedValue({
              id: 'vsf_test123',
              object: 'vector_store.file.deleted',
              deleted: true
            })
          }
        },
        assistants: {
          create: jest.fn().mockResolvedValue({
            id: 'asst_test123',
            object: 'assistant',
            name: 'Test Assistant',
            model: 'gpt-4-turbo-preview',
            instructions: 'Test instructions',
            tools: [],
            created_at: Math.floor(Date.now() / 1000),
            tool_resources: null,
            metadata: {}
          })
        },
        threads: {
          create: jest.fn().mockResolvedValue({
            id: 'thread_test123',
            object: 'thread',
            created_at: Math.floor(Date.now() / 1000),
            metadata: {},
            tool_resources: null
          }),
          messages: {
            create: jest.fn().mockResolvedValue({
              id: 'msg_test123',
              object: 'thread.message',
              created_at: Math.floor(Date.now() / 1000),
              assistant_id: null,
              thread_id: 'thread_test123',
              run_id: null,
              role: 'user',
              content: [],
              attachments: [],
              metadata: {}
            }),
            list: jest.fn().mockResolvedValue({
              object: 'list',
              data: [{
                id: 'msg_assistant_test123',
                object: 'thread.message',
                created_at: Math.floor(Date.now() / 1000),
                assistant_id: 'asst_test123',
                thread_id: 'thread_test123',
                run_id: 'run_test123',
                role: 'assistant',
                content: [{
                  type: 'text',
                  text: {
                    value: '{"order_ref": "TEST001", "products": []}',
                    annotations: []
                  }
                }],
                attachments: [],
                metadata: {}
              }],
              first_id: 'msg_assistant_test123',
              last_id: 'msg_assistant_test123',
              has_more: false
            })
          },
          runs: {
            create: jest.fn().mockResolvedValue({
              id: 'run_test123',
              object: 'thread.run',
              created_at: Math.floor(Date.now() / 1000),
              assistant_id: 'asst_test123',
              thread_id: 'thread_test123',
              status: 'queued',
              started_at: null,
              expires_at: null,
              cancelled_at: null,
              failed_at: null,
              completed_at: null,
              required_action: null,
              last_error: null,
              model: 'gpt-4-turbo-preview',
              instructions: 'Test instructions',
              tools: [],
              tool_resources: null,
              metadata: {},
              temperature: 1.0,
              top_p: 1.0,
              max_completion_tokens: null,
              max_prompt_tokens: null,
              truncation_strategy: { type: 'auto', last_messages: null },
              incomplete_details: null,
              usage: null,
              response_format: 'auto',
              tool_choice: 'auto',
              parallel_tool_calls: true
            }),
            retrieve: jest.fn().mockResolvedValue({
              id: 'run_test123',
              object: 'thread.run',
              created_at: Math.floor(Date.now() / 1000),
              assistant_id: 'asst_test123',
              thread_id: 'thread_test123',
              status: 'completed',
              started_at: Math.floor(Date.now() / 1000),
              expires_at: null,
              cancelled_at: null,
              failed_at: null,
              completed_at: Math.floor(Date.now() / 1000),
              required_action: null,
              last_error: null,
              model: 'gpt-4-turbo-preview',
              instructions: 'Test instructions',
              tools: [],
              tool_resources: null,
              metadata: {},
              temperature: 1.0,
              top_p: 1.0,
              max_completion_tokens: null,
              max_prompt_tokens: null,
              truncation_strategy: { type: 'auto', last_messages: null },
              incomplete_details: null,
              usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
              response_format: 'auto',
              tool_choice: 'auto',
              parallel_tool_calls: true
            })
          },
          del: jest.fn().mockResolvedValue({
            id: 'thread_test123',
            object: 'thread.deleted',
            deleted: true
          })
        }
      },
      files: {
        create: jest.fn().mockResolvedValue({
          id: 'file_test123',
          object: 'file',
          filename: 'test.pdf',
          bytes: 1024,
          created_at: Math.floor(Date.now() / 1000),
          purpose: 'assistants',
          status: 'processed',
          status_details: null
        }),
        del: jest.fn().mockResolvedValue({
          id: 'file_test123',
          object: 'file',
          deleted: true
        })
      }
    }))
  };
});

// Mock logger
jest.mock('@/lib/logger', () => ({
  systemLogger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock config
jest.mock('@/lib/openai-assistant-config', () => ({
  ORDER_ANALYZER_CONFIG: {
    model: 'gpt-4-turbo-preview',
    name: 'Test Assistant',
    instructions: 'Test instructions',
    tools: [{ type: 'file_search' }]
  },
  ASSISTANT_RETRY_CONFIG: {
    maxAttempts: 3,
    pollInterval: 1000,
    timeout: 30000
  }
}));

describe('AssistantService', () => {
  let service: AssistantService;

  beforeAll(() => {
    // 設置環境變數
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  beforeEach(() => {
    // 獲取服務實例
    service = AssistantService.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('SDK 兼容性檢查', () => {
    it('應該正確初始化並通過兼容性檢查', () => {
      expect(service).toBeInstanceOf(AssistantService);
    });

    it('應該能夠獲取 Vector Stores API', () => {
      // @ts-ignore - 測試私有方法
      const vectorStoresAPI = service.getVectorStoresAPI();
      expect(vectorStoresAPI).toBeDefined();
      expect((vectorStoresAPI as { create?: unknown }).create).toBeDefined();
      expect((vectorStoresAPI as { files?: unknown }).files).toBeDefined();
    });
  });

  describe('Vector Store 管理', () => {
    it('應該能夠創建新的 vector store', async () => {
      const vectorStoreId = await service.getOrCreateVectorStore();
      expect(vectorStoreId).toBe('vs_test123');
    });

    it('應該能夠上傳文件到 vector store', async () => {
      const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileId = await service.uploadFileToVectorStore(testFile, 'test.pdf');
      expect(fileId).toBe('file_test123');
    });

    it('應該能夠從 vector store 中刪除文件', async () => {
      // 首先創建一個 vector store
      await service.getOrCreateVectorStore();
      
      // 然後刪除文件 (不應該拋出錯誤)
      await expect(service.removeFileFromVectorStore('file_test123')).resolves.toBeUndefined();
    });
  });

  describe('Assistant 管理', () => {
    it('應該能夠創建或獲取 Assistant', async () => {
      const assistantId = await service.getAssistant();
      expect(assistantId).toBe('asst_test123');
    });

    it('應該能夠創建新的 Thread', async () => {
      const threadId = await service.createThread();
      expect(threadId).toBe('thread_test123');
    });

    it('應該能夠發送消息', async () => {
      const threadId = 'thread_test123';
      await expect(
        service.sendMessage(threadId, 'Test message', 'file_test123')
      ).resolves.toBeUndefined();
    });

    it('應該能夠運行 Assistant 並等待完成', async () => {
      const result = await service.runAndWait('thread_test123', 'asst_test123');
      expect(result).toBe('{"order_ref": "TEST001", "products": []}');
    });
  });

  describe('響應解析', () => {
    it('應該能夠解析標準格式的 JSON 響應', () => {
      const response = '{"order_ref": "TEST001", "products": [{"product_code": "P001", "description": "Test Product", "quantity": 10, "unit_price": 5.99}]}';
      const parsed = service.parseAssistantResponse(response);
      
      expect(parsed.order_ref).toBe('TEST001');
      expect(parsed.products).toHaveLength(1);
      expect(parsed.products[0].product_code).toBe('P001');
    });

    it('應該能夠解析 markdown 代碼塊中的 JSON', () => {
      const response = '```json\n{"order_ref": "TEST002", "products": []}\n```';
      const parsed = service.parseAssistantResponse(response);
      
      expect(parsed.order_ref).toBe('TEST002');
      expect(parsed.products).toHaveLength(0);
    });

    it('應該能夠處理新格式的 orders 數組', () => {
      const response = '{"orders": [{"order_ref": "TEST003", "product_code": "P001", "product_desc": "Test", "product_qty": 5, "unit_price": 10.0}]}';
      const parsed = service.parseAssistantResponse(response);
      
      expect(parsed.order_ref).toBe('TEST003');
      expect(parsed.products).toHaveLength(1);
      expect(parsed.products[0].product_code).toBe('P001');
    });
  });

  describe('錯誤處理', () => {
    it('應該處理無效的 JSON 響應', () => {
      const invalidResponse = 'This is not valid JSON';
      
      expect(() => service.parseAssistantResponse(invalidResponse))
        .toThrow('Failed to parse assistant response as JSON');
    });

    it('應該處理錯誤消息響應', () => {
      const errorResponse = 'Sorry, I encountered an error processing your request';
      
      expect(() => service.parseAssistantResponse(errorResponse))
        .toThrow('Assistant returned an error message');
    });
  });

  describe('清理操作', () => {
    it('應該能夠清理資源', async () => {
      await expect(
        service.cleanup('thread_test123', 'file_test123')
      ).resolves.toBeUndefined();
    });
  });
});