import { BaseModel } from '@core/data';
import { Logger } from '@nestjs/common';
import Big from 'big.js';
import { Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  isDateString,
} from 'class-validator';
import { AddressType, Input, PeruseJobStatus } from './common';
import { PeruseJobType } from './peruse-job-types';
import {
  PeruseDocumentClassifications,
  PeruseVerificationStatus,
} from './peruse-values';
import { VerifyLoadResponse } from './peruse-verify-load-response';
import { DebtorSystemVerification } from './peruse-debtor-verification-system';

export class PeruseAddress {
  @IsOptional()
  @IsString()
  fullAddress?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  type: AddressType;

  @IsOptional()
  @IsString()
  date?: Date;
}

// Peruse uses a mix of string and string[] (if there are multiple possibilities)
// First element is more probable to be the correct one
const getFirstElement = (input: undefined | string | string[]): string => {
  if (!input) {
    return '';
  }
  if (Array.isArray(input)) {
    return input.length > 0 ? input[0] : '';
  }
  return input;
};

// Big.js does not like the format from Peruse (eg. 3,500.02)
const cleanMonetaryValue = (input: string): string => {
  return input.replace(/,/g, '');
};

interface ValidationOptions {
  validateRateConfirmation: boolean;
}

export class ClassificationResultPerDocument {
  @Expose({ name: 'category' })
  @IsEnum(PeruseDocumentClassifications)
  category: PeruseDocumentClassifications;

  @Expose({ name: 'probabilities' })
  probabilities: ProbabilityResult[];
}

export class ClassificationResultPerPage {
  [key: string]: Page;
}

export class Page {
  @Expose({ name: 'probabilities' })
  probabilities: ProbabilityResult[];

  @Expose({ name: 'status' })
  status: string;
}

export class ProbabilityResult {
  @Expose({ name: 'category' })
  @IsEnum(PeruseDocumentClassifications)
  category: PeruseDocumentClassifications;

  @Expose({ name: 'confidence' })
  confidence: number;

  @Expose({ name: 'raw_prob' })
  rawProb: number;
}

export class BOLResult {
  @Expose({ name: 'billing_instructions' })
  @IsOptional()
  billingInstructions?: string | string[];

  @Expose({ name: 'bol_reference_number' })
  @IsOptional()
  bolReferenceNumber?: string | string[];

  @Expose({ name: 'broker_address' })
  @IsOptional()
  brokerAddress?: string | string[];

  @Expose({ name: 'broker_billing_information' })
  @IsOptional()
  brokerBillingInformation?: string | string[];

  @Expose({ name: 'broker_carrier_dot' })
  @IsOptional()
  brokerCarrierDot?: string | string[];

  @Expose({ name: 'broker_carrier_mc' })
  @IsOptional()
  brokerCarrierMc?: string | string[];

  @Expose({ name: 'broker_contact' })
  @IsOptional()
  brokerContact?: string | string[];

  @Expose({ name: 'broker_customer_credit_rating' })
  @IsOptional()
  brokerCustomerCreditRating?: string | string[];

  @Expose({ name: 'broker_driver' })
  @IsOptional()
  brokerDriver?: string | string[];

  @Expose({ name: 'broker_driver_cellphone' })
  @IsOptional()
  brokerDriverCellphone?: string | string[];

  @Expose({ name: 'broker_email' })
  @IsOptional()
  brokerEmail?: string | string[];

  @Expose({ name: 'broker_ext' })
  @IsOptional()
  brokerExt?: string | string[];

  @Expose({ name: 'broker_fax' })
  brokerFax: string | string[];

  @Expose({ name: 'broker_name' })
  brokerName: string | string[];

  @Expose({ name: 'broker_phone' })
  brokerPhone: string | string[];

  @Expose({ name: 'broker_truck' })
  brokerTruck: string | string[];

  @Expose({ name: 'broker_website' })
  brokerWebsite: string | string[];

  @Expose({ name: 'cargo_value' })
  cargoValue: string | string[];

  @Expose({ name: 'carrier_address' })
  carrierAddress: string | string[];

  @Expose({ name: 'carrier_billing_information' })
  carrierBillingInformation: string | string[];

  @Expose({ name: 'carrier_carrier_dot' })
  carrierCarrierDot: string | string[];

