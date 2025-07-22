'use client';

import { useEffect } from 'react';

export function CssMonitor() {
  useEffect(() => {
    // Monitor for CSS/JS MIME type conflicts
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.tagName === 'LINK' && element.getAttribute('rel') === 'stylesheet') {
                const href = element.getAttribute('href');
                if (href && href.includes('_next/static/css/')) {
                  // Ensure CSS files are loaded with correct MIME type
                  element.addEventListener('error', e => {
                    console.warn('CSS loading error detected:', href);
                  });
                }
              }
            }
          });
        }
      });
    });

    // Start observing after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.head, { childList: true, subtree: true });
      });
    } else {
      observer.observe(document.head, { childList: true, subtree: true });
    }

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything
}