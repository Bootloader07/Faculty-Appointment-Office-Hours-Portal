const router = require('express').Router();
const store = require('../data/store');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/roleGuard');

router.get('/', requireAuth, (req, res) => {
  const targetFacultyId = req.query.facultyId || req.user.id;
  const blockedDates = store.getBlockedDatesByFaculty(targetFacultyId);
  res.json({ success: true, data: blockedDates });
});

router.post('/', requireAuth, requireRole('faculty'), (req, res) => {
  const { blocked_date, reason } = req.body;
  if (!blocked_date) return res.status(400).json({ success: false, error: 'blocked_date required' });
  
  if (new Date(blocked_date) < new Date(new Date().toISOString().split('T')[0])) {
    return res.status(400).json({ success: false, error: 'blocked_date must be in the future' });
  }

  const blockedDate = store.create('blockedDates', {
    faculty_id: req.user.id,
    blocked_date,
    reason: reason || ''
  });
  res.json({ success: true, data: blockedDate });
});

router.delete('/:id', requireAuth, requireRole('faculty'), (req, res) => {
  const bd = store.getById('blockedDates', req.params.id);
  if (!bd) return res.status(404).json({ success: false, error: 'Blocked date not found' });
  if (bd.faculty_id !== req.user.id) return res.status(403).json({ success: false, error: 'Not authorized' });

  store.softDelete('blockedDates', req.params.id);
  res.json({ success: true, data: { message: 'Deleted successfully' } });
});

module.exports = router;
