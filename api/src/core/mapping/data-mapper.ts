export interface DataMapper<TEntity, TModel> {
  entityToModel(entity: TEntity): Promise<TModel>;
}
