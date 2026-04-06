import { Arrays, CrossCuttingConcerns } from '@core/util';
import { CommandRunner } from '@module-cqrs';
import { Transactional } from '@module-database';
import { InvoiceContext } from '@module-invoices/data';
import { PendingBuyoutRepository, RecordStatus } from '@module-persistence';
import { Injectable } from '@nestjs/common';
import Big from 'big.js';
import { parse } from 'csv-parse/sync';
import {
  PendingBuyout,
  UpdateBuyoutRequest,
  UploadBuyoutsBatchRequest,
  CreateBuyoutsRequest,
  CreateBuyoutsBatchRequest,
  DeleteBuyoutRequest,
} from '@fs-bobtail/factoring/data';
import { PendingBuyoutMapper } from '../data';
import {
  BulkPurchaseCommand,
  CreateBuyoutsBatchCommand,
  DeleteBuyoutCommand,
  UpdateBuyoutCommand,
} from './commands';

@Injectable()
export class BuyoutsService {
  constructor(
    private readonly pendingBuyoutRepository: PendingBuyoutRepository,
    private readonly mapper: PendingBuyoutMapper,
    private readonly commandRunner: CommandRunner,
  ) {}

  @CrossCuttingConcerns<BuyoutsService, 'create'>({
    logging: () => {
      return {
        message: 'Create batch buyouts',
      };
    },
  })
  @Transactional('create-buyouts')
  async create(request: CreateBuyoutsBatchRequest): Promise<void> {
    await this.commandRunner.run(new CreateBuyoutsBatchCommand(request));
  }

  @CrossCuttingConcerns({
    logging: (
      file: Express.Multer.File,
      request: UploadBuyoutsBatchRequest,
    ) => {
      return {
        message: 'Upload buyouts file',
        payload: {
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          clientId: request.clientId,
        },
      };
    },
  })
  @Transactional('upload-buyouts')
  async upload(
    file: Express.Multer.File,
    request: UploadBuyoutsBatchRequest,
  ): Promise<void> {
    const data = await this.parseBuyoutFile(file);
    const createRequest = new CreateBuyoutsBatchRequest({
      batch: data.map(
        (row) =>
          new CreateBuyoutsRequest({
            clientId: request.clientId,
            loadNumber: row['load number'],
            mc: row['mc'],
            rate: new Big(row['rate']),
            buyoutDate: new Date(row['buyout date']),
            brokerName: row['debtor name'],
          }),
      ),
    });
    await this.commandRunner.run(new CreateBuyoutsBatchCommand(createRequest));
  }

  private async parseBuyoutFile(
    file: Express.Multer.File,
  ): Promise<Array<any>> {
    const data: Array<any> = await parse(file.buffer, {
      skipEmptyLines: true,
      fromLine: 2,
    });
    return data;
  }

  @CrossCuttingConcerns({
    logging: (id: string) => {
      return {
        message: 'Updating pending buyout invoice',
        payload: {
          id,
        },
      };
    },
  })
  @Transactional('update-buyout')
  async update(id: string, request: UpdateBuyoutRequest) {
    const buyout = await this.commandRunner.run(
      new UpdateBuyoutCommand(id, request),
    );
    return this.mapper.entityToModel(buyout);
  }

  @CrossCuttingConcerns({
    logging: () => {
      return {
        message: 'Fetching buyouts',
      };
    },
  })
  async findAll(): Promise<PendingBuyout[]> {
    const [entities] = await this.pendingBuyoutRepository.findAll(
      {
        recordStatus: RecordStatus.Active,
      },
      {
        orderBy: {
          createdAt: 'DESC',
        },
      },
    );
    const pendingBuyouts = await Arrays.mapAsync(entities, (e) =>
      this.mapper.entityToModel(e),
    );
    return pendingBuyouts;
  }

  @CrossCuttingConcerns({
    logging: (id: string) => {
      return {
        message: 'Deleting pending buyout with id',
        payload: {
          id,
        },
      };
    },
  })
  @Transactional('delete-buyout')
  async delete(id: string, request: DeleteBuyoutRequest): Promise<void> {
    await this.commandRunner.run(new DeleteBuyoutCommand(id, request));
  }

  @CrossCuttingConcerns({
    logging: () => {
      return {
        message: 'Bulk purchasing buyouts',
      };
    },
  })
  @Transactional('bulk-purchase-buyouts')
  async bulkPurchase(): Promise<InvoiceContext[]> {
    return this.commandRunner.run(new BulkPurchaseCommand());
  }
}
