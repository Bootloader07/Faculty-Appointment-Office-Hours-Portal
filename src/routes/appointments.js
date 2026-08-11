const router = require('express').Router();
const store = require('../data/store');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/roleGuard');
const { createBooking, approveBooking, rejectBooking, cancelBooking, markNoShow, rescheduleBooking } = require('../logic/booking');

router.use(requireAuth);

const enrichAppt = (appt) => {
  const student = store.getById('users', appt.student_id);
  const faculty = store.getById('users', appt.faculty_id);
  return {
    ...appt,
    student_name: student ? student.name : 'Unknown',
    faculty_name: faculty ? faculty.name : 'Unknown'
  };
};

router.get('/', (req, res) => {
  const statusFilter = req.query.status ? req.query.status.split(',') : null;
  let appointments = [];
  
  if (req.user.role === 'student') {
    appointments = store.getAppointmentsByStudent(req.user.id);
  } else if (req.user.role === 'faculty') {
    appointments = store.getAppointmentsByFaculty(req.user.id, statusFilter);
  } else if (req.user.role === 'admin') {
    appointments = store.getAll('appointments');
  }

  if (statusFilter && req.user.role !== 'faculty') { // Faculty already filtered
    appointments = appointments.filter(a => statusFilter.includes(a.status));
  }

  const enriched = appointments.map(enrichAppt);
  res.json({ success: true, data: enriched });
});

router.post('/', requireRole('student'), (req, res) => {
  const { faculty_id, slot_datetime, duration, reason } = req.body;
  if (!faculty_id || !slot_datetime || !duration) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  const result = createBooking(req.user.id, faculty_id, slot_datetime, duration, reason);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.get('/:id', (req, res) => {
  const appt = store.getById('appointments', req.params.id);
  if (!appt) return res.status(404).json({ success: false, error: 'Not found' });
  
  if (req.user.role !== 'admin' && appt.student_id !== req.user.id && appt.faculty_id !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  res.json({ success: true, data: enrichAppt(appt) });
});

router.put('/:id/approve', requireRole('faculty'), (req, res) => {
  const result = approveBooking(req.params.id, req.user.id);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.put('/:id/reject', requireRole('faculty'), (req, res) => {
  const result = rejectBooking(req.params.id, req.user.id);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.put('/:id/cancel', (req, res) => {
  const result = cancelBooking(req.params.id, req.user.id, req.user.role);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.put('/:id/no-show', requireRole('faculty'), (req, res) => {
  const result = markNoShow(req.params.id, req.user.id);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.put('/:id/reschedule', requireRole('student'), (req, res) => {
  const { new_slot_datetime } = req.body;
  if (!new_slot_datetime) return res.status(400).json({ success: false, error: 'new_slot_datetime required' });
  
  const result = rescheduleBooking(req.params.id, req.user.id, new_slot_datetime);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

module.exports = router;
