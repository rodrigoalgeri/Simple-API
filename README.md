# Simple-API

API simples em Node.js para gerenciar pedidos (CRUD) com transformação de dados, validação e armazenamento em MongoDB ou memória.

## Visão Geral
- Stack: Node.js, Express, Joi, Mongoose
- Persistência: MongoDB (quando `MONGODB_URI` está definido) ou memória (fallback automático)
- Endpoints:
  - `POST /order` cria novo pedido
  - `GET /order/:orderId` obtém um pedido
  - `GET /order/list` lista pedidos
  - `PUT /order/:orderId` atualiza um pedido
  - `DELETE /order/:orderId` remove um pedido
- Transformação de payload conforme especificado no desafio

## Requisitos
- Node.js 18+
- Opcional: MongoDB (Atlas ou local)

## Instalação e Execução
```bash
npm install
# memória (sem MongoDB):
npm start
# com MongoDB:
# crie .env com PORT e MONGODB_URI
npm start
```

Exemplo `.env`:
```env
PORT=3000
MONGODB_URI=mongodb+srv://user:password@cluster/dbname?retryWrites=true&w=majority
```

Status raiz:
```text
GET /
{"status":"ok","endpoints":["POST /order","GET /order/:orderId","GET /order/list","PUT /order/:orderId","DELETE /order/:orderId"]}
```

## Mapeamento de Dados
Entrada (payload de criação):
```json
{
  "numeroPedido": "v10089015vdb-01",
  "valorTotal": 10000,
  "dataCriacao": "2023-07-19T12:24:11.5299601+00:00",
  "items": [
    {
      "idItem": "2434",
      "quantidadeItem": 1,
      "valorItem": 1000
    }
  ]
}
```
Transformação aplicada:
```json
{
  "orderId": "v10089015vdb",
  "value": 10000,
  "creationDate": "2023-07-19T12:24:11.529Z",
  "items": [
    {
      "productId": 2434,
      "quantity": 1,
      "price": 1000
    }
  ]
}
```
Implementação do mapeamento: `src/utils/mapOrder.js:13`

## Validação
- `Joi` valida o payload:
  - `numeroPedido`: string obrigatória
  - `valorTotal`: número obrigatório
  - `dataCriacao`: ISO date obrigatória
  - `items`: array de itens com `idItem`, `quantidadeItem`, `valorItem` obrigatórios
- Validação em: `src/controllers/orderController.js:5`

## Tratamento de Erros
- Middleware global retorna JSON consistente (500 quando inesperado)
- Erros de validação: 400 com `details`
- Duplicidade de pedido: 409
- Não encontrado: 404
- Middleware: `src/middleware/errorHandler.js:1`

## Códigos HTTP
- 201 criação
- 200 leitura/lista/atualização
- 204 deleção
- 400 payload inválido
- 404 não encontrado
- 409 duplicado
- 500 erro interno

## Endpoints e Exemplos
### Criar pedido
```bash
curl.exe -i -s -X POST http://localhost:3000/order \
  -H "Content-Type: application/json" \
  --data '{
    "numeroPedido": "v10089015vdb-01",
    "valorTotal": 10000,
    "dataCriacao": "2023-07-19T12:24:11.5299601+00:00",
    "items": [ { "idItem": "2434", "quantidadeItem": 1, "valorItem": 1000 } ]
  }'
```
PowerShell:
```powershell
$body = @{ numeroPedido="v10089015vdb-01"; valorTotal=10000; dataCriacao="2023-07-19T12:24:11.5299601+00:00"; items=@(@{ idItem="2434"; quantidadeItem=1; valorItem=1000 }) } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method Post -Uri http://localhost:3000/order -ContentType 'application/json' -Body $body
```

### Obter pedido
```bash
curl.exe -i -s http://localhost:3000/order/v10089015vdb
```

### Listar pedidos
```bash
curl.exe -i -s http://localhost:3000/order/list
```

### Atualizar pedido
```powershell
$body = @{ numeroPedido="v10089015vdb-01"; valorTotal=12000; dataCriacao="2023-07-20T10:00:00.000Z"; items=@(@{ idItem="2434"; quantidadeItem=2; valorItem=1500 }) } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method Put -Uri http://localhost:3000/order/v10089015vdb -ContentType 'application/json' -Body $body
```

### Deletar pedido
```bash
curl.exe -i -s -X DELETE http://localhost:3000/order/v10089015vdb
```

## Persistência
- Memória: usada automaticamente quando `MONGODB_URI` não está definido (útil para testes locais).
- MongoDB: usar `MONGODB_URI` para persistência real.
- Modelo: `src/models/Order.js:12`
- Repositório com fallback: `src/repository/orderRepository.js:5`

## Estrutura do Projeto
```
src/
  controllers/        # lógica de endpoints
  db/                 # conexão Mongo
  middleware/         # tratamento de erros
  models/             # schemas Mongoose
  repository/         # acesso a dados (Mongo/memória)
  routes/             # rotas Express
  utils/              # transformação de dados
```

## Critérios de Avaliação (atendidos)
- Funcionalidade completa dos requisitos mínimos (CRUD e transformação)
- Código organizado, validação e tratamento de erros compreensíveis
- Convenções de nomenclatura adequadas
- Respostas HTTP corretas por operação
- Código hospedado em repositório público com commit organizado

## Recursos Adicionais (opcional)
- Autenticação básica com JWT (sugestão):
  - Adicionar middleware que valide `Authorization: Bearer <token>` nas rotas de escrita.
  - Rotas de leitura podem permanecer públicas.
- Documentação com Swagger ou Postman:
  - Adicionar `swagger.json`/`swagger.yaml` em `docs/` e expor `GET /docs`.
  - Alternativamente, fornecer uma coleção Postman.

## Links
- GitHub: https://github.com/rodrigoalgeri/Simple-API

## Referências de Código
- Rotas: `src/routes/orderRoutes.js:6`
- Controller (CRUD): `src/controllers/orderController.js:21`, `47`, `58`, `67`, `86`
- Transformação: `src/utils/mapOrder.js:13`
- Repositório: `src/repository/orderRepository.js:9`, `20`, `28`, `35`, `51`
- Modelo: `src/models/Order.js:12`
- Server/bootstrap: `src/server.js:7`
