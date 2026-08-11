const router = require('express').Router();
const store = require('../data/store');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/roleGuard');
const { cancelBooking } = require('../logic/booking');

router.use(requireAuth);

router.get('/', requireRole('admin'), (req, res) => {
  let users = store.getAll('users');
  if (req.query.role) {
    users = users.filter(u => u.role === req.query.role);
  }
  const sanitized = users.map(u => {
    const { password_hash, ...rest } = u;
    return rest;
  });
  res.json({ success: true, data: sanitized });
});

router.get('/:id', requireRole('admin'), (req, res) => {
  const user = store.getById('users', req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  const { password_hash, ...sanitized } = user;
  res.json({ success: true, data: sanitized });
});

router.put('/:id', requireRole('admin'), (req, res) => {
  const { name, department } = req.body;
  const user = store.getById('users', req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  
  const updated = store.update('users', req.params.id, { name, department });
  const { password_hash, ...sanitized } = updated;
  res.json({ success: true, data: sanitized });
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  const user = store.getById('users', req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  // Cancel all future appointments
  const allAppointments = store.getAll('appointments').filter(a => ['pending', 'confirmed'].includes(a.status) && new Date(a.slot_datetime) > new Date());
  for (const appt of allAppointments) {
    if (appt.student_id === req.params.id || appt.faculty_id === req.params.id) {
      cancelBooking(appt.id, req.user.id, 'admin');
    }
  }

  store.softDelete('users', req.params.id);
  res.json({ success: true, data: { message: 'User deleted successfully' } });
});

module.exports = router;
