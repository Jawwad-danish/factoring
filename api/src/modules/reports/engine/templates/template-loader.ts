import { ReportName } from '@module-persistence';

export const TEMPLATE_LOADER = 'TEMPLATE_LOADER';

export interface TemplateLoader {
  getTemplate(reportName: ReportName): Promise<string>;
  getPublicResourcesBucket(): Promise<string>;
}
