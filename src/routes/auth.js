const router = require('express').Router();
const bcrypt = require('bcryptjs');
const store = require('../data/store');
const requireAuth = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const trimmedEmail = (email || '').toLowerCase().trim();

  if (!trimmedEmail || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  const user = store.getUserByEmail(trimmedEmail);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  req.session.userId = user.id;
  const { password_hash, ...userWithoutPassword } = user;
  const userObj = {
    ...userWithoutPassword,
    fullName: userWithoutPassword.name || userWithoutPassword.fullName
  };

  res.json({ success: true, user: userObj, data: userObj });
});

router.post('/register', (req, res) => {
  const { name, fullName, email, password, role, department } = req.body;
  const userName = (fullName || name || '').trim();
  const trimmedEmail = (email || '').toLowerCase().trim();
  const trimmedDept = (department || '').trim();

  if (!userName || !trimmedEmail || !password || !role || !trimmedDept) {
    return res.status(400).json({ success: false, error: 'Full name, email, password, role, and department are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
  }

  const validRoles = ['student', 'faculty', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, error: 'Invalid role specified. Role must be student, faculty, or admin' });
  }

  if (store.getUserByEmail(trimmedEmail)) {
    return res.status(400).json({ success: false, error: 'This email is already registered.' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const user = store.create('users', {
    name: userName,
    email: trimmedEmail,
    password_hash,
    role,
    department: trimmedDept
  });
  
  req.session.userId = user.id;
  const userObj = {
    id: user.id,
    name: user.name,
    fullName: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    created_at: user.created_at
  };

  res.status(201).json({ success: true, user: userObj, data: userObj });
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
