export class SqlHelper {
  static inOperatorValues(values: string[]): string {
    return `'${values.join("','")}'`;
  }
}
