function normalizeOrderId(numeroPedido) {
  if (typeof numeroPedido !== 'string') return '';
  const base = numeroPedido.split('-')[0];
  return base.trim();
}

function toNumber(value) {
  if (value === null || value === undefined) return undefined;
  const n = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function mapIncomingToOrder(doc) {
  const orderId = normalizeOrderId(doc?.numeroPedido);
  const value = toNumber(doc?.valorTotal);
  const creationDate = doc?.dataCriacao ? new Date(doc.dataCriacao).toISOString() : undefined;
  const items = Array.isArray(doc?.items)
    ? doc.items.map((i) => ({
        productId: toNumber(i?.idItem),
        quantity: toNumber(i?.quantidadeItem),
        price: toNumber(i?.valorItem),
      }))
    : [];

  return { orderId, value, creationDate, items };
}

module.exports = { mapIncomingToOrder };

