import {
  InvoiceEntity,
  InvoiceStatus,
  InvoiceTagEntity,
  RecordStatus,
  TagDefinitionEntity,
  TagDefinitionKey,
  UsedByType,
} from '@module-persistence/entities';
import {
  InvoiceRepository,
  TagDefinitionRepository,
} from '@module-persistence/repositories';
import { Inject, Injectable, Logger } from '@nestjs/common';
import Big from 'big.js';
import { randomInt } from 'crypto';
import {
  randomBoolean,
  randomDisplayId,
  randomEnumValue,
  randomLoadNumber,
  randomMemo,
  randomNote,
} from '../common/random';

@Injectable()
export class InvoiceSeeder {
  private logger: Logger = new Logger(InvoiceSeeder.name);
  private tagDefinitions: TagDefinitionEntity[];

  constructor(
    @Inject(InvoiceRepository)
    private readonly invoiceRepository: InvoiceRepository,
    private readonly tagDefinitionRepository: TagDefinitionRepository,
  ) {}

  async loadTagDefinitions() {
    this.tagDefinitions = (await this.tagDefinitionRepository.findAll({}))[0];
  }

  private getTagDefinition(key: TagDefinitionKey): TagDefinitionEntity {
    const tagDefinition = this.tagDefinitions.find(
      (definition) => definition.key === key,
    );
    if (!tagDefinition) {
      throw new Error(
        `Tag definition ${key} could not be found in the database. Please make sure migrations are executed before seeding`,
      );
    }
    return tagDefinition;
  }

  private buildInvoiceTagEntity(tagKey: TagDefinitionKey): InvoiceTagEntity {
    const tagDefinition = this.getTagDefinition(tagKey);
    const invoiceTag = new InvoiceTagEntity();
    invoiceTag.tagDefinition = tagDefinition;
    invoiceTag.createdAt = new Date();
    invoiceTag.recordStatus = RecordStatus.Active;
    invoiceTag.assignedByType = UsedByType.User;
    return invoiceTag;
  }

  private buildInvoice(
    invoiceData: Partial<Omit<InvoiceEntity, 'tags'>> & {
      tags?: TagDefinitionKey[];
    },
  ): InvoiceEntity {
    const entity = new InvoiceEntity();
    entity.displayId = invoiceData.displayId ?? randomDisplayId();
    entity.loadNumber = invoiceData.loadNumber ?? randomLoadNumber();
    entity.lineHaulRate = invoiceData.lineHaulRate
      ? new Big(invoiceData.lineHaulRate)
      : new Big(randomInt(1000));
    entity.lumper = invoiceData.lumper
      ? new Big(invoiceData.lumper)
      : new Big(randomInt(1000));
    entity.detention = invoiceData.detention
      ? new Big(invoiceData.detention)
      : new Big(randomInt(1000));
    entity.advance = invoiceData.advance
      ? new Big(invoiceData.advance)
      : new Big(randomInt(1000));
    entity.approvedFactorFee = new Big(randomInt(3));
    entity.approvedFactorFeePercentage = new Big(randomInt(3));
    entity.value = entity.lineHaulRate
      .plus(entity.lumper)
      .minus(entity.detention)
      .minus(entity.advance);
    entity.memo = randomMemo();
    entity.note = randomNote();
    entity.status = invoiceData.status
      ? invoiceData.status
      : randomEnumValue(InvoiceStatus);
    entity.expedited = invoiceData.expedited
      ? invoiceData.expedited
      : randomBoolean();
    entity.buyout = invoiceData.buyout;
    entity.recordStatus = invoiceData.recordStatus ?? RecordStatus.Active;
    if (invoiceData.tags && invoiceData.tags.length > 0) {
      const tagDefinitionEntities = invoiceData.tags.map((tagKey) =>
        this.buildInvoiceTagEntity(tagKey),
      );
      entity.tags.hydrate(tagDefinitionEntities);
    }
    return entity;
  }

  async createInvoice(
    invoiceData: Partial<Omit<InvoiceEntity, 'tags'>> & {
      tags?: TagDefinitionKey[];
    },
    clientID: string,
    brokerID: string,
  ): Promise<InvoiceEntity> {
    if (!this.tagDefinitions) {
      await this.loadTagDefinitions();
    }
    const invoice = this.buildInvoice(invoiceData);
    try {
      this.invoiceRepository.assign(invoice, {
        clientId: clientID,
        brokerId: brokerID,
      });
      this.invoiceRepository.persist(invoice);
    } catch (error) {
      this.logger.error(
        `Could not save invoice with load number ${invoice.loadNumber} - ${error}`,
      );
    }
    return invoice;
  }

  async flush() {
    await this.invoiceRepository.flush();
  }
}
