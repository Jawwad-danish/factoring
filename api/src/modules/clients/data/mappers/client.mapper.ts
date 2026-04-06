import { DataMapper } from '@core/mapping';
import {
  ClientFactoringConfigsEntity,
  ClientFactoringConfigsRepository,
  UserEntity,
} from '@module-persistence';
import { Injectable } from '@nestjs/common';
import Big from 'big.js';
import { v4 as uuidv4 } from 'uuid';
import {
  ApiClientContactType,
  ApiContactAddress,
  ApiContactPhone,
  ApiCreateClientContact,
  ApiCreateClientRequest,
  ApiPhoneType,
  ApiUpdateClientRequest,
} from '../../api/data';
import { ClientConfigUser } from '../create-client-factoring-config-and-user.model';
import {
  CreateClientRequest,
  UpdateClientFactoringConfigRequest,
  UpdateClientRequest,
} from '../web';

@Injectable()
export class ClientMapper implements DataMapper<void, void> {
  constructor(
    private readonly clientFactoringConfigsRepository: ClientFactoringConfigsRepository,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  entityToModel(_entity: void): Promise<void> {
    throw new Error('Method not implemented.');
  }

  buildApiCreateClientRequest(
    request: CreateClientRequest,
    data: {
      clientId: string;
    },
  ): ApiCreateClientRequest {
    return new ApiCreateClientRequest({
      id: data.clientId,
      mc: request.mc,
      dot: request.dot,
      name: request.businessName,
      shortName: request.shortName,
      ein: request.ein,
      doingBusinessAs: request.doingBusinessAs,
      corporationType: request.corporationType,
      languages: request.languages,
      authorityDate: request.authorityDate,
      clientContacts: [
        new ApiCreateClientContact({
          primary: true,
          email: request.email,
          name: request.businessName,
          type: ApiClientContactType.BUSINESS,
          notifications: true,
          address: new ApiContactAddress({
            country: request.country,
            state: request.state,
            city: request.city,
            zip: request.zip,
            address: `${request.address} ${request.address2}`,
          }),
          contactPhones: [
            new ApiContactPhone({
              phone: request.phoneNumber,
              phoneType: ApiPhoneType.Mobile,
            }),
          ],
        }),
      ],
    });
  }

  async buildConfigFromRequest(
    request: CreateClientRequest,
  ): Promise<ClientConfigUser> {
    const user = new UserEntity();
    user.id = uuidv4();
    user.email = request.email;
    user.firstName = null;
    user.lastName = null;
    user.externalId = null;

    const config = new ClientFactoringConfigsEntity();
    config.id = uuidv4();
    config.clientId = uuidv4();
    config.factoringRatePercentage = request.factoringRate;
    config.reserveRatePercentage = new Big(0);
    config.verificationPercentage = new Big(0);
    config.vip = false;
    config.requiresVerification = true;
    config.clientLimitAmount = null;
    config.paymentPlan = null;
    config.expediteTransferOnly = false;
    config.doneSubmittingInvoices = false;
    config.insuranceRenewalDate = request.insuranceRenewalDate ?? null;
    config.acceptedFeeIncrease = true;
    config.ccInEmails = true;
    this.clientFactoringConfigsRepository.assign(config, {
      salesRep: request.salesRepId,
    });
    this.clientFactoringConfigsRepository.assign(config, {
      clientSuccessTeam: request.clientSuccessTeamId,
    });
    config.user = user;
    return { user, clientConfig: config };
  }

  buildApiUpdateClientRequest(
    request: UpdateClientRequest,
  ): ApiUpdateClientRequest {
    return new ApiUpdateClientRequest({
      mc: request.mc,
      dot: request.dot,
      authorityDate: request.authorityDate,
      name: request.businessName,
      shortName: request.shortName,
      doingBusinessAs: request.doingBusinessAs,
      ein: request.ein,
      corporationType: request.corporationType,
      languages: request.languages,
    });
  }

  buildUpdateClientFactoringConfigRequest(
    request: UpdateClientRequest,
  ): UpdateClientFactoringConfigRequest {
    request.ingestThrough = false;
    request.v1Payload = undefined;
    return request;
  }
}
