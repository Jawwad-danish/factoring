import dayjs from 'dayjs';
import {
  BUSINESS_TIMEZONE,
  FULL_DATE_FORMAT,
  getUTCDate,
  getDateInTimezone,
  getFormattedDateInBusinessTimezone,
  getDateInBusinessTimezone,
  getCurrentLocalDate,
  getCurrentUTCDate,
  addDaysToToday,
  isBusinessDay,
  getNextBusinessDay,
  formatBusinessTime,
  startOfDay,
  startOfYear,
  endOfYear,
  endOfDay,
} from './date';

describe('date utilities', () => {
  describe('constants', () => {
    it('should have correct values', () => {
      expect(BUSINESS_TIMEZONE).toBe('America/New_York');
      expect(FULL_DATE_FORMAT).toBe('MMM D, YYYY h:mm A');
    });
  });

  describe('getUTCDate', () => {
    it('should return UTC date', () => {
      expect(getUTCDate().isUTC()).toBe(true);
      expect(getUTCDate('2024-01-15T10:30:00').isUTC()).toBe(true);
    });
  });

  describe('getDateInTimezone', () => {
    it('should return date in timezone', () => {
      expect(
        getDateInTimezone('2024-01-15T10:30:00', 'America/New_York').format(
          'z',
        ),
      ).toContain('EST');
      expect(getDateInTimezone()).toBeDefined();
    });
  });

  describe('getFormattedDateInBusinessTimezone', () => {
    it('should format date in business timezone with correct format', () => {
      const date = '2024-01-15T15:30:00Z';
      const result = getFormattedDateInBusinessTimezone(date);
      expect(result).toMatch(
        /\d{2}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} (AM|PM) EST/,
      );
    });
  });

  describe('getDateInBusinessTimezone', () => {
    it('should return date in business timezone', () => {
      expect(
        getDateInBusinessTimezone('2024-01-15T15:30:00Z').format('z'),
      ).toContain('EST');
      expect(getDateInBusinessTimezone().format('z')).toMatch(/EST|EDT/);
    });
  });

  it('should return current local date', () => {
    expect(getCurrentLocalDate().diff(dayjs(), 'second')).toBeLessThan(1);
  });

  it('should return current UTC date', () => {
    expect(getCurrentUTCDate().isUTC()).toBe(true);
  });

  it('should add days to today', () => {
    expect(addDaysToToday(5).format('YYYY-MM-DD')).toBe(
      dayjs(new Date()).add(5, 'day').format('YYYY-MM-DD'),
    );
    expect(addDaysToToday(-3).format('YYYY-MM-DD')).toBe(
      dayjs(new Date()).add(-3, 'day').format('YYYY-MM-DD'),
    );
  });

  describe('isBusinessDay', () => {
    it('should return true for weekdays and false for weekends', () => {
      expect(isBusinessDay(dayjs('2024-01-15'))).toBe(true);
      expect(isBusinessDay(dayjs('2024-01-16'))).toBe(true);
      expect(isBusinessDay(dayjs('2024-01-17'))).toBe(true);
      expect(isBusinessDay(dayjs('2024-01-18'))).toBe(true);
      expect(isBusinessDay(dayjs('2024-01-19'))).toBe(true);
      expect(isBusinessDay(dayjs('2024-01-20'))).toBe(false);
      expect(isBusinessDay(dayjs('2024-01-21'))).toBe(false);
    });
  });

  describe('getNextBusinessDay', () => {
    it('should return next business day', () => {
      expect(getNextBusinessDay(dayjs('2024-01-15')).format('YYYY-MM-DD')).toBe(
        '2024-01-16',
      );
      expect(getNextBusinessDay(dayjs('2024-01-19')).format('YYYY-MM-DD')).toBe(
        '2024-01-22',
      );
      expect(getNextBusinessDay(dayjs('2024-01-20')).format('YYYY-MM-DD')).toBe(
        '2024-01-22',
      );
      expect(getNextBusinessDay(dayjs('2024-01-21')).format('YYYY-MM-DD')).toBe(
        '2024-01-22',
      );
    });
  });

  describe('formatBusinessTime', () => {
    it('should format date with custom format and timezone', () => {
      const date = '2024-01-15T15:30:00Z';
      expect(formatBusinessTime(date)).toMatch(/Jan \d+, 2024 \d+:\d+ (AM|PM)/);
      expect(formatBusinessTime(date, 'YYYY-MM-DD')).toBe('2024-01-15');
      expect(formatBusinessTime(date, 'z', 'America/Los_Angeles')).toContain(
        'PST',
      );
    });
  });

  it('should return start of day', () => {
    expect(startOfDay('2024-01-15T15:30:45').format('HH:mm:ss')).toBe(
      '00:00:00',
    );
    expect(startOfDay().format('HH:mm:ss')).toBe('00:00:00');
  });

  it('should return start of year', () => {
    expect(
      startOfYear('2024-06-15T15:30:45').format('YYYY-MM-DD HH:mm:ss'),
    ).toBe('2024-01-01 00:00:00');
    expect(startOfYear().format('YYYY-MM-DD HH:mm:ss')).toBe(
      `${dayjs().year()}-01-01 00:00:00`,
    );
  });

  it('should return end of year', () => {
    expect(endOfYear('2024-06-15T15:30:45').format('YYYY-MM-DD HH:mm:ss')).toBe(
      '2024-12-31 23:59:59',
    );
    expect(endOfYear().format('YYYY-MM-DD HH:mm:ss')).toBe(
      `${dayjs().year()}-12-31 23:59:59`,
    );
  });

  it('should return end of day', () => {
    expect(endOfDay('2024-01-15T10:30:45').format('HH:mm:ss')).toBe('23:59:59');
    expect(endOfDay().format('HH:mm:ss')).toBe('23:59:59');
  });
});
