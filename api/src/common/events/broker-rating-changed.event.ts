export class BrokerRatingChangedEvent {
  constructor(
    readonly brokerId: string,
    readonly brokerName: string,
    readonly newRating: string,
  ) {}
}
