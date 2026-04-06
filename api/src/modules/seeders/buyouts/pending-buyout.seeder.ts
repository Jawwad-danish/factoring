import {
  FactoringCompanyEntity,
  PendingBuyoutEntity,
  PendingBuyoutsBatchEntity,
} from '@module-persistence/entities';
import {
  FactoringCompanyRepository,
  PendingBuyoutsBatchRepository,
} from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import {
  randomBigInt,
  randomLoadNumber,
  randomMC,
  randomName,
} from '../common/random';

@Injectable()
export class PendingBuyoutBatchSeeder {
  private logger: Logger = new Logger(PendingBuyoutBatchSeeder.name);

  constructor(
    private readonly pendingBuyoutBatchRepository: PendingBuyoutsBatchRepository,
    private readonly factoringCompanyRepository: FactoringCompanyRepository,
  ) {}

  private async build(
    data: Partial<PendingBuyoutsBatchEntity>,
    clientID: string,
    numberOfPendingBuyouts: number,
  ): Promise<PendingBuyoutsBatchEntity> {
    const entity = new PendingBuyoutsBatchEntity();
    entity.bobtailPayableFee = data.bobtailPayableFee ?? randomBigInt(1000);
    entity.clientPayableFee = data.clientPayableFee ?? randomBigInt(1000);
    let factoringCompany: FactoringCompanyEntity;
    if (data.factoringCompany) {
      factoringCompany = data.factoringCompany;
    } else {
      const factoringCompanies =
        await this.factoringCompanyRepository.findAll();
      factoringCompany = factoringCompanies[0][0];
    }
    entity.factoringCompany = factoringCompany;

    const pendingBuyouts: PendingBuyoutEntity[] = [];
    for (let i = 0; i < numberOfPendingBuyouts; i++) {
      const pendingBuyout = this.buildPendingBuyout(clientID);
      pendingBuyout.createdBy = data.createdBy!;
      pendingBuyout.updatedBy = data.updatedBy!;

      pendingBuyouts.push(pendingBuyout);
    }
    this.pendingBuyoutBatchRepository.assign(entity, {
      buyouts: pendingBuyouts,
    });
    Object.assign(entity, data);
    return entity;
  }

  buildPendingBuyout(clientID: string): PendingBuyoutEntity {
    const entity = new PendingBuyoutEntity();
    entity.brokerMC = randomMC();
    entity.brokerName = randomName();
    entity.clientId = clientID;
    entity.loadNumber = randomLoadNumber();
    entity.paymentDate = new Date();
    entity.rate = randomBigInt(1000);
    return entity;
  }

  async create(
    data: Partial<PendingBuyoutsBatchEntity>,
    clientID: string,
    numberOfPendingBuyouts: number,
  ): Promise<PendingBuyoutsBatchEntity> {
    const batch = await this.build(data, clientID, numberOfPendingBuyouts);
    try {
      await this.pendingBuyoutBatchRepository.persistAndFlush(batch);
    } catch (error) {
      this.logger.error(`Could not seed buyouts batch - ${error}`);
    }
    return batch;
  }
}
