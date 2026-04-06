import { deepNullRemove } from './deep-null-remove';

class Car {
  constructor(
    public name: string,
    public model: string | null,
    public doors: number,
  ) {}
}

const value = {
  id: 'id',
  age: 20,
  name: 'John Doe',
  nickname: null,
  address: {
    street: 'street',
    number: null,
  },
  dateOfBirth: new Date('2000-01-01'),
  car: new Car('Ford', null, 5),
  banks: [
    {
      bank: {
        name: 'bank',
        zip: null,
      },
    },
    'just-bank-name',
    null,
    5,
  ],
};
const expected = {
  id: value.id,
  age: value.age,
  name: value.name,
  address: {
    street: value.address.street,
  },
  dateOfBirth: new Date('2000-01-01'),
  car: {
    name: 'Ford',
    doors: 5,
  },
  banks: [
    {
      bank: {
        name: 'bank',
      },
    },
    'just-bank-name',
    5,
  ],
};

describe('Remove deep null', () => {
  it('Null values are remove successfully', () => {
    const result = deepNullRemove(value);
    expect(result).toStrictEqual(expected);
  });
});
