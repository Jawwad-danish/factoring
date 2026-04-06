## Description

Bobtail NextGen App

## Installation

```bash
$ npm install
```

## Prerequisites
* [Login to AWS using AWS SSO](https://bobtail.atlassian.net/wiki/spaces/DEV/pages/390267012/Login+to+AWS+using+AWS+SSO)
```
apt | brew install jq
aws sso login --profile <aws-profile>
awscreds <aws-profile>
```

i.e.:
```
aws sso login --profile bobtail-sandbox
awscreds bobtail-sandbox
```

### Local development using AWS Aurora instance
* [Tunnel to private Aurora DB](https://bobtail.atlassian.net/wiki/spaces/IC/pages/402685953/Tunnel+to+private+Aurora+DB)
* Add the following to `envs/development.env`:
```
DB_HOST=localhost
DB_PORT=1433
```

### Local development using local postgres
* run `createdb bobtailng` # or prefered DB name
* Add the following to `envs/development.env`:
```
DB_HOST=localhost
DB_PORT=5432 # or prefered port
DB_USERNAME=postgres # or prefered username
DB_PASS=  #leave empty for no password
DB_NAME=bobtailng # or prefered DB name
```

### Bring database up to date
```bash
$ npm run migration:run:local
```

### Revert database migration
```bash
$ npm run migration:revert:local
```

### Seed data into db
```bash
$ npm run seed:dev
```

### Create new migration
```bash
$ npm run migration:create
```

## Exporting / Importing data from V1

### Export data from V1
To export the data from V1 use the following commands
```bash
# export clients
$ npm run script:export:clients

# export brokers
$ npm run script:export:debtors

# export invoices, reserves, client payments, broker payments, client broker assignments
$ npm run script:export:all
```
To export only a certain set of data, you can use the existing dedicated scripts
```bash
# export only one data set
$ npm run script:export:(invoices|clientPayments|debtorPayments|clientdebtorassignment|balances)
```
### Import data from V1
To import the exported data from V1 into V2 use the follwing commands 
```bash
# import clients configs
$ npm run script:dev:import:clients:factoring

# import brokers
$ npm run script:dev:import:brokers

# import invoices, reserves, client payments, broker payments, client broker assignments
$ npm run script:dev:import:all
```
To import only a certain set of data, you can use the existing dedicated scripts
```bash
# import only one data set
$ npm run script:import:(invoices|clientPayments|debtorPayments|clientdebtorassignment|balances)
```

### Notes:
1. Exporting will prompt you to enter the environment you want to extract data from, the script to run and a confirmation
2. Exporting scripts give the possibility to export only certain resources specified by ids
3. Not all import scripts have (at the moment of this writing) logs to show progress. If you think the script is stuck check in the db with a count query before termianting the process
## Running the app

1. Prerequisites
```bash
$ aws sso login --profile bobtail-sandbox
$ awscreds bobtail-sandbox
$ export AWS_PROFILE=bobtail-sandbox
```

2. Run ```npm run migration:run:local``` to ensure the database is up to date
3. Run ```npm run mock:client-service```. This mocks the client service and you should have the client factoring config with the same id populated in the db.
4. Start the app with one of the following commands 

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Postman setup
1. Import the postman collection and environment
2. Get the Auth0 client secret from the Auth0 dashboard or ask a team member for it
3. Set the `auth0_client_secret` environment variable in Postman
4. Fetch an access token using the designated request (valid 24h)
5. Set the `auth0_token` environment variable in Postman using that access token
6. Repeat 4-5 when the token expires

## Test

### Setup

- Make sure the credentials from `test.env` match your local DB
- Create the database used by integration tests
  ```bash
  $ createdb bobtail-ng-integration-tests
  ```
- Run migrations for the integration tests database
  ```bash
  $ npm run migration:run:test
  ```
### Running tests
```bash
# unit tests
$ npm run test

# integration tests
$ npm run test:integration

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
## Naming strategies

### Class names
Class, interface, record, and typedef names are written in `UpperCamelCase`

Type names are typically nouns or noun phrases. For example, `Request`, `ImmutableList`, or `VisibilityMode`. Additionally, interface names may sometimes be adjectives or adjective phrases instead (for example, `Readable`).

### Method names
Method names are written in `lowerCamelCase`
Method names are typically verbs or verb phrases. For example, `sendMessage`.

Getter and setter methods for properties are never required, but if they are used they should be named `getFoo` (or optionally `isFoo` or `hasFoo` for booleans), or `setFoo(value)` for setters.

### Enum names
Enum names are written in `UpperCamelCase`, similar to classes, and should generally be singular nouns. Individual items within the enum are named in `CONSTANT_CASE`

### Constant names
Constant names use `CONSTANT_CASE`: all uppercase letters, with words separated by underscores.

### Parameter names
Parameter names are written in `lowerCamelCase`. Note that this applies even if the parameter expects a constructor.

One-character parameter names should not be used in public methods.

### Local variable names
Local variable names are written in `lowerCamelCase`.
Constants in function scopes are still named in `lowerCamelCase`. Note that `lowerCamelCase` is used even if the variable holds a constructor.

### CQRS
Commands and Queries will respect the **class name** naming strategy and will follow this naming pattern **{action}-{business-unit}.(command|query).ts**. 

For example
* create-invoice.command.ts
* update-invoice.command.ts
* delete-reserve.command.ts
* find-all-invoice.query.ts
* upload-document.command.ts

Handlers will have a similar pattern, but we need to add the **handler** word. 
The pattern becomes **{action}-{business-unit}.(command|query)-handler.ts**

### Events
Events will respect the **class name** naming strategy and will follow this naming pattern **{business-unit}-{action}.event.ts**. 

For example
* broker-payment-created.event.ts
* invoice-created.event.ts
* invoice-updated.event.ts
* bank-account-updated.event.ts

### Permissions
Permissions will respect the **enum name** naming strategy but the enum items will follow this naming pattern **{action}:{business-unit}:[...sub-business-units]**. 

For example
* create:invoice:document
* update:invoice
* delete:reserve
* read:invoice:purchased:paid

### Wording
What to use   | What not to use
------------- | -------------
Delete        | Remove

## Modules, organization, scope

### Folder structure
```
{module-name}/
├─ repositories/
│  ├─ index.ts
│  ├─ {name}.repository.ts
│  ├─ {name}.repository.unit.spec.ts
├─ services/
|  ├─ commands/
|  |  ├─ handlers/
|  │  │  ├─ index.ts
│  │  |  ├─ {action}-{business-unit}.command-handler.ts
│  │  ├─ index.ts
│  │  ├─ {action}-{business-unit}.command.ts
|  ├─ queries/
|  |  ├─ handlers/
|  │  │  ├─ index.ts
│  │  |  ├─ {action}-{business-unit}.query-handler.ts
│  │  ├─ index.ts
│  │  ├─ {action}-{business-unit}.query.ts
|  ├─ events/
|  |  ├─ handlers/
|  │  │  ├─ index.ts
│  │  |  ├─ {business-unit}-{action}-{effect}.event-handler.ts
│  │  ├─ index.ts
|  ├─ cron-jobs/
|  |  ├─ {job-name}/
|  │  │  ├─ index.ts
│  │  |  ├─ {job-name}.cron-job.ts
│  │  ├─ index.ts
│  ├─ index.ts
│  ├─ {name}.service.ts
│  ├─ {name}.service.unit.spec.ts
├─ controllers/
│  ├─ index.ts
│  ├─ {name}.controller.ts
├─ test/
│  ├─ index.ts
│  ├─ {name}.model.stub.ts
│  ├─ {name}.entity.stub.ts
├─ data/
│  ├─ web/
│  │  ├─ index.ts
│  │  ├─ {name}.request.ts
│  ├─ events/
│  │  ├─ index.ts
│  │  ├─ {name}.event.ts
│  ├─ mappers/
│  │  ├─ index.ts
│  │  ├─ {model}.mapper.ts
│  │  ├─ {model}.mapper.unit.spec.ts
│  ├─ {name}.model.ts
│  ├─ index.ts
{module-name}.module.ts
index.ts
```
### **core** *folder/module* scope
This folder/module should contain abstract logic that is related to the programming language itself, libraries, external services, algorithms, structures.

### **common** *folder/module* scope
This folder/module should contain abstract logic that is related to the business domain.
For example activity log logic that can be shared across multiple domain modules.
## 3rd Party Library usage
### [class-transformer](https://github.com/typestack/class-transformer)

All the properties that we want to expose, will be marked at property level with **@Expose()** decorator.

The **name** expose option, should be used with **@Expose()** decorator only if the exposed property name will not match the actual class property name.

Good example
```typescript
class Person {
  @Expose()
  age: number;
}
```
Bad example
```typescript
class Person {
  @Expose({ name: 'age' })
  age: number
}
```

### [@golevelup/ts-jest](https://www.npmjs.com/package/@golevelup/ts-jest)
This package provides a very useful function `createMock` that can mock pretty much anything without too much hastle.

Let's say we have a service

```typescript
class PersonService {

  constructor(@Inject(CONFIG_SERVICE) configService: ConfigService){
    const clientServiceUrl = configService.getValue('CLIENT_SERVICE_URL');
    if (!clientServiceUrl.hasValue()) {
      throw new Error(`Could not obtain CLIENT_SERVICE_URL config value`);
    }
    this.url = clientServiceUrl.asString();
    }
  async getAge() { 
    return 30; 
    }
  async getName() { 
    return 'John'; 
    }
}
```

With `@golevelup/ts-jest` you can easily mock this service and its methods due to the usage of Typescript features.

Usage:

```typescript
const personServiceMock = createMock<PersonService>();
    personServiceMock.getAge.mockResolvedValue(20);



    testModule = await Test.createTestingModule({
      imports: [...modules],
    })
      .overrideProvider(PersonService)
      .useValue(personServiceMock)
      .compile();
```

Within your testing app, any usage of the `PersonService` will now be replaced with the mock you provided.
# Terminology
## Testing
| Word   | Description
|:------ |:-------------
| SUT    | Subject Under test 
| Stub   | It provides fake data to the SUT      

# Good practices
## When to use **null** value
When defining a variable that is meant to later hold an object, it is advisable to initialize the variable to **null** as opposed to anything else. That way, you can explicitly check for the value **null** to determine if the variable has been filled with an object reference at a later time.

If you are calling a non existing method / property, then you will get **undefined**, which makes it harder to figure out if it was intentional or a mistake.

## Testing
We are using Jest for running tests. Tests are ran in parallel by multiple test workers, so we must make sure not to create conflicts. This is very important for integration tests. Unit tests mock the interaction with the database, so we don't need to worry about those.

### Integration testing
Because of possible conflicts due to tests being run in parallel, we need to isolate our test subjects as much as possible. Try to use unique values when interacting with subjects.

Good example
```typescript
// There can be only one invoice with this ID
const body = {'ids': 1};
const response = testAPI.post('/invoices/find', body);
expect(response.length).toBe(1);
```
Bad example
```typescript
// There can be multiple invoices with the same amount
const body = {'amount': 100};
const response = testAPI.post('/invoices/find', body)
expect(response.length).toBe(1); // this will fail if another test also created an invoice with the same amount

```

## Date and timezones
Suggested to read: https://en.wikipedia.org/wiki/ISO_8601

We are using the native `Date` object and the `dayjs` library to work with dates.
We should always strive to work with UTC dates (which the `Date` __object__ uses by default), but there are business requirements that need us to## Localstack
In order to start localstack see CDK README.

In order to send calls to localstack 
  
  NOTE -> This additions should be made only on local/localdev env files. Until we have a fully functional local localstack we will point to the dev env as we did until now.

  - add AWS_DEFAULT_ENDPOINT=http://localhost:4566/
  - add INVOICE_DOCUMENTS_QUEUE_URL=http://localhost:4566/000000000000/local-documents-queue.fifo

Awslocal is a wrapper over the aws cli.

In order to view created resources use awslocal followed by the commmand you would use with the normal aws cli.

  Eg. awslocal sqs list-queues -> lists localstack created queues

In order to check messages on a queue use next command:

  curl -H "Accept: application/json" \
      "http://localhost:4566/_aws/sqs/messages?QueueUrl=http://queue.localhost.localstack.cloud:4566/000000000000/YOUR_QUEUE_NAME}"
  
  EG. see messages on local documents queue
  
  curl -H "Accept: application/json" \
    "http://localhost:4566/_aws/sqs/messages?QueueUrl=http://queue.localhost.localstack.cloud:4566/000000000000/local-documents-queue.fifo"

 be careful around timezones.

For example, let's say the bank closes at 17:00 __New York Time__ and we need to check if it's past this time.

__Good examples__
```typescript
dayjs().toDate() > dayjs().tz('America/New_York').hour(17).startOf('hour').toDate()
```

```typescript
dayjs() > dayjs().tz('America/New_York').hour(17).startOf('hour')
```

```typescript
dayjs('2023-01-13 11:55:20Z') > dayjs().tz('America/New_York').hour(17).startOf('hour').toDate()
```

```typescript
dayjs('2023-01-13T13:55:20+02:00') > dayjs().tz('America/New_York').hour(17).startOf('hour').toDate()
```

```typescript
dayjs(1673619379700) > dayjs().tz('America/New_York').hour(17).startOf('hour').toDate()
```

__Bad examples__
```typescript
dayjs('2023-01-13 11:55:20') > dayjs().tz('America/New_York').hour(17).startOf('hour')
```


```typescript
dayjs('2023-01-13 11:55:20') > dayjs().tz('America/New_York').hour(17).startOf('hour').toDate()
```

Notice the missing __Z__ and __+02:00__ (see good example) at end of the date string used in the constructor.

If we don't specify the timezone when creating a new `Date` object, it assumes you are using local time. 

Using UNIX timestamps when instantiating a new `Date` will not have this problem as they are timezone-agnostic.


### Date manipulation

If we manipulate the time, dayjs will manipulate your __local time__ if the timezone is not specified.

```typescript
dayjs().isSame(dayjs().tz('America/New_York')) // true
dayjs().isSame(dayjs.utc()) // true
dayjs().hour(5).isSame(dayjs.utc().hour(5)) // false
```

To avoid any complications, it is recommended to use `dayjs.utc()` when instantiating a new Date object even if you don't manipulate the time.

### Converting to a string
Use the `toISOString()` method:

```typescript
dayjs().toISOString() // '2023-01-13T15:03:37.116Z'
```

```typescript
new Date().toISOString() // '2023-01-13T15:03:37.116Z'
```

Note: `Date().toString()` outputs the __local time__. If you need a specific format you can use the dayjs [format](https://day.js.org/docs/en/display/format) method.

## Nest JS
The project uses a service-oriented approach. 
Keep the command handlers clean and focused on their primary responsability.
Advantages of this approach are:
* Cleaner Command Handlers: Focused solely on business logic
* Easier to test: Command handlers can be tested in isolation
* Flexibility: Easier to modify event payload structure without changing command handlers
* Separation of Concerns: Command handlers handle commands, services orchestrate the workflow

### CQRS

#### Events

Event orchestration should be done in the service layer.

Events should be triggered after the business logic has been executed, and the transaction is completed.
This means entities are detached from the MikroORM context.

**Entities** should not be sent as event payload, but rather the identifiers should be sent, or plain objects.

**Handlers** will fetch the entities from the database, making sure the necessary relations are loaded, and they get the most up-to-date version of the entity.
* We avoids potential stale data issues, and also serialization issues like circular references or large objects.
* Can handle its own transactions
* Can handle failures independently, have retry operations without affecting other handlers 

## Technical information
Certain technical aspects of the app can be found [here](https://bobtail.atlassian.net/wiki/spaces/FAC2/pages/639139841/Technical). For example how the audit fields are set on the entities or how Security is implemented.

## Migrations

Because migrations are versioned, it's best to not use in-code entities to manipulate the data. Future changes in the structure of a table will result in a conflict where an old migration will use the current structure defined by the entity.

The best approach would be to use an explicit object that contains the structure of the entity you wish to insert at that certain point in time

__Good example__
```typescript
const clientData = {
  name: 'John',
  id: '123',
  createdAt: new Date()
}

migration.addUser(clientData);
```

__Bad example__
```typescript
import { ClientEntity } from '@module-persistence/entities';

const clientData = new ClientEntity();
clientData.name = 'John';
clientData.id = '123';

migration.addUser(clientData);
```

If we update the structure of the client table by renaming the `name` field to `firstName`,
we would need to modify the migration file as well (because the entity class is a reflection of the current structure of the table). But in that point of time, the structure of the client table was still using `name` instead of `firstName`, thus the migration would fail.

## Worker Service

The worker service is responsible for processing asynchronous tasks. The worker consumes messages from a queue, allowing the main API to offload long-running or resource-intensive operations.

### Architecture

The worker operates independently from the main API service. Communication between the API and the worker is handled via a message queue. This queue is done through the SQS service or a local file-based queue.

### Configuration

The worker uses different message consumers based on the environment:
- **Local/Test Environments:** Uses a file-based queue (`LocalMessageConsumer`, `LocalMessageProducer`).
- **Other Environments (e.g., Dev, Staging, Production):** Uses AWS SQS (`SqsMessageConsumer`, `SqsMessageProducer`).

### Environment Variables

For local/test environments:
- `LOCAL_REPORTS_PATH`: Directory path where generated report files will be stored locally.
- `LOCAL_QUEUE_PATH`: Directory where local queue files will be created and managed.

For other environments (e.g., Dev, Staging, Production):
- `WORKER_JOBS_QUEUE_URL`: The SQS queue URL for worker jobs.

### Running Locally

To run the worker service locally for development:

1.  Ensure `LOCAL_REPORTS_PATH` and `LOCAL_QUEUE_PATH` are defined in your `envs/local.env` file.
2.  Run the command: `npm run start:worker:local`

This will start the worker using the `LocalMessageConsumer` and `LocalMessageProducer`, polling the specified `LOCAL_QUEUE_PATH`.

### Related Infrastructure

The necessary AWS infrastructure components for the worker (e.g., IAM roles, SQS queue, compute resources) are defined within the main CDK stack (`cdk/lib/worker`).


## Quickbooks

Quickbooks integration is handled through the `QuickbooksService`.

### Authentication

To properly authenticate with Quickbooks, you need to use the `initiate-auth` endpoint.

Steps:

1. Call `initiate-auth` endpoint with the final redirect URL as a parameter. This will be the final destination after authentication.
2. The user will be redirected to the Quickbooks authentication page.
3. After authentication, the `callback` endpoint will be called with the authentication code. This code will be used to exchange for an access token, which will be used to make API calls to Quickbooks.
4. After successful authentication, the user will be redirected to the final redirect URL, provided in step 1.
   
### Considerations

- The `returnUrl` parameter should be a valid URL that the user can be redirected to after authentication.
- If the authentication flow is not completed beforehand, any API calls made will fail with 401.
- If the refresh token expires, the user will need to re-authenticate. Any API calls made after the refresh token expires will fail with 401.
