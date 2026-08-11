const store = require('../data/store');

const detectConflict = (facultyId, slotDatetime) => {
  const appointments = store.getAppointmentsByFaculty(facultyId, ['pending', 'confirmed']);
  return appointments.some(a => new Date(a.slot_datetime).getTime() === new Date(slotDatetime).getTime());
};

const getSystemConflicts = () => {
  const appointments = store.getAll('appointments').filter(a => ['pending', 'confirmed'].includes(a.status));
  const counts = {};
  
  appointments.forEach(a => {
    const key = `${a.faculty_id}_${a.slot_datetime}`;
    if (!counts[key]) counts[key] = [];
    counts[key].push(a);
  });

  const conflicts = [];
  for (const key in counts) {
    if (counts[key].length > 1) {
      conflicts.push({
        faculty_id: counts[key][0].faculty_id,
        slot_datetime: counts[key][0].slot_datetime,
        appointments: counts[key]
      });
    }
  }
  return conflicts;
};

module.exports = { detectConflict, getSystemConflicts };
