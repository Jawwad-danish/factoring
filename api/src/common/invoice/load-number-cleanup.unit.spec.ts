import { loadNumberCleanup } from './load-number-cleanup';

describe('Load Number Cleanup', () => {
  it('Load is removed', () => {
    expect(loadNumberCleanup('load123')).toBe('123');
  });

  it('Ref is removed', () => {
    expect(loadNumberCleanup('ref123')).toBe('123');
  });

  it('Pro is removed', () => {
    expect(loadNumberCleanup('pro123')).toBe('123');
  });

  it('Trip is removed', () => {
    expect(loadNumberCleanup('trip123')).toBe('123');
  });

  it('Number is removed', () => {
    expect(loadNumberCleanup('number123')).toBe('123');
  });

  it('# is removed', () => {
    expect(loadNumberCleanup('#123')).toBe('123');
  });

  it('- is removed', () => {
    expect(loadNumberCleanup('12-3')).toBe('123');
  });

  it('Load number is cleaned up', () => {
    expect(loadNumberCleanup('load#123')).toBe('123');
  });
});
