import { environment } from '@core/environment';
import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { Analytics } from '@segment/analytics-node';

@Injectable()
export class SegmentService implements OnApplicationShutdown {
  private readonly logger: Logger = new Logger(SegmentService.name);

  constructor(private readonly analytics: Analytics) {
    this.analytics.on('error', (err) => {
      this.logger.error({
        message: 'segment-event-failure',
        error: err,
      });
    });
  }

  async onApplicationShutdown() {
    if (!environment.isTest()) {
      await this.analytics.closeAndFlush({ timeout: 5000 });
    }
    this.logger.log(
      `Received application shutdown signal. Flush and close segment app.`,
    );
  }

  identify(id: string, traits: any): void {
    this.analytics.identify({ userId: id, traits: traits });
  }

  track(id: string, event: string, properties: any): void {
    this.analytics.track({ userId: id, event: event, properties: properties });
  }
}
