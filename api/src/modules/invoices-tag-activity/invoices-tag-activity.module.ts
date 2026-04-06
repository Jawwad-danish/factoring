import { AuthModule } from '@module-auth';
import { CommonModule } from '@module-common';
import { PersistenceModule } from '@module-persistence';
import { Module } from '@nestjs/common';
import {
  ChangeActionAssignOperationHandler,
  ChangeActionDeleteOperationHandler,
  InvoiceChangeActionsExecutor,
  InvoiceTagAssignmentValidationService,
} from './services';
import { InvoiceStatusTagAssignmentValidator } from './services/validation/validators';

@Module({
  imports: [AuthModule, PersistenceModule, CommonModule],
  controllers: [],
  providers: [
    ChangeActionAssignOperationHandler,
    ChangeActionDeleteOperationHandler,
    InvoiceChangeActionsExecutor,
    InvoiceTagAssignmentValidationService,
    InvoiceStatusTagAssignmentValidator,
  ],
  exports: [InvoiceChangeActionsExecutor],
})
export class InvoicesTagActivityModule {}
