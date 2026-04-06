import express, { Request, Response, Router } from 'express';
import * as expedite from './resources/transfers/expedite.json';

export const transfersRouter: Router = express.Router();

transfersRouter.post(
  '/v1/transfers/expedite',
  (req: Request, res: Response) => {
    console.log(`Sending response for creating an expedite transfer`);
    res.statusCode = 200;
    res.send(buildMockRtpResponse(req.body.batchPaymentId));
  },
);

transfersRouter.post('/v1/transfers/ach', (req: Request, res: Response) => {
  console.log(`Sending response for creating an ach transfer`);
  res.statusCode = 200;
  res.send(buildMockRtpResponse(req.body.batchPaymentId));
});

transfersRouter.get(
  '/v1/transfers/verify-rtp',
  (req: Request, res: Response) => {
    console.log(`Sending response for verifying RTP support through MT`);
    res.statusCode = 200;
    const list = req.body;
    res.send(list);
  },
);

transfersRouter.post(
  '/v2/transfers/expedite',
  (req: Request, res: Response) => {
    console.log(`Sending response for expedited payment order`);
    res.statusCode = 200;
    const list = req.body;
    res.send(list);
  },
);

transfersRouter.get(
  '/v2/transfers/verify-rtp',
  (req: Request, res: Response) => {
    console.log(`Sending response for verifying RTP support through BofA`);
    res.statusCode = 200;
    const list = req.body;
    res.send(list);
  },
);

function buildMockRtpResponse(batchPaymentId: string) {
  return {
    ...expedite,
    batchTransferId: batchPaymentId,
  };
}
