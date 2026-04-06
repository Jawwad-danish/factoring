import { Test } from '@nestjs/testing';
import { BobtailLoggingModule } from './logging.module';
describe('Bobtail Logging Module', function () {
  it('started succesfully', async function () {
    const rootModule = await Test.createTestingModule({
      imports: [BobtailLoggingModule],
    }).compile();

    expect(rootModule.get(BobtailLoggingModule)).toBeDefined();
  });
});
