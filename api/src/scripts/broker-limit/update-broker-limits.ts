import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import {
  EntityManager,
  RequestContext,
  AbstractSqlDriver,
} from '@mikro-orm/postgresql';
import { DatabaseService } from '@module-database';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@module-app';
import { EmptyReport, run } from '../util';
import {
  BrokerFactoringConfigEntity,
  BrokerLimitAssocEntity,
  TagDefinitionEntity,
  TagDefinitionKey,
  UserEntity,
} from '@module-persistence/entities';
import Big from 'big.js';
import { updateInvoiceTags } from './update-invoice-tags';

type UpdateBrokerLimitsInput = {
  id: string;
  limitAmount: string;
};

const mode = process.argv[3]; // pass 'update' OR 'revert' to script argument

const update = async () => {
  if (mode && ['update', 'revert'].includes(mode)) {
    const app = await NestFactory.createApplicationContext(AppModule);
    const databaseService = app.get(DatabaseService);

    await databaseService.withRequestContext(async () => {
      const em =
        RequestContext.getEntityManager() as EntityManager<AbstractSqlDriver>;
      if (em) {
        await updateBrokerLimitsFromCSV(em);
      }
    });
  }
};

const updateBrokerLimitsFromCSV = async (
  em: EntityManager<AbstractSqlDriver>,
) => {
  const fileName = process.argv[2];
  const mode = process.argv[3] || 'update';
  if (!fileName) {
    console.error('Please provide the CSV filename as an argument.');
    process.exit(1);
  }
  const fileContent = fs.readFileSync(fileName, 'utf8');
  const records: string[][] = parse(fileContent, { skip_empty_lines: true });
  const user = await em.findOne(UserEntity, {
    email: 'system@bobtail.com',
  });

  // fetch BROKER_LIMIT_EXCEEDED tag to put into activities
  const tagDefinition = await em.findOneOrFail(TagDefinitionEntity, {
    key: TagDefinitionKey.BROKER_LIMIT_EXCEEDED,
  });

  if (user) {
    for (const row of records.slice(1)) {
      const input: UpdateBrokerLimitsInput = {
        id: row[0],
        limitAmount: row[1],
      };
      if (!input.id || !input.limitAmount) {
        console.log('invalid record.');
        continue;
      }
      await updateBrokerLimit(em, input, mode, user, tagDefinition);
    }
  }
};

function parseLimitAmount(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]+/g, '')) * 100;
}

const buildBrokerLimitHistory = (
  limitAmount: Big | null,
  config: BrokerFactoringConfigEntity,
  user: UserEntity,
) => {
  const brokerLimitHistory = new BrokerLimitAssocEntity();
  brokerLimitHistory.note = '';
  brokerLimitHistory.limitAmount = limitAmount;
  brokerLimitHistory.config = config;
  brokerLimitHistory.createdBy = user;
  brokerLimitHistory.updatedBy = user;
  return brokerLimitHistory;
};

const getLastUpdatedBrokerLimitAmount = async (
  em: EntityManager<AbstractSqlDriver>,
  configId: string,
): Promise<Big | null> => {
  const brokerLimitHistory = await em.find(
    BrokerLimitAssocEntity,
    {
      config: { id: configId },
    },
    {
      limit: 2,
      orderBy: { createdAt: 'DESC' },
    },
  );
  return brokerLimitHistory.length === 2
    ? brokerLimitHistory[1]?.limitAmount
    : null;
};

const updateBrokerLimit = async (
  em: EntityManager<AbstractSqlDriver>,
  input: UpdateBrokerLimitsInput,
  mode: string,
  user: UserEntity,
  tagDefinition: TagDefinitionEntity,
) => {
  // Update the broker limits
  const brokerFactoringConfig = await em.findOne(
    BrokerFactoringConfigEntity,
    { brokerId: input.id },
    {
      populate: ['updatedBy'],
    },
  );

  if (mode === 'revert' && brokerFactoringConfig?.updatedBy?.id != user.id) {
    return;
  }

  if (brokerFactoringConfig) {
    const limitAmount =
      mode === 'revert'
        ? await getLastUpdatedBrokerLimitAmount(em, brokerFactoringConfig.id)
        : Big(parseLimitAmount(input.limitAmount));

    brokerFactoringConfig.limitAmount = limitAmount;
    brokerFactoringConfig.updatedBy = user;
    await em.persistAndFlush(brokerFactoringConfig);
    const brokerLimitHistory = buildBrokerLimitHistory(
      limitAmount,
      brokerFactoringConfig,
      user,
    );
    await em.persistAndFlush(brokerLimitHistory);
    await updateInvoiceTags(
      em,
      brokerFactoringConfig,
      limitAmount,
      tagDefinition,
    );
    console.log(
      `Updated broker with ID: ${input.id}, Limit Amount: ${limitAmount}`,
    );
  } else {
    console.error(`Broker factoring config not found for ID: ${input.id}`);
  }
};

run(update, new EmptyReport(), __dirname, { logError: true });
