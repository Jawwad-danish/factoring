import dayjs from 'dayjs';
import { diff } from 'json-diff';
import { formatToDollars } from '../../../core/util';

const partial = (
  target: Record<string, any>,
  properties: string[],
): Record<string, any> => {
  return properties.reduce((obj, property) => {
    if (target[property] !== undefined) {
      obj[property] = target[property];
    }
    return obj;
  }, {});
};

export const handleDifference = (row: Record<string, any>) => {
  row.MESSAGE = '';
  if (row.DIFFERENCE.is_deleted) {
    row.MESSAGE = `Deleted amount: ${(Number(row.amount) / 100).toLocaleString(
      'en-US',
      {
        style: 'currency',
        currency: 'USD',
      },
    )}`;
    return;
  } else if (row.DIFFERENCE.is_created__added) {
    row.MESSAGE = 'Created.\n';
  }

  Object.keys(row.DIFFERENCE).forEach((key) => {
    const keyToUse = key.split('__added')[0].split('__deleted')[0];
    const value = row.DIFFERENCE[key];
    let displayValue = value;
    if (keyToUse == 'is_deleted') {
      return;
    }
    if (keyToUse == 'is_created') {
      return;
    }
    if (keyToUse == 'changelog_notes') {
      return;
    }
    if (keyToUse == 'metadata') {
      return;
    }
    if (keyToUse == 'changelog_notes') {
      return;
    }
    if (keyToUse == 'invoice_id') {
      return;
    }
    if (typeof value === 'object' && value && Object.keys(value).length > 0) {
      let displayValueOld = value.__old;
      let displayValueNew = value.__new;
      if (displayValueOld === null) {
        displayValueOld = 'nothing';
      }
      if (displayValueNew === null) {
        displayValueNew = 'nothing';
      }
      if (displayValueOld === 'lockbox') {
        displayValueOld = 'check';
      }
      if (displayValueNew === 'lockbox') {
        displayValueNew = 'check';
      }

      if (keyToUse == 'amount') {
        displayValueOld = `${formatToDollars(
          (Number(displayValueOld) / 100).toFixed(2),
        )}`;
        displayValueNew = `${formatToDollars(
          (Number(displayValueNew) / 100).toFixed(2),
        )}`;
      }
      if (keyToUse == 'batch_date') {
        displayValueOld = dayjs
          .tz(displayValueOld, 'America/New_York')
          .format('MMMM D, YYYY');
        displayValueNew = dayjs
          .tz(displayValueNew, 'America/New_York')
          .format('MMMM D, YYYY');
      }
      row.MESSAGE += `Changed ${keyToUse.replace(
        /_/g,
        ' ',
      )} from ${displayValueOld} to ${displayValueNew}.\n`;
    } else {
      if (displayValue === null) {
        displayValue = 'nothing';
      }
      if (keyToUse == 'amount') {
        displayValue = `${formatToDollars(
          (Number(displayValue) / 100).toFixed(2),
        )}`;
      }
      if (keyToUse == 'batch_date') {
        displayValue = dayjs
          .tz(displayValue, 'America/New_York')
          .format('MMMM D, YYYY');
      }

      if (key.includes('__added') && displayValue != 'nothing') {
        row.MESSAGE += `Added ${key
          .split('__added')[0]
          .replace(/_/g, ' ')}: ${displayValue}.\n`;
      }
      if (key.includes('__deleted') && displayValue != 'nothing') {
        row.MESSAGE += `Removed ${key
          .split('__deleted')[0]
          .replace(/_/g, ' ')}, previously ${displayValue}.\n`;
      }
    }
  });
};

export const extractHistoricalData = (
  items: Map<string, Record<string, any>[]>,
  fields: string[],
): void => {
  let records: Record<string, any>[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [_, value] of items) {
    value.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    for (let i = 0; i < value.length; i++) {
      const current = value[i];
      const next = value[i + 1];
      const currentPartial = partial(current, fields);
      const nextPartial = next ? partial(next, fields) : {};
      const difference = diff(nextPartial, currentPartial);
      current.DIFFERENCE = difference;
      if (
        nextPartial.batch_date &&
        currentPartial.batch_date &&
        nextPartial.batch_date.toString() !==
          currentPartial.batch_date.toString()
      ) {
        if (current.DIFFERENCE)
          current.DIFFERENCE.batch_date = {
            __old: currentPartial.batch_date,
            __new: nextPartial.batch_date,
          };
        else
          current.DIFFERENCE = {
            batch_date: {
              __old: currentPartial.batch_date,
              __new: nextPartial.batch_date,
            },
          };
      }
      records.push(current);
    }
  }
  records.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  records = records.filter((record) => {
    if (!record.DIFFERENCE) {
      return false;
    }
    return !record.DIFFERENCE.is_created__added;
  });
  for (let i = 0; i < (records.length > 10 ? 10 : records.length); i++) {
    const record = records[i];
    handleDifference(record);
    console.log(`${record.invoice_display_id} => ${record.MESSAGE}`);
  }
};
