import { CreateEmployeeRequest } from '../data';

export const buildCreateEmployeeRequest = (
  data?: Partial<CreateEmployeeRequest>,
) => {
  return new CreateEmployeeRequest(data);
};
