const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const corsOptions = require('./src/config/cors');
const { seedDatabase } = require('./src/data/seed');

// Import routes
const authRoutes = require('./src/routes/auth');
const facultyRoutes = require('./src/routes/faculty');
const officeHoursRoutes = require('./src/routes/officeHours');
const blockedDatesRoutes = require('./src/routes/blockedDates');
const appointmentsRoutes = require('./src/routes/appointments');
const availabilityRoutes = require('./src/routes/availability');
const notificationsRoutes = require('./src/routes/notifications');
const usersRoutes = require('./src/routes/users');
const adminRoutes = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
  store: new session.MemoryStore(),
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/office-hours', officeHoursRoutes);
app.use('/api/blocked-dates', blockedDatesRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);

// Static files and SPA fallback
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  seedDatabase();
  console.log(`Server running on port ${PORT}`);
  console.log('Demo Credentials:');
  console.log('  Admin: admin@uni.edu / Admin@123');
  console.log('  Faculty: dr.sharma@uni.edu / Faculty@123');
  console.log('  Student: alice@uni.edu / Student@123');
});
