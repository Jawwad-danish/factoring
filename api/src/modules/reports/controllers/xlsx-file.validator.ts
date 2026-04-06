import { FileValidator, Injectable } from '@nestjs/common';

@Injectable()
export class XlsxFileValidator extends FileValidator {
  constructor() {
    super({});
  }

  isValid(file: Express.Multer.File): boolean {
    if (!file) {
      return false;
    }

    const hasCorrectFileExtension = file.originalname
      .toLowerCase()
      .endsWith('.xlsx');
    const hasValidMimeType = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ].includes(file.mimetype);
    return hasCorrectFileExtension && hasValidMimeType;
  }

  buildErrorMessage(): string {
    return 'File must be a valid XLSX file with .xlsx extension and correct MIME type (application/vnd.ms-excel)';
  }
}
