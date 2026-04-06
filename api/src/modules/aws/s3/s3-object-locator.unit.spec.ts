import { S3ObjectLocator } from './s3-object-locator';

describe('S3 Utils', () => {
  describe('S3 Object Locator', () => {
    test('Key gets encoded properly', () => {
      const s3Object = new S3ObjectLocator('my_bucket', 'my_key+=$', true);
      expect(s3Object.getKey()).toBe('my_key%2B%3D%24');
    });
  });
});
