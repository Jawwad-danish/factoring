import { RequestBuilderMixin } from '@core/test';
import { CreateReserveFromReferralRockRequest } from '../data';
export class CreateRewardReserveRequestBuilder extends RequestBuilderMixin<CreateReserveFromReferralRockRequest>(
  () => {
    return new CreateReserveFromReferralRockRequest();
  },
) {
  static rewardReserveRequest() {
    return CreateRewardReserveRequestBuilder.from({
      Id: 'e0996db3-15c8-468d-8cd2-c1c797aff1cc',
      ClientId: '00000000-0000-0000-0000-000000000000',
      PayoutId: 'cffcbfcb-3288-4ca2-938a-570879a523e2',
      PayoutDescription: 'Credit added to your Bobtail account',
      CurrencyCode: 'Custom',
      ProgramId: '4e36f3a0-5962-40a3-921f-4d42e5f3a199',
      ProgramName: 'Non-Production Referral Program',
      MemberId: '64681166-589c-4b56-9958-313f094e96e9',
      ReferralId: null,
      Type: 'Member',
      RecipientId: '64681166-589c-4b56-9958-313f094e96e9',
      RecipientName: 'Big Red local',
      RecipientEmailAddress: 'testbobtail+djredclassic@gmail.com',
      RecipientExternalIdentifier:
        'clientId:83fc9025-e2a6-45f6-90a8-03fa07013686',
      Status: 'Issued',
      Source: 2,
      Amount: 500,
      CreateDate: new Date('2024-09-17T15:55:56.193Z'),
      IssueDate: new Date('2024-09-17T15:56:00.973Z'),
      EligibilityDate: new Date('2024-09-17T00:00:00Z'),
      Description: 'test r7',
      TransactionID: '4281506a-517f-453a-bfa9-1cc5d1ac40be',
      UpdateDate: new Date('2024-09-17T15:55:56.193Z'),
      ReferralDisplayName: null,
      ReferralEmail: null,
      ProgramRewardRuleDisplayName: null,
      ProgramRewardRuleId: null,
      RecurringRewardEnrollmentId: null,
      ExternalIdentifier: null,
      PaymentType: 'Email',
      PaymentStatus: 'Complete',
      PaymentCode: '',
      CompleteNote: 'Reward Issued',
      Timestamp: 1726588561,
      PayoutType: '1',
      PayoutMetadata:
        '{"IncludeDecimal":false,"CustomSuffix":"Credit added to your Bobtail account","UnitType":"Custom","EnableEmail":false}',
      ReferralFullName: null,
    });
  }
}
