/**
 * Admin Dashboard Content Component
 * 根據不同主題渲染對應的儀表板內容
 */

'use client';

import React from 'react';
import { TimeFrame } from '@/app/components/dashboard/TimeFrameSelector';
import { adminDashboardLayouts } from './adminDashboardLayouts';
import { AdminWidgetRenderer } from './AdminWidgetRenderer';
import { CustomThemeLayout } from './CustomThemeLayout';
import { UploadUpdateLayout } from './UploadUpdateLayout';
import { StockManagementLayout } from './StockManagementLayout';
import { SystemLayout } from './SystemLayout';
import { AnalysisLayout } from './AnalysisLayout';

interface AdminDashboardContentProps {
  theme: string;
  timeFrame: TimeFrame;
}

export const AdminDashboardContent: React.FC<AdminDashboardContentProps> = ({
  theme,
  timeFrame
}) => {
  // Use custom layout for injection, pipeline, and warehouse themes
  if (theme === 'injection' || theme === 'pipeline' || theme === 'warehouse') {
    const layout = adminDashboardLayouts[theme] || adminDashboardLayouts.overview;
    
    return (
      <CustomThemeLayout theme={theme} timeFrame={timeFrame}>
        {layout.widgets.map((widget, index) => (
          <AdminWidgetRenderer
            key={`${widget.gridArea}-${index}`}
            config={widget}
            theme={theme}
            timeFrame={timeFrame}
            index={index}
          />
        ))}
      </CustomThemeLayout>
    );
  }
  
  // Use upload/update layout for upload and update themes
  if (theme === 'upload' || theme === 'update') {
    const layout = adminDashboardLayouts[theme] || adminDashboardLayouts.overview;
    
    return (
      <UploadUpdateLayout theme={theme} timeFrame={timeFrame}>
        {layout.widgets.map((widget, index) => (
          <AdminWidgetRenderer
            key={`${widget.gridArea}-${index}`}
            config={widget}
            theme={theme}
            timeFrame={timeFrame}
            index={index}
          />
        ))}
      </UploadUpdateLayout>
    );
  }
  
  // Use stock management layout for stock-management theme
  if (theme === 'stock-management') {
    const layout = adminDashboardLayouts[theme] || adminDashboardLayouts.overview;
    
    return (
      <StockManagementLayout theme={theme} timeFrame={timeFrame}>
        {layout.widgets.map((widget, index) => (
          <AdminWidgetRenderer
            key={`${widget.gridArea}-${index}`}
            config={widget}
            theme={theme}
            timeFrame={timeFrame}
            index={index}
          />
        ))}
      </StockManagementLayout>
    );
  }
  
  // Use system layout for system theme
  if (theme === 'system') {
    const layout = adminDashboardLayouts[theme] || adminDashboardLayouts.overview;
    
    return (
      <SystemLayout theme={theme} timeFrame={timeFrame}>
        {layout.widgets.map((widget, index) => (
          <AdminWidgetRenderer
            key={`${widget.gridArea}-${index}`}
            config={widget}
            theme={theme}
            timeFrame={timeFrame}
            index={index}
          />
        ))}
      </SystemLayout>
    );
  }
  
  // Use analysis layout for analysis theme
  if (theme === 'analysis') {
    const layout = adminDashboardLayouts[theme] || adminDashboardLayouts.overview;
    
    return (
      <AnalysisLayout theme={theme} timeFrame={timeFrame}>
        {layout.widgets.map((widget, index) => (
          <AdminWidgetRenderer
            key={`${widget.gridArea}-${index}`}
            config={widget}
            theme={theme}
            timeFrame={timeFrame}
            index={index}
          />
        ))}
      </AnalysisLayout>
    );
  }
  
  // Default layout for other themes
  const layout = adminDashboardLayouts[theme] || adminDashboardLayouts.overview;

  return (
    <div 
      className="h-full w-full"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: '200px 300px 200px',
        gap: '16px',
        gridTemplateAreas: layout.gridTemplate,
        height: '100%',
        width: '100%'
      }}
    >
      {layout.widgets.map((widget, index) => (
        <AdminWidgetRenderer
          key={`${widget.gridArea}-${index}`}
          config={widget}
          theme={theme}
          timeFrame={timeFrame}
          index={index}
        />
      ))}
    </div>
  );
};