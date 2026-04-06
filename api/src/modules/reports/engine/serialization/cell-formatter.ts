import { getDateInBusinessTimezone } from '@core/date-time';
import { penniesToDollars } from '@core/formulas';
import { ReportType } from '@fs-bobtail/factoring/data';
import { Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import {
  ColumnFormat,
  CurrencyColumnFormat,
  DateColumnFormat,
  DateTimeColumnFormat,
  NumberColumnFormat,
  PercentageColumnFormat,
  StringColumnFormat,
} from './serialization-options';

class ValueFormatter {
  protected logger = new Logger(ValueFormatter.name);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  formatString(value: any, _column: StringColumnFormat): any {
    return new String(value);
  }

  formatNumber(value: any, format?: NumberColumnFormat): any {
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      this.logger.warn(`Invalid numeric value for number formatting: ${value}`);
      return String(value);
    }
    return numericValue.toLocaleString('en-US', format?.options);
  }

  formatPercentage(value: any, format?: PercentageColumnFormat): any {
    const formattedValue = this.formatNumber(value, {
      type: 'number',
      options: format?.options,
    });
    return `${formattedValue}%`;
  }

  formatCurrency(
    value: any,
    currency: string,
    format?: CurrencyColumnFormat,
  ): any {
    const numericValue = Number(value);

    if (isNaN(numericValue)) {
      console.warn(`Invalid numeric value for currency formatting: ${value}`);
      return String(value);
    }

    return penniesToDollars(numericValue)
      .toNumber()
      .toLocaleString('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...format?.options,
      });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  formatDate(value: any, _format?: DateColumnFormat): any {
    const date = dayjs(value);
    if (!date.isValid()) {
      this.logger.warn(`Invalid date value for CSV: ${value}`);
      return String(value);
    }
    return getDateInBusinessTimezone(date).format('MM/DD/YYYY');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  formatDateTime(value: any, _format?: DateTimeColumnFormat): any {
    const date = dayjs(value);
    if (!date.isValid()) {
      this.logger.warn(`Invalid date value for: ${value}`);
      return String(value);
    }
    return getDateInBusinessTimezone(date).format('MM/DD/YYYY HH:mm:ss');
  }
}

class ExcelValueFormatter extends ValueFormatter {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  formatNumber(value: any, _format?: NumberColumnFormat) {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      this.logger.warn(`Invalid numeric value for Excel raw value: ${value}`);
      return String(value);
    }
    return penniesToDollars(numValue).toNumber();
  }

  formatCurrency(value: any, _currency: string, format?: CurrencyColumnFormat) {
    return this.formatNumber(value, {
      type: 'number',
      options: format?.options,
    });
  }

  formatPercentage(value: any, format?: PercentageColumnFormat) {
    return this.formatNumber(value, {
      type: 'number',
      options: format?.options,
    });
  }
}

class PdfValueFormatter extends ValueFormatter {
  formatPercentage(value: any, format?: PercentageColumnFormat) {
    const formattedValue = this.formatNumber(value, {
      type: 'number',
      options: format?.options,
    });
    return `${formattedValue}%`;
  }
}

const formatters = {
  [ReportType.CSV]: new ValueFormatter(),
  [ReportType.PDF]: new PdfValueFormatter(),
  [ReportType.EXCEL]: new ExcelValueFormatter(),
};

export const formatCell = (
  reportType: ReportType,
  value: any,
  format: ColumnFormat,
): any => {
  if (value == null) {
    return '';
  }

  const formatter = formatters[reportType];
  switch (format.type) {
    case 'currency':
      return formatter.formatCurrency(value, 'USD', format);
    case 'number':
      return formatter.formatNumber(value, format);
    case 'percentage':
      return formatter.formatPercentage(value, format);
    case 'date':
      return formatter.formatDate(value, format);
    case 'date-time':
      return formatter.formatDateTime(value, format);
    case 'string':
    default:
      return String(value);
  }
};
