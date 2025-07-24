import OpenAI from 'openai';
import { ORDER_ANALYZER_CONFIG, ASSISTANT_RETRY_CONFIG } from '@/lib/openai-assistant-config';
import { systemLogger } from '@/lib/logger';
import { AssistantMessageData, ParsedOrderResponse } from '@/lib/types/openai.types';

/**
 * Assistant 管理服務
 * 負責創建、管理和重用 OpenAI Assistant
 */
export class AssistantService {
  private static instance: AssistantService;
  private openai: OpenAI;
  private assistantId: string | null = null;

  private constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    this.openai = new OpenAI({ apiKey });
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
   * 獲取或創建 Assistant
   */
  public async getAssistant(): Promise<string> {
    // 優先使用環境變數中的 Assistant ID
    if (process.env.ORDER_ANALYZER_ASSISTANT_ID) {
      this.assistantId = process.env.ORDER_ANALYZER_ASSISTANT_ID;
      systemLogger.info('[AssistantService] Using existing assistant from env', {
        assistantId: this.assistantId,
      });
      return this.assistantId;
    }

    // 如果已有 Assistant ID，直接返回
    if (this.assistantId) {
      return this.assistantId;
    }

    // 創建新的 Assistant
    try {
      systemLogger.info('[AssistantService] Creating new assistant');
      const assistant = await this.openai.beta.assistants.create(ORDER_ANALYZER_CONFIG);
      this.assistantId = assistant.id;

      systemLogger.info('[AssistantService] Assistant created successfully', {
        assistantId: this.assistantId,
        name: assistant.name,
        model: assistant.model,
      });

      // 建議將 ID 保存到環境變數以供重用
      systemLogger.warn('[AssistantService] Please add this to your .env file:', {
        variable: 'ORDER_ANALYZER_ASSISTANT_ID',
        value: this.assistantId,
      });

      return this.assistantId;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.error('[AssistantService] Failed to create assistant', {
        error: errorMessage,
      });
      throw new Error(`Failed to create assistant: ${errorMessage}`);
    }
  }

  /**
   * 創建新的 Thread
   */
  public async createThread(): Promise<string> {
    try {
      const thread = await this.openai.beta.threads.create();
      systemLogger.debug('[AssistantService] Thread created', { threadId: thread.id });
      return thread.id;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.error('[AssistantService] Failed to create thread', {
        error: errorMessage,
      });
      throw new Error(`Failed to create thread: ${errorMessage}`);
    }
  }

  /**
   * 上傳文件到 OpenAI
   */
  public async uploadFile(file: File | Buffer, fileName: string): Promise<string> {
    try {
      systemLogger.info('[AssistantService] Uploading file', { fileName });

      let fileToUpload: File;
      if (Buffer.isBuffer(file)) {
        fileToUpload = new File([file], fileName, { type: 'application/pdf' });
      } else {
        fileToUpload = file;
      }

      const openaiFile = await this.openai.files.create({
        file: fileToUpload,
        purpose: 'assistants',
      });

      systemLogger.info('[AssistantService] File uploaded successfully', {
        fileId: openaiFile.id,
        fileName: openaiFile.filename,
        bytes: openaiFile.bytes,
      });

      return openaiFile.id;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.error('[AssistantService] Failed to upload file', {
        error: errorMessage,
      });
      throw new Error(`Failed to upload file: ${errorMessage}`);
    }
  }

