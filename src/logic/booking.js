const store = require('../data/store');
const { triggerNotification } = require('./notifications');
const { detectConflict } = require('./conflict');

const createBooking = (studentId, facultyId, slotDatetime, duration, reason) => {
  const slotDate = new Date(slotDatetime);
  const minTime = new Date(Date.now() + 60 * 60 * 1000); // Now + 1 hour

  if (slotDate <= minTime) {
    return { success: false, error: 'Booking must be at least 1 hour in advance' };
  }
  if (detectConflict(facultyId, slotDatetime)) {
    return { success: false, error: 'Slot is already booked' };
  }

  const appt = store.create('appointments', {
    student_id: studentId,
    faculty_id: facultyId,
    slot_datetime: slotDatetime,
    duration,
    reason,
    status: 'pending'
  });

  triggerNotification(facultyId, 'booking_request', `New booking request for ${slotDatetime}`);
  return { success: true, data: appt };
};

const approveBooking = (appointmentId, facultyId) => {
  const appt = store.getById('appointments', appointmentId);
  if (!appt) return { success: false, error: 'Appointment not found' };
  if (appt.faculty_id !== facultyId) return { success: false, error: 'Not authorized' };
  if (appt.status !== 'pending') return { success: false, error: 'Appointment must be pending' };

  store.update('appointments', appointmentId, { status: 'confirmed' });
  triggerNotification(appt.student_id, 'booking_confirmed', `Your booking for ${appt.slot_datetime} was confirmed`);
  return { success: true, data: store.getById('appointments', appointmentId) };
};

const rejectBooking = (appointmentId, facultyId) => {
  const appt = store.getById('appointments', appointmentId);
  if (!appt) return { success: false, error: 'Appointment not found' };
  if (appt.faculty_id !== facultyId) return { success: false, error: 'Not authorized' };
  if (appt.status !== 'pending') return { success: false, error: 'Appointment must be pending' };

  store.update('appointments', appointmentId, { status: 'cancelled' });
  triggerNotification(appt.student_id, 'booking_cancelled', `Your booking for ${appt.slot_datetime} was rejected`);
  return { success: true, data: store.getById('appointments', appointmentId) };
};

const cancelBooking = (appointmentId, actorId, actorRole) => {
  const appt = store.getById('appointments', appointmentId);
  if (!appt) return { success: false, error: 'Appointment not found' };

  if (actorRole === 'student') {
    if (appt.student_id !== actorId) return { success: false, error: 'Not authorized' };
    const minTime = new Date(Date.now() + 60 * 60 * 1000);
    if (new Date(appt.slot_datetime) <= minTime) return { success: false, error: 'Too late to cancel' };
    if (!['pending', 'confirmed'].includes(appt.status)) return { success: false, error: 'Invalid status for cancellation' };
    triggerNotification(appt.faculty_id, 'booking_cancelled', `Student cancelled booking for ${appt.slot_datetime}`);
  } else if (actorRole === 'faculty') {
    if (appt.faculty_id !== actorId) return { success: false, error: 'Not authorized' };
    if (!['pending', 'confirmed'].includes(appt.status)) return { success: false, error: 'Invalid status for cancellation' };
    triggerNotification(appt.student_id, 'booking_cancelled', `Faculty cancelled booking for ${appt.slot_datetime}`);
  } else if (actorRole === 'admin') {
    triggerNotification(appt.student_id, 'booking_cancelled', `Admin cancelled booking for ${appt.slot_datetime}`);
    triggerNotification(appt.faculty_id, 'booking_cancelled', `Admin cancelled booking for ${appt.slot_datetime}`);
  } else {
    return { success: false, error: 'Invalid role' };
  }

  store.update('appointments', appointmentId, { status: 'cancelled' });
  return { success: true, data: store.getById('appointments', appointmentId) };
};

const markNoShow = (appointmentId, facultyId) => {
  const appt = store.getById('appointments', appointmentId);
  if (!appt) return { success: false, error: 'Appointment not found' };
  if (appt.faculty_id !== facultyId) return { success: false, error: 'Not authorized' };
  if (appt.status !== 'confirmed') return { success: false, error: 'Appointment must be confirmed' };
  if (new Date(appt.slot_datetime) >= new Date()) return { success: false, error: 'Appointment is in the future' };

  store.update('appointments', appointmentId, { status: 'no_show' });
  return { success: true, data: store.getById('appointments', appointmentId) };
};

const rescheduleBooking = (appointmentId, studentId, newSlotDatetime) => {
  const appt = store.getById('appointments', appointmentId);
  if (!appt) return { success: false, error: 'Appointment not found' };
  if (appt.student_id !== studentId) return { success: false, error: 'Not authorized' };
  if (appt.status !== 'confirmed') return { success: false, error: 'Only confirmed appointments can be rescheduled' };

  const minTime = new Date(Date.now() + 60 * 60 * 1000);
  if (new Date(newSlotDatetime) <= minTime) return { success: false, error: 'New slot must be at least 1 hour in advance' };
  if (detectConflict(appt.faculty_id, newSlotDatetime)) return { success: false, error: 'New slot is already booked' };

  store.update('appointments', appointmentId, { status: 'rescheduled' });
  
  const newAppt = store.create('appointments', {
    student_id: studentId,
    faculty_id: appt.faculty_id,
    slot_datetime: newSlotDatetime,
    duration: appt.duration,
    reason: appt.reason,
    status: 'pending'
  });

  triggerNotification(appt.faculty_id, 'reschedule', `Student requested reschedule for ${newSlotDatetime}`);
  return { success: true, data: newAppt };
};

module.exports = { createBooking, approveBooking, rejectBooking, cancelBooking, markNoShow, rescheduleBooking };
