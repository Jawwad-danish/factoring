import dayjs from 'dayjs';

export const monthDayYear = (date: Date): string => {
  return dayjs.utc(date).format('MM/DD/YY');
};

export const dayMonthYear = (date: Date): string => {
  return dayjs.utc(date).format('DD/MM/YY');
};

export const businessMonthDayYear = (date: Date): string => {
  return dayjs.utc(date).format('MMMM D, YYYY');
};
