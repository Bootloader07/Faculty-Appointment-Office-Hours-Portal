const crypto = require('crypto');

const store = {
  users: new Map(),
  officeHours: new Map(),
  blockedDates: new Map(),
  appointments: new Map(),
  notifications: new Map()
};

const getAll = (entity) => {
  const records = [];
  store[entity].forEach(record => {
    if (!record.deleted_at) records.push(record);
  });
  return records;
};

const getById = (entity, id) => {
  const record = store[entity].get(id);
  if (record && !record.deleted_at) return record;
  return null;
};

const create = (entity, data) => {
  const id = data.id || crypto.randomUUID();
  const now = new Date().toISOString();
  const record = { ...data, id, created_at: now, updated_at: now, deleted_at: null };
  store[entity].set(id, record);
  return record;
};

const update = (entity, id, data) => {
  const record = getById(entity, id);
  if (!record) return null;
  const updated = { ...record, ...data, updated_at: new Date().toISOString() };
  store[entity].set(id, updated);
  return updated;
};

const softDelete = (entity, id) => {
  const record = getById(entity, id);
  if (!record) return null;
  record.deleted_at = new Date().toISOString();
  store[entity].set(id, record);
  return record;
};

const filter = (entity, predicateFn) => {
  const records = [];
  store[entity].forEach(record => {
    if (!record.deleted_at && predicateFn(record)) records.push(record);
  });
  return records;
};

const getUserByEmail = (email) => {
  return filter('users', u => u.email === email)[0] || null;
};

const getAppointmentsByFaculty = (facultyId, statuses = null) => {
  return filter('appointments', a => a.faculty_id === facultyId && (!statuses || statuses.includes(a.status)));
};

const getAppointmentsByStudent = (studentId) => {
  return filter('appointments', a => a.student_id === studentId);
};

const getOfficeHoursByFaculty = (facultyId) => {
  return filter('officeHours', o => o.faculty_id === facultyId);
};

const getBlockedDatesByFaculty = (facultyId) => {
  return filter('blockedDates', b => b.faculty_id === facultyId);
};

const getNotificationsByUser = (userId) => {
  return filter('notifications', n => n.user_id === userId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

const getRaw = () => store;

module.exports = {
  getAll, getById, create, update, softDelete, filter,
  getUserByEmail, getAppointmentsByFaculty, getAppointmentsByStudent,
  getOfficeHoursByFaculty, getBlockedDatesByFaculty, getNotificationsByUser,
  getRaw
};
