const Joi = require('joi');

// Esquema de validação para o payload original (em português)
const createOrderSchema = Joi.object({
  numeroPedido: Joi.string().trim().required(),
  valorTotal: Joi.number().integer().min(0).required(),
  dataCriacao: Joi.string().isoDate().required(),
  items: Joi.array()
    .items(
      Joi.object({
        idItem: Joi.string().trim().required(),
        quantidadeItem: Joi.number().integer().min(1).required(),
        valorItem: Joi.number().integer().min(0).required(),
      })
    )
    .min(1)
    .required(),
});

// Função de transformação (mapping) do JSON de entrada para o modelo do banco
function mapToOrderModel(input) {
  // Extrai somente a parte antes do sufixo "-01" caso exista
  const orderId = (input.numeroPedido || '').split('-')[0];

  // Normaliza a data para formato ISO sem milissegundos extras e com sufixo Z
  const date = new Date(input.dataCriacao);
  const creationDate = date.toISOString();

  return {
    orderId,
    value: input.valorTotal,
    creationDate,
    items: (input.items || []).map((it) => ({
      productId: Number(it.idItem),
      quantity: it.quantidadeItem,
      price: it.valorItem,
    })),
  };
}

module.exports = { createOrderSchema, mapToOrderModel };
