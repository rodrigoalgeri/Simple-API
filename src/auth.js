const jwt = require('jsonwebtoken');

// Carrega configurações de autenticação do ambiente
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const USER = process.env.AUTH_USER || 'admin';
const PASSWORD = process.env.AUTH_PASSWORD || 'secret';

// Middleware para autenticar rotas protegidas
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) return res.status(401).json({ message: 'Token ausente' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
}

// Rota handler para emitir token (login básico)
function loginHandler(req, res) {
  const { username, password } = req.body || {};
  if (username === USER && password === PASSWORD) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '2h' });
    return res.status(200).json({ token });
  }
  return res.status(401).json({ message: 'Credenciais inválidas' });
}

module.exports = { authenticate, loginHandler };
