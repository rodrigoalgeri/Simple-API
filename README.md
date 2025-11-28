# Simple API de Pedidos

API REST em Node.js/Express para gerenciar pedidos (CRUD), com persistência em SQLite, autenticação JWT e documentação via Swagger.

## Sumário
- [Tecnologias](#tecnologias)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Execução](#execução)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Modelo de Dados](#modelo-de-dados)
- [Transformação de Payload](#transformação-de-payload)
- [Endpoints](#endpoints)
- [Autenticação](#autenticação)
- [Swagger](#swagger)
- [Erros e Respostas](#erros-e-respostas)
- [Convenções de Commit](#convenções-de-commit)
- [Licença](#licença)

## Tecnologias
- Node.js 18+
- Express 4
- SQLite3
- Joi (validação)
- JWT (autenticação)
- Swagger UI

## Requisitos
- Node.js instalado
- Git instalado

## Instalação
```bash
npm install
```

## Execução
- Ambiente local padrão usa `PORT=3000` (configurado no `.env`).
- Iniciar o servidor:
```bash
npm start
```
- Health-check: `GET http://localhost:3000/health`

## Variáveis de Ambiente
Crie um arquivo `.env` (não é commitado) com:

| Variável       | Padrão              | Descrição                              |
|----------------|---------------------|----------------------------------------|
| `PORT`         | `3000`              | Porta do servidor HTTP                 |
| `DB_FILE`      | `./data/orders.db`  | Caminho do arquivo SQLite              |
| `JWT_SECRET`   | `super-secret-dev`  | Segredo para assinar tokens JWT        |
| `AUTH_USER`    | `admin`             | Usuário fixo para login                |
| `AUTH_PASSWORD`| `secret`            | Senha fixa para login                  |

## Modelo de Dados
SQLite com duas tabelas:

- `Order`:
  - `orderId` (TEXT, PK)
  - `value` (INTEGER)
  - `creationDate` (TEXT ISO)
- `Items`:
  - `id` (INTEGER, PK autoincrement)
  - `orderId` (TEXT, FK -> `Order(orderId)` com `ON DELETE CASCADE`)
  - `productId` (INTEGER)
  - `quantity` (INTEGER)
  - `price` (INTEGER)

## Transformação de Payload
Entrada (exemplo):
```json
{
  "numeroPedido": "v10089015vdb-01",
  "valorTotal": 10000,
  "dataCriacao": "2023-07-19T12:24:11.5299601+00:00",
  "items": [
    { "idItem": "2434", "quantidadeItem": 1, "valorItem": 1000 }
  ]
}
```
Transformação para persistência:
```json
{
  "orderId": "v10089015vdb",
  "value": 10000,
  "creationDate": "2023-07-19T12:24:11.529Z",
  "items": [
    { "productId": 2434, "quantity": 1, "price": 1000 }
  ]
}
```
Regra: `orderId` é a parte anterior ao sufixo após `-` (ex.: `v10089015vdb-01` → `v10089015vdb`).

## Endpoints
Base URL: `http://localhost:3000`

- Criar pedido (JWT): `POST /order`
- Obter pedido: `GET /order/:orderId`
- Listar pedidos: `GET /order/list`
- Atualizar pedido (JWT): `PUT /order/:orderId`
- Deletar pedido (JWT): `DELETE /order/:orderId`

### Exemplo com curl
Obter token:
```bash
curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"secret"}'
```
Criar pedido:
```bash
curl -s -X POST http://localhost:3000/order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "numeroPedido": "v10089015vdb-01",
    "valorTotal": 10000,
    "dataCriacao": "2023-07-19T12:24:11.5299601+00:00",
    "items": [
      { "idItem": "2434", "quantidadeItem": 1, "valorItem": 1000 }
    ]
  }'
```
Obter pedido:
```bash
curl -s http://localhost:3000/order/v10089015vdb
```
Listar pedidos:
```bash
curl -s http://localhost:3000/order/list
```
Atualizar pedido:
```bash
curl -s -X PUT http://localhost:3000/order/v10089015vdb \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "numeroPedido": "v10089015vdb-01",
    "valorTotal": 12000,
    "dataCriacao": "2023-07-19T12:24:11.5299601+00:00",
    "items": [
      { "idItem": "2434", "quantidadeItem": 2, "valorItem": 6000 }
    ]
  }'
```
Deletar pedido:
```bash
curl -s -X DELETE http://localhost:3000/order/v10089015vdb \
  -H "Authorization: Bearer <TOKEN>" -I
```

## Autenticação
- `POST /login` retorna `{ token }` ao enviar credenciais válidas (`AUTH_USER`/`AUTH_PASSWORD`).
- Use `Authorization: Bearer <token>` nas rotas protegidas (`POST/PUT/DELETE`).

## Swagger
- Interface: `http://localhost:3000/docs`
- Inclui schemas de payload de entrada e modelo persistido, além de segurança Bearer configurada.

## Erros e Respostas
- `400` Payload inválido (validação `joi`).
- `409` Conflito: `orderId` já existe.
- `404` Não encontrado em `GET/PUT/DELETE` conforme aplicável.
- `204` Deleção sem conteúdo.
- `500` Erro interno não mapeado.

## Convenções de Commit
- Estilo recomendado: Conventional Commits
  - `feat: ...` novas funcionalidades
  - `fix: ...` correções
  - `docs: ...` documentação
  - `refactor: ...` refatorações

## Licença
MIT. Veja detalhes no repositório.
