/**
 * PDF 庫優化 webpack 插件
 * 解決 @react-pdf/renderer 依賴重複載入問題
 */

class PDFOptimizationPlugin {
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap('PDFOptimizationPlugin', nmf => {
      nmf.hooks.beforeResolve.tap('PDFOptimizationPlugin', resolveData => {
        // 統一 fontkit 解析路徑
        if (resolveData.request === 'fontkit' || resolveData.request === '@react-pdf/fontkit') {
          resolveData.request = 'fontkit';
        }

        // 統一 pdfkit 解析路徑
        if (resolveData.request === '@react-pdf/pdfkit') {
          resolveData.request = 'pdfkit';
        }
      });
    });
  }
}

module.exports = PDFOptimizationPlugin;