  @Expose({ name: 'carrier_carrier_mc' })
  carrierCarrierMc: string | string[];

  @Expose({ name: 'carrier_contact' })
  carrierContact: string | string[];

  @Expose({ name: 'carrier_customer_credit_rating' })
  carrierCustomerCreditRating: string | string[];

  @Expose({ name: 'carrier_driver' })
  carrierDriver: string | string[];

  @Expose({ name: 'carrier_driver_cellphone' })
  carrierDriverCellphone: string | string[];

  @Expose({ name: 'carrier_email' })
  carrierEmail: string | string[];

  @Expose({ name: 'carrier_ext' })
  carrierExt: string | string[];

  @Expose({ name: 'carrier_fax' })
  carrierFax: string | string[];

  @Expose({ name: 'carrier_name' })
  carrierName: string | string[];

  @Expose({ name: 'carrier_phone' })
  carrierPhone: string | string[];

  @Expose({ name: 'carrier_truck' })
  carrierTruck: string | string[];

  @Expose({ name: 'carrier_website' })
  carrierWebsite: string | string[];

  @Expose({ name: 'commodity' })
  commodity: string | string[];

  @Expose({ name: 'consignee_billing_information' })
  consigneeBillingInformation: string | string[];

  @Expose({ name: 'consignee_carrier_dot' })
  consigneeCarrierDot: string | string[];

  @Expose({ name: 'consignee_carrier_mc' })
  consigneeCarrierMc: string | string[];

  @Expose({ name: 'consignee_customer_credit_rating' })
  consigneeCustomerCreditRating: string | string[];

  @Expose({ name: 'consignee_driver' })
  consigneeDriver: string | string[];

  @Expose({ name: 'consignee_driver_cellphone' })
  consigneeDriverCellphone: string | string[];

  @Expose({ name: 'consignee_reference_number' })
  consigneeReferenceNumber: string | string[];

  @Expose({ name: 'consignee_truck' })
  consigneeTruck: string | string[];

  @Expose({ name: 'damages' })
  damages: string | string[];

  @Expose({ name: 'date_received' })
  dateReceived: string | string[];

  @Expose({ name: 'delivery_appointment_notes' })
  deliveryAppointmentNotes: string | string[];

  @Expose({ name: 'delivery_appointment_number' })
  deliveryAppointmentNumber: string | string[];

  @Expose({ name: 'delivery_appointment_time' })
  deliveryAppointmentTime: string | string[];

  @Expose({ name: 'delivery_arrival_time' })
  deliveryArrivalTime: string | string[];

  @Expose({ name: 'delivery_contact' })
  deliveryContact: string | string[];

  @Expose({ name: 'delivery_date' })
  deliveryDate: string | string[];

  @Expose({ name: 'delivery_departure_time' })
  deliveryDepartureTime: string | string[];

  @Expose({ name: 'delivery_directions' })
  deliveryDirections: string | string[];

  @Expose({ name: 'delivery_end_time' })
  deliveryEndTime: string | string[];

  @Expose({ name: 'delivery_notes' })
  deliveryNotes: string | string[];

  @Expose({ name: 'delivery_reference_number' })
  deliveryReferenceNumber: string | string[];

  @Expose({ name: 'delivery_start_time' })
  deliveryStartTime: string | string[];

  @Expose({ name: 'detention' })
  detention: string | string[];

  @Expose({ name: 'dimensions' })
  dimensions: string | string[];

  @Expose({ name: 'dispatch_notes' })
  dispatchNotes: string | string[];

  @Expose({ name: 'driver_instructions' })
  driverInstructions: string | string[];

  @Expose({ name: 'equipment' })
  equipment: string | string[];

  @Expose({ name: 'equipment_size' })
  equipmentSize: string | string[];

  @Expose({ name: 'food_grade' })
  foodGrade: string | string[];

  @Expose({ name: 'freight_charge_terms' })
  freightChargeTerms: string | string[];

  @Expose({ name: 'freight_class' })
  freightClass: string | string[];

  @Expose({ name: 'fuel_surcharge' })
  fuelSurcharge: string | string[];

  @Expose({ name: 'hazmat_un_number' })
  hazmatUnNumber: string | string[];

