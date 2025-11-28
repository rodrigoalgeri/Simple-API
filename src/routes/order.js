const express = require('express');
const Order = require('../models/order');

const router = express.Router();

function mapInputToOrder(input) {
  const base = String(input.numeroPedido || '').trim();
  const orderId = base.includes('-') ? base.split('-')[0] : base;
  return {
    orderId,
    value: input.valorTotal,
    creationDate: input.dataCriacao ? new Date(input.dataCriacao) : undefined,
    items: Array.isArray(input.items) ? input.items.map(i => ({
      productId: i.idItem != null ? Number(i.idItem) : undefined,
      quantity: i.quantidadeItem,
      price: i.valorItem
    })) : []
  };
}

router.post('/', async (req, res) => {
  try {
    const data = mapInputToOrder(req.body);
    if (!data.orderId || data.value == null || !data.creationDate || !Array.isArray(data.items) || data.items.length === 0) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
    const exists = await Order.findOne({ orderId: data.orderId });
    if (exists) {
      return res.status(409).json({ error: 'Pedido já existe' });
    }
    const created = await Order.create(data);
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

router.get('/list', async (req, res) => {
  try {
    const orders = await Order.find().lean();
    return res.status(200).json(orders);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar pedidos' });
  }
});

router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId }).lean();
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    return res.status(200).json(order);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao obter pedido' });
  }
});

router.put('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const mapped = mapInputToOrder(req.body);
    const update = {
      value: mapped.value,
      creationDate: mapped.creationDate,
      items: mapped.items
    };
    const updated = await Order.findOneAndUpdate({ orderId }, update, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar pedido' });
  }
});

router.delete('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const deleted = await Order.findOneAndDelete({ orderId });
    if (!deleted) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao deletar pedido' });
  }
});

module.exports = router;

