const store = require('../data/store');

const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const user = store.getById('users', req.session.userId);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  req.user = user;
  next();
};

module.exports = requireAuth;