  @Expose({ name: 'ishazmat' })
  ishazmat: string | string[];

  @Expose({ name: 'layover' })
  layover: string | string[];

  @Expose({ name: 'line_haul_rate' })
  lineHaulRate: string | string[];

  @Expose({ name: 'load_bars' })
  loadBars: string | string[];

  @Expose({ name: 'load_height' })
  loadHeight: string | string[];

  @Expose({ name: 'load_length' })
  loadLength: string | string[];

  @Expose({ name: 'load_type' })
  loadType: string | string[];

  @Expose({ name: 'load_width' })
  loadWidth: string | string[];

  @Expose({ name: 'lumper' })
  lumper: string | string[];

  @Expose({ name: 'miles' })
  miles: string | string[];

  @Expose({ name: 'number_of_units' })
  numberOfUnits: string | string[];

  @Expose({ name: 'other_accessorial_charges' })
  otherAccessorialCharges: string | string[];

  @Expose({ name: 'other_reference_number' })
  otherReferenceNumber: string | string[];

  @Expose({ name: 'packaging' })
  packaging: string | string[];

  @Expose({ name: 'pages' })
  pages: string | string[];

  @Expose({ name: 'pickup_appointment_notes' })
  pickupAppointmentNotes: string | string[];

  @Expose({ name: 'pickup_appointment_number' })
  pickupAppointmentNumber: string | string[];

  @Expose({ name: 'pickup_appointment_time' })
  pickupAppointmentTime: string | string[];

  @Expose({ name: 'pickup_arrival_time' })
  pickupArrivalTime: string | string[];

  @Expose({ name: 'pickup_contact' })
  pickupContact: string | string[];

  @Expose({ name: 'pickup_date' })
  pickupDate: string | string[];

  @Expose({ name: 'pickup_departure_time' })
  pickupDepartureTime: string | string[];

  @Expose({ name: 'pickup_directions' })
  pickupDirections: string | string[];

  @Expose({ name: 'pickup_end_time' })
  pickupEndTime: string | string[];

  @Expose({ name: 'pickup_notes' })
  pickupNotes: string | string[];

  @Expose({ name: 'pickup_reference_number' })
  pickupReferenceNumber: string | string[];

  @Expose({ name: 'pickup_start_time' })
  pickupStartTime: string | string[];

  @Expose({ name: 'po_reference_number' })
  poReferenceNumber: string | string[];

  @Expose({ name: 'quickpay_email' })
  quickpayEmail: string | string[];

  @Expose({ name: 'received_shortage' })
  receivedShortage: string | string[];

  @Expose({ name: 'receiver_address' })
  receiverAddress: string | string[];

  @Expose({ name: 'receiver_billing_information' })
  receiverBillingInformation: string | string[];

  @Expose({ name: 'receiver_carrier_dot' })
  receiverCarrierDot: string | string[];

  @Expose({ name: 'receiver_carrier_mc' })
  receiverCarrierMc: string | string[];

  @Expose({ name: 'receiver_contact' })
  receiverContact: string | string[];

  @Expose({ name: 'receiver_customer_credit_rating' })
  receiverCustomerCreditRating: string | string[];

  @Expose({ name: 'receiver_driver' })
  receiverDriver: string | string[];

  @Expose({ name: 'receiver_driver_cellphone' })
  receiverDriverCellphone: string | string[];

  @Expose({ name: 'receiver_email' })
  receiverEmail: string | string[];

  @Expose({ name: 'receiver_ext' })
  receiverExt: string | string[];

  @Expose({ name: 'receiver_name' })
  receiverName: string | string[];

  @Expose({ name: 'receiver_phone' })
  receiverPhone: string | string[];

  @Expose({ name: 'receiver_signature' })
  receiverSignature: string | string[];

  @Expose({ name: 'receiver_truck' })
  receiverTruck: string | string[];

  @Expose({ name: 'roll_doors' })
  rollDoors: string | string[];

  @Expose({ name: 'scac_code' })
  scacCode: string | string[];

  @Expose({ name: 'seal_number' })
  sealNumber: string | string[];

  @Expose({ name: 'shipment_requirements' })
  shipmentRequirements: string | string[];

