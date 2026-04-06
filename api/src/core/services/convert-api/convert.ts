import ConvertAPI from 'convertapi';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf';

type Rotate = {
  page: number;
  angle: number;
};

export class Convert {
  private readonly client: ConvertAPI;

  constructor(convertApiKey: string, convertApiUri: string) {
    this.client = new ConvertAPI(convertApiKey, {
      baseUri: convertApiUri,
    });
  }

  async compress(url: string): Promise<string> {
    console.log(`Compressing URL ${url}`);
    try {
      const result = await this.client.convert(
        'compress',
        {
          File: url,
          SubsetEmbeddedFonts: false,
        },
        'pdf',
      );
      console.log(`Finished compressing URL ${url}`);
      return result.file.url;
    } catch (error) {
      console.error(`Could not compress URL ${url}`);
      throw error;
    }
  }

  async rotate(url: string, angle: number): Promise<string> {
    console.log(`Rotating URL ${url} to angle ${angle}`);
    try {
      const result = await this.client.convert('rotate', {
        File: url,
        RotatePage: angle,
      });
      console.log(`Finished rotating URL ${url} to angle ${angle}`);
      return result.file.url;
    } catch (error) {
      console.error(`Could not rotate URL ${url} to angle ${angle}`);
      throw error;
    }
  }

  async split(url: string): Promise<string[]> {
    console.log(`Splitting URL ${url}`);
    try {
      const result = await this.client.convert('split', {
        File: url,
      });
      console.log(`Finished splitting URL ${url}`);
      return result.files.map((file) => file.url);
    } catch (error) {
      console.error(`Could not split URL ${url}`);
      throw error;
    }
  }

  async merge(urls: string[]): Promise<string> {
    console.log(`Merging URLs ${urls}`);
    if (urls && urls.length === 0) {
      throw new Error('Missing URLs for merging');
    }

    try {
      const result = await this.client.convert('merge', {
        Files: urls,
        PageSize: 'usletter',
      });
      console.log(`Finished merging URLs ${urls}`);
      return result.file.url;
    } catch (error) {
      console.error(`Could not merge URLs ${urls}`);
      throw error;
    }
  }

  async orient(url: string): Promise<string> {
    console.log(`Orienting URL ${url}`);
    const rotations = await this.getCorrectRotations(url);
    if (rotations.length > 0) {
      const splitUrls = await this.split(url);
      const rotationResults = await Promise.all(
        splitUrls.map((splitUrl, index) => {
          if (rotations[index].angle === 0) {
            return splitUrl;
          }
          return this.rotate(splitUrl, rotations[index].angle);
        }),
      );

      return this.merge(rotationResults);
    } else {
      return this.rotate(url, rotations[0].angle);
    }
  }

  private async getCorrectRotations(url: string): Promise<Rotate[]> {
    const pdf = await this.loadPdf(url);
    const rotations: Rotate[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      const rotation =
        viewport.rotation <= 0 ? viewport.rotation + 360 : viewport.rotation;
      const rotate = {
        page: i,
        angle: 360 - rotation,
      };
      if (viewport.rotation === 0 && viewport.width > viewport.height) {
        rotate.angle = 270;
      }
      rotations.push(rotate);
    }

    return rotations;
  }

  private loadPdf(url: string) {
    try {
      return getDocument(url).promise;
    } catch (error) {
      console.error(`Could not load PDF from url ${url}`);
      throw error;
    }
  }

  async urlToPDF(url: string): Promise<string> {
    const result = await this.client.convert(
      'pdf',
      {
        Url: url,
        MarginRight: 0,
        MarginTop: 0,
        MarginLeft: 0,
        MarginBottom: 0,
        RespectViewport: false,
      },
      'web',
    );
    return result.file.url;
  }
}
