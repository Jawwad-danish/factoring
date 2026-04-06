import dayjs from 'dayjs';

import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import weekday from 'dayjs/plugin/weekday';
import advanced from 'dayjs/plugin/advancedFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekday);
dayjs.extend(advanced);

export const BUSINESS_TIMEZONE = 'America/New_York';
export const FULL_DATE_FORMAT = 'MMM D, YYYY h:mm A';

export const getUTCDate = (date?: dayjs.ConfigType): dayjs.Dayjs => {
  return dayjs.utc(date);
};

export const getDateInTimezone = (
  date?: dayjs.ConfigType,
  tz?: string | undefined,
): dayjs.Dayjs => {
  return dayjs.tz(date, tz);
};

export const getFormattedDateInBusinessTimezone = (date?: dayjs.ConfigType) => {
  return getDateInBusinessTimezone(date).format('MM/DD/YY hh:mm:ss A z');
};

export const getDateInBusinessTimezone = (date?: dayjs.ConfigType) => {
  return getDateInTimezone(date, BUSINESS_TIMEZONE);
};

export const getCurrentLocalDate = (): dayjs.Dayjs => {
  return getDateInTimezone();
};

export const getCurrentUTCDate = (): dayjs.Dayjs => {
  return getUTCDate();
};

export const addDaysToToday = (days: number): dayjs.Dayjs => {
  return dayjs(new Date()).add(days, 'day');
};

export const isBusinessDay = (date?: dayjs.ConfigType): boolean => {
  const day = dayjs(date).day(); // 0-6, 0 is Sunday, 6 is Saturday
  return day > 0 && day < 6; // Monday-Friday are 1-5
};

export const getNextBusinessDay = (date?: dayjs.ConfigType): dayjs.Dayjs => {
  const currentDate = dayjs(date);
  const currentDay = currentDate.day();

  switch (currentDay) {
    case 5: // friday after working hours case
      return currentDate.add(3, 'day');
    case 6: // saturday
      return currentDate.add(2, 'day');
    case 0: // sunday
      return currentDate.add(1, 'day');
    default:
      return currentDate.add(1, 'day');
  }
};

export const formatBusinessTime = (
  date: dayjs.ConfigType,
  format = FULL_DATE_FORMAT,
  timezone = BUSINESS_TIMEZONE,
): string => {
  return dayjs(date).tz(timezone).format(format);
};

export const startOfDay = (date?: dayjs.ConfigType): dayjs.Dayjs => {
  return dayjs(date).startOf('day');
};

export const startOfYear = (date?: dayjs.ConfigType): dayjs.Dayjs => {
  return dayjs(date).startOf('year');
};

export const endOfYear = (date?: dayjs.ConfigType): dayjs.Dayjs => {
  return dayjs(date).endOf('year');
};

export const endOfDay = (date?: dayjs.ConfigType): dayjs.Dayjs => {
  return dayjs(date).endOf('day');
};
