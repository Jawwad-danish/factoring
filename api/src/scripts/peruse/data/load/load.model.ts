import { BaseModel } from '@core/data';
import { environment } from '@core/environment';
import { writeToString } from '@fast-csv/format';
import { Client } from '@module-clients';
import { InvoiceEntity, TagDefinitionKey } from '@module-persistence/entities';
import { Type, instanceToPlain, plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsDefined,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';
import * as fs from 'fs';
import { fileExists, parseJSON, writeObject } from '../../../util';
import { PeruseJob } from './peruse-job.model';

export class LoadBobtailData extends BaseModel<LoadBobtailData> {
  @IsUUID()
  invoiceId: string;

  @IsString()
  loadNumber: string;

  @IsNumber()
  totalAmount: number;

  @IsDate()
  createdAt: Date;

  @IsDate()
  approvedAt: null | Date;

  @IsString()
  brokerName: null | string;

  @IsString()
  clientDOT: null | string;

  @IsString()
  clientMC: null | string;

  @IsString()
  clientName: null | string;

  @IsString()
  nonPaymentReason: null | string;

  @IsDate()
  nonPaymentDate: null | Date;

  @IsString()
  nonPaymentNote: null | string;

  static fromClient(client: Client): LoadBobtailData {
    return new LoadBobtailData({
      clientMC: client.mc || null,
      clientDOT: client.dot || null,
      clientName: client.name,
    });
  }

  static fromInvoice(
    invoice: InvoiceEntity,
    options: {
      nonPaymentReasons: TagDefinitionKey[];
    },
  ): LoadBobtailData {
    let nonPaymentKey: null | string = null;
    let nonPaymentCreatedAt: null | Date = null;
    let nonPaymentNote: null | string = null;
    for (const activity of invoice.activities) {
      if (options.nonPaymentReasons.includes(activity.tagDefinition.key)) {
        nonPaymentKey = activity.tagDefinition.key;
        nonPaymentCreatedAt = activity.createdAt;
        nonPaymentNote = activity.note;
        break;
      }
    }
    return new LoadBobtailData({
      invoiceId: invoice.id,
      loadNumber: invoice.loadNumber,
      totalAmount: invoice.value.toNumber(),
      brokerName: invoice.activities[0].payload['data']?.broker || null,
      createdAt: invoice.createdAt,
      approvedAt: invoice.purchasedDate,
      nonPaymentReason: nonPaymentKey,
      nonPaymentDate: nonPaymentCreatedAt,
      nonPaymentNote: nonPaymentNote,
    });
  }
}

export class LoadPeruseData extends BaseModel<LoadPeruseData> {
  @IsNumber()
  brokerName: null | string;

  @IsNumber()
  brokerMC: null | string;

  @IsString()
  clientName: null | string;

  @IsString()
  clientMC: null | string;

  @IsString()
  clientDOT: null | string;

  @IsString()
  loadNumber: null | string;

  @IsNumber()
  totalAmount: number;

  @IsBoolean()
  hasMissingBillOfLading: boolean;

  @IsNumber()
  bolVsRateConfirmationProbability: number;

  @IsBoolean()
  autoVerifyLoad: boolean;

  @IsString()
  autoVerifyLoadNumber: null | string;

  @IsString()
  autoVerifyVerifier: null | string;

  @IsNumber()
  checkBolPagesMissingProbability: number;

  @IsNumber()
  checkDamagesOrShortagesProbability: null | number;

  @IsNumber()
  checkLateDeliveryProbability: null | number;

  @IsNumber()
  checkMultistopProbability: null | number;

  @IsNumber()
  checkProduceProbability: null | number;

  @IsBoolean()
  checkReceiverStampPresent: boolean;

  @IsNumber()
  checkSignaturePresentProbability: null | number;

  @IsBoolean()
  checkTonu: boolean;
}

export class Load extends PeruseJob<Load> {
  @IsDefined()
  @Type(() => LoadBobtailData)
  bobtail = new LoadBobtailData();

  @IsDefined()
  @Type(() => LoadPeruseData)
  peruse = new LoadPeruseData();

  setBobtailData(data: Partial<LoadBobtailData>) {
    Object.assign(this.bobtail, data);
    return this;
  }

  setPeruseData(data: Partial<LoadPeruseData>) {
    Object.assign(this.peruse, data);
    return this;
  }

  toJSON(): object {
    return instanceToPlain(this);
  }
}

export class Loads {
  readonly items: Load[] = [];

  constructor(items?: Load[]) {
    if (items) {
      this.items.push(...items);
    }
  }

  findByInvoiceId(id: string): null | Load {
    return this.items.find((item) => item.bobtail.invoiceId === id) || null;
  }

  push(item: Load): void {
    this.items.push(item);
  }

  pushAll(items: Load[]): void {
    this.items.push(...items);
  }

  writeJSON(path: string): void {
    writeObject(
      this.items.map((item) => item.toJSON()),
      path,
      environment.util.checkAndGetForEnvVariable('SCRIPT_PERUSE_CREATE_LOADS'),
    );
  }

  async writeCSV(path: string): Promise<void> {
    const result = await writeToString(
      this.items.map((item) => {
        return [
          item.bobtail.invoiceId,
          item.bobtail.createdAt,
          item.bobtail.approvedAt,
          item.bobtail.clientName,
          item.bobtail.clientMC,
          item.bobtail.clientDOT,
          item.peruse.clientName,
          item.peruse.clientMC,
          item.peruse.clientDOT ? `peruse-dot ${item.peruse.clientDOT}` : '',
          item.bobtail.brokerName,
          item.peruse.brokerName,
          item.peruse.brokerMC,
          item.bobtail.loadNumber,
          item.peruse.loadNumber,
          item.bobtail.totalAmount,
          item.peruse.totalAmount,
          item.peruse.hasMissingBillOfLading ? 'Yes' : 'No',
          item.peruse.bolVsRateConfirmationProbability,
          item.peruse.autoVerifyLoad ? 'Yes' : 'No',
          item.peruse.autoVerifyLoadNumber,
          item.peruse.autoVerifyVerifier,
          item.peruse.checkBolPagesMissingProbability,
          item.peruse.checkDamagesOrShortagesProbability,
          item.peruse.checkLateDeliveryProbability,
          item.peruse.checkMultistopProbability,
          item.peruse.checkProduceProbability,
          item.peruse.checkReceiverStampPresent ? 'Yes' : 'No',
          item.peruse.checkSignaturePresentProbability,
          item.peruse.checkTonu ? 'Yes' : 'No',
          item.bobtail.nonPaymentReason != null ? 'Yes' : 'No',
          item.bobtail.nonPaymentReason,
          item.bobtail.nonPaymentDate,
          item.bobtail.nonPaymentNote,
        ];
      }),
      {
        headers: [
          'Invoice ID',
          'Invoice created at (UTC)',
          'Invoice approved at (UTC)',
          'Bobtail client name',
          'Bobtail client MC',
          'Bobtail client DOT',
          'Peruse client name',
          'Peruse client MC',
          'Peruse client DOT',
          'Broker name',
          'Peruse broker name',
          'Peruse broker MC',
          'Bobtail Load Number',
          'Peruse Load Number',
          'Bobtail Total Amount',
          'Peruse Total Amount',
          'Missing BOL',
          'Peruse verification BOL vs Rate confirmation probability',
          'Auto-Verify 1 Load is verified',
          'Auto-Verify 2 Load number',
          'Auto-Verify 3 Verifier',
          'Check 1 Bill of lading missing pages probability',
          'Check 2 Damages or shortages probability',
          'Check 3 Late delivery probability',
          'Check 4 Multistop probability',
          'Check 5 Produce probability',
          'Check 6 Receiver stamp present',
          'Check 7 Signature present probability',
          'Check 8 Tonu',
          'Non payment',
          'Non payment reason',
          'Non payment created at',
          'Non payment note',
        ],
      },
    );
    fs.writeFileSync(
      `${path}/${environment.util.checkAndGetForEnvVariable(
        'SCRIPT_PERUSE_RESULT',
      )}`,
      result,
    );
  }

  static fromJSON(path: string): Loads {
    const filePath = `${path}/${environment.util.checkAndGetForEnvVariable(
      'SCRIPT_PERUSE_CREATE_LOADS',
    )}`;
    if (!fileExists(filePath)) {
      return new Loads();
    }

    const entries = parseJSON(filePath);
    return new Loads(entries.map((item) => plainToInstance(Load, item)));
  }
}