  @Expose({ name: 'shipper_address' })
  shipperAddress: string | string[];

  @Expose({ name: 'shipper_address_city' })
  shipperAddressCity: string | string[];

  @Expose({ name: 'shipper_billing_information' })
  shipperBillingInformation: string | string[];

  @Expose({ name: 'shipper_carrier_dot' })
  shipperCarrierDot: string | string[];

  @Expose({ name: 'shipper_carrier_mc' })
  shipperCarrierMc: string | string[];

  @Expose({ name: 'shipper_contact' })
  shipperContact: string | string[];

  @Expose({ name: 'shipper_customer_credit_rating' })
  shipperCustomerCreditRating: string | string[];

  @Expose({ name: 'shipper_driver' })
  shipperDriver: string | string[];

  @Expose({ name: 'shipper_driver_cellphone' })
  shipperDriverCellphone: string | string[];

  @Expose({ name: 'shipper_email' })
  shipperEmail: string | string[];

  @Expose({ name: 'shipper_ext' })
  shipperExt: string | string[];

  @Expose({ name: 'shipper_name' })
  shipperName: string | string[];

  @Expose({ name: 'shipper_phone' })
  shipperPhone: string | string[];

  @Expose({ name: 'shipper_reference_number' })
  shipperReferenceNumber: string | string[];

  @Expose({ name: 'shipper_signature' })
  shipperSignature: string | string[];

  @Expose({ name: 'shipper_truck' })
  shipperTruck: string | string[];

  @Expose({ name: 'shortages' })
  shortages: string | string[];

  @Expose({ name: 'straps_needed' })
  strapsNeeded: string | string[];

  @Expose({ name: 'temp_mode_cycle_continue' })
  tempModeCycleContinue: string | string[];

  @Expose({ name: 'temperature' })
  temperature: string | string[];

  @Expose({ name: 'third_party_billing_info' })
  thirdPartyBillingInfo: string | string[];

  @Expose({ name: 'total_rate' })
  totalRate: string | string[];

  @Expose({ name: 'total_volume' })
  totalVolume: string | string[];

  @Expose({ name: 'total_weight' })
  totalWeight: string | string[];

  @Expose({ name: 'trailer' })
  trailer: string | string[];

  @Expose({ name: 'type_of_hazmat' })
  typeOfHazmat: string | string[];

  @Expose({ name: 'type_of_units' })
  typeOfUnits: string | string[];

  @Expose({ name: 'value_of_items' })
  valueOfItems: string | string[];

  @Expose({ name: 'volume' })
  volume: string | string[];

  @Expose({ name: 'weight' })
  weight: string | string[];
}

export class RateConfirmationResult extends BaseModel<RateConfirmationResult> {
  @Expose({ name: 'billing_instructions' })
  @IsOptional()
  billingInstructions?: string | string[];

  @Expose({ name: 'bol_reference_number' })
  @IsOptional()
  bolReferenceNumber?: string | string[];

  @Expose({ name: 'broker_address' })
  @IsOptional()
  brokerAddress?: string | string[];

  @Expose({ name: 'broker_billing_information' })
  @IsOptional()
  brokerBillingInformation?: string | string[];

  @Expose({ name: 'broker_carrier_dot' })
  @IsOptional()
  brokerCarrierDot?: string | string[];

  @Expose({ name: 'broker_carrier_mc' })
  @IsOptional()
  brokerCarrierMc?: string | string[];

  @Expose({ name: 'broker_contact' })
  @IsOptional()
  brokerContact?: string | string[];

  @Expose({ name: 'broker_driver' })
  @IsOptional()
  brokerDriver?: string | string[];

  @Expose({ name: 'broker_driver_cellphone' })
  @IsOptional()
  brokerDriverCellphone?: string | string[];

  @Expose({ name: 'broker_email' })
  @IsOptional()
  brokerEmail?: string | string[];

  @Expose({ name: 'broker_ext' })
  @IsOptional()
  brokerExt?: string | string[];

  @Expose({ name: 'broker_fax' })
  @IsOptional()
  brokerFax?: string | string[];

  @Expose({ name: 'broker_name' })
  @IsOptional()
  brokerName?: string | string[];

  @Expose({ name: 'broker_name_canonical' })
  @IsOptional()
  brokerNameCanonical?: string | string[];

