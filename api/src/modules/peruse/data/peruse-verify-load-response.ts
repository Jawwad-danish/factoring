import Big from 'big.js';
import { Expose, Type } from 'class-transformer';
import { IsDefined, IsString } from 'class-validator';

export class TransportDate {
  @Expose({ name: 'BOL' })
  bol?: string;

  @Expose({ name: 'delta_in_days' })
  deltaInDays?: number;

  @Expose({ name: 'match_probability' })
  matchProbability?: number;

  @Expose({ name: 'rate_confirmation' })
  rateConfirmation?: string;
}

export class BillOfLadingPages {
  @IsDefined()
  present: number;
}

export class BrokerReferenceNumber {
  @Expose({ name: 'rate_confirmation' })
  @IsDefined()
  rateConfirmation: null | string;
}

export class PoReferenceNumber {
  @Expose({ name: 'po_reference_number_recent_broker_sequence' })
  poReferenceNUmberRecentBrokerSequence?: string[];

  @Expose({ name: 'rate_confirmation_reference_number_conformity' })
  rateConfirmationReferenceNumberConformity?: number;
}

export class VerifyLoadRate {
  @Expose({ name: 'rate_confirmation_total_rate' })
  @IsDefined()
  rateConfirmationTotalRate: number;

  @Expose({ name: 'rate_confirmation_line_haul_rate' })
  @IsDefined()
  rateConfirmationLineHaulRate: number;

  @Expose({ name: 'rate_confirmation_vs_known_broker_domain_probability' })
  rateConfirmationVsKnownBrokerDomainProbabiity: number | null;

  @Expose({
    name: 'rate_confirmation_vs_structured_load_data_match_probability',
  })
  rateConfirmationVsStructuredLoadDataMatchProbability: number | null;
}

export class BrokerName {
  @Expose({ name: 'rate_confirmation' })
  @IsString()
  rateConfirmation: string;
}

export class BrokerMC {
  @Expose({ name: 'rate_confirmation' })
  @IsString()
  rateConfirmation: string;
}

export class CarrierDOT {
  @Expose({ name: 'rate_confirmation' })
  @IsString()
  rateConfirmation: string;
}

export class CarrierMC {
  @Expose({ name: 'rate_confirmation' })
  @IsString()
  rateConfirmation: string;
}

export class CarrierName {
  @Expose({ name: 'rate_confirmation' })
  @IsString()
  rateConfirmation: string;
}

export class Fields {
  @Expose({ name: 'rate' })
  @Type(() => VerifyLoadRate)
  rate?: VerifyLoadRate;

  @Expose({ name: 'broker_reference_number' })
  @Type(() => BrokerReferenceNumber)
  brokerReferenceNumber?: BrokerReferenceNumber;

  @Expose({ name: 'BOL_pages' })
  @Type(() => BillOfLadingPages)
  billOfLadingPages?: BillOfLadingPages;

  @Expose({ name: 'broker_name' })
  @Type(() => BrokerName)
  brokerName?: BrokerName;

  @Expose({ name: 'broker_mc' })
  @Type(() => BrokerMC)
  brokerMC?: BrokerMC;

  @Expose({ name: 'carrier_mc' })
  @Type(() => CarrierMC)
  carrierMC?: CarrierMC;

  @Expose({ name: 'carrier_dot' })
  @Type(() => CarrierDOT)
  carrierDOT?: CarrierDOT;

  @Expose({ name: 'carrier_name' })
  @Type(() => CarrierName)
  carrierName?: CarrierName;

  @Expose({ name: 'delivery_date' })
  @Type(() => TransportDate)
  deliveryDate?: TransportDate;

  @Expose({ name: 'pickup_date' })
  @Type(() => TransportDate)
  pickupDate?: TransportDate;

  @Expose({
    name: 'po_reference_number',
  })
  @Type(() => PoReferenceNumber)
  poReferenceNumber?: PoReferenceNumber;
}

export class Checks {
  @Expose({ name: 'bol_pages_missing_probability' })
  @IsDefined()
  bolPagesMissingProbability: number;

  @Expose({ name: 'damages_or_shortages_probability' })
  @IsDefined()
  damagesOrShortagesProbability: null | number;

  @Expose({ name: 'is_tonu' })
  @IsDefined()
  tonu: boolean;

  @Expose({ name: 'late_delivery_probability' })
  @IsDefined()
  lateDeliveryProbability: number;

  @Expose({ name: 'multistop_probability' })
  @IsDefined()
  multistopProbability: number;

  @Expose({ name: 'produce_probability' })
  @IsDefined()
  produceProbability: number;

  @Expose({ name: 'receiver_stamp_present' })
  @IsDefined()
  receiverStampPresent: boolean;

  @Expose({ name: 'signature_present_probability' })
  @IsDefined()
  signaturePresentProbability: null | number;
}

export class VerifyLoadResponse {
  @Expose({ name: 'BOL_vs_rate_confirmation_probability' })
  bolVsRateConfirmationProbability: number;

  @Expose({ name: 'fields' })
  @Type(() => Fields)
  @IsDefined()
  fields: Fields;

  @Expose({ name: 'checks' })
  @Type(() => Checks)
  @IsDefined()
  checks: Checks;

  @Expose({ name: 'message' })
  @IsDefined()
  message: string;

  hasMissingBillOfLading(): boolean {
    return (this.fields.billOfLadingPages?.present || 0) === 0;
  }

  getTotalAmount(): number {
    return new Big(this.fields.rate?.rateConfirmationTotalRate || 0)
      .times(100)
      .toNumber();
  }

  getLoadNumber(): null | string {
    return (
      this.fields.brokerReferenceNumber?.rateConfirmation
        ?.replace('#', '')
        ?.replace('-', '') || null
    );
  }

  getBrokerName(): null | string {
    return this.fields.brokerName?.rateConfirmation || null;
  }

  getBrokerMC(): null | string {
    return this.fields.brokerMC?.rateConfirmation || null;
  }

  getCarrierMC(): null | string {
    return this.fields.carrierMC?.rateConfirmation || null;
  }

  getCarrierDOT(): null | string {
    return this.fields.carrierDOT?.rateConfirmation || null;
  }

  getCarrierName(): null | string {
    return this.fields.carrierName?.rateConfirmation || null;
  }
}
