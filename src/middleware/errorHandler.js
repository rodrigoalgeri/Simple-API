function errorHandler(err, req, res, next) {
  const status = 500;
  const message = 'Erro interno';
  res.status(status).json({ message, error: String(err && err.message ? err.message : err) });
}

module.exports = { errorHandler };

