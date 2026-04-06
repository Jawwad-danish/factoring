import { percentOf, percentageOfNumber } from './percentage';

describe('Formulas - percentage', () => {
  it('20 is 40% of 50', () => {
    const result = percentageOfNumber(20, 50);
    expect(result.eq(40)).toBe(true);
  });

  it('30 is 33.3333% of 90 if rounded', () => {
    const result = percentageOfNumber(30, 90);
    expect(result.round(4).eq(33.3333)).toBe(true);
  });

  it('30 is not 33.3333% of 90 if not rounded', () => {
    const result = percentageOfNumber(30, 90);
    expect(result.eq(33.3333)).toBe(false);
  });

  it('20% of 150 is 30', () => {
    const result = percentOf(20, 150);
    expect(result.eq(30)).toBe(true);
  });
});
