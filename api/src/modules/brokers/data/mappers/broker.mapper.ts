import { DataMapper } from '@core/mapping';
import { BrokerFactoringConfigEntity } from '@module-persistence';
import { Injectable } from '@nestjs/common';
import {
  AddressType,
  BrokerCreateApiRequest,
  BrokerEmailCreate,
  EmailType,
  BrokerAddressCreate,
  BrokerUpdateApiRequest,
  BrokerEmailUpdate,
} from '../../api/data';
import { CreateBrokerRequest, UpdateBrokerRequest } from '../web';
import { v4 as uuidv4 } from 'uuid';
import { AppContextHolder } from '@core/app-context';

@Injectable()
export class BrokerMapper implements DataMapper<void, void> {
  constructor() {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  entityToModel(_entity: void): Promise<void> {
    throw new Error('Method not implemented.');
  }

  buildApiCreateBrokerRequest(
    request: CreateBrokerRequest,
    data: { brokerId: string },
  ): BrokerCreateApiRequest {
    const createdBy = AppContextHolder.get().getAuthentication().principal.id;

    const emails: BrokerEmailCreate[] = [
      ...(request.noaEmails ?? []).map(
        (email) =>
          new BrokerEmailCreate({
            email: email,
            type: EmailType.NOA,
            createdBy,
          }),
      ),
      ...(request.invoiceDeliveryEmails ?? []).map(
        (email) =>
          new BrokerEmailCreate({
            email: email,
            type: EmailType.INVOICE_DELIVERY,
            createdBy,
          }),
      ),
      ...(request.payStatusEmails ?? []).map(
        (email) =>
          new BrokerEmailCreate({
            email: email,
            type: EmailType.PAYMENT_STATUS,
            createdBy,
          }),
      ),
    ].filter((e) => !!e.email);

    const addresses: BrokerAddressCreate[] = [
      new BrokerAddressCreate({
        address: request.address,
        city: request.city,
        state: request.state,
        country: request.country,
        type: AddressType.Office,
        zip: request.zip,
        streetAddress: request.address2 ?? null,
        createdBy,
      }),
    ];

    if (request.mailingAddress) {
      addresses.push(
        new BrokerAddressCreate({
          address: request.mailingAddress,
          city: request.mailingCity,
          state: request.mailingState,
          country: request.mailingCountry,
          type: AddressType.Mailing,
          zip: request.mailingZip,
          streetAddress: request.mailingAddress2 ?? null,
          createdBy,
        }),
      );
    }

    return new BrokerCreateApiRequest({
      id: data.brokerId,
      mc: request.mc,
      dot: request.dot,
      legalName: request.businessName,
      doingBusinessAs: request.doingBusinessAs,
      phone: request.phoneNumber,
      authorityDate: request.authorityDate,
      authorityStatus: request.authorityStatus,
      status: request.bobtailStatus,
      rating: request.rating,
      externalRating: request.externalRating,
      ratingReason: request.ratingReason,
      portalUrl: request.portalUrl,
      createdBy,
      addresses,
      emails: emails,
      requireOriginals: request.requireOriginals,
      requireCopies: request.requireCopies,
      requireOnlineSubmit: request.requireOnlineSubmit,
      requireFax: request.requireFax,
      requireEmail: request.requireEmail,
    });
  }

  buildApiUpdateBrokerRequest(
    request: UpdateBrokerRequest,
  ): Partial<BrokerUpdateApiRequest> {
    const updatedBy = AppContextHolder.get().getAuthentication().principal.id;
    let emails: BrokerEmailUpdate[] | undefined;
    let addresses: BrokerAddressCreate[] | undefined;

    if (
      request.noaEmails ||
      request.invoiceDeliveryEmails ||
      request.payStatusEmails
    ) {
      emails = [
        ...(request.noaEmails ?? []).map(
          (email) =>
            new BrokerEmailUpdate({
              email: email,
              type: EmailType.NOA,
            }),
        ),
        ...(request.invoiceDeliveryEmails ?? []).map(
          (email) =>
            new BrokerEmailUpdate({
              email: email,
              type: EmailType.INVOICE_DELIVERY,
            }),
        ),
        ...(request.payStatusEmails ?? []).map(
          (email) =>
            new BrokerEmailUpdate({
              email: email,
              type: EmailType.PAYMENT_STATUS,
            }),
        ),
      ].filter((e) => !!e.email);
    }

    if (request.address) {
      addresses = [
        new BrokerAddressCreate({
          address: request.address,
          city: request.city,
          state: request.state,
          country: request.country,
          type: AddressType.Office,
          zip: request.zip,
          streetAddress: request.address2 ?? null,
        }),
      ];
    }

    if (request.mailingAddress) {
      if (addresses === undefined) {
        addresses = [];
      }
      addresses.push(
        new BrokerAddressCreate({
          address: request.mailingAddress,
          city: request.mailingCity,
          state: request.mailingState,
          country: request.mailingCountry,
          type: AddressType.Mailing,
          zip: request.mailingZip,
          streetAddress: request.mailingAddress2 ?? null,
        }),
      );
    }

    return new BrokerUpdateApiRequest({
      mc: request?.mc,
      dot: request?.dot,
      legalName: request?.legalName,
      doingBusinessAs: request?.doingBusinessAs,
      phone: request?.phone,
      authorityDate: request?.authorityDate,
      status: request?.bobtailStatus,
      rating: request?.rating,
      externalRating: request?.externalRating,
      ratingReason: request?.ratingReason,
      portalUrl: request?.portalUrl,
      addresses,
      emails: emails,
      updatedBy,
    });
  }

  async buildConfig(): Promise<BrokerFactoringConfigEntity> {
    const brokerConfig = new BrokerFactoringConfigEntity();
    brokerConfig.id = uuidv4();
    brokerConfig.brokerId = uuidv4();

    return brokerConfig;
  }
}