  /**
   * 發送消息並附加文件
   */
  public async sendMessage(threadId: string, content: string, fileId?: string): Promise<void> {
    try {
      const messageData: AssistantMessageData = {
        role: 'user' as const,
        content,
      };

      if (fileId) {
        messageData.attachments = [
          {
            file_id: fileId,
            tools: [{ type: 'file_search' }],
          },
        ];
      }

      await this.openai.beta.threads.messages.create(threadId, messageData);

      systemLogger.debug('[AssistantService] Message sent', {
        threadId,
        hasFile: !!fileId,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.error('[AssistantService] Failed to send message', {
        error: errorMessage,
      });
      throw new Error(`Failed to send message: ${errorMessage}`);
    }
  }

  /**
   * 運行 Assistant 並等待完成
   */
  public async runAndWait(threadId: string, assistantId: string): Promise<string> {
    try {
      // 創建運行
      const run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
      });

      systemLogger.info('[AssistantService] Run created', {
        runId: run.id,
        threadId,
        assistantId,
      });

      // 輪詢等待完成
      const result = await this.pollForCompletion(threadId, run.id);
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.error('[AssistantService] Failed to run assistant', {
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * 輪詢等待運行完成
   */
  private async pollForCompletion(threadId: string, runId: string): Promise<string> {
    const { maxAttempts, pollInterval, timeout } = ASSISTANT_RETRY_CONFIG;
    const startTime = Date.now();
    let attempts = 0;

    while (attempts < maxAttempts) {
      // 檢查是否超時
      if (Date.now() - startTime > timeout) {
        throw new Error('Assistant execution timeout');
      }

      const run = await this.openai.beta.threads.runs.retrieve(threadId, runId);

      systemLogger.debug('[AssistantService] Run status', {
        status: run.status,
        attempt: attempts + 1,
      });

      switch (run.status) {
        case 'completed':
          // 獲取最新消息
          const messages = await this.openai.beta.threads.messages.list(threadId);
          const latestMessage = messages.data[0];

          if (latestMessage && latestMessage.content[0]?.type === 'text') {
            const result = latestMessage.content[0].text.value;
            systemLogger.info('[AssistantService] Run completed successfully', {
              resultLength: result.length,
            });
            return result;
          }
          throw new Error('No text response received from assistant');

        case 'failed':
          throw new Error(`Assistant run failed: ${run.last_error?.message || 'Unknown error'}`);

        case 'cancelled':
          throw new Error('Assistant run was cancelled');

        case 'expired':
          throw new Error('Assistant run expired');

        case 'requires_action':
          throw new Error('Assistant run requires action (not supported)');

        case 'in_progress':
        case 'queued':
          // 繼續等待
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          attempts++;
          break;

        default:
          throw new Error(`Unknown run status: ${run.status}`);
      }
    }

    throw new Error('Assistant execution exceeded maximum attempts');
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
          .then(() => {})
          .catch(error => {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            systemLogger.warn('[AssistantService] Failed to delete thread', {
              threadId,
              error: errorMessage,
            });
          })
      );
    }

    if (fileId) {
      promises.push(
        this.openai.files
          .del(fileId)
          .then(() => {})
          .catch(error => {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            systemLogger.warn('[AssistantService] Failed to delete file', {
              fileId,
              error: errorMessage,
            });
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
      // 清理可能的多餘字符
      const cleanedResponse = response.trim();

      // 嘗試直接解析
      const parsed = JSON.parse(cleanedResponse);

      // 驗證是否包含必要的欄位
      if (!parsed.order_ref || !parsed.products || !Array.isArray(parsed.products)) {
        systemLogger.error('[AssistantService] Invalid response structure', {
          hasOrderRef: !!parsed.order_ref,
          hasProducts: !!parsed.products,
          isProductsArray: Array.isArray(parsed.products),
        });
        throw new Error('Invalid response structure: missing required fields');
      }

      return parsed;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.error('[AssistantService] Initial parse failed', {
        error: errorMessage,
        responseLength: response.length,
        responseStart: response.substring(0, 500),
        fullResponse: response.length < 2000 ? response : 'Response too long',
      });

      // 如果失敗，嘗試提取 JSON 部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extracted = JSON.parse(jsonMatch[0]);

          // 再次驗證結構
          if (!extracted.order_ref || !extracted.products || !Array.isArray(extracted.products)) {
            throw new Error('Extracted JSON missing required fields');
          }

          systemLogger.info('[AssistantService] Successfully extracted JSON from response');
          return extracted;
        } catch (innerError) {
          const innerErrorMessage =
            innerError instanceof Error ? innerError.message : 'Unknown error';
          systemLogger.error('[AssistantService] Failed to parse extracted JSON', {
            extractedJson: jsonMatch[0].substring(0, 200),
            error: innerErrorMessage,
          });
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