  @Expose({ name: 'broker_phone' })
  @IsOptional()
  brokerPhone?: string | string[];

  @Expose({ name: 'broker_reference_number' })
  @IsOptional()
  brokerReferenceNumber?: string | string[];

  @Expose({ name: 'broker_trailer' })
  @IsOptional()
  brokerTrailer?: string | string[];

  @Expose({ name: 'broker_website' })
  @IsOptional()
  brokerWebsite?: string | string[];

  @Expose({ name: 'cargo_value' })
  @IsOptional()
  cargoValue?: string | string[];

  @Expose({ name: 'carrier_address' })
  @IsOptional()
  carrierAddress?: string | string[];

  @Expose({ name: 'carrier_carrier_dot' })
  @IsOptional()
  carrierCarrierDot?: string | string[];

  @Expose({ name: 'carrier_carrier_mc' })
  @IsOptional()
  carrierCarrierMc?: string | string[];

  @Expose({ name: 'carrier_contact' })
  @IsOptional()
  carrierContact?: string | string[];

  @Expose({ name: 'carrier_driver' })
  @IsOptional()
  carrierDriver?: string | string[];

  @Expose({ name: 'carrier_driver_cellphone' })
  @IsOptional()
  carrierDriverCellphone?: string | string[];

  @Expose({ name: 'carrier_email' })
  @IsOptional()
  carrierEmail?: string | string[];

  @Expose({ name: 'carrier_ext' })
  @IsOptional()
  carrierExt?: string | string[];

  @Expose({ name: 'carrier_fax' })
  @IsOptional()
  carrierFax?: string | string[];

  @Expose({ name: 'carrier_name' })
  @IsOptional()
  carrierName?: string | string[];

  @Expose({ name: 'carrier_phone' })
  @IsOptional()
  carrierPhone?: string | string[];

  @Expose({ name: 'carrier_trailer' })
  @IsOptional()
  carrierTrailer?: string | string[];

  @Expose({ name: 'carrier_truck' })
  @IsOptional()
  carrierTruck?: string | string[];

  @Expose({ name: 'carrier_website' })
  @IsOptional()
  carrierWebsite?: string | string[];

  @Expose({ name: 'commodity' })
  @IsOptional()
  commodity?: string | string[];

  @Expose({ name: 'delivery_appointment_notes' })
  @IsOptional()
  deliveryAppointmentNotes?: string | string[];

  @Expose({ name: 'delivery_appointment_number' })
  @IsOptional()
  deliveryAppointmentNumber?: string | string[];

  @Expose({ name: 'delivery_appointment_time' })
  @IsOptional()
  deliveryAppointmentTime?: string | string[];

  @Expose({ name: 'delivery_contact' })
  @IsOptional()
  deliveryContact?: string | string[];

  @Expose({ name: 'delivery_date' })
  @IsOptional()
  deliveryDate?: string | string[];

  @Expose({ name: 'delivery_directions' })
  @IsOptional()
  deliveryDirections?: string | string[];

  @Expose({ name: 'delivery_end_time' })
  @IsOptional()
  deliveryEndTime?: string | string[];

  @Expose({ name: 'delivery_notes' })
  @IsOptional()
  deliveryNotes?: string | string[];

  @Expose({ name: 'delivery_reference_number' })
  @IsOptional()
  deliveryReferenceNumber?: string | string[];

  @Expose({ name: 'delivery_start_time' })
  @IsOptional()
  deliveryStartTime?: string | string[];

  @Expose({ name: 'detention' })
  @IsOptional()
  detention?: string | string[];

  @Expose({ name: 'dimensions' })
  @IsOptional()
  dimensions?: string | string[];

  @Expose({ name: 'dispatch_notes' })
  @IsOptional()
  dispatchNotes?: string | string[];

  @Expose({ name: 'driver_instructions' })
  @IsOptional()
  driverInstructions?: string | string[];

  @Expose({ name: 'equipment' })
  @IsOptional()
  equipment?: string | string[];

  @Expose({ name: 'equipment_size' })
  @IsOptional()
  equipmentSize?: string | string[];

  @Expose({ name: 'food_grade' })
  @IsOptional()
  foodGrade?: string | string[];

