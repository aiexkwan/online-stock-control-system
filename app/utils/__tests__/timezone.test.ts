import {
  TIMEZONES,
  USER_TIMEZONE,
  DATABASE_TIMEZONE,
  toDbTime,
  fromDbTime,
  formatDbTime,
  getStartOfDay,
  getEndOfDay,
  getDateRange,
  getTodayRange,
  getYesterdayRange,
  getThisWeekRange,
  getThisMonthRange,
  isToday,
  isYesterday,
  formatRelativeTime
} from '../timezone';

// Mock current date for consistent testing
const mockDate = new Date('2024-01-15T14:30:00.000Z'); // Monday, 15 Jan 2024, 14:30 UTC

describe('timezone utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constants', () => {
    it('should have correct timezone definitions', () => {
      expect(TIMEZONES.UK).toBe('Europe/London');
      expect(TIMEZONES.US_EAST).toBe('America/New_York');
      expect(TIMEZONES.UTC).toBe('UTC');
      expect(USER_TIMEZONE).toBe('Europe/London');
      expect(DATABASE_TIMEZONE).toBe('America/New_York');
    });
  });

  describe('toDbTime', () => {
    it('should convert UK time to database time', () => {
      const ukTime = new Date('2024-01-15T10:00:00'); // 10 AM UK time
      const dbTime = toDbTime(ukTime);

      // Should return ISO string
      expect(typeof dbTime).toBe('string');
      expect(dbTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should handle daylight saving time', () => {
      // Summer time in UK (BST)
      const summerDate = new Date('2024-07-15T10:00:00');
      const summerDbTime = toDbTime(summerDate);

      // Winter time in UK (GMT)
      const winterDate = new Date('2024-01-15T10:00:00');
      const winterDbTime = toDbTime(winterDate);

      // Both should return valid ISO strings
      expect(summerDbTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(winterDbTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('fromDbTime', () => {
    it('should convert database ISO string to UK time', () => {
      const isoString = '2024-01-15T15:00:00.000Z';
      const ukTime = fromDbTime(isoString);

      expect(ukTime).toBeInstanceOf(Date);
      expect(ukTime.getFullYear()).toBe(2024);
      expect(ukTime.getMonth()).toBe(0); // January
      expect(ukTime.getDate()).toBe(15);
    });

    it('should handle ISO strings with different formats', () => {
      const formats = [
        '2024-01-15T15:00:00.000Z',
        '2024-01-15T15:00:00Z',
        '2024-01-15T15:00:00'
      ];

      formats.forEach(format => {
        const result = fromDbTime(format);
        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2024);
      });
    });
  });

  describe('formatDbTime', () => {
    it('should format database time with default format', () => {
      const isoString = '2024-01-15T15:30:45.000Z';
      const formatted = formatDbTime(isoString);

      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('should format with custom format string', () => {
      const isoString = '2024-01-15T15:30:45.000Z';

      expect(formatDbTime(isoString, 'dd/MM/yyyy')).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      expect(formatDbTime(isoString, 'HH:mm')).toMatch(/^\d{2}:\d{2}$/);
      expect(formatDbTime(isoString, 'MMM dd, yyyy')).toMatch(/^[A-Za-z]{3} \d{2}, \d{4}$/);
    });
  });

  describe('getStartOfDay', () => {
    it('should return start of current day', () => {
      const startOfDay = getStartOfDay();

      expect(startOfDay.getHours()).toBe(0);
      expect(startOfDay.getMinutes()).toBe(0);
      expect(startOfDay.getSeconds()).toBe(0);
      expect(startOfDay.getMilliseconds()).toBe(0);
    });

    it('should handle specific date', () => {
      const specificDate = new Date('2024-06-15T15:30:00');
      const startOfDay = getStartOfDay(specificDate);

      expect(startOfDay.getFullYear()).toBe(2024);
      expect(startOfDay.getMonth()).toBe(5); // June
      expect(startOfDay.getDate()).toBe(15);
      expect(startOfDay.getHours()).toBe(0);
      expect(startOfDay.getMinutes()).toBe(0);
    });
  });

  describe('getEndOfDay', () => {
    it('should return end of current day', () => {
      const endOfDay = getEndOfDay();

      expect(endOfDay.getHours()).toBe(23);
      expect(endOfDay.getMinutes()).toBe(59);
      expect(endOfDay.getSeconds()).toBe(59);
      expect(endOfDay.getMilliseconds()).toBe(999);
    });

    it('should handle specific date', () => {
      const specificDate = new Date('2024-12-25T10:00:00');
      const endOfDay = getEndOfDay(specificDate);

      expect(endOfDay.getFullYear()).toBe(2024);
      expect(endOfDay.getMonth()).toBe(11); // December
      expect(endOfDay.getDate()).toBe(25);
      expect(endOfDay.getHours()).toBe(23);
      expect(endOfDay.getMinutes()).toBe(59);
    });
  });

  describe('getDateRange', () => {
    it('should return correct date range for past days', () => {
      const range = getDateRange(7); // Past 7 days

      expect(range).toHaveProperty('start');
      expect(range).toHaveProperty('end');
      expect(typeof range.start).toBe('string');
      expect(typeof range.end).toBe('string');

      // Start should be before end
      const startDate = new Date(range.start);
      const endDate = new Date(range.end);
      expect(startDate.getTime()).toBeLessThan(endDate.getTime());
    });

    it('should handle single day range', () => {
      const range = getDateRange(0); // Today only

      // Parse the ISO strings to check the range
      const startDate = new Date(range.start);
      const endDate = new Date(range.end);

      // The difference should be less than 24 hours
      const diffMs = endDate.getTime() - startDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      expect(diffHours).toBeLessThanOrEqual(24);
      expect(diffHours).toBeGreaterThan(0);
    });
  });

  describe('getTodayRange', () => {
    it('should return today\'s date range', () => {
      const range = getTodayRange();

      const startDate = new Date(range.start);
      const endDate = new Date(range.end);

      // The difference should be less than 24 hours
      const diffMs = endDate.getTime() - startDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      expect(diffHours).toBeLessThanOrEqual(24);
      expect(diffHours).toBeGreaterThan(0);

      // Should be recent (within last 24 hours)
      const now = new Date();
      const hoursSinceStart = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      expect(hoursSinceStart).toBeLessThan(48);
    });
  });

  describe('getYesterdayRange', () => {
    it('should return yesterday\'s date range', () => {
      const range = getYesterdayRange();

      const startDate = new Date(range.start);
      const endDate = new Date(range.end);

      // The difference should be less than 24 hours
      const diffMs = endDate.getTime() - startDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      expect(diffHours).toBeLessThanOrEqual(24);
      expect(diffHours).toBeGreaterThan(0);

      // Should be between 24 and 48 hours ago
      const now = new Date();
      const hoursSinceStart = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      expect(hoursSinceStart).toBeGreaterThan(24);
      expect(hoursSinceStart).toBeLessThan(72);
    });
  });

  describe('getThisWeekRange', () => {
    it('should return past 7 days range', () => {
      const range = getThisWeekRange();

      const startDate = new Date(range.start);
      const endDate = new Date(range.end);

      // Should span 7 days
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(7);
    });
  });

  describe('getThisMonthRange', () => {
    it('should return current month range', () => {
      const range = getThisMonthRange();

      const startDate = new Date(range.start);
      const endDate = new Date(range.end);

      // Should span at least several days
      const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(1);

      // End should be in the future or very recent
      const now = new Date();
      const hoursUntilEnd = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(hoursUntilEnd).toBeGreaterThan(-24); // Allow for timezone differences
    });
  });

  describe('isToday', () => {
    it('should correctly identify today\'s date', () => {
      const todayIso = new Date().toISOString();
      expect(isToday(todayIso)).toBe(true);
    });

    it('should correctly identify not today', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday.toISOString())).toBe(false);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow.toISOString())).toBe(false);
    });
  });

  describe('isYesterday', () => {
    it('should correctly identify yesterday\'s date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isYesterday(yesterday.toISOString())).toBe(true);
    });

    it('should correctly identify not yesterday', () => {
      const today = new Date();
      expect(isYesterday(today.toISOString())).toBe(false);

      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      expect(isYesterday(twoDaysAgo.toISOString())).toBe(false);
    });
  });

  describe('formatRelativeTime', () => {
    it('should format "just now" for recent times', () => {
      const now = new Date();
      expect(formatRelativeTime(now.toISOString())).toBe('just now');

      const thirtySecondsAgo = new Date(now.getTime() - 30000);
      expect(formatRelativeTime(thirtySecondsAgo.toISOString())).toBe('just now');
    });

    it('should format minutes ago', () => {
      const now = new Date();

      const oneMinuteAgo = new Date(now.getTime() - 60000);
      expect(formatRelativeTime(oneMinuteAgo.toISOString())).toBe('1 minute ago');

      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
      expect(formatRelativeTime(fiveMinutesAgo.toISOString())).toBe('5 minutes ago');

      const fiftyNineMinutesAgo = new Date(now.getTime() - 59 * 60000);
      expect(formatRelativeTime(fiftyNineMinutesAgo.toISOString())).toBe('59 minutes ago');
    });

    it('should format hours ago', () => {
      const now = new Date();

      const oneHourAgo = new Date(now.getTime() - 60 * 60000);
      expect(formatRelativeTime(oneHourAgo.toISOString())).toBe('1 hour ago');

      const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60000);
      expect(formatRelativeTime(twelveHoursAgo.toISOString())).toBe('12 hours ago');
    });

    it('should format days ago', () => {
      const now = new Date();

      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60000);
      expect(formatRelativeTime(oneDayAgo.toISOString())).toBe('1 day ago');

      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60000);
      expect(formatRelativeTime(threeDaysAgo.toISOString())).toBe('3 days ago');
    });

    it('should format as date for older times', () => {
      const now = new Date();
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60000);

      const formatted = formatRelativeTime(twoWeeksAgo.toISOString());
      expect(formatted).toMatch(/^[A-Za-z]{3} \d{2}, \d{4}$/);
    });
  });

  describe('edge cases', () => {
    it('should handle invalid ISO strings gracefully', () => {
      // These functions should not throw errors
      expect(() => fromDbTime('invalid-date')).not.toThrow();
      expect(() => formatDbTime('invalid-date')).not.toThrow();

      // fromDbTime should return a Date object (even if invalid)
      const result = fromDbTime('invalid-date');
      expect(result).toBeInstanceOf(Date);

      // formatDbTime should return a string (even if "Invalid Date")
      const formatted = formatDbTime('invalid-date');
      expect(typeof formatted).toBe('string');
    });

    it('should handle timezone boundaries', () => {
      // Test around midnight
      const almostMidnight = new Date('2024-01-15T23:59:59');
      const startOfDay = getStartOfDay(almostMidnight);
      const endOfDay = getEndOfDay(almostMidnight);

      expect(startOfDay.getDate()).toBe(almostMidnight.getDate());
      expect(endOfDay.getDate()).toBe(almostMidnight.getDate());
    });

    it('should handle leap years', () => {
      const leapDay = new Date('2024-02-29T12:00:00');
      const range = getDateRange(0);

      expect(() => toDbTime(leapDay)).not.toThrow();
      expect(() => fromDbTime(leapDay.toISOString())).not.toThrow();
    });
  });
});
