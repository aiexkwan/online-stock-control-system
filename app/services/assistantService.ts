import OpenAI from 'openai';
import { ORDER_ANALYZER_CONFIG, ASSISTANT_RETRY_CONFIG, VECTOR_STORE_CONFIG, MODEL_CONFIG } from '@/lib/openai-assistant-config';
import { systemLogger } from '@/lib/logger';
import { AssistantMessageData, ParsedOrderResponse } from '@/lib/types/openai.types';

/**
 * Assistant 管理服務
 * 負責創建、管理和重用 OpenAI Assistant 和 Vector Stores
 */
export class AssistantService {
  private static instance: AssistantService;
  private openai: OpenAI;
  private assistantId: string | null = null;
  private vectorStoreId: string | null = null;

  private constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    this.openai = new OpenAI({ apiKey });
    
    // 檢查 SDK 版本兼容性
    this.validateSDKCompatibility();
  }

  /**
   * 驗證 OpenAI SDK 版本兼容性
   */
  private validateSDKCompatibility(): void {
    try {
      // 檢查必要的 API 是否存在
      
      // 檢查 vectorStores (現在在頂層)
      const hasTopLevelVectorStores = !!(this.openai as OpenAI & { vectorStores?: unknown }).vectorStores;
      const hasBetaVectorStores = !!(this.openai.beta && (this.openai.beta as { vectorStores?: unknown }).vectorStores);
      const hasVectorStores = hasTopLevelVectorStores || hasBetaVectorStores;
      
      if (!hasVectorStores) {
        throw new Error('Vector Stores API not available. Please upgrade to OpenAI SDK v4.0+');
      }

      // 檢查 assistants (應該在 beta 下)
      if (!this.openai.beta || !this.openai.beta.assistants) {
        throw new Error('Assistants API not available in OpenAI beta namespace. Please upgrade to OpenAI SDK v4.0+');
      }

      // 檢查 threads (應該在 beta 下)
      if (!this.openai.beta || !this.openai.beta.threads) {
        throw new Error('Threads API not available in OpenAI beta namespace. Please upgrade to OpenAI SDK v4.0+');
      }

      systemLogger.info({
        hasBeta: !!this.openai.beta,
        hasTopLevelVectorStores,
        hasBetaVectorStores,
        hasAssistants: !!this.openai.beta.assistants,
        hasThreads: !!this.openai.beta.threads,
      }, '[AssistantService] OpenAI SDK compatibility check passed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown compatibility error';
      systemLogger.error({
        error: errorMessage,
        hasBeta: !!this.openai?.beta,
        hasTopLevelVectorStores: !!(this.openai as OpenAI & { vectorStores?: unknown })?.vectorStores,
        hasBetaVectorStores: !!(this.openai?.beta && (this.openai?.beta as { vectorStores?: unknown })?.vectorStores),
        hasAssistants: !!(this.openai?.beta && this.openai?.beta?.assistants),
      }, '[AssistantService] SDK compatibility check failed');
      throw error;
    }
  }

  /**
   * 獲取 AssistantService 單例實例
   */
  public static getInstance(): AssistantService {
    if (!AssistantService.instance) {
      AssistantService.instance = new AssistantService();
    }
    return AssistantService.instance;
  }

  /**
   * 獲取 Vector Store API 的正確引用
   * 處理不同 SDK 版本可能嘅 API 結構變化
   */
  private getVectorStoresAPI(): { 
    create: (params: { name: string; expires_after?: { anchor: string; days: number } }) => Promise<{ id: string; name?: string }>;
    files: { 
      create: (vectorStoreId: string, params: { file_id: string }) => Promise<{ id: string }>;
      retrieve: (vectorStoreId: string, fileId: string) => Promise<{ status: string; last_error?: { message: string } }>;
      del: (vectorStoreId: string, fileId: string) => Promise<void>;
    };
  } {
    // OpenAI SDK v4.104.0+ 使用頂層 vectorStores (不在 beta 下)
    const topLevelVectorStores = (this.openai as OpenAI & { vectorStores?: unknown }).vectorStores;
    if (topLevelVectorStores) {
      systemLogger.debug('[AssistantService] Using top-level vectorStores API');
      return topLevelVectorStores as unknown as ReturnType<typeof this.getVectorStoresAPI>;
    }
    
    // 向後兼容檢查 - 舊版本可能在 beta 下
    const betaVectorStores = this.openai.beta && (this.openai.beta as { vectorStores?: unknown }).vectorStores;
    if (betaVectorStores) {
      systemLogger.debug('[AssistantService] Using beta.vectorStores API');
      return betaVectorStores as unknown as ReturnType<typeof this.getVectorStoresAPI>;
    }
    
    throw new Error('Vector Stores API not found. Please check your OpenAI SDK version.');
  }

  /**
   * 創建或獲取 Vector Store
   */
  public async getOrCreateVectorStore(): Promise<string> {
    // 優先使用環境變數中的 Vector Store ID
    if (process.env.ORDER_ANALYZER_VECTOR_STORE_ID) {
      this.vectorStoreId = process.env.ORDER_ANALYZER_VECTOR_STORE_ID;
      systemLogger.info({
        vectorStoreId: this.vectorStoreId,
      }, '[AssistantService] Using existing vector store from env');
      return this.vectorStoreId;
    }

    // 如果已有 Vector Store ID，直接返回
    if (this.vectorStoreId) {
      return this.vectorStoreId;
    }

    // 創建新的 Vector Store
    try {
      systemLogger.info('[AssistantService] Creating new vector store');
      const vectorStoresAPI = this.getVectorStoresAPI();
      const vectorStore = await vectorStoresAPI.create({
        name: 'Order PDF Vector Store',
        expires_after: {
          anchor: 'last_active_at',
          days: 7,
        },
      });
      this.vectorStoreId = vectorStore.id;

      systemLogger.info({
        vectorStoreId: this.vectorStoreId,
        name: vectorStore.name,
      }, '[AssistantService] Vector store created successfully');

      // 建議將 ID 保存到環境變數以供重用
      systemLogger.warn({
        variable: 'ORDER_ANALYZER_VECTOR_STORE_ID',
        value: this.vectorStoreId,
      }, '[AssistantService] Please add this to your .env file:');

      return this.vectorStoreId!;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.error({
        error: errorMessage,
        errorStack: error instanceof Error ? error.stack : undefined,
        hasOpenAI: !!this.openai,
        hasBeta: !!this.openai?.beta,
        hasVectorStores: !!((this.openai as OpenAI & { vectorStores?: unknown })?.vectorStores || (this.openai?.beta as { vectorStores?: unknown })?.vectorStores),
      }, '[AssistantService] Failed to create vector store');
      
      // 提供更詳細嘅錯誤信息
      if (errorMessage.includes('vectorStores') || errorMessage.includes('undefined')) {
        throw new Error(
          `Vector Stores API not available. Current OpenAI SDK may be outdated or misconfigured. ` +
          `Please ensure you have OpenAI SDK v4.0+ installed. Original error: ${errorMessage}`
        );
      }
      
      throw new Error(`Failed to create vector store: ${errorMessage}`);
    }
  }

  /**
   * 獲取或創建 Assistant
   */
  public async getAssistant(): Promise<string> {
    // 優先使用環境變數中的 Assistant ID
    if (process.env.ORDER_ANALYZER_ASSISTANT_ID) {
      this.assistantId = process.env.ORDER_ANALYZER_ASSISTANT_ID;
      systemLogger.info({
        assistantId: this.assistantId,
      }, '[AssistantService] Using existing assistant from env');
      return this.assistantId;
    }

    // 如果已有 Assistant ID，直接返回
    if (this.assistantId) {
      return this.assistantId;
    }

    // Check model configuration
    const modelSettings = MODEL_CONFIG.models[MODEL_CONFIG.selectedModel];
    
    try {
      let assistantConfig: OpenAI.Beta.Assistants.AssistantCreateParams = { ...ORDER_ANALYZER_CONFIG };
      
      // Only setup vector store for models that use file_search
      if (modelSettings.useFileSearch) {
        // 確保 Vector Store 存在
        const vectorStoreId = await this.getOrCreateVectorStore();
        
        systemLogger.info('[AssistantService] Creating new assistant with file_search');
        
        // Add vector store to tool_resources for file_search
        assistantConfig.tool_resources = {
          file_search: {
            vector_store_ids: [vectorStoreId]
          }
        };
      } else {
        systemLogger.info({
          model: MODEL_CONFIG.selectedModel,
          reason: 'Model has known issues with file_search'
        }, '[AssistantService] Creating new assistant without file_search (using code_interpreter)');
        
        // For code_interpreter, we don't need vector stores
        // The tool can directly process uploaded files
      }
      
      const assistant = await this.openai.beta.assistants.create(assistantConfig);
      this.assistantId = assistant.id;

      systemLogger.info({
        assistantId: this.assistantId,
        name: assistant.name,
        model: assistant.model,
        tools: assistantConfig.tools,
        useFileSearch: modelSettings.useFileSearch,
      }, '[AssistantService] Assistant created successfully');

      // 建議將 ID 保存到環境變數以供重用
      systemLogger.warn({
        variable: 'ORDER_ANALYZER_ASSISTANT_ID',
        value: this.assistantId,
      }, '[AssistantService] Please add this to your .env file:');

      return this.assistantId;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.error({
        error: errorMessage,
      }, '[AssistantService] Failed to create assistant');
      throw new Error(`Failed to create assistant: ${errorMessage}`);
    }
  }

  /**
   * 創建新的 Thread
   */
  public async createThread(): Promise<string> {
    try {
      const thread = await this.openai.beta.threads.create();
      systemLogger.debug({ threadId: thread.id }, '[AssistantService] Thread created');
      return thread.id;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.error({
        error: errorMessage,
      }, '[AssistantService] Failed to create thread');
      throw new Error(`Failed to create thread: ${errorMessage}`);
    }
  }

  /**
   * 上傳文件到 Vector Store (for file_search) or just to OpenAI (for code_interpreter)
   */
  public async uploadFileToVectorStore(file: File | Buffer, fileName: string, skipVectorStoreProcessing = false): Promise<string> {
    try {
      // Check model configuration
      const modelSettings = MODEL_CONFIG.models[MODEL_CONFIG.selectedModel];
      
      systemLogger.info({ 
        fileName,
        skipVectorStoreProcessing,
        model: MODEL_CONFIG.selectedModel,
        useFileSearch: modelSettings.useFileSearch
      }, '[AssistantService] Uploading file');

      let fileToUpload: File;
      if (Buffer.isBuffer(file)) {
        fileToUpload = new File([file as unknown as ArrayBuffer], fileName, { type: 'application/pdf' });
      } else {
        fileToUpload = file;
      }

      // 先上傳文件到 OpenAI
      const openaiFile = await this.openai.files.create({
        file: fileToUpload,
        purpose: 'assistants',
      });

      systemLogger.info({
        fileId: openaiFile.id,
        fileName: openaiFile.filename,
        bytes: openaiFile.bytes,
      }, '[AssistantService] File uploaded to OpenAI');

      // 使用 file_search tool，需要 vector store
      if (!modelSettings.useFileSearch) {
        systemLogger.info({
          fileId: openaiFile.id,
          model: MODEL_CONFIG.selectedModel
        }, '[AssistantService] Skipping vector store (model uses code_interpreter instead)');
        return openaiFile.id;
      }

      // Check if we should skip vector store processing entirely
      if (skipVectorStoreProcessing) {
        systemLogger.info({
          fileId: openaiFile.id,
        }, '[AssistantService] Skipping vector store processing as requested');
        return openaiFile.id;
      }

      // 獲取或創建 Vector Store (only for models that use file_search)
      const vectorStoreId = await this.getOrCreateVectorStore();

      // 將文件加入 Vector Store
      const vectorStoresAPI = this.getVectorStoresAPI();
      const vectorStoreFile = await vectorStoresAPI.files.create(vectorStoreId, {
        file_id: openaiFile.id,
      });

      systemLogger.info({
        fileId: openaiFile.id,
        vectorStoreId,
        vectorStoreFileId: vectorStoreFile.id,
      }, '[AssistantService] File added to vector store');

      // 等待文件處理完成
      await this.waitForVectorStoreFileProcessing(vectorStoreId, vectorStoreFile.id);

      return openaiFile.id;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.error({
        error: errorMessage,
      }, '[AssistantService] Failed to upload file');
      throw new Error(`Failed to upload file: ${errorMessage}`);
    }
  }

  /**
   * 等待 Vector Store 文件處理完成
   */
  private async waitForVectorStoreFileProcessing(vectorStoreId: string, fileId: string): Promise<void> {
    // Get timeout configuration based on model
    const model = ORDER_ANALYZER_CONFIG.model;
    const maxTimeout = VECTOR_STORE_CONFIG.processingTimeout[model as keyof typeof VECTOR_STORE_CONFIG.processingTimeout] 
      || VECTOR_STORE_CONFIG.processingTimeout.default;
    const skipOnTimeout = VECTOR_STORE_CONFIG.skipOnTimeout[model as keyof typeof VECTOR_STORE_CONFIG.skipOnTimeout] 
      || VECTOR_STORE_CONFIG.skipOnTimeout.default;
    const pollInterval = VECTOR_STORE_CONFIG.pollInterval;
    const startTime = Date.now();
    
    systemLogger.info({
      vectorStoreId,
      fileId,
      model,
      maxTimeout,
    }, '[AssistantService] Waiting for vector store file processing');
    
    while (Date.now() - startTime < maxTimeout) {
      try {
        const vectorStoresAPI = this.getVectorStoresAPI();
        const vectorStoreFile = await vectorStoresAPI.files.retrieve(vectorStoreId, fileId);
        
        const elapsedMs = Date.now() - startTime;
        systemLogger.debug({
          status: vectorStoreFile.status,
          elapsedMs,
          remainingMs: maxTimeout - elapsedMs,
        }, '[AssistantService] Vector store file status');
        
        if (vectorStoreFile.status === 'completed') {
          systemLogger.info({
            totalTimeMs: elapsedMs,
          }, '[AssistantService] Vector store file processing completed');
          return;
        }
        
        if (vectorStoreFile.status === 'failed') {
          // Don't throw if skipOnTimeout is enabled, just log warning and continue
          if (skipOnTimeout) {
            systemLogger.warn({
              model,
              error: vectorStoreFile.last_error?.message || 'Unknown error',
            }, '[AssistantService] Vector store file processing failed, continuing anyway');
            return; // Continue anyway if skipOnTimeout is enabled
          }
          throw new Error(`Vector store file processing failed: ${vectorStoreFile.last_error?.message || 'Unknown error'}`);
        }
        
        // Continue waiting
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        // Handle API errors gracefully
        if (error instanceof Error && error.message.includes('404')) {
          systemLogger.warn({
            fileId,
            elapsedMs: Date.now() - startTime,
          }, '[AssistantService] Vector store file not found, may still be initializing');
          
          // If skipOnTimeout is enabled, don't wait too long for initialization
          if (skipOnTimeout && Date.now() - startTime > 5000) {
            systemLogger.info({ model }, '[AssistantService] Skipping vector store wait after 5s');
            return;
          }
        } else if (!(error instanceof Error && error.message.includes('Vector store file processing failed'))) {
          systemLogger.error({
            error: error instanceof Error ? error.message : 'Unknown error',
            elapsedMs: Date.now() - startTime,
          }, '[AssistantService] Error checking vector store file status');
          
          // Be more lenient with errors if skipOnTimeout is enabled
          if (skipOnTimeout) {
            systemLogger.warn({ model }, '[AssistantService] Ignoring error, continuing anyway');
            return;
          }
          throw error;
        }
      }
    }
    
    // Timeout reached
    const finalElapsedMs = Date.now() - startTime;
    
    // If skipOnTimeout is enabled, just log warning and continue
    if (skipOnTimeout) {
      systemLogger.warn({
        model,
        timeoutMs: maxTimeout,
        elapsedMs: finalElapsedMs,
      }, '[AssistantService] Vector store processing timeout, continuing anyway');
      return; // Don't throw, just continue
    }
    
    // For other models, throw error
    systemLogger.error({
      model,
      timeoutMs: maxTimeout,
      elapsedMs: finalElapsedMs,
    }, '[AssistantService] Vector store file processing timeout');
    throw new Error(`Vector store file processing timeout after ${Math.round(finalElapsedMs / 1000)}s`);
  }

  /**
   * 上傳文件到 OpenAI (舊方法，保持向後兼容)
   * Note: This method is deprecated. Use uploadFileToVectorStore for file_search functionality.
   */
  public async uploadFile(file: File | Buffer, fileName: string): Promise<string> {
    try {
      systemLogger.info({ fileName }, '[AssistantService] Uploading file (deprecated method, use uploadFileToVectorStore instead)');

      let fileToUpload: File;
      if (Buffer.isBuffer(file)) {
        fileToUpload = new File([file as unknown as ArrayBuffer], fileName, { type: 'application/pdf' });
      } else {
        fileToUpload = file;
      }

      const openaiFile = await this.openai.files.create({
        file: fileToUpload,
        purpose: 'assistants',
      });

      systemLogger.info({
        fileId: openaiFile.id,
        fileName: openaiFile.filename,
        bytes: openaiFile.bytes,
      }, '[AssistantService] File uploaded successfully');

      return openaiFile.id;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.error({
        error: errorMessage,
      }, '[AssistantService] Failed to upload file');
      throw new Error(`Failed to upload file: ${errorMessage}`);
    }
  }

  /**
   * 發送消息（根據模型選擇使用 file_search 或 code_interpreter）
   */
  public async sendMessage(threadId: string, content: string, fileId?: string): Promise<void> {
    try {
      const modelSettings = MODEL_CONFIG.models[MODEL_CONFIG.selectedModel];
      const messageData: AssistantMessageData = {
        role: 'user' as const,
        content,
      };

      // Attach file based on the tool being used
      if (fileId) {
        const toolType = modelSettings.useFileSearch ? 'file_search' : 'code_interpreter';
        messageData.attachments = [
          {
            file_id: fileId,
            tools: [{ type: toolType }],
          },
        ];
        
        systemLogger.debug({
          fileId,
          toolType,
          model: MODEL_CONFIG.selectedModel
        }, '[AssistantService] Attaching file with tool');
      }
      
      await this.openai.beta.threads.messages.create(threadId, messageData);

      systemLogger.debug({
        threadId,
        hasFile: !!fileId,
        model: MODEL_CONFIG.selectedModel,
        tool: modelSettings.useFileSearch ? 'file_search' : 'code_interpreter',
      }, '[AssistantService] Message sent');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.error({
        error: errorMessage,
      }, '[AssistantService] Failed to send message');
      throw new Error(`Failed to send message: ${errorMessage}`);
    }
  }

  /**
   * 運行 Assistant 並等待完成
   */
  public async runAndWait(threadId: string, assistantId: string): Promise<string> {
    try {
      // 創建運行，設定 max_completion_tokens
      const run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
        max_completion_tokens: ASSISTANT_RETRY_CONFIG.maxCompletionTokens,
      });

      systemLogger.info({
        runId: run.id,
        threadId,
        assistantId,
        maxCompletionTokens: ASSISTANT_RETRY_CONFIG.maxCompletionTokens,
      }, '[AssistantService] Run created');

      // 輪詢等待完成
      const result = await this.pollForCompletion(threadId, run.id);
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.error({
        error: errorMessage,
      }, '[AssistantService] Failed to run assistant');
      throw error;
    }
  }

  /**
   * 輪詢等待運行完成 (with intelligent rate limit handling)
   */
  private async pollForCompletion(threadId: string, runId: string): Promise<string> {
    const { maxAttempts, pollInterval, timeout } = ASSISTANT_RETRY_CONFIG;
    const startTime = Date.now();
    let attempts = 0;
    let currentInterval = pollInterval;
    const maxInterval = 30000; // 最大30秒間隔
    const backoffMultiplier = 1.5; // 退避乘數

    while (attempts < maxAttempts) {
      // 檢查是否超時
      const elapsed = Date.now() - startTime;
      if (elapsed > timeout) {
        throw new Error(`Assistant execution timeout after ${elapsed}ms (${Math.round(elapsed/1000)}s). Max timeout: ${timeout}ms. Attempts made: ${attempts}/${maxAttempts}`);
      }

      try {
        const run = await this.openai.beta.threads.runs.retrieve(threadId, runId);

        systemLogger.debug({
          status: run.status,
          attempt: attempts + 1,
          interval: currentInterval,
        }, '[AssistantService] Run status');

        switch (run.status) {
          case 'completed':
            // 獲取最新消息
            const messages = await this.openai.beta.threads.messages.list(threadId);
            const latestMessage = messages.data[0];

            if (latestMessage && latestMessage.content[0]?.type === 'text') {
              const result = latestMessage.content[0].text.value;
              systemLogger.info({
                resultLength: result.length,
              }, '[AssistantService] Run completed successfully');
              return result;
            }
            throw new Error('No text response received from assistant');

          case 'failed':
            const errorMsg = run.last_error?.message || 'Unknown error';
            // 檢查是否為速率限制錯誤
            if (this.isRateLimitError(errorMsg)) {
              const retryAfter = this.extractRetryAfter(errorMsg);
              const backoffDelay = retryAfter ? retryAfter * 1000 : Math.min(currentInterval * backoffMultiplier, maxInterval);
              
              systemLogger.warn({
                attempt: attempts + 1,
                retryAfter: backoffDelay,
                error: errorMsg
              }, '[AssistantService] Rate limit hit in run status, applying backoff');
              
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
              currentInterval = Math.min(currentInterval * backoffMultiplier, maxInterval);
              attempts++;
              continue; // 重試而不是拋出錯誤
            }
            throw new Error(`Assistant run failed: ${errorMsg}`);

          case 'cancelled':
            throw new Error('Assistant run was cancelled');

          case 'expired':
            throw new Error('Assistant run expired');

          case 'requires_action':
            throw new Error('Assistant run requires action (not supported)');

          case 'in_progress':
          case 'queued':
            // 使用動態間隔，逐漸增加等待時間
            await new Promise(resolve => setTimeout(resolve, currentInterval));
            // 每10次嘗試後增加間隔
            if (attempts > 0 && attempts % 10 === 0) {
              currentInterval = Math.min(currentInterval * backoffMultiplier, maxInterval);
              systemLogger.debug({
                newInterval: currentInterval,
                attempt: attempts
              }, '[AssistantService] Increasing poll interval');
            }
            attempts++;
            break;

          default:
            throw new Error(`Unknown run status: ${run.status}`);
        }
      } catch (error) {
        // 處理 API 調用錯誤（不是 run status 錯誤）
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (this.isRateLimitError(errorMessage)) {
          const retryAfter = this.extractRetryAfter(errorMessage);
          const backoffDelay = retryAfter ? retryAfter * 1000 : Math.min(currentInterval * backoffMultiplier, maxInterval);
          
          systemLogger.warn({
            attempt: attempts + 1,
            retryAfter: backoffDelay,
            error: errorMessage
          }, '[AssistantService] API rate limit hit, applying backoff');
          
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          currentInterval = Math.min(currentInterval * backoffMultiplier, maxInterval);
          attempts++;
          continue;
        }
        throw error; // 重新拋出非速率限制錯誤
      }
    }

    throw new Error('Assistant execution exceeded maximum attempts');
  }

  /**
   * 檢查是否為速率限制錯誤
   */
  private isRateLimitError(message: string): boolean {
    return /rate limit|too many requests|quota exceeded|TPM|RPM/i.test(message);
  }

  /**
   * 從錯誤消息中提取重試時間
   */
  private extractRetryAfter(message: string): number | null {
    // 嘗試匹配 "try again in X.Xs" 或 "try again in X seconds"
    const match = message.match(/try again in ([\d.]+)s?/i);
    if (match) {
      return Math.ceil(parseFloat(match[1]));
    }
    return null;
  }

  /**
   * 從 Vector Store 中刪除文件
   */
  public async removeFileFromVectorStore(fileId: string): Promise<void> {
    try {
      const modelSettings = MODEL_CONFIG.models[MODEL_CONFIG.selectedModel];
      
      // Skip if model doesn't use file_search
      if (!modelSettings.useFileSearch) {
        systemLogger.debug({
          fileId,
          model: MODEL_CONFIG.selectedModel
        }, '[AssistantService] Skipping vector store cleanup (model uses code_interpreter)');
        return;
      }
      
      if (!this.vectorStoreId) {
        systemLogger.warn({
          fileId,
        }, '[AssistantService] No vector store ID available for file cleanup');
        return;
      }

      const vectorStoresAPI = this.getVectorStoresAPI();
      await vectorStoresAPI.files.del(this.vectorStoreId, fileId);
      systemLogger.info({
        fileId,
        vectorStoreId: this.vectorStoreId,
      }, '[AssistantService] File removed from vector store');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.warn({
        fileId,
        vectorStoreId: this.vectorStoreId,
        error: errorMessage,
      }, '[AssistantService] Failed to remove file from vector store');
    }
  }

  /**
   * 清理資源
   */
  public async cleanup(threadId?: string, fileId?: string): Promise<void> {
    const promises: Promise<void>[] = [];

    if (threadId) {
      promises.push(
        this.openai.beta.threads
          .del(threadId)
          .then(() => {
            systemLogger.debug({ threadId }, '[AssistantService] Thread deleted');
          })
          .catch(error => {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            systemLogger.warn({
              threadId,
              error: errorMessage,
            }, '[AssistantService] Failed to delete thread');
          })
      );
    }

    if (fileId) {
      // 從 Vector Store 中刪除文件
      promises.push(
        this.removeFileFromVectorStore(fileId)
          .then(() => {})
          .catch(() => {}) // 錯誤已在 removeFileFromVectorStore 中處理
      );
      
      // 從 OpenAI 中刪除文件
      promises.push(
        this.openai.files
          .del(fileId)
          .then(() => {
            systemLogger.debug({ fileId }, '[AssistantService] File deleted from OpenAI');
          })
          .catch(error => {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            systemLogger.warn({
              fileId,
              error: errorMessage,
            }, '[AssistantService] Failed to delete file from OpenAI');
          })
      );
    }

    await Promise.all(promises);
  }

  /**
   * 解析助手返回的 JSON 結果
   */
  public parseAssistantResponse(response: string): ParsedOrderResponse {
    try {
      // 記錄原始響應長度和內容摘要
      systemLogger.info({
        responseLength: response.length,
        responsePreview: response.substring(0, 200),
        hasCodeBlock: response.includes('```'),
        hasOrdersArray: response.includes('"orders"')
      }, '[AssistantService] Parsing assistant response');
      
      // 清理可能的多餘字符
      let cleanedResponse = response.trim();
      
      // 如果響應包含 markdown 代碼塊，提取其中的 JSON
      const codeBlockMatch = cleanedResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        cleanedResponse = codeBlockMatch[1].trim();
        systemLogger.info({
          extractedLength: cleanedResponse.length
        }, '[AssistantService] Extracted JSON from markdown code block');
      }

      // 嘗試直接解析
      const parsed = JSON.parse(cleanedResponse);

      // 檢查是否為新格式（orders 陣列）
      if (parsed.orders && Array.isArray(parsed.orders)) {
        // 處理空陣列情況
        if (parsed.orders.length === 0) {
          systemLogger.warn('[AssistantService] Assistant returned empty orders array - no products extracted');
          throw new Error('Assistant failed to extract any products from PDF');
        }
        
        systemLogger.info({
          totalOrdersInArray: parsed.orders.length,
          firstOrderSample: JSON.stringify(parsed.orders[0]).substring(0, 200)
        }, '[AssistantService] Detected new format with orders array');
        
        // 從 orders 陣列中提取資料，轉換為舊格式
        const firstOrder = parsed.orders[0];
        const orderRef = String(firstOrder.order_ref);
        
        // 記錄訂單號分佈
        const orderRefCounts = parsed.orders.reduce((acc: Record<string, number>, order: Record<string, unknown>) => {
          const ref = String(order.order_ref);
          acc[ref] = (acc[ref] || 0) + 1;
          return acc;
        }, {});
        
        systemLogger.info({
          orderRefDistribution: orderRefCounts,
          primaryOrderRef: orderRef
        }, '[AssistantService] Order reference distribution');
        
        // 合併所有相同訂單號的產品
        const products = parsed.orders
          .filter((order: Record<string, unknown>) => String(order.order_ref) === orderRef)
          .map((order: Record<string, unknown>) => ({
            product_code: order.product_code,
            description: order.product_desc,
            quantity: order.product_qty,
            unit_price: order.unit_price
          }));

        const result: ParsedOrderResponse = {
          order_ref: orderRef,
          products: products
        };

        systemLogger.info({
          orderRef,
          productCount: products.length,
          allOrdersCount: parsed.orders.length,
          filteredCount: products.length
        }, '[AssistantService] Successfully parsed orders array format');

        return result;
      }

      // 舊格式驗證
      if (!parsed.order_ref || !parsed.products || !Array.isArray(parsed.products)) {
        systemLogger.error({
          hasOrderRef: !!parsed.order_ref,
          hasProducts: !!parsed.products,
          isProductsArray: Array.isArray(parsed.products),
          hasOrders: !!parsed.orders
        }, '[AssistantService] Invalid response structure');
        throw new Error('Invalid response structure: missing required fields');
      }

      return parsed;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.error({
        error: errorMessage,
        responseLength: response.length,
        responseStart: response.substring(0, 500),
        responseEnd: response.substring(Math.max(0, response.length - 500)),
        fullResponse: response.length < 2000 ? response : 'Response too long',
      }, '[AssistantService] Initial parse failed');

      // 如果失敗，嘗試提取 JSON 部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extracted = JSON.parse(jsonMatch[0]);

          // 檢查新格式
          if (extracted.orders && Array.isArray(extracted.orders) && extracted.orders.length > 0) {
            const firstOrder = extracted.orders[0];
            const orderRef = String(firstOrder.order_ref);
            
            const products = extracted.orders
              .filter((order: Record<string, unknown>) => String(order.order_ref) === orderRef)
              .map((order: Record<string, unknown>) => ({
                product_code: order.product_code,
                description: order.product_desc,
                quantity: order.product_qty,
                unit_price: order.unit_price
              }));

            systemLogger.info('[AssistantService] Successfully extracted JSON with orders array');
            
            return {
              order_ref: orderRef,
              products: products
            };
          }

          // 再次驗證舊格式結構
          if (!extracted.order_ref || !extracted.products || !Array.isArray(extracted.products)) {
            throw new Error('Extracted JSON missing required fields');
          }

          systemLogger.info('[AssistantService] Successfully extracted JSON from response');
          return extracted;
        } catch (innerError) {
          const innerErrorMessage =
            innerError instanceof Error ? innerError.message : 'Unknown error';
          systemLogger.error({
            extractedJson: jsonMatch[0].substring(0, 200),
            error: innerErrorMessage,
          }, '[AssistantService] Failed to parse extracted JSON');
        }
      }

      // 檢查是否返回了錯誤消息
      if (response.toLowerCase().includes('error') || response.toLowerCase().includes('sorry')) {
        throw new Error(`Assistant returned an error message: ${response.substring(0, 200)}`);
      }

      throw new Error('Failed to parse assistant response as JSON');
    }
  }
}
