export type PartialPick<Type, Keys extends keyof Type> = Partial<
  Omit<Type, Keys>
> &
  Pick<Type, Keys>;
