import type { Config } from 'jest';

const config: Config = {
  verbose: true,
  globalTeardown: '<rootDir>/../test/globalTeardown.ts',
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': '@swc/jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coveragePathIgnorePatterns: [
    'scripts/',
    'postman/',
    'migrations/',
    'lambda/',
    'coverage/',
    'coverage-unit/',
    'coverage-integration/',
    'core/test/',
    'app/integration-tests/',
    '.*\\.model\\.ts$',
    '.*\\.entity\\.ts$',
    '.*\\.request\\.ts$',
    '.*\\.response\\.ts$',
    '.*\\.command\\.ts$',
    '.*\\.query\\.ts$',
    '.*\\.event\\.ts$',
    '.*\\index\\.ts$',
  ],
  coverageDirectory: '../test/coverage',
  coverageReporters: ['json-summary', 'text', 'lcov'],
  testEnvironment: 'node',
  testTimeout: 10000,
  moduleNameMapper: {
    '^@common$': '<rootDir>/common/index',
    '^@common/data$': '<rootDir>/common/data/index',
    '^@common/events$': '<rootDir>/common/events/index',
    '^@common/mappers$': '<rootDir>/common/mappers/index',
    '^@core$': '<rootDir>/core/index',
    '^@core/date-time$': '<rootDir>/core/date-time/index',
    '^@core/uuid$': '<rootDir>/core/util/uuid/index',
    '^@core/streams$': '<rootDir>/core/util/streams/index',
    '^@core/formatting$': '<rootDir>/core/util/formatting/index',
    '^@core/cron$': '<rootDir>/core/cron/index',
    '^@core/web$': '<rootDir>/core/web/index',
    '^@core/data$': '<rootDir>/core/data/index',
    '^@core/services$': '<rootDir>/core/services/index',
    '^@core/entities$': '<rootDir>/core/entities/index',
    '^@core/test$': '<rootDir>/core/test/index',
    '^@core/types$': '<rootDir>/core/types/index',
    '^@core/timers$': '<rootDir>/core/timers/index',
    '^@core/observability$': '<rootDir>/core/observability/index',
    '^@core/(.*)$': '<rootDir>/core/$1',
    '^@module-database$': '<rootDir>/modules/database/index',
    '^@module-database/test$': '<rootDir>/modules/database/test/index',
    '^@module-tag-definitions$': '<rootDir>/modules/tag-definitions/index',
    '^@module-tag-definitions/test$':
      '<rootDir>/modules/tag-definitions/test/index',
    '^@module-tag-definitions/data$':
      '<rootDir>/modules/tag-definitions/data/index',
    '^@module-audit-log$': '<rootDir>/modules/audit-log/index',
    '^@module-auth$': '<rootDir>/modules/auth/index',
    '^@module-analytics$': '<rootDir>/modules/analytics/index',
    '^@module-aws$': '<rootDir>/modules/aws/index',
    '^@module-seeders$': '<rootDir>/modules/seeders/index',
    '^@module-brokers$': '<rootDir>/modules/brokers/index',
    '^@module-brokers/data$': '<rootDir>/modules/brokers/data/index',
    '^@module-brokers/commands$':
      '<rootDir>/modules/brokers/services/commands/index',
    '^@module-reserves$': '<rootDir>/modules/reserves/index',
    '^@module-peruse$': '<rootDir>/modules/peruse/index',
    '^@module-invoices$': '<rootDir>/modules/invoices/index',
    '^@module-invoices-tag-activity$':
      '<rootDir>/modules/invoices-tag-activity/index',
    '^@module-invoices/commands$':
      '<rootDir>/modules/invoices/services/commands/index',
    '^@module-invoices/data$': '<rootDir>/modules/invoices/data/index',
    '^@module-invoices/test$': '<rootDir>/modules/invoices/tests/index',
    '^@module-brokers/test$': '<rootDir>/modules/brokers/test/index',
    '^@module-clients$': '<rootDir>/modules/clients/index',
    '^@module-email$': '<rootDir>/modules/email/index',
    '^@module-clients/test$': '<rootDir>/modules/clients/test/index',
    '^@module-clients/data$': '<rootDir>/modules/clients/data/index',
    '^@module-clients/commands$':
      '<rootDir>/modules/clients/services/commands/index',
    '^@module-config$': '<rootDir>/modules/bobtail-config/index',
    '^@module-client-broker-assignments$':
      '<rootDir>/modules/client-broker-assignments/index',
    '^@module-client-broker-assignments/test$':
      '<rootDir>/modules/client-broker-assignments/test/index',
    '^@module-broker-payments$': '<rootDir>/modules/broker-payments/index',
    '^@module-broker-payments/commands$':
      '<rootDir>/modules/broker-payments/services/commands/index',
    '^@module-broker-payments/data$':
      '<rootDir>/modules/broker-payments/data/index',
    '^@module-broker-payments/test$':
      '<rootDir>/modules/broker-payments/test/index',
    '^@module-broker-payments/repositories$':
      '<rootDir>/modules/broker-payments/repositories/index',
    '^@module-client-payments$': '<rootDir>/modules/client-payments/index',
    '^@module-client-payments/test$':
      '<rootDir>/modules/client-payments/test/index',
    '^@module-persistence$': '<rootDir>/modules/persistence/index',
    '^@module-persistence/entities$':
      '<rootDir>/modules/persistence/entities/index',
    '^@module-persistence/history$':
      '<rootDir>/modules/persistence/history/index',
    '^@module-persistence/repositories$':
      '<rootDir>/modules/persistence/repositories/index',
    '^@module-persistence/util$': '<rootDir>/modules/persistence/util/index',
    '^@module-persistence/test$': '<rootDir>/modules/persistence/test/index',
    '^@module-cqrs$': '<rootDir>/modules/cqrs/index',
    '^@module-document-generation$':
      '<rootDir>/modules/document-generation/index',
    '^@module-buyouts$': '<rootDir>/modules/buyouts/index',
    '^@module-buyouts/commands$':
      '<rootDir>/modules/buyouts/services/commands/index',
    '^@module-buyouts/test$': '<rootDir>/modules/buyouts/test/index',
    '^@module-reserves/data$': '<rootDir>/modules/reserves/data/index',
    '^@module-reserves/test$': '<rootDir>/modules/reserves/test/index',
    '^@module-reserves/commands$':
      '<rootDir>/modules/reserves/services/commands/index',
    '^@module-reserve-account-funds$':
      '<rootDir>/modules/reserve-account-funds/index',
    '^@module-reserve-account-funds/data$':
      '<rootDir>/modules/reserve-account-funds/data/index',
    '^@module-reserve-account-funds/test$':
      '<rootDir>/modules/reserve-account-funds/test/index',
    '^@module-buyouts/data$': '<rootDir>/modules/buyouts/data/index',
    '^@module-common$': '<rootDir>/modules/common/index',
    '^@module-common/test$': '<rootDir>/modules/common/test/index',
    '^@module-logger$': '<rootDir>/modules/logging/index',
    '^@module-transfers$': '<rootDir>/modules/transfers/index',
    '^@module-transfers/data$': '<rootDir>/modules/transfers/data/index',
    '^@module-transfers/test$': '<rootDir>/modules/transfers/test/index',
    '^@module-v1-sync': '<rootDir>/modules/v1-sync/index',
    '^@module-users$': '<rootDir>/modules/users/index',
    '^@module-users/test$': '<rootDir>/modules/users/tests/index',
    '^@module-slack': '<rootDir>/modules/slack/index',
    '^@module-maintenance$': '<rootDir>/modules/maintenance/index',
    '^@module-maintenance/test$': '<rootDir>/modules/maintenance/test/index',
    '^@module-processing-notes$': '<rootDir>/modules/processing-notes/index',
    '^@module-processing-notes/test$':
      '<rootDir>/modules/processing-notes/test/index',
    '^@module-firebase$': '<rootDir>/modules/firebase/index',
    '^@module-firebase/test$': '<rootDir>/modules/firebase/test/index',
    '^@module-firebase/commands$':
      '<rootDir>/modules/firebase/services/commands/index',
    '^@module-notifications$': '<rootDir>/modules/notifications/index',
    '^@module-notifications/test$':
      '<rootDir>/modules/notifications/test/index',
    '^@module-sms$': '<rootDir>/modules/sms/index',
    '^@module-worker$': '<rootDir>/modules/worker/index',
    '^@module-reports$': '<rootDir>/modules/reports/index',
    '^@module-reports/data$': '<rootDir>/modules/reports/data/index',
    '^@module-cron$': '<rootDir>/modules/cron/index',
    '^@module-cron/data$': '<rootDir>/modules/cron/data/index',
    '^@module-quickbooks$': '<rootDir>/modules/quickbooks/index',
    '^@module-rtp$': '<rootDir>/modules/rtp/index',
    '^@module-feature-toggles': '<rootDir>/modules/feature-toggles/index',
  },
};
export default config;
