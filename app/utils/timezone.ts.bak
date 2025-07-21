/**
 * 時區處理工具
 * 統一處理 Supabase（美國時間）與用戶（英國時間）之間的時區轉換
 */

import { format, parseISO } from 'date-fns';
import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';

// 定義時區
export const TIMEZONES = {
  UK: 'Europe/London',
  US_EAST: 'America/New_York',
  UTC: 'UTC',
} as const;

// 用戶時區（英國）
export const USER_TIMEZONE = TIMEZONES.UK;

// Supabase 時區（假設為美國東部時間）
export const DATABASE_TIMEZONE = TIMEZONES.US_EAST;

/**
 * 將用戶本地時間轉換為資料庫時間（用於查詢）
 * @param date 用戶本地時間
 * @returns ISO string 格式的資料庫時間
 */
export function toDbTime(date: Date): string {
  // 將用戶時區時間轉換為 UTC
  const utcDate = fromZonedTime(date, USER_TIMEZONE);
  // 將 UTC 轉換為資料庫時區
  const dbDate = toZonedTime(utcDate, DATABASE_TIMEZONE);
  return dbDate.toISOString();
}

/**
 * 將資料庫時間轉換為用戶本地時間（用於顯示）
 * @param isoString 資料庫返回的 ISO string
 * @returns 用戶時區的 Date 對象
 */
export function fromDbTime(isoString: string): Date {
  // 解析 ISO string
  const date = parseISO(isoString);
  // 假設資料庫時間是 UTC，轉換為用戶時區
  return toZonedTime(date, USER_TIMEZONE);
}

/**
 * 格式化資料庫時間為用戶本地時間字符串
 * @param isoString 資料庫返回的 ISO string
 * @param formatStr date-fns 格式字符串
 * @returns 格式化的時間字符串
 */
export function formatDbTime(isoString: string, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string {
  const userDate = fromDbTime(isoString);
  // Check if date is valid before formatting
  if (isNaN(userDate.getTime())) {
    return 'Invalid Date';
  }
  return format(userDate, formatStr);
}

/**
 * 獲取今天的開始時間（用戶時區）
 * @returns 今天 00:00:00 的 Date 對象
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const userDate = toZonedTime(date, USER_TIMEZONE);
  userDate.setHours(0, 0, 0, 0);
  return userDate;
}

/**
 * 獲取今天的結束時間（用戶時區）
 * @returns 今天 23:59:59 的 Date 對象
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const userDate = toZonedTime(date, USER_TIMEZONE);
  userDate.setHours(23, 59, 59, 999);
  return userDate;
}

/**
 * 獲取日期範圍（用於資料庫查詢）
 * @param days 往前推的天數
 * @returns { start: ISO string, end: ISO string }
 */
export function getDateRange(days: number): { start: string; end: string } {
  const now = new Date();
  const endDate = getEndOfDay(now);
  const startDate = getStartOfDay(now);
  startDate.setDate(startDate.getDate() - days);

  return {
    start: toDbTime(startDate),
    end: toDbTime(endDate),
  };
}

/**
 * 獲取今天的日期範圍（用於資料庫查詢）
 * @returns { start: ISO string, end: ISO string }
 */
export function getTodayRange(): { start: string; end: string } {
  return {
    start: toDbTime(getStartOfDay()),
    end: toDbTime(getEndOfDay()),
  };
}

/**
 * 獲取昨天的日期範圍（用於資料庫查詢）
 * @returns { start: ISO string, end: ISO string }
 */
export function getYesterdayRange(): { start: string; end: string } {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return {
    start: toDbTime(getStartOfDay(yesterday)),
    end: toDbTime(getEndOfDay(yesterday)),
  };
}

/**
 * 獲取本週的日期範圍（用於資料庫查詢）
 * @returns { start: ISO string, end: ISO string }
 */
export function getThisWeekRange(): { start: string; end: string } {
  const now = new Date();
  const startOfWeek = getStartOfDay(now);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  return {
    start: toDbTime(startOfWeek),
    end: toDbTime(getEndOfDay()),
  };
}

/**
 * 獲取本月的日期範圍（用於資料庫查詢）
 * @returns { start: ISO string, end: ISO string }
 */
export function getThisMonthRange(): { start: string; end: string } {
  const now = new Date();
  const startOfMonth = getStartOfDay(now);
  startOfMonth.setDate(1);

  return {
    start: toDbTime(startOfMonth),
    end: toDbTime(getEndOfDay()),
  };
}

/**
 * 判斷日期是否為今天（用戶時區）
 * @param isoString 資料庫返回的 ISO string
 * @returns boolean
 */
export function isToday(isoString: string): boolean {
  const date = fromDbTime(isoString);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * 判斷日期是否為昨天（用戶時區）
 * @param isoString 資料庫返回的 ISO string
 * @returns boolean
 */
export function isYesterday(isoString: string): boolean {
  const date = fromDbTime(isoString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  );
}

/**
 * 格式化相對時間（如：2小時前）
 * @param isoString 資料庫返回的 ISO string
 * @returns 相對時間字符串
 */
export function formatRelativeTime(isoString: string): string {
  const date = fromDbTime(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return formatDbTime(isoString, 'MMM dd, yyyy');
}
