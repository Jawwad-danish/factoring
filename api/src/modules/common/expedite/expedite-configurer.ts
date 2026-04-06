import Big from 'big.js';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ExpediteConfigurer {
  constructor(
    @Inject(CONFIG_SERVICE) private readonly configService: ConfigService,
  ) {}

  expediteFee(): Big {
    const config = this.configService.getValue('EXPEDITE_FEE');
    if (!config.hasValue()) {
      throw new Error('Could not find expedite transfer fee');
    }
    return Big(config.asString());
  }
}
