import { Provider } from '@nestjs/common';
import { Analytics } from '@segment/analytics-node';
import { SegmentCredentialsService } from './segment-credentials.service';

export const segmentAnalyticsProvider: Provider = {
  provide: Analytics,
  useFactory: async (segmentCredentialsService: SegmentCredentialsService) => {
    const credentials = await segmentCredentialsService.getCredentials();
    return new Analytics({
      writeKey: credentials.writeKey,
      disable: credentials.disable,
    });
  },
  inject: [SegmentCredentialsService],
};