  @Expose({ name: 'fuel_surcharge' })
  @IsOptional()
  fuelSurcharge?: string | string[];

  @Expose({ name: 'hazmat_un_number' })
  @IsOptional()
  hazmatUnNumber?: string | string[];

  @Expose({ name: 'ishazmat' })
  @IsOptional()
  ishazmat?: string | string[];

  @Expose({ name: 'layover' })
  @IsOptional()
  layover?: string | string[];

  @Expose({ name: 'line_haul_rate' })
  @IsOptional()
  lineHaulRate?: string | string[];

  @Expose({ name: 'load_bars' })
  @IsOptional()
  loadBars?: string | string[];

  @Expose({ name: 'load_type' })
  @IsOptional()
  loadType?: string | string[];

  @Expose({ name: 'lumper' })
  @IsOptional()
  lumper?: string | string[];

  @Expose({ name: 'miles' })
  @IsOptional()
  miles?: string | string[];

  @Expose({ name: 'number_of_units' })
  @IsOptional()
  numberOfUnits?: string | string[];

  @Expose({ name: 'other_accessorial_charges' })
  @IsOptional()
  otherAccessorialCharges?: string | string[];

  @Expose({ name: 'pages' })
  @IsOptional()
  pages?: string | string[];

  @Expose({ name: 'pickup_appointment_notes' })
  @IsOptional()
  pickupAppointmentNotes?: string | string[];

  @Expose({ name: 'pickup_appointment_number' })
  @IsOptional()
  pickupAppointmentNumber?: string | string[];

  @Expose({ name: 'pickup_appointment_time' })
  @IsOptional()
  pickupAppointmentTime?: string | string[];

  @Expose({ name: 'pickup_contact' })
  @IsOptional()
  pickupContact?: string | string[];

  @Expose({ name: 'pickup_date' })
  @IsOptional()
  pickupDate?: string | string[];

  @Expose({ name: 'pickup_directions' })
  @IsOptional()
  pickupDirections?: string | string[];

  @Expose({ name: 'pickup_notes' })
  @IsOptional()
  pickupNotes?: string | string[];

  @Expose({ name: 'pickup_reference_number' })
  @IsOptional()
  pickupReferenceNumber?: string | string[];

  @Expose({ name: 'po_reference_number' })
  @IsOptional()
  poReferenceNumber?: string | string[];

  @Expose({ name: 'quickpay_email' })
  @IsOptional()
  quickpayEmail?: string | string[];

  @Expose({ name: 'receiver_address' })
  @IsOptional()
  receiverAddress?: string | string[];

  @Expose({ name: 'receiver_address_city' })
  @IsOptional()
  receiverAddressCity?: string | string[];

  @Expose({ name: 'receiver_address_state' })
  @IsOptional()
  receiverAddressState?: string | string[];

  @Expose({ name: 'receiver_billing_information' })
  @IsOptional()
  receiverBillingInformation?: string | string[];

  @Expose({ name: 'receiver_carrier_dot' })
  @IsOptional()
  receiverCarrierDot?: string | string[];

  @Expose({ name: 'receiver_carrier_mc' })
  @IsOptional()
  receiverCarrierMc?: string | string[];

  @Expose({ name: 'receiver_contact' })
  @IsOptional()
  receiverContact?: string | string[];

  @Expose({ name: 'receiver_email' })
  @IsOptional()
  receiverEmail?: string | string[];

  @Expose({ name: 'receiver_ext' })
  @IsOptional()
  receiverExt?: string | string[];

  @Expose({ name: 'receiver_name' })
  @IsOptional()
  receiverName?: string | string[];

  @Expose({ name: 'receiver_phone' })
  @IsOptional()
  receiverPhone?: string | string[];

  @Expose({ name: 'roll_doors' })
  @IsOptional()
  rollDoors?: string | string[];

  @Expose({ name: 'scac_code' })
  @IsOptional()
  scacCode?: string | string[];

  @Expose({ name: 'seal_number' })
  @IsOptional()
  sealNumber?: string | string[];

  @Expose({ name: 'shipment_requirements' })
  @IsOptional()
  shipmentRequirements?: string | string[];

  @Expose({ name: 'shipper_address' })
  @IsOptional()
  shipperAddress?: string | string[];

