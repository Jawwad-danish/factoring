import { ClientSuccessTeamEntity } from '@module-persistence/entities';

export function buildClientSuccessTeam(
  sourceData: any,
): ClientSuccessTeamEntity {
  const entity = new ClientSuccessTeamEntity();
  entity.id = sourceData.id;
  entity.name = `${sourceData.first_name.trim()} ${sourceData.last_name.trim()}`;
  return entity;
}
