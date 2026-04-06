import { getDateInBusinessTimezone } from '@core/date-time';
import { createMock } from '@golevelup/ts-jest';
import { CONFIG_SERVICE, Config, ConfigService } from '@module-config';
import { Test, TestingModule } from '@nestjs/testing';
import { TransferTimeService } from './transfer-time.service';

describe('Transfer Time service', () => {
  const configService = createMock<ConfigService>();
  let transferTimeService: TransferTimeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferTimeService,
        {
          provide: CONFIG_SERVICE,
          useValue: configService,
        },
      ],
    }).compile();

    transferTimeService = module.get(TransferTimeService);
  }, 60000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('When transfer time not defined, find by name returns null', async () => {
    configService.getValue.mockReturnValueOnce(
      new Config('', [
        {
          name: 'first_ach',
          cutoff: {
            hour: 11,
            minute: 0,
          },
          send: {
            hour: 13,
            minute: 0,
          },
        },
      ]),
    );

    const result = transferTimeService.findByName('second_ach');
    expect(result).toBeNull();
  });

  it('When transfer time is defined, find by name returns proper value', async () => {
    configService.getValue.mockReturnValueOnce(
      new Config('', [
        {
          name: 'first_ach',
          cutoff: {
            hour: 11,
            minute: 0,
          },
          send: {
            hour: 13,
            minute: 0,
          },
          next: 'second_ach',
        },
        {
          name: 'second_ach',
          cutoff: {
            hour: 17,
            minute: 0,
          },
          send: {
            hour: 19,
            minute: 0,
          },
          previous: 'first_ach',
        },
      ]),
    );

    const result = transferTimeService.findByName('first_ach');

    expect(result).toBeDefined();
    expect(result?.cutoff.hour).toBe(11);
    expect(result?.next?.name).toBe('second_ach');
  });

  it('Get next transfer time works properly', async () => {
    configService.getValue.mockReturnValueOnce(
      new Config('', [
        {
          name: 'first_ach',
          cutoff: {
            hour: 11,
            minute: 0,
          },
          send: {
            hour: 13,
            minute: 0,
          },
          next: 'second_ach',
        },
        {
          name: 'second_ach',
          cutoff: {
            hour: 17,
            minute: 0,
          },
          send: {
            hour: 19,
            minute: 0,
          },
          previous: 'first_ach',
        },
      ]),
    );
    const fromDate = getDateInBusinessTimezone().set('hour', 22).toDate();
    const result = transferTimeService.getNextTransferTime(fromDate);

    const resultInBusinessTz = getDateInBusinessTimezone(result);
    const fromDateInBusinessTz = getDateInBusinessTimezone(fromDate);

    expect(fromDateInBusinessTz.isBefore(resultInBusinessTz)).toBeTruthy();
  });

  it('Get last transfer time of the day works properly', async () => {
    configService.getValue.mockReturnValue(
      new Config('', [
        {
          name: 'first_ach',
          cutoff: {
            hour: 11,
            minute: 0,
          },
          send: {
            hour: 13,
            minute: 0,
          },
          next: 'second_ach',
        },
        {
          name: 'second_ach',
          cutoff: {
            hour: 17,
            minute: 0,
          },
          send: {
            hour: 19,
            minute: 0,
          },
          previous: 'first_ach',
        },
      ]),
    );
    const result = transferTimeService.getLastTransferTimeOfTheDay();
    expect(result.name).toBe('second_ach');
  });

  it('Should schedule next transfer on Monday when called on Friday after 10 PM', async () => {
    configService.getValue.mockReturnValue(
      new Config('', [
        {
          name: 'first_ach',
          cutoff: {
            hour: 11,
            minute: 0,
          },
          send: {
            hour: 13,
            minute: 0,
          },
          next: 'second_ach',
        },
        {
          name: 'second_ach',
          cutoff: {
            hour: 17,
            minute: 0,
          },
          send: {
            hour: 19,
            minute: 0,
          },
          previous: 'first_ach',
        },
      ]),
    );

    // 25 july is a friday
    const fridayAfter10PM = getDateInBusinessTimezone(
      '2025-07-25T22:00:00',
    ).toDate();

    const result = transferTimeService.getNextTransferTime(fridayAfter10PM);
    const resultAsUTC = new Date(result.getTime());
    expect(resultAsUTC.getUTCDay()).toBe(1);
    expect(resultAsUTC.getUTCHours()).toBe(17);
    expect(resultAsUTC.getUTCMinutes()).toBe(0);
    expect(resultAsUTC.getUTCDate()).toBe(28);
    expect(resultAsUTC.getUTCMonth()).toBe(6);
    expect(resultAsUTC.getUTCFullYear()).toBe(2025);
  });

  it('Get wire override window', async () => {
    configService.getValue.mockReturnValueOnce(
      new Config('', {
        start: {
          hour: 0,
          minute: 0,
        },
        end: {
          hour: 23,
          minute: 59,
        },
      }),
    );
    const result = transferTimeService.getWireOverrideWindow();

    expect(result.start.hour).toBe(0);
    expect(result.end.hour).toBe(23);
  });

  describe('getCurrentTransferWindow', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return the correct transfer time within the margin', () => {
      configService.getValue.mockReturnValueOnce(
        new Config('', [
          {
            name: 'first_ach',
            cutoff: {
              hour: 11,
              minute: 0,
            },
            send: {
              hour: 13,
              minute: 0,
            },
            next: 'second_ach',
          },
          {
            name: 'second_ach',
            cutoff: {
              hour: 17,
              minute: 0,
            },
            send: {
              hour: 19,
              minute: 0,
            },
            previous: 'first_ach',
          },
        ]),
      );

      const margin = 10;
      const currentDate = getDateInBusinessTimezone()
        .set('hour', 13)
        .set('minute', 3)
        .toDate();
      const result = transferTimeService.getCurrentTransferWindow(
        currentDate,
        margin,
      );

      expect(result).not.toBeNull();
      expect(result?.name).toBe('first_ach');
    });

    it('should return null if no transfer time found within the margin', () => {
      configService.getValue.mockReturnValueOnce(
        new Config('', [
          {
            name: 'first_ach',
            cutoff: {
              hour: 11,
              minute: 0,
            },
            send: {
              hour: 13,
              minute: 0,
            },
            next: 'second_ach',
          },
          {
            name: 'second_ach',
            cutoff: {
              hour: 17,
              minute: 0,
            },
            send: {
              hour: 19,
              minute: 0,
            },
            previous: 'first_ach',
          },
        ]),
      );

      const margin = 10;
      const currentDate = getDateInBusinessTimezone()
        .set('hour', 13)
        .set('minute', 25)
        .toDate();
      const result = transferTimeService.getCurrentTransferWindow(
        currentDate,
        margin,
      );

      expect(result).toBeNull();
    });

    it('should handle multiple transfer times correctly', () => {
      configService.getValue.mockReturnValueOnce(
        new Config('', [
          {
            name: 'first_ach',
            cutoff: {
              hour: 11,
              minute: 0,
            },
            send: {
              hour: 13,
              minute: 0,
            },
            next: 'second_ach',
          },
          {
            name: 'second_ach',
            cutoff: {
              hour: 17,
              minute: 0,
            },
            send: {
              hour: 19,
              minute: 0,
            },
            previous: 'first_ach',
          },
        ]),
      );

      const margin = 10;
      const currentDate = getDateInBusinessTimezone()
        .set('hour', 13)
        .set('minute', 3)
        .toDate();
      const currentDate2 = getDateInBusinessTimezone()
        .set('hour', 19)
        .set('minute', 9)
        .toDate();
      const result1 = transferTimeService.getCurrentTransferWindow(
        currentDate,
        margin,
      );
      expect(result1).not.toBeNull();
      expect(result1?.name).toBe('first_ach');
      const result2 = transferTimeService.getCurrentTransferWindow(
        currentDate2,
        margin,
      );
      expect(result2).not.toBeNull();
      expect(result2?.name).toBe('second_ach');
    });
  });

  it('should correctly convert TransferTime to business timezone dayjs objects', () => {
    const transferTime = {
      name: 'second_ach',
      cutoff: {
        hour: 17,
        minute: 0,
      },
      send: {
        hour: 19,
        minute: 0,
      },
    };

    const result =
      transferTimeService.getTransferTimeInBusinessTimezone(transferTime);

    expect(result.cutoff.hour()).toBe(17);
    expect(result.cutoff.minute()).toBe(0);
    expect(result.send.hour()).toBe(19);
    expect(result.send.minute()).toBe(0);
  });
});
