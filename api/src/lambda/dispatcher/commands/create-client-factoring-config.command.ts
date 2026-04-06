import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { S3EventRecord } from 'aws-lambda';
import axios, { AxiosResponse } from 'axios';
import { AxiosCommand } from '../axios-command';
import { readS3File } from './util';

export class CreateClientfactoringConfigCommand implements AxiosCommand {
  private readonly url: string;
  private readonly s3Event: S3EventRecord;
  private readonly s3Client: S3Client;

  constructor(record: S3EventRecord) {
    this.url = `${process.env.API_URL}/clients`;
    this.s3Event = record;
    this.s3Client = new S3Client({ region: record.awsRegion });
  }

  async run(): Promise<AxiosResponse<any, any> | null> {
    const { authorizationToken, payload } = await readS3File<any>(
      this.s3Client,
      this.s3Event,
    );

    const client: Record<string, any> = {
      clientId: payload.client.id,
      factoringRatePercentage: payload.client.factor_rate_percentage,
      status: payload.client.status,
      vip: payload.client.vip_status,
      requiresVerification: payload.client.requires_verification,
      acceptedFeeIncrease:
        payload.client.metadata?.factoringRateIncrease?.accepted || false,
      successTeamId: payload.client.account_manager_id,
      reserveRatePercentage: payload.client.reserve_rate_percentage,
      expediteTransferOnly: payload.client.expedite_flag,
      doneSubmittingInvoices: payload.client.done_submitting_invoices_flag,
      ccInEmails: payload.client.cc_in_emails,
      createdAt: payload.client.created_at,
      updatedAt: payload.client.updated_at,
      userId: payload.client.updated_by,
      insuranceAgency: payload.client.insurance_agency,
      insuranceCompany: payload.client.insurance_company,
      insuranceMonthlyPaymentPerTruck:
        payload.client.insurance_monthly_payment_per_truck,
      insuranceRenewalDate: payload.client.insurance_renewal_date,
      ofacVerified: payload.client.ofac_verified,
      carrier411Alerts: payload.client.carrier_411_alerts,
      taxGuardAlerts: payload.client.tax_guard_alerts,
      dryvanTrucksAmount: payload.client.dryvan_trucks_amount,
      refrigeratedTrucksAmount: payload.client.refrigerated_trucks_amount,
      flatbedTrucksAmount: payload.client.flatbed_trucks_amount,
      stepdeckTrucksAmount: payload.client.stepdeck_trucks_amount,
      leasedTrucksAmount: payload.client.leased_trucks_amount,
      otherTrucksAmount: payload.client.other_trucks_amount,
    };

    if (payload.client.sales_rep?.user_id) {
      client.salesRepId = payload.client.sales_rep.user_id;
    }

    const user = {
      email: payload.user.email,
      id: payload.user.id,
      employee: {
        firstName: payload.user.employee?.first_name || null,
        lastName: payload.user.employee?.last_name || null,
      },
      client: {
        shortenedName: payload.user.client?.shortened_name || null,
      },
      createdAt: payload.user.created_at,
      updatedAt: payload.user.updated_at,
    };

    const requestBody = {
      client,
      user,
    };

    try {
      console.log(
        `Sending to ${this.url} POST request with request body`,
        requestBody,
      );
      const result = await axios.post(this.url, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          authorization: !authorizationToken.startsWith('Bearer ')
            ? `Bearer ${authorizationToken}`
            : authorizationToken,
        },
      });
      return result;
    } catch (error) {
      console.error(`Error sending request to ${this.url}`, requestBody, error);
      throw new Error(`Error sending request to ${this.url}`);
    } finally {
      const key = this.s3Event.s3.object.key;
      const bucket = this.s3Event.s3.bucket.name;
      const deleteResult = await this.s3Client.send(
        new DeleteObjectCommand({
          Key: key,
          Bucket: bucket,
        }),
      );
      console.debug(
        `Delete s3 object ${key} from bucket ${bucket}`,
        deleteResult.$metadata,
      );
    }
  }
}
