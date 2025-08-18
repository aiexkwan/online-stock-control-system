/**
 * PDF Extraction Service
 * 使用 pdf-parse 庫直接提取 PDF 文本內容
 * 替代 OpenAI Assistant API 的文件處理
 */


import pdf from 'pdf-parse';
import { systemLogger } from '@/lib/logger';

export interface ExtractedPDFData {
  text: string;
  numPages: number;
  fileName?: string;
  info: {
    title?: string;
    author?: string;
    creationDate?: Date;
  };
  pages: Array<{
    pageNumber: number;
    text: string;
  }>;
}

export class PDFExtractionService {
  private static instance: PDFExtractionService;

  private constructor() {}

  public static getInstance(): PDFExtractionService {
    if (!PDFExtractionService.instance) {
      PDFExtractionService.instance = new PDFExtractionService();
    }
    return PDFExtractionService.instance;
  }

  /**
   * 從 PDF Buffer 提取文本
   */
  public async extractText(buffer: ArrayBuffer): Promise<ExtractedPDFData> {
    try {
      const startTime = Date.now();
      const pdfBuffer = Buffer.from(buffer);
      
      systemLogger.info({
        bufferSize: pdfBuffer.length,
      }, '[PDFExtractionService] Starting PDF extraction');

      // 使用 pdf-parse 提取文本
      const data = await pdf(pdfBuffer, {
        // 保留頁面結構
        pagerender: this.renderPage,
        // 最大頁數限制（避免記憶體問題）
        max: 50,
      });

      // 提取每頁的文本
      const pages: Array<{ pageNumber: number; text: string }> = [];
      
      // pdf-parse 不直接提供分頁文本，需要從完整文本中解析
      // 使用分頁標記來分割（如果存在）
      const pageTexts = this.splitIntoPages(data.text);
      
      for (let i = 0; i < pageTexts.length; i++) {
        pages.push({
          pageNumber: i + 1,
          text: pageTexts[i],
        });
      }

      const result: ExtractedPDFData = {
        text: data.text,
        numPages: data.numpages,
        info: {
          title: data.info?.Title,
          author: data.info?.Author,
          creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
        },
        pages,
      };

      const processingTime = Date.now() - startTime;
      
      systemLogger.info({
        numPages: result.numPages,
        textLength: result.text.length,
        processingTime,
        pagesExtracted: pages.length,
      }, '[PDFExtractionService] PDF extraction completed');

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.error({
        error: errorMessage,
      }, '[PDFExtractionService] Failed to extract PDF text');
      throw new Error(`PDF extraction failed: ${errorMessage}`);
    }
  }

  /**
   * 自定義頁面渲染函數（用於提取結構化文本）
   */
  private renderPage(pageData: { getTextContent: (options: Record<string, boolean>) => Promise<{ items: Array<{ str: string; transform: number[] }> }> }): Promise<string> {
    // 這個函數會被 pdf-parse 為每一頁調用
    let render_options = {
      normalizeWhitespace: false,
      disableCombineTextItems: false,
    };

    return pageData.getTextContent(render_options)
      .then((textContent: { items: Array<{ str: string; transform: number[] }> }) => {
        let text = '';
        let lastY = null;
        
        for (let item of textContent.items) {
          // 檢測換行（基於 Y 座標變化）
          if (lastY !== null && Math.abs(lastY - item.transform[5]) > 5) {
            text += '\n';
          }
          
          text += item.str;
          lastY = item.transform[5];
        }
        
        return text;
      });
  }

  /**
   * 將完整文本分割成頁面
   * 嘗試識別頁面邊界
   */
  private splitIntoPages(fullText: string): string[] {
    const pages: string[] = [];
    
    // 方法1：尋找明顯的頁面標記
    // 例如 "Page X of Y" 或頁碼模式
    const pagePatterns = [
      /Page\s+\d+\s+of\s+\d+/gi,
      /\n\s*\d+\s*\n/g, // 獨立的頁碼
      /\f/g, // Form feed character
    ];
    
    // 嘗試使用 form feed 字符分割
    if (fullText.includes('\f')) {
      const splitPages = fullText.split('\f');
      return splitPages.filter(page => page.trim().length > 0);
    }
    
    // 方法2：基於內容模式分割
    // 查找 "Total Number Of Pages" 來確定頁數
    const totalPagesMatch = fullText.match(/Total\s+Number\s+Of\s+Pages[:\s]+(\d+)/i);
    const expectedPages = totalPagesMatch ? parseInt(totalPagesMatch[1]) : 1;
    
    // 如果只有一頁或無法分割，返回整個文本
    if (expectedPages === 1 || !this.canSplitPages(fullText)) {
      return [fullText];
    }
    
    // 方法3：基於內容長度均勻分割（作為最後手段）
    const averagePageLength = Math.ceil(fullText.length / expectedPages);
    let currentPos = 0;
    
    for (let i = 0; i < expectedPages; i++) {
      const pageEnd = Math.min(currentPos + averagePageLength, fullText.length);
      
      // 嘗試在句子或段落結尾分割
      let actualEnd = pageEnd;
      if (pageEnd < fullText.length) {
        // 尋找最近的換行符
        const nextNewline = fullText.indexOf('\n', pageEnd);
        if (nextNewline !== -1 && nextNewline - pageEnd < 200) {
          actualEnd = nextNewline + 1;
        }
      }
      
      pages.push(fullText.substring(currentPos, actualEnd));
      currentPos = actualEnd;
    }
    
    return pages.filter(page => page.trim().length > 0);
  }

