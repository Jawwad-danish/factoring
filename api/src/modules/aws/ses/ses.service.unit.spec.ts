import { Test, TestingModule } from '@nestjs/testing';

import { mockToken } from '@core/test';
import 'aws-sdk-client-mock-jest';
import { SESService } from './ses.service';

const sendMailMock = jest.fn();
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockImplementation(() => ({
    sendMail: sendMailMock,
  })),
}));

describe('SESService', () => {
  let sesService: SESService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SESService],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    sesService = module.get(SESService);
  });

  it('Should be defined', () => {
    expect(sesService).toBeDefined();
  });

  it('Should call nodemailer to send the email', async () => {
    await sesService.send(
      '',
      {
        to: '',
        cc: '',
        bcc: '',
      },
      {
        subject: '',
        body: '',
      },
    );
    expect(sendMailMock).toBeCalledTimes(1);
  });
});
