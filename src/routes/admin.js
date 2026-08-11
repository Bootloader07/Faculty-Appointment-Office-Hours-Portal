const router = require('express').Router();
const store = require('../data/store');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/roleGuard');
const { getSystemConflicts } = require('../logic/conflict');

router.use(requireAuth, requireRole('admin'));

router.get('/stats', (req, res) => {
  const users = store.getAll('users');
  const appts = store.getAll('appointments');

  const stats = {
    totalUsers: users.length,
    totalStudents: users.filter(u => u.role === 'student').length,
    totalFaculty: users.filter(u => u.role === 'faculty').length,
    totalBookings: appts.length,
    pendingBookings: appts.filter(a => a.status === 'pending').length,
    confirmedBookings: appts.filter(a => a.status === 'confirmed').length,
    cancelledBookings: appts.filter(a => a.status === 'cancelled').length,
    noShowBookings: appts.filter(a => a.status === 'no_show').length,
    rescheduledBookings: appts.filter(a => a.status === 'rescheduled').length,
    conflictCount: getSystemConflicts().length
  };

  res.json({ success: true, data: stats });
});

router.get('/conflicts', (req, res) => {
  const conflicts = getSystemConflicts();
  const enriched = conflicts.map(c => {
    const faculty = store.getById('users', c.faculty_id);
    return {
      ...c,
      faculty_name: faculty ? faculty.name : 'Unknown',
      appointments: c.appointments.map(a => {
        const student = store.getById('users', a.student_id);
        return { ...a, student_name: student ? student.name : 'Unknown' };
      })
    };
  });

  res.json({ success: true, data: enriched });
});

module.exports = router;
