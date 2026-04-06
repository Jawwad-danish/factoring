import { importClientFactoringConfig } from './client-factoring-config/import-clients-factoring.script';
import { importClientSuccessTeams } from './client-success-team/import-client-success-team.script';
import { ImportReport } from '../../util/report';
import { INestApplicationContext } from '@nestjs/common';

const operations = [importClientSuccessTeams, importClientFactoringConfig];

export const importClients = async (
  report: ImportReport,
  app: INestApplicationContext,
) => {
  for (const operation of operations) {
    await operation(report, app);
  }
};
