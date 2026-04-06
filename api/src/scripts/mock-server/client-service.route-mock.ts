import express, { Request, Response, Router } from 'express';
import * as client from './resources/clients/client.json';
import * as clientBankAccount from './resources/clients/clientBankAccount.json';

export const clientRouter: Router = express.Router();

clientRouter.get('/clients/get-all-clients', (_req: Request, res: Response) => {
  console.log(`Sending response for fetching all client statuses`);
  const items = [client];
  res.send({
    items: items,
    pagination: {
      page: 1,
      itemsPerPage: 10,
      totalItems: items.length,
      totalPages: 1,
    },
  });
  res.statusCode = 400;
});

clientRouter.get('/clients/getByIds/id', (req: Request, res: Response) => {
  console.log(`Sending response for fetching clients`);
  const clientIds = Array.isArray(req.query.id) ? req.query.id : [req.query.id];
  const items = clientIds.map((clientId) =>
    buildMockClient(clientId as string),
  );
  res.send({
    items: items,
    pagination: {
      page: 1,
      itemsPerPage: 10,
      totalItems: items.length,
      totalPages: 1,
    },
  });
});

clientRouter.get(
  '/clients/:id/bank-accounts',
  (req: Request, res: Response) => {
    console.log(
      `Sending response for fetching client bank account for client with id ${req.params.id}`,
    );
    res.send({ items: [clientBankAccount] });
  },
);

clientRouter.get(
  '/clients/:id/bank-accounts/:bankAccountId',
  (req: Request, res: Response) => {
    console.log(
      `Sending response for fetching client bank account for client with id ${req.params.id}`,
    );
    res.send(clientBankAccount);
  },
);

clientRouter.post('/clients', (req: Request, res: Response) => {
  console.log(`Sending response for creating client with id ${req.params.id}`);
  res.send(buildMockClient(req.params.id));
});

clientRouter.get('/clients/:id', (req: Request, res: Response) => {
  console.log(`Sending response for fetching client with id ${req.params.id}`);
  res.send(buildMockClient(req.params.id));
});

clientRouter.post('/clients-bank-accounts', (req: Request, res: Response) => {
  console.log(
    `Sending response for fetching client bank accounts for clients with ids ${req.body.clientIds}`,
  );
  const clientIds = req.body;
  const items = clientIds.map((clientId) => ({
    clientId,
    bankAccounts: [clientBankAccount],
  }));
  res.send(items);
});

function buildMockClient(clientId: string) {
  return {
    ...client,
    id: clientId,
  };
}
