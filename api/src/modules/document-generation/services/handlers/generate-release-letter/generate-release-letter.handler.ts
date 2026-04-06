import { BobtailData } from '@common';
import { ValidationError } from '@core/validation';
import { S3ObjectLocator, S3Service } from '@module-aws';
import { Client } from '@module-clients';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as Handlebars from 'handlebars';
import { GenerateReleaseLetterResult } from '../../../data';
import { GenerateReleaseLetterCommand } from '../../commands';
import { ConvertService } from '../../convert.service';

@CommandHandler(GenerateReleaseLetterCommand)
export class GenerateReleaseLetterHandler
  implements
    ICommandHandler<GenerateReleaseLetterCommand, GenerateReleaseLetterResult>
{
  private logger = new Logger(GenerateReleaseLetterHandler.name);
  private readonly emailTemplatesBucket: string;
  private readonly publicResourcesBucket: string;
  private readonly releaseLettersBucket: string;

  constructor(
    @Inject(CONFIG_SERVICE) readonly configService: ConfigService,
    private readonly s3Service: S3Service,
    private readonly convertService: ConvertService,
  ) {
    this.emailTemplatesBucket = configService
      .getValue('EMAIL_TEMPLATES_BUCKET')
      .asString();
    this.publicResourcesBucket = configService
      .getValue('PUBLIC_RESOURCES_BUCKET')
      .asString();
    this.releaseLettersBucket = configService
      .getValue('RELEASE_LETTERS_BUCKET')
      .asString();
  }

  async execute(
    command: GenerateReleaseLetterCommand,
  ): Promise<GenerateReleaseLetterResult> {
    const { client } = command;
    const key = `release-letter-client-${client.id}`;
    this.logger.debug('Generating release letter', {
      clientId: client.id,
      file: key,
    });
    const htmlUrl = await this.generateHtml(client, `${key}.html`);
    const pdfUrl = await this.generatePDF(htmlUrl, `${key}.pdf`);
    return new GenerateReleaseLetterResult(pdfUrl, key);
  }

  private async generateHtml(client: Client, key: string): Promise<string> {
    const locator = new S3ObjectLocator(
      this.emailTemplatesBucket,
      'client-release-letter.hbs',
    );
    const content = await this.s3Service.getObjectContent(locator);
    const compiledTemplate = Handlebars.compile(content);
    const body = compiledTemplate({
      client: client,
      bobtailData: BobtailData,
      publicResourcesBucket: `https://${this.publicResourcesBucket}.s3.us-east-1.amazonaws.com`,
    });
    const s3Result = await this.s3Service.putObject(
      {
        data: body,
        type: 'text/html',
      },
      new S3ObjectLocator(this.releaseLettersBucket, key),
    );
    if (s3Result.$metadata.httpStatusCode !== 200) {
      throw new ValidationError(
        'generate-release-letter-upload',
        `Could not generate release letter. The document was not uploaded in it's html form`,
      );
    }
    const url = `https://${this.releaseLettersBucket}.s3.us-east-1.amazonaws.com/${key}`;
    this.logger.debug('Finished generating release letter HTML', {
      clientId: client.id,
      htmlUrl: url,
    });
    return url;
  }

  private async generatePDF(htmlUrl: string, key: string) {
    const pdfUrl = await this.convertService.urlToPDF(htmlUrl);
    const s3Result = await this.s3Service.putObjectFromURL(
      pdfUrl,
      new S3ObjectLocator(this.releaseLettersBucket, key),
    );
    if (s3Result.$metadata.httpStatusCode !== 200) {
      throw new ValidationError(
        'generate-release-letter-upload',
        `Could not generate release letter. The document was not uploaded in it's pdf form`,
      );
    }
    return `https://${this.releaseLettersBucket}.s3.us-east-1.amazonaws.com/${key}`;
  }
}
