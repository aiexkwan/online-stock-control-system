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

export const RemarkFormatter: React.FC<RemarkFormatterProps> = React.memo(({ remarkText }) => {
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
    return <div className='animate-pulse whitespace-pre-line text-red-400'>{remarkText}</div>;
  }

  return (
    <div className='space-y-3'>
      {/* Title Section */}
      {parsed.title && (
        <div className='rounded-lg border-l-4 border-red-500 bg-red-900/30 p-3'>
          <div className='animate-pulse text-base font-bold text-red-200'>{parsed.title}</div>
        </div>
      )}

      {/* Items Section */}
      {parsed.items.length > 0 && (
        <div className='rounded-lg bg-gray-900/50 p-3'>
          <div className='space-y-2'>
            {parsed.items.map((item, index) => (
              <div key={index} className='flex animate-pulse items-start text-red-400'>
                <span className='mr-3 mt-1 font-bold text-red-500'>•</span>
                <span className='flex-1 leading-relaxed'>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remarks Section */}
      {parsed.remarks && (
        <div className='mt-4 rounded-lg border-l-4 border-yellow-500 bg-yellow-900/30 p-3'>
          <div className='animate-pulse font-semibold text-yellow-200'>{parsed.remarks}</div>
        </div>
      )}
    </div>
  );
});

// Set display name for debugging
RemarkFormatter.displayName = 'RemarkFormatter';

export default RemarkFormatter;
