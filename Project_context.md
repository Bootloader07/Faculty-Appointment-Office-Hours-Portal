# 📋 Project Context — Faculty Appointment & Office Hours Portal

## What We Are Building

A **browser-based web application** that allows university students to book appointments with faculty members during their office hours. Faculty can manage their availability, and admins oversee the entire system.

Built on **Antigravity** (AI app builder) using:
- **Gemini 2.5 Flash** — UI generation, forms, CRUD screens
- **Claude Sonnet 4.6** — business logic, rules engine, edge cases, data models

---

## Problem Being Solved

| Current Pain Point | How This Portal Fixes It |
|--------------------|--------------------------|
| Students email/WhatsApp faculty randomly | Structured self-service booking system |
| Faculty get interrupted without notice | Only confirmed, time-boxed appointments |
| Double bookings and scheduling conflicts | Real-time slot locking + conflict detection |
| No record of student-faculty meetings | Full appointment history with status tracking |
| Admin has no visibility | Centralized dashboard with full oversight |

---

## Who Uses This App

### 👨‍🎓 Students
- Browse the faculty directory
- See available office hour slots per faculty member
- Book a slot with a reason/topic for the meeting
- Cancel or reschedule their booking (up to 1 hour before)
- View past and upcoming appointments

### 👨‍🏫 Faculty
- Define weekly recurring office hours (day + time range)
- Block specific dates when unavailable
- View and manage appointment requests (approve/reject)
- Mark students as no-show if they don't attend
- See a clean weekly view of confirmed appointments

### 🛠️ Admin
- View all users (students and faculty)
- Monitor all bookings across the system
- Override or cancel any appointment
- Detect and resolve scheduling conflicts
- View system-wide statistics

---

## MVP Scope (What to Build First)

✅ Role-based authentication (Student / Faculty / Admin)
✅ Faculty office hours setup (recurring weekly slots)
✅ Student booking flow (browse → select slot → confirm)
✅ Faculty approval/rejection of booking requests
✅ Cancellation and rescheduling by student
✅ Admin dashboard with full visibility

---

## Out of Scope for MVP (Phase 2+)

❌ Email / SMS notifications (added in Phase 2)
❌ Google Calendar / Outlook sync (Phase 2)
❌ SSO / University login integration (Phase 2)
❌ LMS integration (Moodle/Canvas) (Phase 3)
❌ AI meeting summarizer (Phase 3)
❌ Mobile app (Phase 3)

---

## Key Business Rules

1. **One slot = one student.** No double bookings for the same faculty slot.
2. **Students cannot book in the past** or within 1 hour of the slot start.
3. **Faculty must approve** before a booking is confirmed (no auto-confirm in MVP).
4. **Cancelled slots are freed immediately** for other students to book.
5. **Blocked dates override recurring office hours** — if a faculty blocks a Monday, no slots show for that Monday even if office hours are set.
6. **Faculty can reject with no reason required.**
7. **Admin can cancel any booking** regardless of timing rules.
8. **No-show is only markable by faculty** after the slot time has passed.

---

## User Journey Maps

### Student Journey
```
Register → Login → Browse Faculty Directory
  → Select Faculty → View Available Slots
  → Pick Slot → Enter Reason → Submit Request
  → Wait for Faculty Approval
  → Receive Confirmation → Attend Meeting
  → (Optional) Reschedule / Cancel
```

### Faculty Journey
```
Register → Login → Set Weekly Office Hours
  → Block Specific Dates (if needed)
  → View Incoming Requests
  → Approve or Reject Each Request
  → View Confirmed Schedule for the Week
  → Mark No-Show (if student doesn't attend)
```

### Admin Journey
```
Login → View Dashboard Stats
  → Browse All Faculty + Their Schedules
  → Browse All Student Bookings
  → Detect Conflicts → Override if Needed
  → Manage User Accounts
```

---

## Edge Cases to Handle

| Scenario | Expected Behavior |
|----------|------------------|
| Two students book same slot simultaneously | First confirm wins; second gets "slot unavailable" |
| Faculty cancels after student confirmed | Student's appointment is cancelled, slot freed |
| Faculty sets overlapping time ranges | Show validation error on save |
| Holiday falls on recurring office hour day | Blocked date takes priority, slot hidden |
| Student tries to book within 1 hour of slot | Show "booking window closed" message |
| Faculty rejects then student rebooks | Student can pick any remaining available slot |
| Admin deletes a faculty account | All future appointments cancelled, students notified |

---

## Terminology Glossary

| Term | Meaning |
|------|---------|
| **Office Hours** | Recurring time windows a faculty sets as available |
| **Slot** | A specific time block within office hours (e.g., 2:00–2:30 PM) |
| **Appointment** | A student's confirmed booking of a specific slot |
| **Blocked Date** | A date when faculty is unavailable despite regular office hours |
| **No-Show** | When a student doesn't attend a confirmed appointment |
| **Rescheduling** | Moving an existing appointment to a different available slot |

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| App Builder | Antigravity |
| UI Generation | Gemini 2.5 Flash |
| Logic Generation | Claude Sonnet 4.6 |
| Database | Antigravity built-in DB |
| Auth | Antigravity role-based auth |
| Deployment | Antigravity hosting |
| Future: Email | SMTP / SendGrid |
| Future: Calendar | Google Calendar API |
| Future: SSO | OAuth2 / SAML / LDAP |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Slot fill rate | > 70% of available slots booked |
| Conflict rate | 0% double bookings |
| Avg approval time | < 24 hours |
| No-show rate | < 10% |
| Admin interventions needed | < 5% of total bookings |
