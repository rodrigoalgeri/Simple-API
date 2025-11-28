// Dependências de banco de dados SQLite
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Caminho do arquivo de banco de dados a partir de variável de ambiente
const DB_FILE = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'orders.db');

// Cria e retorna uma conexão única com o banco (modo "serialize" para garantir ordem)
const db = new sqlite3.Database(DB_FILE);
// Ativa suporte a chaves estrangeiras (necessário para ON DELETE CASCADE)
db.run('PRAGMA foreign_keys = ON');

// Executa migrações de esquema (criação das tabelas se não existirem)
function runMigrations() {
  db.serialize(() => {
    // Tabela principal de pedidos
    db.run(
      `CREATE TABLE IF NOT EXISTS "Order" (
        orderId TEXT PRIMARY KEY,
        value INTEGER NOT NULL,
        creationDate TEXT NOT NULL
      )`
    );

    // Tabela de itens do pedido
    db.run(
      `CREATE TABLE IF NOT EXISTS Items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderId TEXT NOT NULL,
        productId INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price INTEGER NOT NULL,
        FOREIGN KEY(orderId) REFERENCES "Order"(orderId) ON DELETE CASCADE
      )`
    );
  });
}

// CRUD de Pedido + Itens
const OrderRepository = {
  // Insere um pedido e seus itens em uma transação simples
  create(order) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run(
          'INSERT INTO "Order"(orderId, value, creationDate) VALUES(?, ?, ?)',
          [order.orderId, order.value, order.creationDate],
          function (err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }

            // Insere itens
            const stmt = db.prepare(
              'INSERT INTO Items(orderId, productId, quantity, price) VALUES(?, ?, ?, ?)'
            );
            for (const item of order.items || []) {
              stmt.run([order.orderId, item.productId, item.quantity, item.price]);
            }
            stmt.finalize((finalizeErr) => {
              if (finalizeErr) {
                db.run('ROLLBACK');
                return reject(finalizeErr);
              }
              db.run('COMMIT');
              resolve(order);
            });
          }
        );
      });
    });
  },

  // Recupera um pedido e seus itens
  getById(orderId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT orderId, value, creationDate FROM "Order" WHERE orderId = ?', [orderId], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        db.all('SELECT productId, quantity, price FROM Items WHERE orderId = ?', [orderId], (itemsErr, itemsRows) => {
          if (itemsErr) return reject(itemsErr);
          resolve({
            orderId: row.orderId,
            value: row.value,
            creationDate: row.creationDate,
            items: itemsRows || [],
          });
        });
      });
    });
  },

  // Lista todos os pedidos com itens (join por consulta secundária)
  listAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT orderId, value, creationDate FROM "Order"', [], async (err, rows) => {
        if (err) return reject(err);
        const results = [];
        for (const row of rows) {
          const items = await new Promise((res, rej) => {
            db.all(
              'SELECT productId, quantity, price FROM Items WHERE orderId = ?',
              [row.orderId],
              (itemsErr, itemsRows) => (itemsErr ? rej(itemsErr) : res(itemsRows || []))
            );
          });
          results.push({ orderId: row.orderId, value: row.value, creationDate: row.creationDate, items });
        }
        resolve(results);
      });
    });
  },

  // Atualiza (substitui) os dados de um pedido e seus itens
  update(orderId, order) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run(
          'UPDATE "Order" SET value = ?, creationDate = ? WHERE orderId = ?',
          [order.value, order.creationDate, orderId],
          function (err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            if (this.changes === 0) {
              db.run('ROLLBACK');
              return reject(new Error('ORDER_NOT_FOUND'));
            }
            // Remove itens antigos
            db.run('DELETE FROM Items WHERE orderId = ?', [orderId], function (delErr) {
              if (delErr) {
                db.run('ROLLBACK');
                return reject(delErr);
              }
              // Insere itens novos
              const stmt = db.prepare(
                'INSERT INTO Items(orderId, productId, quantity, price) VALUES(?, ?, ?, ?)'
              );
              for (const item of order.items || []) {
                stmt.run([orderId, item.productId, item.quantity, item.price]);
              }
              stmt.finalize((finalizeErr) => {
                if (finalizeErr) {
                  db.run('ROLLBACK');
                  return reject(finalizeErr);
                }
                db.run('COMMIT');
                resolve({ ...order, orderId });
              });
            });
          }
        );
      });
    });
  },

  // Exclui um pedido (cascade resolve os itens)
  delete(orderId) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM "Order" WHERE orderId = ?', [orderId], function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  },
};

module.exports = { db, runMigrations, OrderRepository };
