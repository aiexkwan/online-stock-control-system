// Common types shared across card components

export type FilterValue = string | number | boolean | null;

export interface UserInfo {
  id?: number;
  name: string;
  email: string | null;
  iconUrl?: string | null;
}

export interface DownloadRecord {
  id: string;
  fileName: string;
  fileSize: number;
  downloadDate: Date;
  status: 'completed' | 'failed' | 'pending';
  url?: string;
  error?: string;
}

export interface DownloadCenterCardProps {
  onDownload?: (record: DownloadRecord) => void;
  maxRecords?: number;
  className?: string;
  title?: string;
  description?: string;
  onReportSelect?: (report: unknown) => void;
}

export interface DataUpdateCardProps {
  onUpdate?: () => void;
  isLoading?: boolean;
  className?: string;
  height?: string | number;
}
