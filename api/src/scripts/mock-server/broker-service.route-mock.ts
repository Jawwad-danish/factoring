import express, { Request, Response, Router } from 'express';
import * as broker from './resources/broker.json';

export const brokerRouter: Router = express.Router();

brokerRouter.get('/brokers/get-all-brokers', (_req: Request, res: Response) => {
  console.log(`Sending response for fetching all brokers`);
  const items = [broker];
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

brokerRouter.get('/brokers/getByIds/id', (req: Request, res: Response) => {
  console.log(`Sending response for fetching brokers`);
  const ids = Array.isArray(req.query.id) ? req.query.id : [req.query.id];
  const items = ids.map((id) => {
    return { ...broker, id: id };
  });
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

brokerRouter.get('/brokers/:id', (req: Request, res: Response) => {
  console.log(`Sending response for fetching broker with id ${req.params.id}`);
  res.send({
    ...broker,
    id: req.params.id,
  });
});

brokerRouter.get('/brokers', (_req: Request, res: Response) => {
  console.log(`Sending response for fetching brokers`);
  const items = [broker];
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
