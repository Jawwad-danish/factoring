import { RequestBuilderMixin } from '@core/test';
import { CreateClientFactoringConfigRequest } from '../data';
import { UUID } from '@core/uuid';
import { LeadAttributionType } from '@module-persistence';

export class CreateClientFactoringConfigRequestBuilder extends RequestBuilderMixin<CreateClientFactoringConfigRequest>(
  () => {
    return new CreateClientFactoringConfigRequest();
  },
) {
  static createClientFactoringConfigAndUser(
    userId: string,
    successTeamId: string,
    salesRepId: string,
  ) {
    return CreateClientFactoringConfigRequestBuilder.from({
      client: {
        clientId: UUID.get(),
        factoringRatePercentage: '3.0000',
        status: 'pending',
        vip: false,
        requiresVerification: false,
        acceptedFeeIncrease: false,
        successTeamId,
        reserveRatePercentage: '0.0000',
        expediteTransferOnly: false,
        doneSubmittingInvoices: false,
        leadAttribution: LeadAttributionType.Web,
        ccInEmails: false,
        createdAt: new Date('2024-09-10T12:59:55.428Z'),
        updatedAt: new Date('2024-09-10T12:59:55.428Z'),
        userId,
        salesRepId,
        insuranceAgency: 'Test Agency',
        insuranceCompany: 'Test Insurance Co',
        insuranceMonthlyPaymentPerTruck: '100.00',
        insuranceRenewalDate: new Date('2025-09-10T12:59:55.428Z'),
        ofacVerified: false,
        carrier411Alerts: false,
        taxGuardAlerts: false,
        dryvanTrucksAmount: 0,
        refrigeratedTrucksAmount: 0,
        flatbedTrucksAmount: 0,
        stepdeckTrucksAmount: 0,
        otherTrucksAmount: 0,
        leasedTrucksAmount: 0,
      },
      user: {
        email: `testbobtail+${Date.now()}@gmail.com`,
        id: UUID.get(),
        employee: {
          firstName: null,
          lastName: null,
        },
        client: {
          shortenedName: 'incubate applications',
        },
        createdAt: new Date('2024-09-10T12:59:55.428Z'),
        updatedAt: new Date('2024-09-10T12:59:55.428Z'),
      },
    });
  }
}
