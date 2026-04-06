import { getDateInBusinessTimezone, getNextBusinessDay } from '@core/date-time';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { Inject, Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { ArrivalTime, TransferTime, WireOverrideWindow } from './types';

@Injectable()
export class TransferTimeService {
  constructor(
    @Inject(CONFIG_SERVICE) private readonly configService: ConfigService,
  ) {}

  findByName(name: string): null | TransferTime {
    return (
      this.findAllTransferTimes().find(
        (transferTime) => transferTime.name === name,
      ) || null
    );
  }

  /**
   * Retrieves the next available date to send a transfer, based on the provided date and predefined transfer times.
   * If the input date does not meet the cutoff for any transfer time, it will return the first transfer time from the next day.
   * @param {Date} from The initial date from which the calculation starts.
   * @returns {Date} The next available transfer send date.
   *
   * @example
   * // Assume the current date and time is June 10, 2024, 3 PM in the business timezone,
   * // and there are transfer times with cutoffs at 10 AM, 2 PM, and 5 PM.
   * const nextSendDate = getNextTransferTime(new Date('2024-06-10T15:00:00'));
   * // Returns the send date for the transfer time with the 5 PM cutoff on June 10, 2024.
   */

  getNextTransferTime(from: Date): Date {
    const businessDate = getDateInBusinessTimezone(from);
    const transferTimes = this.findAllTransferTimes();
    for (const transferTime of transferTimes) {
      const businessDateTransferTime =
        this.getTransferTimeInBusinessTimezoneForDate(
          transferTime,
          businessDate.toDate(),
        );

      if (businessDate.isBefore(businessDateTransferTime.send)) {
        return businessDateTransferTime.send.toDate();
      }
    }

    const nextBusinessDay = getNextBusinessDay(businessDate);
    const nextDayTransferTime = this.getTransferTimeInBusinessTimezoneForDate(
      transferTimes[0],
      nextBusinessDay.toDate(),
    );

    return nextDayTransferTime.send.toDate();
  }

  //  As we do not trigger the transfers ourselves, we need to determine which transfer it is
  /**
   * Determines which transfer time window the current date falls into, considering an optional margin of error around the send time.
   *
   * @param {Date} currentDate The current date when the transfer is initiated.
   * @param {number} [margin=0] The optional margin of error in minutes. Defaults to 0 if not provided.
   * @returns {Object|null} The current transfer time window object or null if no window is found.
   *
   * @example
   * // Assume the current date and time is June 10, 2024, 3:05 PM in the business timezone,
   * // there are transfer times with send times at 3 PM, 5 PM, and 7 PM,
   * // and a margin of error of 10 minutes.
   * const currentTransferWindow = getCurrentTransferWindow(new Date('2024-06-10T15:05:00'), 10);
   * // Returns the transfer time window with the 3 PM send time.
   *
   * @example
   * // Assume the current date and time is June 10, 2024, 3:05 PM in the business timezone,
   * // there are transfer times with send times at 3 PM, 5 PM, and 7 PM,
   * // and no margin of error provided.
   * const currentTransferWindow = getCurrentTransferWindow(new Date('2024-06-10T15:05:00'));
   * // Returns null as 3:05 PM is not within any send time window without a margin.
   */
  getCurrentTransferWindow(
    currentDate: Date,
    margin: number = 0,
  ): TransferTime | null {
    const businessDate = getDateInBusinessTimezone(currentDate);
    const transferTimes = this.findAllTransferTimes();

    for (const transferTime of transferTimes) {
      const businessDateTransferTime =
        this.getTransferTimeInBusinessTimezone(transferTime);

      const sendTimeWithMarginStart = businessDateTransferTime.send.subtract(
        margin,
        'minute',
      );
      const sendTimeWithMarginEnd = businessDateTransferTime.send.add(
        margin,
        'minute',
      );

      if (
        businessDate.isAfter(sendTimeWithMarginStart) &&
        businessDate.isBefore(sendTimeWithMarginEnd)
      ) {
        return transferTime;
      }
    }

    return null;
  }

  getWireOverrideWindow(): WireOverrideWindow {
    return this.configService
      .getValue('WIRE_TRANSFER_OVERRIDE_WINDOW')
      .asParsedJson() as WireOverrideWindow;
  }

  getLastTransferTimeOfTheDay(): TransferTime {
    const transferTimes = this.findAllTransferTimes();
    let current = transferTimes[0];
    while (current.next) {
      current = current.next;
    }
    return current;
  }

  private getByName(transferTimes: TransferTime[], name: string): TransferTime {
    const transferTime = transferTimes.find(
      (transferTime) => transferTime.name === name,
    );
    if (!transferTime) {
      throw new Error('Could not find transfer time');
    }
    return transferTime;
  }

  findAllTransferTimes(): TransferTime[] {
    const transferTimes: TransferTime[] = [];
    const items = this.configService
      .getValue('ACH_TRANSFER_TIMES')
      .asParsedJson();
    for (const item of items) {
      transferTimes.push({
        name: item.name,
        send: {
          minute: item?.send?.minute,
          hour: item?.send?.hour,
        },
        cutoff: {
          minute: item?.cutoff?.minute,
          hour: item?.cutoff?.hour,
        },
      });
    }
    for (const item of items) {
      const transferTime = this.getByName(transferTimes, item.name);
      if (item.next != null) {
        transferTime.next = this.getByName(transferTimes, item.next);
      }
      if (item.previous != null) {
        transferTime.previous = this.getByName(transferTimes, item.previous);
      }
    }
    return transferTimes;
  }

  private findAllArrivalTimes(): ArrivalTime[] {
    const arrivalTimes: ArrivalTime[] = [];
    const items = this.configService
      .getValue('ACH_ARRIVAL_TRANSFER_TIMES')
      .asParsedJson();
    for (const item of items) {
      arrivalTimes.push({
        name: item.name,
        arrival: {
          minute: item?.arrival?.minute,
          hour: item?.arrival?.hour,
        },
      });
    }
    return arrivalTimes;
  }

  getTransferTimeInBusinessTimezone(transferTime: TransferTime): {
    cutoff: dayjs.Dayjs;
    send: dayjs.Dayjs;
  } {
    return {
      cutoff: getDateInBusinessTimezone()
        .startOf('day')
        .hour(transferTime.cutoff.hour)
        .minute(transferTime.cutoff.minute),
      send: getDateInBusinessTimezone()
        .startOf('day')
        .hour(transferTime.send.hour)
        .minute(transferTime.send.minute),
    };
  }

  getTransferTimeInBusinessTimezoneForDate(
    transferTime: TransferTime,
    date: Date,
  ): {
    cutoff: dayjs.Dayjs;
    send: dayjs.Dayjs;
  } {
    const businessDate = getDateInBusinessTimezone(date);
    return {
      cutoff: businessDate
        .startOf('day')
        .hour(transferTime.cutoff.hour)
        .minute(transferTime.cutoff.minute),
      send: businessDate
        .startOf('day')
        .hour(transferTime.send.hour)
        .minute(transferTime.send.minute),
    };
  }

  getRegularArrivalTime(currentDate: Date): Date {
    const arrivalTimes = this.findAllArrivalTimes();
    const firstArrival = arrivalTimes.find(
      (t) => t.name === 'first_ach_arrival',
    );
    const secondArrival = arrivalTimes.find(
      (t) => t.name === 'second_ach_arrival',
    );

    const transferTimes = this.findAllTransferTimes();
    const firstAch = transferTimes.find((t) => t.name === 'first_ach');
    const secondAch = transferTimes.find((t) => t.name === 'second_ach');

    if (
      !firstArrival?.arrival ||
      !secondArrival?.arrival ||
      !firstAch?.send ||
      !secondAch?.send
    ) {
      throw new Error('ACH times not properly configured');
    }

    const businessDate = getDateInBusinessTimezone(currentDate);
    const currentHour = businessDate.hour();

    // Before first ACH - arrives today at 5 PM
    if (currentHour <= firstAch.send.hour) {
      return businessDate
        .hour(firstArrival.arrival.hour)
        .minute(firstArrival.arrival.minute)
        .toDate();
    }

    // Before second ACH - arrives next business day at 8 AM
    if (currentHour <= secondAch.send.hour) {
      const nextBusinessDay = getNextBusinessDay(businessDate);
      return nextBusinessDay
        .hour(secondArrival.arrival.hour)
        .minute(secondArrival.arrival.minute)
        .toDate();
    }

    // After all - arrives next business day at 5 PM
    const nextBusinessDay = getNextBusinessDay(businessDate);
    return nextBusinessDay
      .hour(firstArrival.arrival.hour)
      .minute(firstArrival.arrival.minute)
      .toDate();
  }
}
