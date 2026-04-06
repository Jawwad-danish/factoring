export interface IdentityEntity {
  id: string | number;
}

export abstract class PrimitiveEntity implements IdentityEntity {
  id: string | number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: any;
  updatedBy?: any;
  recordStatus: RecordStatus;
}

export enum RecordStatus {
  Active = 'Active',
  Inactive = 'Inactive',
}
