const store = require('../data/store');

const generateAvailableSlots = (facultyId, daysAhead = 14) => {
  const officeHours = store.getOfficeHoursByFaculty(facultyId);
  const blockedDates = store.getBlockedDatesByFaculty(facultyId).map(b => b.blocked_date);
  const appointments = store.getAppointmentsByFaculty(facultyId, ['pending', 'confirmed']);
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const slots = [];
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  for (let i = 0; i <= daysAhead; i++) {
    const currentDay = new Date(now);
    currentDay.setDate(now.getDate() + i);
    const dayName = daysOfWeek[currentDay.getDay()];
    const dateStr = currentDay.toISOString().split('T')[0];

    if (blockedDates.includes(dateStr)) continue;

    const dayOfficeHours = officeHours.filter(oh => oh.day_of_week === dayName);
    
    for (const oh of dayOfficeHours) {
      let [startH, startM] = oh.start_time.split(':').map(Number);
      const [endH, endM] = oh.end_time.split(':').map(Number);
      const slotDurMs = oh.slot_duration * 60000;
      
      let currentSlotTime = new Date(currentDay);
      currentSlotTime.setHours(startH, startM, 0, 0);
      
      const endTime = new Date(currentDay);
      endTime.setHours(endH, endM, 0, 0);

      while (currentSlotTime.getTime() + slotDurMs <= endTime.getTime()) {
        const slotISO = currentSlotTime.toISOString();
        const isPastOrTooSoon = currentSlotTime <= oneHourFromNow;
        
        const isBooked = appointments.some(appt => {
          const apptTime = new Date(appt.slot_datetime).getTime();
          const apptEnd = apptTime + appt.duration * 60000;
          const currentEnd = currentSlotTime.getTime() + slotDurMs;
          return (currentSlotTime.getTime() < apptEnd && currentEnd > apptTime);
        });

        if (!isPastOrTooSoon && !isBooked) {
          slots.push({
            datetime: slotISO,
            duration: oh.slot_duration,
            faculty_id: facultyId
          });
        }
        
        currentSlotTime = new Date(currentSlotTime.getTime() + slotDurMs);
      }
    }
  }

  return slots;
};

module.exports = { generateAvailableSlots };
