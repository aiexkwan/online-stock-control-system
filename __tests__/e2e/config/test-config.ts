export const testConfig = {
  // 登入資料
  credentials: {
    email: 'akwan@pennineindustries.com',
    password: 'X315Y316'
  },
  
  // 應用 URL
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  
  // Puppeteer 配置
  puppeteer: {
    headless: false, // 設為 false 可以睇到瀏覽器操作
    slowMo: 100, // 減慢操作速度，方便觀察
    defaultViewport: {
      width: 1920,
      height: 1080
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-site-isolation-trials'
    ]
  },
  
  // 超時設定
  timeout: {
    navigation: 30000,
    analysis: 60000, // PDF 分析可能需要較長時間
    default: 10000
  },
  
  // PDF 文件路徑
  pdfDirectory: 'public/pdf',
  
  // 測試報告設定
  report: {
    outputDir: '__tests__/e2e/reports',
    format: 'json' // 可以改為 'html' 或 'csv'
  },
  
  // 重試設定
  retry: {
    times: 3,
    delay: 5000
  }
};

// 選擇器配置
export const selectors = {
  // 登入頁面
  login: {
    emailInput: 'input[type="email"]',
    passwordInput: 'input[type="password"]',
    submitButton: 'button[type="submit"]',
    errorMessage: '.error-message'
  },
  
  // Admin Panel Menu
  adminPanel: {
    menuButton: 'button:has-text("Admin Panel")',
    uploadOrderPDFButton: 'button:has-text("Upload Order PDF")'
  },
  
  // Upload Order PDF Dialog
  uploadDialog: {
    dialog: '[role="dialog"]',
    dropZone: 'div[ondrop]',
    fileInput: 'input[type="file"][accept=".pdf"]',
    analyzeButton: 'button:has-text("Analyze PDF")',
    closeButton: 'button:has-text("Close")',
    progressBar: 'div[role="progressbar"]',
    extractedDataSection: 'div:has-text("Extracted Order Data")',
    successMessage: 'div:has-text("Data Import Success")',
    errorMessage: '.text-red-300'
  },
  
  // 提取數據顯示
  extractedData: {
    orderNumber: 'span:has-text("Order Number:") + span',
    productCode: 'span:has-text("Product Code:") + span',
    quantity: 'span:has-text("Quantity:") + span',
    description: 'span:has-text("Product Description:") + span'
  }
};

// 測試數據
export const testPDFs = [
  '280813-Picking List.pdf',
  '280831-Picking List.pdf',
  '280832-Picking List.pdf',
  '280833-Picking List.pdf',
  '280834-Picking List.pdf',
  '280835-Picking List.pdf',
  '280836-Picking List.pdf',
  '280858 Picking List.pdf',
  '280859 Picking List.pdf',
  '280860 Picking List.pdf',
  '280862 Picking List.pdf',
  'ACO - 280761 Picking List.pdf'
];