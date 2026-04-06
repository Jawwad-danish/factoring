export class S3ObjectLocator {
  private readonly key: string;
  private readonly bucket: string;

  getKey(): string {
    return this.key;
  }

  getBucket(): string {
    return this.bucket;
  }

  getPath(): string {
    return `${this.bucket}/${this.key}`;
  }

  toString(): string {
    return this.getPath();
  }

  /**
   * Create an S3 object Locator
   */
  constructor(bucket: string, key: string, encode = false) {
    this.bucket = bucket;
    this.key = encode ? encodeURIComponent(key) : key;
  }
}
