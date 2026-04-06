import { BaseModel } from '@core/data';
import { environment } from '@core/environment';
import { Type, instanceToPlain, plainToInstance } from 'class-transformer';
import { IsDefined } from 'class-validator';
import { parseJSON, writeObject } from '../../util';
import { PeruseVerificationStatus } from './peruse-values';

export interface ProcessedInvoiceFileEntry {
  billOfLading: {
    url: null | string;
  };
  rateConfirmation: {
    url: null | string;
  };
  peruse: {
    totalAmount: null | number;
    loadNumber: null | string;
    jobId: null | string;
    jobType: null | string;
  };
  bobtail: {
    id: string;
    totalAmount: number;
    loadNumber: string;
  };
}

export class ProcessedInvoices {
  readonly items: ProcessedInvoice[] = [];

  constructor(invoices?: ProcessedInvoice[]) {
    if (invoices) {
      this.items.push(...invoices);
    }
  }

  push(item: ProcessedInvoice) {
    this.items.push(item);
  }

  writeJSON(path: string) {
    writeObject(
      this.toJSON(),
      path,
      environment.util.checkAndGetForEnvVariable('SCRIPT_PERUSE_PROCESS_PATH'),
    );
  }

  private toJSON(): object[] {
    return this.items.map((item) => item.toJSON());
  }

  static fromJSON(path: string): ProcessedInvoices {
    const entries = parseJSON(
      `${path}/${environment.util.checkAndGetForEnvVariable(
        'SCRIPT_PERUSE_PROCESS_PATH',
      )}`,
    ) as ProcessedInvoiceFileEntry[];
    return new ProcessedInvoices(
      entries.map((item) => ProcessedInvoice.fromJSON(item)),
    );
  }
}

class PeruseJobModel<T> extends BaseModel<T> {
  jobId: null | string = null;
  jobType: null | string = null;
}

class BillOfLading extends PeruseJobModel<BillOfLading> {
  url: null | string = null;
}

class RateConfirmation extends PeruseJobModel<RateConfirmation> {
  url: null | string = null;
}

class Peruse extends PeruseJobModel<Peruse> {
  loadNumber: null | string = null;
  totalAmount: null | number = null;
  verificationStatus: null | PeruseVerificationStatus = null;
  verificationProbability: null | number = null;
}

class Bobtail extends BaseModel<Bobtail> {
  invoiceId: string;
  loadNumber: string;
  totalAmount: number;
}

export class ProcessedInvoice extends BaseModel<ProcessedInvoice> {
  @Type(() => BillOfLading)
  @IsDefined()
  billOfLading = new BillOfLading();

  @Type(() => RateConfirmation)
  @IsDefined()
  rateConfirmation = new RateConfirmation();

  @Type(() => Bobtail)
  @IsDefined()
  bobtail = new Bobtail();

  @Type(() => Peruse)
  @IsDefined()
  peruse = new Peruse();

  setBillOfLading(url: string, peruseData?: PeruseJobModel<object>) {
    this.billOfLading.url = url;
    if (peruseData) {
      this.billOfLading.jobId = peruseData.jobId;
      this.billOfLading.jobType = peruseData.jobType;
    }
  }

  setRateConfirmation(
    url: string,
    peruseData?: {
      loadNumber: string;
      totalAmount: number;
    } & PeruseJobModel<object>,
  ) {
    this.rateConfirmation.url = url;
    if (peruseData) {
      this.peruse.loadNumber = peruseData.loadNumber;
      this.peruse.totalAmount = peruseData.totalAmount;
      this.rateConfirmation.jobId = peruseData.jobId;
      this.rateConfirmation.jobType = peruseData.jobType;
    }
  }

  setVerificationJob(data: Pick<Peruse, 'jobId' | 'jobType'>) {
    this.peruse.jobId = data.jobId;
    this.peruse.jobType = data.jobType;
  }

  setVerification(
    status: null | PeruseVerificationStatus,
    probability: null | number,
  ) {
    this.peruse.verificationStatus = status;
    this.peruse.verificationProbability = probability;
  }

  toJSON(): object {
    return instanceToPlain(this);
  }

  static fromBobtailData(data: Required<Bobtail>) {
    const instance = new ProcessedInvoice();
    instance.bobtail.invoiceId = data.invoiceId;
    instance.bobtail.loadNumber = data.loadNumber;
    instance.bobtail.totalAmount = data.totalAmount;
    return instance;
  }

  static fromJSON(data: object) {
    return plainToInstance(ProcessedInvoice, data);
  }
}
