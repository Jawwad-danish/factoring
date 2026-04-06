import { Response } from 'superagent';

export const expectEmptyBody = (response: Response) => {
  expect(response.body).toStrictEqual({});
};
