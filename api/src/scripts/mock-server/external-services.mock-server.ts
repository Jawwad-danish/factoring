import express, { Express } from 'express';
import { brokerRouter } from './broker-service.route-mock';
import { clientRouter } from './client-service.route-mock';
import { transfersRouter } from './transfers-service.route-mock';
import path from 'path';

const app: Express = express();
const port = process.env.PORT || 4001;

app.use(express.json());
app.use('/clients', clientRouter);
app.use('/brokers', brokerRouter);
app.use('/transfers', transfersRouter);
app.use('/public/assets', express.static(path.join(__dirname, 'assets')));
app.listen(port, () => {
  console.log(`External services mock started on http://localhost:${port}`);
});
