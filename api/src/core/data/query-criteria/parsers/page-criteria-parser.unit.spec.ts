import { ValidationError } from 'class-validator';
import { parsePageQuery } from './page-criteria-parser';

describe('Page query param parser', () => {
  it('When page query param does not exist default values are returned', () => {
    const pageQuery = parsePageQuery({});

    expect(pageQuery).toBeDefined();
    expect(pageQuery.page).toBe(1);
    expect(pageQuery.limit).toBe(10);
  });

  it('When page query param does exist values are returned', () => {
    const pageQuery = parsePageQuery({
      page: '5',
      limit: '5',
    });

    expect(pageQuery).toBeDefined();
    expect(pageQuery.page).toBe(5);
    expect(pageQuery.limit).toBe(5);
  });

  it('When page query exists and is not number then exception is thrown', () => {
    expect(() => {
      parsePageQuery({
        page: 'asd',
      });
    }).toThrow(ValidationError);
  });

  it('When limit query exists and is not number then exception is thrown', () => {
    expect(() => {
      parsePageQuery({
        limit: 'asd',
      });
    }).toThrow(ValidationError);
  });
});
