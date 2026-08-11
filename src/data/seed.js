const bcrypt = require('bcryptjs');
const store = require('./store');

let seeded = false;

const seedDatabase = () => {
  if (seeded) return;

  const usersData = [
    { name: 'System Admin', email: 'admin@uni.edu', password: 'Admin@123', role: 'admin', department: 'Administration' },
    { name: 'Dr. Rajesh Sharma', email: 'dr.sharma@uni.edu', password: 'Faculty@123', role: 'faculty', department: 'Computer Science' },
    { name: 'Dr. Priya Mehta', email: 'dr.mehta@uni.edu', password: 'Faculty@123', role: 'faculty', department: 'Mathematics' },
    { name: 'Dr. Anish Patel', email: 'dr.patel@uni.edu', password: 'Faculty@123', role: 'faculty', department: 'Physics' },
    { name: 'Dr. Sunita Gupta', email: 'dr.gupta@uni.edu', password: 'Faculty@123', role: 'faculty', department: 'Electronics & Communication' },
    { name: 'Alice Johnson', email: 'alice@uni.edu', password: 'Student@123', role: 'student', department: 'Computer Science' },
    { name: 'Bob Williams', email: 'bob@uni.edu', password: 'Student@123', role: 'student', department: 'Mathematics' },
    { name: 'Charlie Brown', email: 'charlie@uni.edu', password: 'Student@123', role: 'student', department: 'Computer Science' },
    { name: 'Diana Prince', email: 'diana@uni.edu', password: 'Student@123', role: 'student', department: 'Physics' },
    { name: 'Eve Davis', email: 'eve@uni.edu', password: 'Student@123', role: 'student', department: 'Electronics & Communication' }
  ];

  const users = {};
  for (const ud of usersData) {
    const password_hash = bcrypt.hashSync(ud.password, 10);
    const u = store.create('users', { name: ud.name, email: ud.email, password_hash, role: ud.role, department: ud.department });
    users[ud.email] = u;
  }

  // Office hours
  store.create('officeHours', { faculty_id: users['dr.sharma@uni.edu'].id, day_of_week: 'Mon', start_time: '10:00', end_time: '12:00', slot_duration: 30 });
  store.create('officeHours', { faculty_id: users['dr.sharma@uni.edu'].id, day_of_week: 'Wed', start_time: '10:00', end_time: '12:00', slot_duration: 30 });
  store.create('officeHours', { faculty_id: users['dr.sharma@uni.edu'].id, day_of_week: 'Fri', start_time: '10:00', end_time: '12:00', slot_duration: 30 });
  
  store.create('officeHours', { faculty_id: users['dr.mehta@uni.edu'].id, day_of_week: 'Tue', start_time: '14:00', end_time: '16:00', slot_duration: 30 });
  store.create('officeHours', { faculty_id: users['dr.mehta@uni.edu'].id, day_of_week: 'Thu', start_time: '14:00', end_time: '16:00', slot_duration: 30 });
  
  store.create('officeHours', { faculty_id: users['dr.patel@uni.edu'].id, day_of_week: 'Mon', start_time: '15:00', end_time: '17:00', slot_duration: 45 });
  store.create('officeHours', { faculty_id: users['dr.patel@uni.edu'].id, day_of_week: 'Wed', start_time: '15:00', end_time: '17:00', slot_duration: 45 });
  
  store.create('officeHours', { faculty_id: users['dr.gupta@uni.edu'].id, day_of_week: 'Fri', start_time: '13:00', end_time: '15:00', slot_duration: 30 });

  const getNextDay = (dayIndex) => {
    const d = new Date();
    d.setDate(d.getDate() + ((dayIndex + 7 - d.getDay()) % 7 || 7));
    return d;
  };

  const nextMonday = getNextDay(1);
  const nextTuesday = getNextDay(2);
  const nextWednesday = getNextDay(3);
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // Blocked date
  store.create('blockedDates', { faculty_id: users['dr.sharma@uni.edu'].id, blocked_date: nextMonday.toISOString().split('T')[0], reason: 'Faculty Development Workshop' });

  const formatDate = (date, time) => {
    const d = new Date(date);
    const [h, m] = time.split(':');
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  // Appointments
  const appt1 = store.create('appointments', { student_id: users['alice@uni.edu'].id, faculty_id: users['dr.sharma@uni.edu'].id, slot_datetime: formatDate(nextWednesday, '10:00'), duration: 30, reason: 'Discuss project proposal', status: 'confirmed' });
  const appt2 = store.create('appointments', { student_id: users['bob@uni.edu'].id, faculty_id: users['dr.mehta@uni.edu'].id, slot_datetime: formatDate(nextTuesday, '14:00'), duration: 30, reason: 'Help with assignment', status: 'pending' });
  const appt3 = store.create('appointments', { student_id: users['charlie@uni.edu'].id, faculty_id: users['dr.sharma@uni.edu'].id, slot_datetime: formatDate(lastWeek, '10:00'), duration: 30, reason: 'Past discussion', status: 'confirmed' });
  const appt4 = store.create('appointments', { student_id: users['diana@uni.edu'].id, faculty_id: users['dr.patel@uni.edu'].id, slot_datetime: formatDate(threeDaysAgo, '15:00'), duration: 45, reason: 'Doubt clearing', status: 'no_show' });

  // Notifications
  store.create('notifications', { user_id: users['alice@uni.edu'].id, type: 'welcome', message: 'Welcome to the Faculty Portal!', is_read: false });
  store.create('notifications', { user_id: users['bob@uni.edu'].id, type: 'welcome', message: 'Welcome to the Faculty Portal!', is_read: false });
  store.create('notifications', { user_id: users['dr.sharma@uni.edu'].id, type: 'booking_confirmed', message: 'Appointment confirmed for Alice', is_read: false });

  seeded = true;
};

module.exports = { seedDatabase };
