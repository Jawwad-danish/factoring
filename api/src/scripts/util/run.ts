import { Report } from './report';

export const run = (
  handler: () => Promise<void>,
  report: Report | Report[],
  resultPath: string,
  config?: {
    logError: boolean;
  },
) => {
  handler()
    .then(() => {
      console.log('Finished running the script');
    })
    .catch((error) => {
      if (config?.logError) {
        console.log('Could not finish running the script', error);
      } else {
        console.error('Could not finish running the script');
      }
    })
    .finally(() => {
      console.log('Writing results to:', resultPath);
      if (Array.isArray(report)) {
        report.forEach((r) => r.write(resultPath));
      } else {
        report.write(resultPath);
      }
      process.exit(0);
    });
};
