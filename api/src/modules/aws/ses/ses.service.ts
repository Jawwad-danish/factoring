import * as aws from '@aws-sdk/client-ses';
import { environment } from '@core/environment';
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import SESTransport from 'nodemailer/lib/ses-transport';

export interface EmailDestination {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
}
export interface EmailMessage {
  subject: string;
  body: string;
  html?: boolean;
}
@Injectable()
export class SESService {
  private client: nodemailer.Transporter<SESTransport.SentMessageInfo>;

  constructor() {
    const ses = new aws.SES({
      region: environment.aws.defaultRegion(),
    });
    this.client = nodemailer.createTransport({
      SES: {
        ses,
        aws,
      },
    });
  }

  send(
    from: string,
    destination: EmailDestination,
    message: EmailMessage,
    attachments?: Mail.Attachment[],
  ): Promise<SESTransport.SentMessageInfo> {
    const mailOptions: Mail.Options = {
      from: from,
      to: destination.to,
      cc: destination.cc,
      bcc: destination.bcc,
    };
    if (message.subject) {
      mailOptions.subject = message.subject;
    }
    if (message.html) {
      mailOptions.html = message.body;
    } else {
      mailOptions.text = message.body;
    }
    if (attachments) {
      mailOptions.attachments = attachments;
    }
    return this.client.sendMail(mailOptions);
  }
}
