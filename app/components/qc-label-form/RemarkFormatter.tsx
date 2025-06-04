'use client';

import React from 'react';

interface RemarkFormatterProps {
  remarkText: string;
}

interface ParsedRemark {
  title: string;
  items: string[];
  remarks: string;
}

export const RemarkFormatter: React.FC<RemarkFormatterProps> = ({ remarkText }) => {
  const parseRemarkText = (text: string): ParsedRemark => {
    // Simplified parsing based on symbols only
    // "-" : New paragraph/section
    // ">" : New line item with bullet point
    
    let title = '';
    let items: string[] = [];
    let remarks = '';
    
    // First, check if there's a title with brackets at the beginning
    const titleMatch = text.match(/^([^-]*\[[^\]]+\][^-]*?)(?:\s*-\s*)/);
    let remainingText = text;
    
    if (titleMatch) {
      title = titleMatch[1].trim();
      remainingText = text.substring(titleMatch[0].length).trim();
    }
    
    // Split by "-" to get sections
    const sections = remainingText.split(/\s*-\s*/).filter(section => section.trim().length > 0);
    
    for (const section of sections) {
      const trimmedSection = section.trim();
      
      // Check if this section starts with "Remark"
      if (/^remark\s*:/i.test(trimmedSection)) {
        remarks = trimmedSection;
        continue;
      }
      
      // Check if this section contains ">" symbols
      if (trimmedSection.includes('>')) {
        // Split by ">" and create bullet points
        const parts = trimmedSection.split(/\s*>\s*/).filter(part => part.trim().length > 0);
        items.push(...parts);
      } else {
        // Regular section without ">" - treat as single item
        items.push(trimmedSection);
      }
    }
    
    return { title, items, remarks };
  };

  const parsed = parseRemarkText(remarkText);
  
  // If no structure detected, display as simple text
  if (!parsed.title && parsed.items.length === 0 && !parsed.remarks) {
    return (
      <div className="animate-pulse whitespace-pre-line text-red-400">
        {remarkText}
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {/* Title Section */}
      {parsed.title && (
        <div className="bg-red-900/30 rounded-lg p-3 border-l-4 border-red-500">
          <div className="text-red-200 font-bold text-base animate-pulse">
            {parsed.title}
          </div>
        </div>
      )}
      
      {/* Items Section */}
      {parsed.items.length > 0 && (
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="space-y-2">
            {parsed.items.map((item, index) => (
              <div key={index} className="flex items-start text-red-400 animate-pulse">
                <span className="text-red-500 mr-3 mt-1 font-bold">•</span>
                <span className="flex-1 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Remarks Section */}
      {parsed.remarks && (
        <div className="bg-yellow-900/30 rounded-lg p-3 border-l-4 border-yellow-500 mt-4">
          <div className="text-yellow-200 font-semibold animate-pulse">
            {parsed.remarks}
          </div>
        </div>
      )}
    </div>
  );
};

export default RemarkFormatter; 