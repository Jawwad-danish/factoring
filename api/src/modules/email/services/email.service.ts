import { Arrays } from '@core/util';
import {
  EmailDestination,
  EmailMessage,
  S3ObjectLocator,
  S3Service,
  SESService,
} from '@module-aws';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import { EmailEntity } from '@module-persistence/entities';
import { EmailRepository } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as Handlebars from 'handlebars';
import Mail from 'nodemailer/lib/mailer';
import SESTransport from 'nodemailer/lib/ses-transport';
import { EmailConfiguration } from './email-configuration';

export interface EmailSendRequest<TMessage> {
  from?: string;
  destination: EmailDestination;
  message: TMessage;
  attachments?: Mail.Attachment[];
}

export interface EmailSendResponse {
  mailingServiceResponse: SESTransport.SentMessageInfo;
  destination: EmailDestination;
  message: EmailMessage;
}

export interface EmailTemplateMessage {
  subject: string;
  s3: {
    bucket?: string;
    key: string;
  };
  placeholders: any;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly emailRepository: EmailRepository,
    private readonly sesService: SESService,
    private readonly s3Service: S3Service,
    private readonly featureFlagResolver: FeatureFlagResolver,
    private readonly config: EmailConfiguration,
  ) {}

  async send(
    input: EmailSendRequest<EmailMessage>,
  ): Promise<null | EmailSendResponse> {
    if (!this.shouldSendEmail()) {
      return null;
    }

    return await this.doSend(input);
  }

  async sendTemplate({
    from,
    destination,
    message,
    attachments,
  }: EmailSendRequest<EmailTemplateMessage>): Promise<null | EmailSendResponse> {
    if (!this.shouldSendEmail()) {
      return null;
    }

    const locator = new S3ObjectLocator(
      message.s3.bucket ?? this.config.getTemplatesBucket(),
      message.s3.key,
    );
    const content = await this.s3Service.getObjectContent(locator);
    const compiledTemplate = Handlebars.compile(content);
    const body = compiledTemplate(message.placeholders);
    return await this.doSend({
      from,
      destination,
      attachments,
      message: {
        subject: message.subject,
        body: body,
        html: true,
      },
    });
  }

  private shouldSendEmail(): boolean {
    return this.featureFlagResolver.isEnabled(FeatureFlag.EnableEmailService);
  }

  private async doSend({
    from,
    destination,
    message,
    attachments,
  }: EmailSendRequest<EmailMessage>): Promise<EmailSendResponse> {
    const sentFrom = from || this.config.getOrigin();
    const response = await this.sesService.send(
      sentFrom,
      destination,
      message,
      attachments,
    );
    this.persistEmail({ response: response, sentFrom, destination, message });
    return {
      mailingServiceResponse: response,
      destination,
      message,
    };
  }

  private persistEmail({
    response: result,
    sentFrom,
    destination,
    message,
  }: {
    response: SESTransport.SentMessageInfo;
    sentFrom: string;
    destination: EmailDestination;
    message: EmailMessage;
  }) {
    const entity = new EmailEntity();
    entity.externalIdentifier = result.messageId;
    entity.from = sentFrom;
    entity.to = Arrays.wrap(destination.to);
    entity.cc = destination.cc ? Arrays.wrap(destination.cc) : undefined;
    entity.bcc = destination.bcc ? Arrays.wrap(destination.bcc) : undefined;
    entity.subject = message.subject;
    entity.body = message.body;
    entity.html = message.html ?? false;
    this.emailRepository.persist(entity);
  }

  async urlAsAttachment(url: string): Promise<Mail.Attachment> {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      return {
        filename: url.split('/').pop(),
        content: Buffer.from(response.data),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch attachment from ${url}`, error);
      throw error;
    }
  }
}
