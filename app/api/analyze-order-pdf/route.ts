'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// 創建 Supabase 服務端客戶端的函數
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
  }
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  }
  
  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      }
    }
  );
}

// 創建 OpenAI 客戶端
function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  
  return new OpenAI({
    apiKey: apiKey,
  });
}

// PDF 轉圖像函數（使用 pdf-poppler 作為主要方法，pdf2pic 作為備用）
async function convertPdfToImages(pdfBuffer: Buffer): Promise<string[]> {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  
  try {
    console.log('[PDF to Images] 開始轉換 PDF 到圖像...');
    
    // 檢測運行環境
    const isWindows = process.platform === 'win32';
    const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
    
    // 在 Vercel 環境中，直接使用文本提取模式
    if (isVercel) {
      console.log('[PDF to Images] 在 Vercel 環境中運行，跳過圖像轉換，使用文本提取模式...');
      throw new Error('PDF_TEXT_EXTRACTION_NEEDED');
    }
    
    // 使用系統臨時目錄而不是 /tmp（Windows 兼容）
    const tempDir = os.tmpdir();
    const tempPdfPath = path.join(tempDir, `temp-pdf-${Date.now()}.pdf`);
    
    // 寫入臨時 PDF 文件
    fs.writeFileSync(tempPdfPath, pdfBuffer);
    console.log('[PDF to Images] 臨時 PDF 文件創建:', tempPdfPath);
    
    let base64Images: string[] = [];
    
    try {
      // 方法 1: 直接使用 pdftocairo 命令行工具
      console.log('[PDF to Images] 嘗試使用 pdftocairo 命令行...');
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      let pdftocairoPath: string;
      
      if (isWindows) {
        // Windows 開發環境
        const projectRoot = process.cwd();
        const popplerPath = path.join(projectRoot, 'poppler', 'poppler-24.08.0', 'Library', 'bin');
        pdftocairoPath = path.join(popplerPath, 'pdftocairo.exe');
        
        if (!fs.existsSync(pdftocairoPath)) {
          console.error('[PDF to Images] pdftocairo.exe 不存在:', pdftocairoPath);
          throw new Error('pdftocairo.exe not found');
        }
      } else {
        // Linux/Mac 開發環境
        pdftocairoPath = 'pdftocairo';
        
        // 檢查 pdftocairo 是否可用
        try {
          await execAsync('which pdftocairo');
        } catch (e) {
          console.warn('[PDF to Images] pdftocairo 不可用，使用文本提取模式');
          throw new Error('PDF_TEXT_EXTRACTION_NEEDED');
        }
      }
      
      console.log('[PDF to Images] 使用 pdftocairo 路徑:', pdftocairoPath);
      
      // 生成輸出文件前綴
      const outputPrefix = path.join(tempDir, `pdf-page-${Date.now()}`);
      
      // 構建命令
      const command = isWindows 
        ? `"${pdftocairoPath}" -png -r 150 "${tempPdfPath}" "${outputPrefix}"`
        : `${pdftocairoPath} -png -r 150 "${tempPdfPath}" "${outputPrefix}"`;
      
      console.log('[PDF to Images] 執行命令:', command);
      
      // 執行命令
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        console.warn('[PDF to Images] pdftocairo 警告:', stderr);
      }
      
      console.log('[PDF to Images] pdftocairo 輸出:', stdout);
      
      // 查找生成的 PNG 文件
      const files = fs.readdirSync(tempDir);
      const pngFiles = files
        .filter((file: string) => file.startsWith(path.basename(outputPrefix)) && file.endsWith('.png'))
        .map((file: string) => path.join(tempDir, file))
        .sort(); // 確保頁面順序正確
      
      console.log(`[PDF to Images] 找到 ${pngFiles.length} 個 PNG 文件`);
      
      // 讀取生成的圖像文件並轉換為 base64
      for (const pngPath of pngFiles) {
        try {
          const imageBuffer = fs.readFileSync(pngPath);
          const base64String = imageBuffer.toString('base64');
          base64Images.push(base64String);
          
          // 清理臨時圖像文件
          fs.unlinkSync(pngPath);
        } catch (fileError: any) {
          console.error('[PDF to Images] 讀取圖像文件錯誤:', fileError.message);
        }
      }
      
      if (base64Images.length === 0) {
        throw new Error('No images generated from PDF');
      }
      
    } catch (popplerError: any) {
      console.warn('[PDF to Images] pdftocairo 失敗，嘗試備用方法:', popplerError.message);
      
      // 直接拋出 PDF_TEXT_EXTRACTION_NEEDED 錯誤，跳過 PDF-lib
      throw new Error('PDF_TEXT_EXTRACTION_NEEDED');
    }
    
    // 清理臨時 PDF 文件
    try {
      if (fs.existsSync(tempPdfPath)) {
        fs.unlinkSync(tempPdfPath);
      }
    } catch (cleanupError: any) {
      console.warn('[PDF to Images] 清理臨時文件失敗:', cleanupError.message);
    }
    
    console.log(`[PDF to Images] 成功轉換 ${base64Images.length} 個圖像為 base64`);
    return base64Images;
    
  } catch (error: any) {
    console.error('[PDF to Images] 轉換錯誤:', error);
    
    // 如果是特殊的文本提取標記，重新拋出
    if (error.message === 'PDF_TEXT_EXTRACTION_NEEDED') {
      throw error;
    }
    
    throw new Error(`Failed to convert PDF to images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 新增：PDF 文本提取函數（備用方案）
async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    console.log('[PDF Text Extraction] 開始提取 PDF 文本...');
    console.log('[PDF Text Extraction] Buffer 大小:', pdfBuffer.length, 'bytes');
    
    // 確保傳入的是 Buffer 對象
    if (!Buffer.isBuffer(pdfBuffer)) {
      throw new Error('Invalid buffer provided to extractTextFromPDF');
    }
    
    // 檢測運行環境
    const isWindows = process.platform === 'win32';
    const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
    
    // 在 Vercel 環境中，使用 pdfjs-dist legacy build（不需要 canvas）
    if (isVercel) {
      console.log('[PDF Text Extraction] 在 Vercel 環境中運行，使用 pdfjs-dist legacy build...');
      
      try {
        // 動態導入 pdfjs-dist legacy build（不需要 canvas）
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
        
        // 設置 worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        
        // 將 Buffer 轉換為 Uint8Array
        const uint8Array = new Uint8Array(pdfBuffer);
        
        // 加載 PDF 文檔
        const loadingTask = pdfjsLib.getDocument({
          data: uint8Array,
          useSystemFonts: true,
          disableFontFace: true, // 禁用字體加載以避免 canvas 依賴
          isEvalSupported: false, // 禁用 eval 以提高安全性
        });
        
        const pdfDoc = await loadingTask.promise;
        console.log('[PDF Text Extraction] PDF 加載成功，頁數:', pdfDoc.numPages);
        
        let fullText = '';
        
        // 逐頁提取文本
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          try {
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // 將文本項目組合成字符串
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            
            fullText += pageText + '\n';
          } catch (pageError) {
            console.warn(`[PDF Text Extraction] 頁面 ${pageNum} 提取失敗:`, pageError);
          }
        }
        
        console.log('[PDF Text Extraction] pdfjs-dist 提取成功，文本長度:', fullText.length);
        
        if (!fullText || fullText.trim().length === 0) {
          throw new Error('No text content found in PDF');
        }
        
        return fullText;
      } catch (parseError: any) {
        console.error('[PDF Text Extraction] pdfjs-dist 失敗:', parseError.message);
        
        // 如果 pdfjs-dist 失敗，嘗試基本的文本提取
        console.log('[PDF Text Extraction] 嘗試基本文本提取...');
        const textContent = pdfBuffer.toString('utf8', 0, Math.min(pdfBuffer.length, 50000));
        
        // 嘗試找到 PDF 中的文本流
        const textMatches = textContent.match(/\(([^)]+)\)/g);
        if (textMatches && textMatches.length > 0) {
          const extractedText = textMatches
            .map(match => match.slice(1, -1))
            .join(' ')
            .replace(/\\(\d{3})/g, (match, octal) => String.fromCharCode(parseInt(octal, 8)))
            .replace(/\\/g, '');
          
          if (extractedText.length > 100) {
            console.log('[PDF Text Extraction] 基本提取成功，文本長度:', extractedText.length);
            return extractedText;
          }
        }
        
        throw new Error(`PDF parsing failed: ${parseError.message}`);
      }
    }
    
    // 本地環境使用 pdftotext（如果可用）
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    let pdftotextPath: string;
    
    if (isWindows) {
      // Windows 環境
      const projectRoot = process.cwd();
      const popplerPath = path.join(projectRoot, 'poppler', 'poppler-24.08.0', 'Library', 'bin');
      pdftotextPath = path.join(popplerPath, 'pdftotext.exe');
      
      if (!fs.existsSync(pdftotextPath)) {
        console.warn('[PDF Text Extraction] pdftotext.exe 不存在，使用 pdfjs-dist 作為後備');
        // 如果本地也沒有 pdftotext，使用 pdfjs-dist
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        
        const uint8Array = new Uint8Array(pdfBuffer);
        const loadingTask = pdfjsLib.getDocument({ 
          data: uint8Array, 
          useSystemFonts: true,
          disableFontFace: true,
          isEvalSupported: false,
        });
        const pdfDoc = await loadingTask.promise;
        
        let fullText = '';
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        
        return fullText;
      }
    } else {
      // Linux/Mac 環境
      pdftotextPath = 'pdftotext';
      
      // 檢查 pdftotext 是否可用
      try {
        await execAsync('which pdftotext');
      } catch (e) {
        console.warn('[PDF Text Extraction] pdftotext 不可用，使用 pdfjs-dist 作為後備');
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        
        const uint8Array = new Uint8Array(pdfBuffer);
        const loadingTask = pdfjsLib.getDocument({ 
          data: uint8Array, 
          useSystemFonts: true,
          disableFontFace: true,
          isEvalSupported: false,
        });
        const pdfDoc = await loadingTask.promise;
        
        let fullText = '';
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        
        return fullText;
      }
    }
    
    // 創建臨時文件
    const tempDir = os.tmpdir();
    const tempPdfPath = path.join(tempDir, `temp-pdf-text-${Date.now()}.pdf`);
    const tempTxtPath = path.join(tempDir, `temp-pdf-text-${Date.now()}.txt`);
    
    // 寫入臨時 PDF 文件
    fs.writeFileSync(tempPdfPath, pdfBuffer);
    
    try {
      // 使用 pdftotext 提取文本
      const command = isWindows 
        ? `"${pdftotextPath}" -enc UTF-8 "${tempPdfPath}" "${tempTxtPath}"`
        : `${pdftotextPath} -enc UTF-8 "${tempPdfPath}" "${tempTxtPath}"`;
      
      console.log('[PDF Text Extraction] 執行命令:', command);
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        console.warn('[PDF Text Extraction] pdftotext 警告:', stderr);
      }
      
      // 讀取提取的文本
      const fullText = fs.readFileSync(tempTxtPath, 'utf8');
      
      console.log('[PDF Text Extraction] 文本提取成功，字符數:', fullText.length);
      
      if (!fullText || fullText.trim().length === 0) {
        throw new Error('No text content found in PDF');
      }
      
      return fullText;
      
    } finally {
      // 清理臨時文件
      try {
        if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
        if (fs.existsSync(tempTxtPath)) fs.unlinkSync(tempTxtPath);
      } catch (cleanupError) {
        console.warn('[PDF Text Extraction] 清理臨時文件失敗:', cleanupError);
      }
    }
    
  } catch (error: any) {
    console.error('[PDF Text Extraction] 文本提取失敗:', error);
    console.error('[PDF Text Extraction] 錯誤詳情:', {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n') // 只顯示前3行堆棧
    });
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

// 定義訂單數據接口
interface OrderData {
  account_num: number;
  order_ref: number;
  customer_ref: number;
  invoice_to: string;
  delivery_add: string;
  product_code: string;
  product_desc: string;
  product_qty: number;
  unit_price: number;
  uploaded_by: number;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Analyze Order PDF API] 接收 PDF 分析請求...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadedBy = formData.get('uploadedBy') as string;
    const saveToStorage = formData.get('saveToStorage') as string;
    
    if (!file) {
      console.error('[Analyze Order PDF API] 沒有找到文件');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!uploadedBy) {
      console.error('[Analyze Order PDF API] 沒有提供上傳者ID');
      return NextResponse.json({ error: 'No uploadedBy provided' }, { status: 400 });
    }
    
    console.log('[Analyze Order PDF API] 文件信息:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedBy,
      saveToStorage: saveToStorage === 'true'
    });
    
    // 驗證文件類型
    if (file.type !== 'application/pdf') {
      console.error('[Analyze Order PDF API] 無效的文件類型:', file.type);
      return NextResponse.json({ 
        error: `Invalid file type: ${file.type}. Only PDF files are allowed.` 
      }, { status: 400 });
    }
    
    // 轉換文件為 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    
    // 可選：保存文件到 Storage
    let storageInfo = null;
    if (saveToStorage === 'true') {
      try {
        console.log('[Analyze Order PDF API] 保存文件到 orderpdf bucket...');
        
        const supabaseAdmin = createSupabaseAdmin();
        const fileName = `order-${Date.now()}-${file.name}`;
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('orderpdf')
          .upload(fileName, blob, {
            cacheControl: '3600',
            upsert: true,
            contentType: 'application/pdf',
          });
        
        if (uploadError) {
          console.error('[Analyze Order PDF API] Storage 上傳錯誤:', uploadError);
        } else {
          const { data: urlData } = supabaseAdmin.storage
            .from('orderpdf')
            .getPublicUrl(uploadData.path);
          
          storageInfo = {
            path: uploadData.path,
            publicUrl: urlData.publicUrl,
            bucket: 'orderpdf'
          };
          
          console.log('[Analyze Order PDF API] 文件保存成功:', storageInfo);
        }
      } catch (storageError) {
        console.error('[Analyze Order PDF API] Storage 操作錯誤:', storageError);
      }
    }
    
    console.log('[Analyze Order PDF API] 開始將 PDF 轉換為圖像...');
    
    // 嘗試將 PDF 轉換為圖像，如果失敗則使用文本提取
    let imageBase64Array: string[] = [];
    let extractedText: string = '';
    let useTextMode = false;
    
    try {
      imageBase64Array = await convertPdfToImages(pdfBuffer);
      console.log(`[Analyze Order PDF API] PDF 轉換完成，共 ${imageBase64Array.length} 頁圖像`);
    } catch (conversionError: any) {
      console.warn('[Analyze Order PDF API] 圖像轉換失敗，嘗試文本提取:', conversionError.message);
      
      // 如果圖像轉換失敗，直接使用文本提取模式
      try {
        extractedText = await extractTextFromPDF(pdfBuffer);
        useTextMode = true;
        console.log('[Analyze Order PDF API] 切換到文本提取模式，提取字符數:', extractedText.length);
      } catch (textError: any) {
        console.error('[Analyze Order PDF API] 文本提取也失敗:', textError.message);
        return NextResponse.json({ 
          error: `PDF processing failed: Unable to convert to images or extract text. ${textError.message}`,
          details: 'Both image conversion and text extraction methods failed'
        }, { status: 500 });
      }
    }
    
    if (!useTextMode && imageBase64Array.length === 0) {
      return NextResponse.json({ 
        error: 'No content extracted from PDF',
        details: 'PDF conversion resulted in no images and text extraction was not attempted'
      }, { status: 500 });
    }
    
    // 創建 OpenAI 客戶端
    const openai = createOpenAIClient();
    
    // 構建詳細的 prompt
    const prompt = `
You are a professional data extraction specialist. Analyze the provided document and extract order information.

**CRITICAL INSTRUCTIONS:**
1. Return ONLY a valid JSON array - no explanations, no markdown, no additional text
2. Start your response with [ and end with ]
3. Do not include any text before or after the JSON array
4. Do not wrap the response in markdown code blocks

Database Schema:
- account_num (number) - Account number
- order_ref (number) - Order reference number
- customer_ref (number) - Customer reference number
- invoice_to (string) - Invoice address
- delivery_add (string) - Delivery address
- product_code (string) - Product code/SKU
- product_desc (string) - Product description
- product_qty (number) - Quantity
- unit_price (number) - Price in pence/cents (£12.50 = 1250)

If data is missing, use these defaults:
- Numbers: 0
- Text: "NOT_FOUND"

Example of the EXACT format required:
[{"account_num":12345,"order_ref":67890,"customer_ref":11111,"invoice_to":"ABC Ltd","delivery_add":"123 Street","product_code":"PROD001","product_desc":"Product Name","product_qty":10,"unit_price":1250}]

Extract all line items if multiple products exist. Remember: ONLY return the JSON array, nothing else.`;
    
    // 構建消息內容，包含所有圖像
    const messageContent: any[] = [
      {
        type: "text",
        text: prompt
      }
    ];
    
    if (useTextMode) {
      // 文本模式：添加提取的文本
      messageContent[0].text += `\n\n**DOCUMENT TEXT:**\n${extractedText}`;
      console.log('[Analyze Order PDF API] 使用文本模式發送到 OpenAI...');
      console.log('[Analyze Order PDF API] 文本預覽（前500字符）:', extractedText.substring(0, 500));
    } else {
      // 圖像模式：添加所有頁面的圖像
      for (let i = 0; i < imageBase64Array.length; i++) {
        messageContent.push({
          type: "image_url",
          image_url: {
            url: `data:image/png;base64,${imageBase64Array[i]}`,
            detail: "high"
          }
        });
      }
      console.log('[Analyze Order PDF API] 使用圖像模式發送到 OpenAI，包含', imageBase64Array.length, '張圖像...');
    }
    
    // 發送到 OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a JSON-only data extraction bot. You must ONLY output valid JSON arrays. Never include explanations, markdown formatting, or any text outside the JSON. Your entire response must be parseable by JSON.parse()."
        },
        {
          role: "user",
          content: messageContent
        }
      ],
      max_tokens: 4000,
      temperature: 0.1
    });
    
    console.log('[Analyze Order PDF API] OpenAI 回應接收完成');
    
    const extractedContent = response.choices[0]?.message?.content;
    
    if (!extractedContent) {
      console.error('[Analyze Order PDF API] OpenAI 沒有返回內容');
      return NextResponse.json({ error: 'No content extracted from PDF' }, { status: 500 });
    }
    
    console.log('[Analyze Order PDF API] 原始提取內容:', extractedContent);
    console.log('[Analyze Order PDF API] 內容長度:', extractedContent.length);
    console.log('[Analyze Order PDF API] 前500字符:', extractedContent.substring(0, 500));
    
    // 解析 JSON 回應
    let orderData: OrderData[];
    try {
      // 嘗試多種清理方式
      let cleanContent = extractedContent.trim();
      
      // 移除 markdown 代碼塊標記
      cleanContent = cleanContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      
      // 移除可能的 BOM 或其他不可見字符
      cleanContent = cleanContent.replace(/^\uFEFF/, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
      
      // 如果內容包含多餘的文字說明，嘗試提取 JSON 部分
      const jsonMatch = cleanContent.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
      if (jsonMatch) {
        cleanContent = jsonMatch[1];
      }
      
      console.log('[Analyze Order PDF API] 清理後的內容:', cleanContent.substring(0, 500));
      
      // 如果內容被包裹在對象中，嘗試提取數組
      if (cleanContent.startsWith('{')) {
        try {
          const parsed = JSON.parse(cleanContent);
          console.log('[Analyze Order PDF API] 解析為對象，鍵:', Object.keys(parsed));
          
          if (parsed.orders && Array.isArray(parsed.orders)) {
            orderData = parsed.orders;
          } else if (parsed.data && Array.isArray(parsed.data)) {
            orderData = parsed.data;
          } else if (parsed.items && Array.isArray(parsed.items)) {
            orderData = parsed.items;
          } else if (parsed.records && Array.isArray(parsed.records)) {
            orderData = parsed.records;
          } else {
            // 查找任何數組屬性
            const arrayProp = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
            if (arrayProp) {
              console.log('[Analyze Order PDF API] 找到數組屬性:', arrayProp);
              orderData = parsed[arrayProp];
            } else {
              throw new Error('No array found in response object');
            }
          }
        } catch (e) {
          console.error('[Analyze Order PDF API] 嘗試解析對象失敗:', e);
          throw new Error('Response is wrapped in object but cannot extract array');
        }
      } else if (cleanContent.startsWith('[')) {
        // 直接解析為數組
        orderData = JSON.parse(cleanContent);
      } else {
        // 如果不是標準 JSON 格式，嘗試其他方法
        console.error('[Analyze Order PDF API] 內容不是有效的 JSON 格式');
        throw new Error('Response is not valid JSON format');
      }
      
      if (!Array.isArray(orderData)) {
        console.error('[Analyze Order PDF API] 解析結果不是數組:', typeof orderData);
        throw new Error('Response is not an array');
      }
      
      if (orderData.length === 0) {
        console.warn('[Analyze Order PDF API] 解析結果為空數組');
        throw new Error('No order data extracted from PDF');
      }
      
      console.log(`[Analyze Order PDF API] 成功解析 ${orderData.length} 條記錄`);
      console.log('[Analyze Order PDF API] 第一條記錄樣本:', JSON.stringify(orderData[0], null, 2));
      
      // 驗證每個訂單記錄的必要欄位
      orderData.forEach((order, index) => {
        const requiredFields: (keyof OrderData)[] = ['account_num', 'order_ref', 'customer_ref', 'invoice_to', 'delivery_add', 'product_code', 'product_desc', 'product_qty', 'unit_price'];
        for (const field of requiredFields) {
          if (order[field] === undefined || order[field] === null) {
            console.warn(`[Analyze Order PDF API] 記錄 ${index + 1} 缺少欄位 '${field}'，使用默認值`);
            // 使用默認值
            if (['account_num', 'order_ref', 'customer_ref', 'product_qty', 'unit_price'].includes(field)) {
              (order as any)[field] = 0;
            } else {
              (order as any)[field] = 'NOT_FOUND';
            }
          }
        }
        
        // 確保數字欄位是數字類型
        const numericFields: (keyof OrderData)[] = ['account_num', 'order_ref', 'customer_ref', 'product_qty', 'unit_price'];
        for (const field of numericFields) {
          const value = order[field];
          if (typeof value === 'string') {
            // 嘗試解析字符串為數字
            const parsed = parseInt(value.toString().replace(/[^\d]/g, ''));
            (order as any)[field] = isNaN(parsed) ? 0 : parsed;
          } else if (typeof value !== 'number') {
            (order as any)[field] = 0;
          }
        }
      });
      
    } catch (parseError) {
      console.error('[Analyze Order PDF API] JSON 解析錯誤:', parseError);
      console.error('[Analyze Order PDF API] 清理後的內容:', extractedContent.substring(0, 500));
      
      // 如果是文本模式且解析失敗，返回更詳細的錯誤信息
      if (useTextMode) {
        return NextResponse.json({ 
          error: 'Failed to parse extracted data',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
          hint: 'The PDF text extraction may not have captured structured data properly. Try uploading a clearer PDF.',
          rawContent: extractedContent.substring(0, 1000) // 只返回前1000字符避免太大
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to parse extracted data',
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
        rawContent: extractedContent.substring(0, 1000)
      }, { status: 500 });
    }
    
    console.log('[Analyze Order PDF API] 解析的訂單數據:', orderData);
    
    // 創建服務端客戶端
    const supabaseAdmin = createSupabaseAdmin();
    
    // 檢查是否已存在相同的訂單記錄（基於 order_ref 和 product_code）
    console.log('[Analyze Order PDF API] 檢查重複記錄...');
    const duplicateChecks = await Promise.all(
      orderData.map(async (order) => {
        const { data: existingRecords, error } = await supabaseAdmin
          .from('data_order')
          .select('uuid, order_ref, product_code')
          .eq('order_ref', order.order_ref)
          .eq('product_code', order.product_code);
        
        if (error) {
          console.error('[Analyze Order PDF API] 重複檢查錯誤:', error);
          return { isDuplicate: false, order };
        }
        
        return { 
          isDuplicate: existingRecords && existingRecords.length > 0, 
          order,
          existingRecords 
        };
      })
    );
    
    // 過濾掉重複的記錄
    const newOrders = duplicateChecks.filter(check => !check.isDuplicate).map(check => check.order);
    const duplicateOrders = duplicateChecks.filter(check => check.isDuplicate);
    
    if (duplicateOrders.length > 0) {
      console.log(`[Analyze Order PDF API] 發現 ${duplicateOrders.length} 個重複記錄，將跳過插入`);
      duplicateOrders.forEach((dup, index) => {
        console.log(`[Analyze Order PDF API] 重複記錄 ${index + 1}: Order ${dup.order.order_ref}, Product ${dup.order.product_code}`);
      });
    }
    
    if (newOrders.length === 0) {
      console.log('[Analyze Order PDF API] 所有記錄都已存在，無需插入新記錄');
      return NextResponse.json({
        success: true,
        message: 'All records already exist in database',
        extractedData: orderData,
        insertedRecords: [],
        duplicateRecords: duplicateOrders.map(d => d.order),
        recordCount: 0,
        duplicateCount: duplicateOrders.length,
        storageInfo: storageInfo,
        pagesProcessed: useTextMode ? 1 : imageBase64Array.length,
        processingMode: useTextMode ? 'text_extraction' : 'image_analysis'
      });
    }
    
    console.log(`[Analyze Order PDF API] 將插入 ${newOrders.length} 個新記錄`);
    
    // 插入數據到 data_order 表
    const insertPromises = newOrders.map(async (order, index) => {
      try {
        const orderWithUploader = {
          ...order,
          uploaded_by: parseInt(uploadedBy)
        };
        
        console.log(`[Analyze Order PDF API] 插入記錄 ${index + 1}:`, orderWithUploader);
        
        const { data, error } = await supabaseAdmin
          .from('data_order')
          .insert(orderWithUploader)
          .select();
        
        if (error) {
          console.error(`[Analyze Order PDF API] 插入記錄 ${index + 1} 錯誤:`, error);
          throw error;
        }
        
        console.log(`[Analyze Order PDF API] 記錄 ${index + 1} 插入成功:`, data);
        return data;
      } catch (insertError) {
        console.error(`[Analyze Order PDF API] 記錄 ${index + 1} 插入失敗:`, insertError);
        throw new Error(`Failed to insert record ${index + 1}: ${insertError instanceof Error ? insertError.message : 'Unknown error'}`);
      }
    });
    
    const insertResults = await Promise.all(insertPromises);
    
    console.log('[Analyze Order PDF API] 數據插入成功，插入記錄數:', insertResults.length);
    
    return NextResponse.json({
      success: true,
      extractedData: orderData,
      insertedRecords: insertResults.flat(),
      duplicateRecords: duplicateOrders.map(d => d.order),
      recordCount: insertResults.length,
      duplicateCount: duplicateOrders.length,
      storageInfo: storageInfo,
      pagesProcessed: useTextMode ? 1 : imageBase64Array.length,
      processingMode: useTextMode ? 'text_extraction' : 'image_analysis',
      message: `Successfully extracted and saved ${insertResults.length} new order records using ${useTextMode ? 'text extraction' : `image analysis (${imageBase64Array.length} pages)`}${duplicateOrders.length > 0 ? ` (${duplicateOrders.length} duplicates skipped)` : ''}`
    });
    
  } catch (error: any) {
    console.error('[Analyze Order PDF API] 意外錯誤:', error);
    return NextResponse.json({ 
      error: `Server error: ${error.message}`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 