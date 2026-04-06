import { Criteria, QueryCriteria } from '@core/data';
import {
  ApprovedAgingReportCreateRequest,
  BatchReportRequest,
  BrokerAgingReportCreateRequest,
  BrokerPaymentReportRequest,
  ClientAccountSummaryReportRequest,
  ClientAnnualReportRequest,
  ClientListReportRequest,
  ClientSummaryRequest,
  ClientTotalReserveReportCreateRequest,
  ClientTrendsReportCreateRequest,
  DetailedAgingReportCreateRequest,
  LoanTapeReportRequest,
  NetFundsEmployedReportRequest,
  PortfolioReportRequest,
  ReconciliationReportRequest,
  PortoflioReserveReportRequest,
  RollForwardRequest,
  SalesforceReconciliationReportRequest,
  ClientAgingReportRequest,
  BrokerRatingReportRequest,
  VolumeReportRequest,
} from '@fs-bobtail/factoring/data';
import { S3ObjectLocator, S3Service } from '@module-aws';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { ReportName } from '@module-persistence/entities';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReportsService } from '../services';
import { XlsxFileValidator } from './xlsx-file.validator';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly s3Service: S3Service,
    @Inject(CONFIG_SERVICE) private readonly configService: ConfigService,
  ) {}

  @Post('client-total-reserve')
  @HttpCode(202)
  async createClientTotalReserveReport(
    @Body() parameters: ClientTotalReserveReportCreateRequest,
  ) {
    await this.reportsService.createReport({
      ...parameters,
      name: ReportName.ClientTotalReserve,
    });
  }

  @Post('approved-aging')
  @HttpCode(202)
  async createApprovedAgingReport(
    @Criteria() criteria: QueryCriteria,
    @Body() parameters: ApprovedAgingReportCreateRequest,
  ) {
    await this.reportsService.createReport({
      ...parameters,
      criteria,
      name: ReportName.ApprovedAging,
    });
  }

  @Post('portoflio-reserve')
  @HttpCode(202)
  async createPortoflioReserveReport(
    @Body() request: PortoflioReserveReportRequest,
  ) {
    await this.reportsService.createReport({
      ...request,
      name: ReportName.PortfolioReserve,
    });
  }

  @Post('client-list')
  @HttpCode(202)
  async createClientListReport(@Body() request: ClientListReportRequest) {
    await this.reportsService.createReport({
      ...request,
      name: ReportName.ClientList,
    });
  }

  @Post('client-annual')
  @HttpCode(202)
  async createClientAnualReport(@Body() request: ClientAnnualReportRequest) {
    await this.reportsService.createReport({
      ...request,
      name: ReportName.ClientAnnual,
    });
  }

  @Post('salesforce-reconciliation')
  @HttpCode(202)
  @UseInterceptors(FileInterceptor('file'))
  async createSalesforceReconciliationReport(
    @Body() request: SalesforceReconciliationReportRequest,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new XlsxFileValidator()],
      }),
    )
    file: Express.Multer.File,
  ) {
    const bucketName = this.configService
      .getValue('SALESFORCE_REPORTS_BUCKET')
      .asString();
    if (!bucketName) {
      throw new Error(
        'Could not obtain SALESFORCE_REPORTS_BUCKET config value',
      );
    }

    const destination = new S3ObjectLocator(bucketName, file.originalname);

    await this.s3Service.putObject(
      {
        data: file.buffer,
        length: file.size,
        type: file.mimetype,
      },
      destination,
    );
    request.s3Key = destination.getKey();
    request.s3Bucket = destination.getBucket();
    await this.reportsService.createReport({
      ...request,
      name: ReportName.SalesforceReconciliation,
    });
  }

  @Post('batch')
  @HttpCode(202)
  async createBatchReport(@Body() request: BatchReportRequest) {
    await this.reportsService.createReport({
      ...request,
      name: ReportName.Batch,
    });
  }

  @Post('client-account-summary')
  @HttpCode(202)
  async createClientAccountSummaryReport(
    @Body() request: ClientAccountSummaryReportRequest,
  ) {
    await this.reportsService.createReport({
      ...request,
      name: ReportName.ClientAccountSummary,
    });
  }

  @Post('broker-aging')
  @HttpCode(202)
  async createBrokerAgingReport(
    @Body() request: BrokerAgingReportCreateRequest,
  ) {
    await this.reportsService.createReport({
      ...request,
      name: ReportName.BrokerAging,
    });
  }

  @Post('loan-tape')
  @HttpCode(202)
  async createLoanTapeReport(@Body() request: LoanTapeReportRequest) {
    await this.reportsService.createReport({
      ...request,
      name: ReportName.LoanTape,
    });
  }

  @Post('detailed-aging')
  @HttpCode(202)
  async createDetailedAgingReport(
    @Body() request: DetailedAgingReportCreateRequest,
  ) {
    await this.reportsService.createReport(request);
  }

  @Post('client-trends')
  @HttpCode(202)
  async createClientTrendsReport(
    @Body() request: ClientTrendsReportCreateRequest,
  ) {
    await this.reportsService.createReport({
      ...request,
      name: ReportName.ClientTrends,
    });
  }

  @Post('broker-payment')
  @HttpCode(202)
  async createBrokerPaymentReport(@Body() request: BrokerPaymentReportRequest) {
    await this.reportsService.createReport({
      ...request,
      name: ReportName.BrokerPayment,
    });
  }

  @Post('client-summary')
  @HttpCode(202)
  async createClientSummaryReport(@Body() request: ClientSummaryRequest) {
    await this.reportsService.createReport(request);
  }

  @Post('portfolio')
  @HttpCode(202)
  async createPortfolioReport(@Body() request: PortfolioReportRequest) {
    await this.reportsService.createReport({
      ...request,
      name: ReportName.Portfolio,
    });
  }

  @Post('roll-forward')
  @HttpCode(202)
  async createRollForwardReport(@Body() request: RollForwardRequest) {
    await this.reportsService.createReport(request);
  }

  @Post('reconciliation')
  @HttpCode(202)
  async createReconciliationReport(
    @Body() request: ReconciliationReportRequest,
  ) {
    await this.reportsService.createReport({
      ...request,
      name: ReportName.Reconciliation,
    });
  }

  @Post('net-funds-employed')
  @HttpCode(202)
  async createNetFundsEmployedReport(
    @Body() request: NetFundsEmployedReportRequest,
  ) {
    await this.reportsService.createReport(request);
  }

  @Post('client-aging')
  @HttpCode(202)
  async createClientAgingReport(@Body() request: ClientAgingReportRequest) {
    await this.reportsService.createReport({
      ...request,
      name: ReportName.ClientAging,
    });
  }

  @Post('broker-rating')
  @HttpCode(202)
  async createBrokerRatingReport(@Body() request: BrokerRatingReportRequest) {
    await this.reportsService.createReport({
      ...request,
      name: ReportName.BrokerRating,
    });
  }

  @Post('volume')
  @HttpCode(202)
  async createVolumeReport(@Body() request: VolumeReportRequest) {
    await this.reportsService.createReport({
      ...request,
      name: ReportName.Volume,
    });
  }

  @Get()
  async getReports() {
    return this.reportsService.getReports();
  }
}
