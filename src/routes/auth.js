const router = require('express').Router();
const bcrypt = require('bcryptjs');
const store = require('../data/store');
const requireAuth = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  const user = store.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  req.session.userId = user.id;
  const { password_hash, ...userWithoutPassword } = user;
  res.json({ success: true, data: userWithoutPassword });
});

router.post('/register', (req, res) => {
  const { name, email, password, role, department } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  if (!['student', 'faculty'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Invalid role' });
  }

  if (store.getUserByEmail(email)) {
    return res.status(400).json({ success: false, error: 'Email already taken' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const user = store.create('users', { name, email, password_hash, role, department });
  
  req.session.userId = user.id;
  const { password_hash: _ph, ...userWithoutPassword } = user;
  res.json({ success: true, data: userWithoutPassword });
});

router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ success: false, error: 'Could not log out' });
    res.json({ success: true, data: { message: 'Logged out' } });
  });
});

router.get('/me', requireAuth, (req, res) => {
  const { password_hash, ...userWithoutPassword } = req.user;
  res.json({ success: true, data: userWithoutPassword });
});

module.exports = router;
