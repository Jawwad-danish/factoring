import { FileValidator, Injectable } from '@nestjs/common';

@Injectable()
export class CsvFileValidator extends FileValidator {
  constructor() {
    super({});
  }

  isValid(file: Express.Multer.File): boolean {
    if (!file) return false;
    const isCSVExtension = file.originalname.toLowerCase().endsWith('.csv');

    // Check for the MIME type
    const validMimeTypes = ['text/csv', 'text/plain', 'application/csv'];
    const hasValidMimeType = validMimeTypes.includes(file.mimetype);

    return isCSVExtension && hasValidMimeType;
  }

  buildErrorMessage(): string {
    return 'File must be a valid CSV file with .csv extension and correct MIME type (text/csv, text/plain, or application/csv)';
  }
}