  @Expose({ name: 'shipper_address_city' })
  @IsOptional()
  shipperAddressCity?: string | string[];

  @Expose({ name: 'shipper_address_state' })
  @IsOptional()
  shipperAddressState?: string | string[];

  @Expose({ name: 'shipper_contact' })
  @IsOptional()
  shipperContact?: string | string[];

  @Expose({ name: 'shipper_email' })
  @IsOptional()
  shipperEmail?: string | string[];

  @Expose({ name: 'shipper_ext' })
  @IsOptional()
  shipperExt?: string | string[];

  @Expose({ name: 'shipper_name' })
  @IsOptional()
  shipperName?: string | string[];

  @Expose({ name: 'shipper_phone' })
  @IsOptional()
  shipperPhone?: string | string[];

  @Expose({ name: 'shipper_reference_number' })
  @IsOptional()
  shipperReferenceNumber?: string | string[];

  @Expose({ name: 'shipper_trailer' })
  @IsOptional()
  shipperTrailer?: string | string[];

  @Expose({ name: 'shipper_truck' })
  @IsOptional()
  shipperTruck?: string | string[];

  @Expose({ name: 'straps_needed' })
  @IsOptional()
  strapsNeeded?: string | string[];

  @Expose({ name: 'temperature' })
  @IsOptional()
  temperature?: string | string[];

  @Expose({ name: 'total_rate' })
  @IsOptional()
  totalRate?: string | string[];

  @Expose({ name: 'type_of_hazmat' })
  @IsOptional()
  typeOfHazmat?: string | string[];

  @Expose({ name: 'type_of_units' })
  @IsOptional()
  typeOfUnits?: string | string[];

  @Expose({ name: 'value_of_items' })
  @IsOptional()
  valueOfItems?: string | string[];

  @Expose({ name: 'weight' })
  @IsOptional()
  weight?: string | string[];

  getPickupAddress() {
    const model = new PeruseAddress();
    model.fullAddress = getFirstElement(this.shipperAddress);
    model.city = getFirstElement(this.shipperAddressCity);
    model.state = getFirstElement(this.shipperAddressState);
    model.type = AddressType.Pickup;
    const pickupDate = getFirstElement(this.pickupDate);
    if (pickupDate && isDateString(pickupDate)) {
      model.date = new Date(pickupDate);
    }
    return model;
  }

  getDeliveryAddress() {
    const model = new PeruseAddress();
    model.fullAddress = getFirstElement(this.receiverAddress);
    model.city = getFirstElement(this.receiverAddressCity);
    model.state = getFirstElement(this.receiverAddressState);
    model.type = AddressType.Delivery;
    const deliveryDate = getFirstElement(this.deliveryDate);
    if (deliveryDate && isDateString(deliveryDate)) {
      model.date = new Date(deliveryDate);
    }
    return model;
  }

  getBrokerName() {
    return getFirstElement(this.brokerName);
  }

  getBrokerNames() {
    return Array.isArray(this.brokerName) ? this.brokerName : [this.brokerName];
  }

  getBrokerNameCanonical() {
    return getFirstElement(this.brokerNameCanonical);
  }

  getBrokerMC() {
    return getFirstElement(this.brokerCarrierMc);
  }

  getBrokerDOT() {
    return getFirstElement(this.brokerCarrierDot);
  }

  getBrokerReferenceNumber() {
    return getFirstElement(this.brokerReferenceNumber).replace('#', '');
  }

  getBrokerEmail() {
    return getFirstElement(this.brokerEmail);
  }

  getTotalAmount() {
    // The amount is in USD, and we need cents
    const amount = cleanMonetaryValue(getFirstElement(this.totalRate) || '0');
    return new Big(amount).times(100);
  }
}

export class InformationExtractionResult extends BaseModel<InformationExtractionResult> {
  @Expose({ name: 'BOL' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BOLResult)
  bol?: Partial<BOLResult>;

  @Expose({ name: 'rate_confirmation' })
  @IsOptional()
  @ValidateNested()
  @Type(() => RateConfirmationResult)
  rateConfirmation?: RateConfirmationResult;
}

export class Result {
  @Expose({ name: 'ocr_urls' })
  ocrUrls: string[];

