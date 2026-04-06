import { pipeline, Readable, Transform } from 'stream';

export interface TypedReadable<T> extends Readable {
  push(chunk: T | null, encoding?: BufferEncoding): boolean;
}

export abstract class TypedTransform<TInput, TOutput = any> extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  abstract doTransform(chunk: TInput): TOutput;

  _transform(
    chunk: TInput,
    _encoding: string,
    callback: (error?: Error | null, data?: TOutput) => void,
  ): void {
    try {
      const transformed = this.doTransform(chunk);
      this.push(transformed);
      callback();
    } catch (err) {
      this.emit('error', err);
      callback(err);
    }
  }
}

export class WrappedReadable<TInput> {
  constructor(private readonly stream: Readable) {}

  pipeline<TOutput>(transformer: TypedTransform<TInput, TOutput>) {
    return pipeline(this.stream, transformer, (err) => {
      if (err) {
        throw err;
      }
    });
  }
}
