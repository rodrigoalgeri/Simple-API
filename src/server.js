require('dotenv').config();
const express = require('express');
const { runMigrations, OrderRepository } = require('./db');
const { createOrderSchema, mapToOrderModel } = require('./orderService');
const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('./swagger.json');
const { authenticate, loginHandler } = require('./auth');

const app = express();

// Middleware para parse de JSON
app.use(express.json());

// Documentação Swagger na rota /docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Health-check simples
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Autenticação básica via JWT: POST /login
app.post('/login', loginHandler);

// Cria um novo pedido: POST /order
app.post('/order', authenticate, async (req, res) => {
  try {
    // Validação do payload original
    const { error, value } = createOrderSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: 'Payload inválido', details: error.details });
    }

    // Mapeia para o modelo interno e persiste
    const order = mapToOrderModel(value);
    try {
      await OrderRepository.create(order);
    } catch (err) {
      if (err && err.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({ message: 'Pedido já existe' });
      }
      throw err;
    }
    return res.status(201).json(order);
  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    return res.status(500).json({ message: 'Erro interno ao criar pedido' });
  }
});

// Obter pedido por ID: GET /order/:orderId
app.get('/order/:orderId', async (req, res) => {
  try {
    const order = await OrderRepository.getById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });
    return res.status(200).json(order);
  } catch (err) {
    console.error('Erro ao obter pedido:', err);
    return res.status(500).json({ message: 'Erro interno ao obter pedido' });
  }
});

// Listar todos os pedidos: GET /order/list
app.get('/order/list', async (req, res) => {
  try {
    const orders = await OrderRepository.listAll();
    return res.status(200).json(orders);
  } catch (err) {
    console.error('Erro ao listar pedidos:', err);
    return res.status(500).json({ message: 'Erro interno ao listar pedidos' });
  }
});

// Atualizar pedido: PUT /order/:orderId
app.put('/order/:orderId', authenticate, async (req, res) => {
  try {
    // Reutiliza o mesmo schema de criação, pois operação substitui os itens
    const { error, value } = createOrderSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: 'Payload inválido', details: error.details });
    }

    const mapped = mapToOrderModel(value);
    // Garante que o path param prevalece como orderId alvo
    try {
      const updated = await OrderRepository.update(req.params.orderId, mapped);
      return res.status(200).json(updated);
    } catch (err) {
      if (err && err.message === 'ORDER_NOT_FOUND') {
        return res.status(404).json({ message: 'Pedido não encontrado' });
      }
      throw err;
    }
  } catch (err) {
    console.error('Erro ao atualizar pedido:', err);
    return res.status(500).json({ message: 'Erro interno ao atualizar pedido' });
  }
});

// Deletar pedido: DELETE /order/:orderId
app.delete('/order/:orderId', authenticate, async (req, res) => {
  try {
    const deleted = await OrderRepository.delete(req.params.orderId);
    if (!deleted) return res.status(404).json({ message: 'Pedido não encontrado' });
    return res.status(204).send();
  } catch (err) {
    console.error('Erro ao deletar pedido:', err);
    return res.status(500).json({ message: 'Erro interno ao deletar pedido' });
  }
});

// Middleware de rota não encontrada
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Inicializa banco e inicia servidor
runMigrations();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API-SIMPLE rodando em http://localhost:${PORT}`);
  console.log(`Docs Swagger em http://localhost:${PORT}/docs`);
});