  /**
   * 檢查是否可以分割頁面
   */
  private canSplitPages(text: string): boolean {
    // 檢查是否有多頁標記
    return text.includes('Page ') || 
           text.includes('Total Number Of Pages') ||
           text.includes('\f') ||
           text.length > 5000; // 文本很長，可能是多頁
  }

  /**
   * 預處理文本以優化 LLM 處理
   */
  public preprocessTextForLLM(extractedData: ExtractedPDFData): string {
    let processedText = '';
    
    // 添加頁面標記以幫助 LLM 理解結構
    for (const page of extractedData.pages) {
      processedText += `\n=== PAGE ${page.pageNumber} of ${extractedData.numPages} ===\n`;
      processedText += page.text;
      processedText += '\n=== END OF PAGE ===\n';
    }
    
    // 清理多餘的空白
    processedText = processedText
      .replace(/\n{4,}/g, '\n\n\n') // 最多3個連續換行
      .replace(/[ \t]{2,}/g, ' ') // 多個空格替換為單個
      .trim();
    
    systemLogger.debug({
      originalLength: extractedData.text.length,
      processedLength: processedText.length,
      numPages: extractedData.numPages,
    }, '[PDFExtractionService] Text preprocessed for LLM');
    
    return processedText;
  }

  /**
   * 驗證提取的文本是否包含必要的訂單信息
   */
  public validateExtractedText(text: string): {
    isValid: boolean;
    missingElements: string[];
  } {
    const requiredElements = {
      orderRef: /Order\s+Reference|Order\s+Ref|Order\s+No/i,
      products: /Item\s+Code|Product\s+Code|Product/i,
      quantity: /Qty|Quantity|Pack\s+Size/i,
    };
    
    const missingElements: string[] = [];
    
    for (const [element, pattern] of Object.entries(requiredElements)) {
      if (!pattern.test(text)) {
        missingElements.push(element);
      }
    }
    
    const isValid = missingElements.length === 0;
    
    if (!isValid) {
      systemLogger.warn({
        missingElements,
        textLength: text.length,
        textSample: text.substring(0, 500),
      }, '[PDFExtractionService] Extracted text validation failed');
    }
    
    return { isValid, missingElements };
  }

  /**
   * 提取關鍵元數據（快速掃描）
   */
  public extractMetadata(text: string): {
    orderRef?: string;
    accountNum?: string;
    numProducts?: number;
    hasMultiplePages: boolean;
  } {
    const metadata = {
      hasMultiplePages: false
    } as {
      orderRef?: string;
      accountNum?: string;
      numProducts?: number;
      hasMultiplePages: boolean;
    };
    
    // 提取訂單號
    const orderRefMatch = text.match(/Order\s+Reference[:\s]+([0-9]+)/i);
    if (orderRefMatch) {
      metadata.orderRef = orderRefMatch[1].replace(/^0+/, ''); // 去除前導零
    }
    
    // 提取帳號
    const accountMatch = text.match(/Account\s+No[:\s]+([A-Z0-9]+)/i);
    if (accountMatch) {
      metadata.accountNum = accountMatch[1];
    }
    
    // 估算產品數量（通過計算產品代碼模式）
    const productCodePattern = /^[A-Z][A-Z0-9]{2,}/gm;
    const productMatches = text.match(productCodePattern);
    if (productMatches) {
      metadata.numProducts = productMatches.length;
    }
    
    // 檢查是否多頁
    metadata.hasMultiplePages = 
      text.includes('Page 2') || 
      text.includes('Total Number Of Pages: 2') ||
      text.includes('=== PAGE 2');
    
    systemLogger.debug({
      metadata,
    }, '[PDFExtractionService] Metadata extracted');
    
    return metadata;
  }
}