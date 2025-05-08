'use client';

import React, { useState } from 'react';

export default function HtmlPreviewPage() {
  const [htmlContent, setHtmlContent] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setHtmlContent(content);
        
        // 創建一個臨時的 div 來解析 HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        // 提取樣式
        const styles = tempDiv.getElementsByTagName('style');
        const styleContent = Array.from(styles).map(style => style.textContent).join('\n');
        
        // 提取 body 內容
        const bodyContent = tempDiv.querySelector('body')?.innerHTML || content;
        
        // 更新預覽
        const previewDiv = document.getElementById('preview');
        if (previewDiv) {
          // 創建樣式標籤
          const styleTag = document.createElement('style');
          styleTag.textContent = styleContent;
          previewDiv.innerHTML = '';
          previewDiv.appendChild(styleTag);
          previewDiv.insertAdjacentHTML('beforeend', bodyContent);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">HTML 標籤預覽</h1>
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="mb-4">
          <input
            type="file"
            accept=".html"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="overflow-hidden">
            <h2 className="text-lg font-semibold mb-2">預覽</h2>
            <div id="preview" className="border rounded-lg p-4 min-h-[500px] overflow-auto"></div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">HTML 源代碼</h2>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              className="w-full h-[500px] border rounded-lg p-4 font-mono text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 