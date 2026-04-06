import * as filestackJS from 'filestack-js';
import axios from 'axios';
import { Filestack } from './filestack';

jest.mock('filestack-js', () => {
  return {
    getSecurity: jest.fn(),
    init: jest.fn(() => {
      return {
        transform: jest.fn(),
      };
    }),
  };
});
jest.mock('axios');

const mockAxiosHappyPath = () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  mockedAxios.get.mockResolvedValue({
    data: '',
  });
};

describe('Filestack', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('Client is initialized', () => {
    new Filestack('', '');

    const initSpy = jest.spyOn(filestackJS, 'init');
    expect(initSpy).toBeCalledTimes(1);
  });

  it('Request is sent to do transformations', async () => {
    mockAxiosHappyPath();
    const filestack = new Filestack('', '');
    await filestack.convertImageToPdf('http://filestack/file-handle');
    expect(axios.get).toBeCalledTimes(1);
  });
});
