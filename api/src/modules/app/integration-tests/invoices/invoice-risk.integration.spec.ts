import { addDaysToToday } from '@core/date-time';
import { Client } from '@module-clients/data';
import Big from 'big.js';
import { expectBigEquality } from '../expects';
import { ITAppManager } from '../setup/it-app-manager';
import { IntegrationTestsSteps } from '../steps';

describe('Invoice risk tests', () => {
  let appManager: ITAppManager;
  let steps: IntegrationTestsSteps;
  let client: Client;

  beforeAll(async () => {
    appManager = await ITAppManager.init();
    steps = new IntegrationTestsSteps(appManager);
    client = await appManager.data.createClient();
    appManager.data.createBroker();
    appManager.data.createBroker();
  });

  afterAll(async () => {
    if (appManager) {
      await appManager.close();
    }
  });

  it('Invoice risk', async () => {
    let numberOfDaysBetweenPay = 0;
    for (let i = 1; i < appManager.data.brokers.length + 1; i++) {
      jest.useRealTimers();
      const broker = appManager.data.brokers[i - 1];
      const invoice = await steps.invoice.createAndCompletePayment({
        clientId: client.id,
        brokerId: broker.id,
      });
      jest.useFakeTimers();
      jest.setSystemTime(addDaysToToday(i).toDate());
      numberOfDaysBetweenPay += i;
      await steps.brokerPayment.create({
        invoiceId: invoice.id,
        amount: invoice.accountsReceivableValue,
      });
      const risk = await steps.invoice.getRisk(invoice.id);

      expect(risk.broker?.id).toBe(broker.id);
      expect(risk.broker?.name).toBe(broker.legalName);
      expect(risk.broker?.mc).toBe(broker.mc);
      expect(risk.broker?.dot).toBe(broker.dot);
      expect(risk.broker?.totalClientsWorkingWith).toBe(
        appManager.data.clients.length,
      );

      expect(risk.client.id).toBe(client.id);
      expect(risk.client.name).toBe(client.name);
      expect(risk.client.mc).toBe(client.mc);
      expect(risk.client.dot).toBe(client.dot);
      expect(risk.client.email).toBe(client.email);
      expectBigEquality(new Big(risk.client.totalBrokers.last30Days), i);
      expectBigEquality(new Big(risk.client.totalBrokers.last60Days), i);
      expectBigEquality(new Big(risk.client.totalBrokers.last90Days), i);
      expectBigEquality(
        new Big(risk.client.daysToPay.last30Days),
        numberOfDaysBetweenPay / i,
      );
      expectBigEquality(
        new Big(risk.client.daysToPay.last60Days),
        numberOfDaysBetweenPay / i,
      );
      expectBigEquality(
        new Big(risk.client.daysToPay.last90Days),
        numberOfDaysBetweenPay / i,
      );
    }
  }, 120000);
});
