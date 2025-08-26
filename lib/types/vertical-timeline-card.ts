/**
 * Vertical Timeline Card Type Definitions
 * @packageDocumentation
 */

/**
 * Interface for Vertical Timeline Card Properties
 * @public
 */
export interface VerticalTimelineCardProps {
  /**
   * Height of the card
   * @defaultValue '100%'
   */
  height?: number | string;

  /**
   * Additional CSS classes for custom styling
   */
  className?: string;

  /**
   * Edit mode flag for future extensibility
   * @defaultValue false
   */
  isEditMode?: boolean;

  /**
   * Time frame for filtering records
   */
  timeFrame?: {
    /** Start date for filtering */
    start: Date;
    /** End date for filtering */
    end: Date;
  };

  /**
   * Number of records to load initially
   * @defaultValue 10
   * @maxValue 100
   */
  limit?: number;
}

/**
 * Interface for Merged Timeline Item
 * @public
 */
export interface MergedTimelineItem {
  /** Unique identifier for the merged item */
  id: string;

  /** Name of the operator */
  operator: string;

  /** Action performed */
  action: string;

  /** Number of merged records */
  count: number;

  /** List of pallet numbers */
  palletNumbers: string[];

  /** Formatted pallet number range */
  palletRange: string;

  /** Formatted time range */
  timeRange: string;

  /** Optional additional remarks */
  remark?: string;

  /** Timestamp of the item */
  timestamp: string;
}

/**
 * Interface for Raw History Item
 * @public
 */
export interface RawHistoryItem {
  /** Timestamp of the record */
  time: string;

  /** Action performed */
  action: string;

  /** Pallet number (can be null) */
  plt_num: string | null;

  /** Location information (can be null) */
  loc: string | null;

  /** Additional remarks (can be null) */
  remark: string | null;

  /** Operator name (can be null) */
  operator_name: string | null;
}

export default VerticalTimelineCardProps;
