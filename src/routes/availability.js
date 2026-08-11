const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const { generateAvailableSlots } = require('../logic/availability');

router.get('/:facultyId', requireAuth, (req, res) => {
  const slots = generateAvailableSlots(req.params.facultyId);
  res.json({ success: true, data: slots });
});

module.exports = router;