  @Expose({ name: 'message' })
  message: string;

  @Expose({ name: 'status' })
  status: string;

  @Expose({ name: 'classification_result' })
  classificationResult:
    | ClassificationResultPerPage
    | ClassificationResultPerDocument;

  @Expose({ name: 'information_extraction_result' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => InformationExtractionResult)
  informationExtractionResult: InformationExtractionResult;

  @Expose({ name: 'verify_load_response' })
  @Type(() => VerifyLoadResponse)
  @IsOptional()
  @ValidateNested()
  verifyLoadResponse?: VerifyLoadResponse;

  @Expose({ name: 'debtor_system_verification' })
  @Type(() => DebtorSystemVerification)
  @IsOptional()
  @ValidateNested()
  debtorSystemVerification?: DebtorSystemVerification;
}

export class PeruseJobResult extends BaseModel<PeruseJobResult> {
  static logger = new Logger(PeruseJobResult.name);

  @Expose({ name: 'job_id' })
  @IsNotEmpty()
  jobId: string;

  @Expose({ name: 'job_type' })
  @IsNotEmpty()
  @IsEnum(PeruseJobType)
  jobType: PeruseJobType;

  @Expose({ name: 'status' })
  @IsEnum(PeruseJobStatus)
  status: PeruseJobStatus;

  @Expose({ name: 'input' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Input)
  input: Input;

  @Expose({ name: 'result' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Result)
  result: Result;

  @Expose({ name: 'message' })
  @IsOptional()
  message?: string;

  @Expose({ name: 'load_id' })
  @IsOptional()
  loadId?: string;

  @Expose({ name: 'document_ids' })
  @IsNotEmpty()
  documentIds: string[];

  validate(options?: ValidationOptions) {
    if (this.status === 'error') {
      PeruseJobResult.logger.error(`Processed document has an error status`, {
        peruseResponse: this,
      });
      throw new Error(`Could not process attachment ${this.getExternalId()}`);
    }
    if (
      options?.validateRateConfirmation &&
      !this.result.informationExtractionResult.rateConfirmation
    ) {
      PeruseJobResult.logger.error(
        `Processed document does not contain rate confirmation`,
        {
          peruseResponse: this,
        },
      );
      throw new Error('Processed document does not contain rate confirmation');
    }
  }

  getJobId() {
    return this.jobId;
  }

  getExternalId() {
    return this.input.document.externalId;
  }

  getRateConfirmationResult() {
    return this.result.informationExtractionResult.rateConfirmation;
  }

  isBillOfLading() {
    return this.getClassificationType() === PeruseDocumentClassifications.BOL;
  }

  isRateConfirmation() {
    return (
      this.getClassificationType() ===
      PeruseDocumentClassifications.RateConfirmation
    );
  }

  getVerificationProbability(): null | number {
    return (
      this.result.verifyLoadResponse?.bolVsRateConfirmationProbability || null
    );
  }

  getVerificationStatus(): null | PeruseVerificationStatus {
    if (this.jobType !== PeruseJobType.VerifyLoad) {
      return null;
    }
    const probability = this.getVerificationProbability();
    if (!probability) {
      return null;
    }
    return new Big(probability).gt(new Big(0.5))
      ? PeruseVerificationStatus.Success
      : PeruseVerificationStatus.Fail;
  }

  getClassificationType(): PeruseDocumentClassifications {
    const result = this.result.classificationResult;
    // is classification per document
    if (result.category) {
      return (result as ClassificationResultPerDocument).category;
    }
    // is classification per page
    else {
      const topClassificationsPerPage = Object.values(
        result as ClassificationResultPerPage,
      ).map((page) => {
        return page.probabilities.sort((a, b) => {
          return b.confidence - a.confidence;
        })[0];
      });

      const classificationScore: Record<string, number> = {};
      for (const result of topClassificationsPerPage) {
        if (!classificationScore[result.category]) {
          classificationScore[result.category] = 0;
        }
        classificationScore[result.category] += result.confidence;
      }
      const topClassification = Object.entries(classificationScore).sort(
        (a, b) => {
          return a[1] - b[1];
        },
      )[0];
      return topClassification[0] as PeruseDocumentClassifications;
    }
  }
}
