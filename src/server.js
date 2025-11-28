const express = require('express');
const { connectDB } = require('./db');
const orderRoutes = require('./routes/order');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/order', orderRoutes);

(async () => {
  try {
    await connectDB();
    app.listen(port, () => {});
  } catch (err) {
    process.exit(1);
  }
})();

