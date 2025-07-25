/**
 * OtherFilesCard Component
 * 使用統一 TableCard 架構的其他文件列表卡片
 * 取代原有 OtherFilesListWidget
 */

'use client';

import React, { useMemo } from 'react';
import { DocumentIcon, PhotoIcon, CloudIcon } from '@heroicons/react/24/outline';
import { TableCard, TableCardProps } from './TableCard';
import { TableColumn, FormatterType, ColumnAlign } from '@/types/generated/graphql';

export interface OtherFilesCardProps
  extends Omit<TableCardProps, 'dataSource' | 'columns'> {
  // 可選的自定義配置
  showFileIcons?: boolean;
}

// 根據檔案類型返回圖標
const getFileIcon = (docType?: string, docName?: string) => {
  if (docType === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(docName || '')) {
    return 'photo';
  }
  if (docType === 'cloud' || /\.(zip|rar|7z)$/i.test(docName || '')) {
    return 'cloud';
  }
  return 'document';
};

export const OtherFilesCard: React.FC<OtherFilesCardProps> = ({
  showFileIcons = true,
  className,
  ...props
}) => {
  // 定義專門的欄位配置
  const columns = useMemo<string[]>(() => [
    'created_at',
    'doc_name', 
    'uploader_name',
    'doc_type'
  ], []);

  // TableCard 配置
  const tableCardProps: TableCardProps = {
    ...props,
    dataSource: 'other_files', // GraphQL data source
    columns,
    sortable: true,
    filterable: true,
    showSearch: true,
    showExport: true,
    showHeader: true,
    showPagination: true,
    pageSize: 10,
    className,
  };

  return <TableCard {...tableCardProps} />;
};

// 預設配置（用於 Card 系統註冊）
export const OtherFilesCardConfig = {
  id: 'other-files',
  name: 'Other Files',
  description: 'Display list of uploaded files',
  dataSource: 'other_files',
  defaultProps: {
    showFileIcons: true,
    pageSize: 10,
    height: 400,
  },
};

export default OtherFilesCard;