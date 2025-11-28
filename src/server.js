require('dotenv').config();
const express = require('express');
const { connectMongo } = require('./db/mongo');
const routes = require('./routes/orderRoutes');
const { errorHandler } = require('./middleware/errorHandler');

async function bootstrap() {
  const app = express();
  app.use(express.json());
  app.get('/', (req, res) => {
    res.json({
      status: 'ok',
      endpoints: [
        'POST /order',
        'GET /order/:orderId',
        'GET /order/list',
        'PUT /order/:orderId',
        'DELETE /order/:orderId',
      ],
    });
  });
  app.use(routes);
  app.use(errorHandler);

  const port = process.env.PORT || 3000;
  const uri = process.env.MONGODB_URI;
  let dbStatus = { connected: false };
  try {
    dbStatus = await connectMongo(uri);
  } catch (e) {
    dbStatus = { connected: false };
  }

  app.listen(port, () => {
    const mode = dbStatus.connected ? 'mongo' : 'memory';
    console.log(`API listening on http://localhost:${port} (storage: ${mode})`);
  });
}

bootstrap();
