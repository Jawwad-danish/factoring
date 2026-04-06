import axios from 'axios';
import * as filestack from 'filestack-js';

export type TransformResponse = {
  container: string;
  filename: string;
  handle: string;
  key: string;
  size: number;
  type: string;
  url: string;
};

export class Filestack {
  private readonly client: filestack.Client;

  constructor(filestackKey: string, private readonly filestackSecret: string) {
    this.client = filestack.init(filestackKey);
  }

  async convertImageToPdf(filestackUrl: string): Promise<TransformResponse> {
    const fileHandle = filestackUrl.substring(
      filestackUrl.lastIndexOf('/') + 1,
    );
    const transformUrl = this.client.transform(fileHandle, {
      security: this.buildSecurity(fileHandle),
      output: {
        format: 'pdf',
      },
      store: {},
    });
    try {
      const result = await axios.get(transformUrl);
      return result.data as TransformResponse;
    } catch (error) {
      console.error(`Could not convert image URL ${filestackUrl} to PDF`);
      throw error;
    }
  }

  private buildSecurity(fileHandle: string) {
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 1);
    return filestack.getSecurity(
      {
        expiry: expiration.getTime() / 1000,
        handle: fileHandle,
      },
      this.filestackSecret,
    );
  }
}
