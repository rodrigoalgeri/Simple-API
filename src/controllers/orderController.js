const Joi = require('joi');
const repo = require('../repository/orderRepository');
const { mapIncomingToOrder } = require('../utils/mapOrder');

const incomingSchema = Joi.object({
  numeroPedido: Joi.string().min(1).required(),
  valorTotal: Joi.number().required(),
  dataCriacao: Joi.string().isoDate().required(),
  items: Joi.array()
    .items(
      Joi.object({
        idItem: Joi.alternatives(Joi.string(), Joi.number()).required(),
        quantidadeItem: Joi.number().required(),
        valorItem: Joi.number().required(),
      })
    )
    .min(1)
    .required(),
});

async function createOrder(req, res, next) {
  try {
    const { error } = incomingSchema.validate(req.body);
    if (error) return res.status(400).json({ message: 'Payload inválido', details: error.details });
    const mapped = mapIncomingToOrder(req.body);
    if (!mapped.orderId || mapped.value === undefined || !mapped.creationDate)
      return res.status(400).json({ message: 'Campos obrigatórios ausentes após transformação' });

    try {
      const saved = await repo.create({
        orderId: mapped.orderId,
        value: mapped.value,
        creationDate: mapped.creationDate,
        items: mapped.items,
      });
      return res.status(201).json(saved);
    } catch (e) {
      if (String(e.message).includes('duplicate'))
        return res.status(409).json({ message: 'Pedido já existe' });
      throw e;
    }
  } catch (err) {
    next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const found = await repo.findById(orderId);
    if (!found) return res.status(404).json({ message: 'Pedido não encontrado' });
    return res.json(found);
  } catch (err) {
    next(err);
  }
}

async function listOrders(req, res, next) {
  try {
    const all = await repo.findAll();
    return res.json(all);
  } catch (err) {
    next(err);
  }
}

async function updateOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const { error } = incomingSchema.validate(req.body);
    if (error) return res.status(400).json({ message: 'Payload inválido', details: error.details });
    const mapped = mapIncomingToOrder(req.body);
    const updateDoc = {
      value: mapped.value,
      creationDate: mapped.creationDate,
      items: mapped.items,
    };
    const updated = await repo.update(orderId, updateDoc);
    if (!updated) return res.status(404).json({ message: 'Pedido não encontrado' });
    return res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const ok = await repo.remove(orderId);
    if (!ok) return res.status(404).json({ message: 'Pedido não encontrado' });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, getOrder, listOrders, updateOrder, deleteOrder };

