import { dollarsToPennies, penniesToDollars } from './money';

describe('Formulas - money', () => {
  it('Fixed amount of dollars are converted to pennies', () => {
    const result = dollarsToPennies(100);
    expect(result.eq(10000)).toBe(true);
  });

  it('Dollars and pennies are converted to pennies', () => {
    const result = dollarsToPennies(1.23);
    expect(result.eq(123)).toBe(true);
  });

  it('Fixed amount of pennies are converted to dollars', () => {
    const result = penniesToDollars(100);
    expect(result.eq(1)).toBe(true);
  });

  it('Amount of pennies are converted to dollars', () => {
    const result = penniesToDollars(123);
    expect(result.eq(1.23)).toBe(true);
  });
});
