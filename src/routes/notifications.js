const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const store = require('../data/store');

router.use(requireAuth);

router.get('/', (req, res) => {
  const notifications = store.getNotificationsByUser(req.user.id);
  res.json({ success: true, data: notifications });
});

router.put('/read-all', (req, res) => {
  const notifications = store.getNotificationsByUser(req.user.id);
  notifications.forEach(n => {
    if (!n.is_read) store.update('notifications', n.id, { is_read: true });
  });
  res.json({ success: true, data: { message: 'All notifications marked as read' } });
});

router.put('/:id/read', (req, res) => {
  const n = store.getById('notifications', req.params.id);
  if (!n) return res.status(404).json({ success: false, error: 'Not found' });
  if (n.user_id !== req.user.id) return res.status(403).json({ success: false, error: 'Access denied' });

  const updated = store.update('notifications', req.params.id, { is_read: true });
  res.json({ success: true, data: updated });
});

module.exports = router;
