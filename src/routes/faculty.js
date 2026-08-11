const router = require('express').Router();
const store = require('../data/store');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

router.get('/', (req, res) => {
  const faculties = store.filter('users', u => u.role === 'faculty').map(f => {
    const { password_hash, ...rest } = f;
    return rest;
  });
  res.json({ success: true, data: faculties });
});

router.get('/:id', (req, res) => {
  const faculty = store.getById('users', req.params.id);
  if (!faculty || faculty.role !== 'faculty') {
    return res.status(404).json({ success: false, error: 'Faculty not found' });
  }
  const { password_hash, ...facultyWithoutPassword } = faculty;
  
  const officeHours = store.getOfficeHoursByFaculty(faculty.id);
  const blockedDates = store.getBlockedDatesByFaculty(faculty.id);
  
  res.json({
    success: true,
    data: {
      ...facultyWithoutPassword,
      office_hours: officeHours,
      blocked_dates: blockedDates
    }
  });
});

module.exports = router;
