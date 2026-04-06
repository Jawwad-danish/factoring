import { Convert } from './convert';

const URL_TO_CONVERT = 'http://localhost/to-convert';
const URL_CONVERTED = 'http://localhost/converted';

const mockConvert = jest.fn();

jest.mock('convertapi', () => {
  return jest.fn().mockImplementation(() => ({
    convert: mockConvert,
  }));
});

const mockConvertHappyPath = () => {
  mockConvert.mockReturnValueOnce(
    Promise.resolve({
      file: {
        url: URL_CONVERTED,
      },
      files: [
        {
          url: URL_CONVERTED,
        },
      ],
    }),
  );
};

describe('Convert API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Compress', () => {
    mockConvertHappyPath();
    new Convert('', '').compress(URL_TO_CONVERT);

    const params = mockConvert.mock.calls[0];
    expect(mockConvert).toHaveBeenCalledTimes(1);
    expect(params[0]).toBe('compress');
    expect(params[1]).toStrictEqual({
      File: URL_TO_CONVERT,
      SubsetEmbeddedFonts: false,
    });
  });

  it('Rotate', () => {
    mockConvertHappyPath();
    new Convert('', '').rotate(URL_TO_CONVERT, 10);

    const params = mockConvert.mock.calls[0];
    expect(mockConvert).toHaveBeenCalledTimes(1);
    expect(params[0]).toBe('rotate');
    expect(params[1]).toStrictEqual({
      File: URL_TO_CONVERT,
      RotatePage: 10,
    });
  });

  it('Split', () => {
    mockConvertHappyPath();
    new Convert('', '').split(URL_TO_CONVERT);

    const params = mockConvert.mock.calls[0];
    expect(mockConvert).toHaveBeenCalledTimes(1);
    expect(params[0]).toBe('split');
    expect(params[1]).toStrictEqual({
      File: URL_TO_CONVERT,
    });
  });
});
