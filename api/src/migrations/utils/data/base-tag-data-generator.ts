export interface BaseTagDataGenerator {
  buildTag(...args: any[]): any;
  buildGroup(...args: any[]): any;
  buildAssociation(groupId: any, tagId: any): any;
}
