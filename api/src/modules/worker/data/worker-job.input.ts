import { WorkerJobType } from '../../persistence';

export interface WorkerJobInput<T extends object> {
  type: WorkerJobType;
  payload: T;
}
