import { Metric } from '@aws-sdk/client-cloudwatch';

export class StandardMetric implements Metric {
  Namespace: string;
  MetricName: string;

  constructor(name: string) {
    this.Namespace = 'Bobtail-NG';
    this.MetricName = name;
  }
}
