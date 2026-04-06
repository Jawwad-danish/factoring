interface BaseColumnFormat {
  label?: string;
}

export interface StringColumnFormat extends BaseColumnFormat {
  type: 'string';
  options?: Record<string, never>;
}

export interface NumberDisplayOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export interface NumberColumnFormat extends BaseColumnFormat {
  type: 'number';
  options?: NumberDisplayOptions;
}

export interface PercentageColumnFormat extends BaseColumnFormat {
  type: 'percentage';
  options?: NumberDisplayOptions;
}

export interface CurrencyColumnFormat extends BaseColumnFormat {
  type: 'currency';
  options?: NumberDisplayOptions;
}

export interface DateColumnFormat extends BaseColumnFormat {
  type: 'date';
}

export interface DateTimeColumnFormat extends BaseColumnFormat {
  type: 'date-time';
}

export type ColumnFormat =
  | StringColumnFormat
  | NumberColumnFormat
  | PercentageColumnFormat
  | CurrencyColumnFormat
  | DateColumnFormat
  | DateTimeColumnFormat;

export type FormatDefinition<T> = {
  [K in keyof T]: ColumnFormat;
};

export interface ReportSerializerOptions<T> {
  formatDefinition: FormatDefinition<T>;
  hbsContext?: object;
  metadataRow?: string;
}
