const Order = require('../models/Order');

const memory = new Map();

function useMemory() {
  return !process.env.MONGODB_URI;
}

async function create(order) {
  if (useMemory()) {
    if (!order.orderId) throw new Error('orderId missing');
    if (memory.has(order.orderId)) throw new Error('duplicate');
    memory.set(order.orderId, { ...order });
    return memory.get(order.orderId);
  }
  const created = await Order.create(order);
  return created.toObject();
}

async function findById(orderId) {
  if (useMemory()) {
    return memory.get(orderId) || null;
  }
  const found = await Order.findOne({ orderId }).lean();
  return found;
}

async function findAll() {
  if (useMemory()) {
    return Array.from(memory.values());
  }
  return await Order.find({}).lean();
}

async function update(orderId, updateDoc) {
  if (useMemory()) {
    const existing = memory.get(orderId);
    if (!existing) return null;
    const updated = { ...existing, ...updateDoc };
    memory.set(orderId, updated);
    return updated;
  }
  const updated = await Order.findOneAndUpdate(
    { orderId },
    { $set: updateDoc },
    { new: true }
  ).lean();
  return updated;
}

async function remove(orderId) {
  if (useMemory()) {
    return memory.delete(orderId);
  }
  const res = await Order.deleteOne({ orderId });
  return res.deletedCount > 0;
}

module.exports = { create, findById, findAll, update, remove };

