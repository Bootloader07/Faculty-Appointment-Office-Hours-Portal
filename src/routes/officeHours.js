const router = require('express').Router();
const store = require('../data/store');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/roleGuard');

router.get('/', requireAuth, (req, res) => {
  const targetFacultyId = req.query.facultyId || req.user.id;
  const officeHours = store.getOfficeHoursByFaculty(targetFacultyId);
  res.json({ success: true, data: officeHours });
});

router.post('/', requireAuth, requireRole('faculty'), (req, res) => {
  const { day_of_week, start_time, end_time, slot_duration } = req.body;
  if (!['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].includes(day_of_week)) {
    return res.status(400).json({ success: false, error: 'Invalid day_of_week' });
  }
  if (start_time >= end_time) {
    return res.status(400).json({ success: false, error: 'start_time must be before end_time' });
  }
  if (!slot_duration || slot_duration <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid slot_duration' });
  }

  const officeHour = store.create('officeHours', {
    faculty_id: req.user.id,
    day_of_week,
    start_time,
    end_time,
    slot_duration
  });
  res.json({ success: true, data: officeHour });
});

router.put('/:id', requireAuth, requireRole('faculty'), (req, res) => {
  const oh = store.getById('officeHours', req.params.id);
  if (!oh) return res.status(404).json({ success: false, error: 'Office hour not found' });
  if (oh.faculty_id !== req.user.id) return res.status(403).json({ success: false, error: 'Not authorized' });

  const updated = store.update('officeHours', req.params.id, req.body);
  res.json({ success: true, data: updated });
});

router.delete('/:id', requireAuth, requireRole('faculty'), (req, res) => {
  const oh = store.getById('officeHours', req.params.id);
  if (!oh) return res.status(404).json({ success: false, error: 'Office hour not found' });
  if (oh.faculty_id !== req.user.id) return res.status(403).json({ success: false, error: 'Not authorized' });

  store.softDelete('officeHours', req.params.id);
  res.json({ success: true, data: { message: 'Deleted successfully' } });
});

module.exports = router;
