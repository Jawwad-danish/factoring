import {
  BrokerEvents,
  BrokerLimitEvent,
  ClientEvents,
  ClientLimitEvent,
} from '@common/events';
import { Arrays } from '@core/util';
import { CommandRunner, EventPublisher } from '@module-cqrs';
import { Transactional } from '@module-database';
import { BrokerPaymentRepository } from '@module-persistence';
import { Injectable } from '@nestjs/common';
import {
  BrokerPayment,
  BrokerPaymentCreatedEvent,
  BrokerPaymentDeletedEvent,
  BrokerPaymentMapper,
  BrokerPaymentsQuery,
  BrokerPaymentState,
  BrokerPaymentUpdatedEvent,
  CreateBrokerPaymentRequest,
  DeleteBrokerPaymentRequest,
  UpdateBrokerPaymentRequest,
} from '../data';
import {
  CreateBrokerPaymentCommand,
  DeleteBrokerPaymentCommand,
  NonFactoredPaymentCommand,
  UpdateBrokerPaymentCommand,
} from './commands';

@Injectable()
export class BrokerPaymentService {
  constructor(
    private brokerPaymentRepository: BrokerPaymentRepository,
    private commandRunner: CommandRunner,
    protected brokerPaymentMapper: BrokerPaymentMapper,
    private readonly eventEmitter: EventPublisher,
  ) {}

  async create(request: CreateBrokerPaymentRequest): Promise<BrokerPayment> {
    const entity = await this.doCreate(request);

    this.eventEmitter.emit(
      BrokerPaymentCreatedEvent.EVENT_NAME,
      new BrokerPaymentCreatedEvent(entity.id),
    );
    if (entity.invoice.brokerId) {
      this.eventEmitter.emit(
        BrokerEvents.Limit,
        new BrokerLimitEvent(entity.invoice.brokerId),
      );
    }

    this.eventEmitter.emit(
      ClientEvents.Limit,
      new ClientLimitEvent(entity.invoice.clientId),
    );
    return this.brokerPaymentMapper.entityToModel(entity);
  }

  @Transactional('create-broker-payment')
  private async doCreate(request: CreateBrokerPaymentRequest) {
    return this.commandRunner.run(new CreateBrokerPaymentCommand(request));
  }

  async update(
    id: string,
    request: UpdateBrokerPaymentRequest,
  ): Promise<BrokerPayment> {
    const currentEntity = await this.brokerPaymentRepository.getOneById(id);
    const previousState: BrokerPaymentState = {
      batchDate: currentEntity.batchDate,
      checkNumber: currentEntity.checkNumber,
      type: currentEntity.type,
    };
    const updatedEntity = await this.doUpdate(id, request);
    this.eventEmitter.emit(
      BrokerPaymentUpdatedEvent.EVENT_NAME,
      new BrokerPaymentUpdatedEvent(updatedEntity.id, previousState),
    );
    return this.brokerPaymentMapper.entityToModel(updatedEntity);
  }

  @Transactional('update-broker-payment')
  private doUpdate(id: string, request: UpdateBrokerPaymentRequest) {
    return this.commandRunner.run(new UpdateBrokerPaymentCommand(id, request));
  }

  async delete(
    id: string,
    request: DeleteBrokerPaymentRequest,
  ): Promise<BrokerPayment> {
    const entity = await this.doDelete(id, request);
    this.eventEmitter.emit(
      BrokerPaymentDeletedEvent.EVENT_NAME,
      new BrokerPaymentDeletedEvent(entity.id),
    );
    return this.brokerPaymentMapper.entityToModel(entity);
  }

  @Transactional('delete-broker-payment')
  private doDelete(id: string, payload: DeleteBrokerPaymentRequest) {
    return this.commandRunner.run(new DeleteBrokerPaymentCommand(id, payload));
  }

  @Transactional()
  async findAllByInvoiceId(
    query: BrokerPaymentsQuery,
  ): Promise<BrokerPayment[]> {
    const brokerPaymentsEntities =
      await this.brokerPaymentRepository.getByInvoiceId(query.invoiceId);
    return Arrays.mapAsync(brokerPaymentsEntities, (e) =>
      this.brokerPaymentMapper.entityToModel(e),
    );
  }

  async createNonFactored(
    request: CreateBrokerPaymentRequest,
  ): Promise<BrokerPayment> {
    const entity = await this.doCreateNonFactored(request);
    return this.brokerPaymentMapper.entityToModel(entity);
  }

  @Transactional('create-non-factored-payment')
  private doCreateNonFactored(request: CreateBrokerPaymentRequest) {
    return this.commandRunner.run(new NonFactoredPaymentCommand(request));
  }
}
