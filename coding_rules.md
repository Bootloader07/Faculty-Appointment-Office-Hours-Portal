# ⚙️ Coding Rules — Faculty Appointment & Office Hours Portal

## Purpose

This document defines the standards, conventions, and rules that govern all code generated in Antigravity for this project. Every prompt sent to **Gemini 2.5 Flash** or **Claude Sonnet 4.6** must produce code that follows these rules. Share this file at the start of any new Antigravity session.

---

## 🤖 Model Responsibilities

### Use Gemini 2.5 Flash for:
- Page layouts and UI components
- Forms (login, registration, booking, office hours setup)
- Tables and list views (faculty directory, appointments list)
- Basic CRUD screens
- Admin dashboard charts and stats

### Use Claude Sonnet 4.6 for:
- Booking conflict detection logic
- Slot availability calculation
- Cancellation and rescheduling rules
- Notification trigger conditions
- Role-based permission enforcement
- Data model design and validation schemas
- Any multi-step conditional logic

**Rule:** Never mix responsibilities in a single prompt. One model, one task.

---

## 📁 Project Structure Convention

```
/pages
  /auth           → login.js, register.js
  /student        → dashboard.js, faculty-list.js, book.js, appointments.js
  /faculty        → dashboard.js, office-hours.js, blocked-dates.js, requests.js
  /admin          → dashboard.js, users.js, bookings.js, conflicts.js

/components
  /shared         → Navbar.js, Sidebar.js, Button.js, Modal.js, Badge.js
  /student        → SlotPicker.js, AppointmentCard.js, FacultyCard.js
  /faculty        → ScheduleTable.js, RequestCard.js, HoursForm.js
  /admin          → StatsCard.js, ConflictAlert.js, UserTable.js

/logic
  availability.js → Slot generation from office hours
  conflict.js     → Conflict detection engine
  booking.js      → Booking rules and validation
  notifications.js → Notification trigger conditions

/data
  models.js       → Schema definitions
  seed.js         → Sample data for testing
```

---

## 🗃️ Database Rules

1. **Always use UUIDs** as primary keys, never auto-increment integers.
2. **Every table must have** `created_at` and `updated_at` timestamps.
3. **Foreign keys must be enforced** — never store raw strings where a relation exists.
4. **Status fields use enums** — never plain strings like "approved" or "done".
5. **Soft deletes preferred** — add `deleted_at` (nullable) instead of hard deleting records.
6. **Index these fields:** `faculty_id`, `student_id`, `slot_datetime`, `status` in the `appointments` table.

### Allowed Status Values

```
appointments.status:
  pending | confirmed | cancelled | rescheduled | no_show

office_hours.day_of_week:
  Mon | Tue | Wed | Thu | Fri | Sat | Sun

users.role:
  student | faculty | admin
```

---

## 🔐 Auth & Role Rules

1. **Every page must check user role** before rendering any content.
2. **Students cannot access** `/faculty/*` or `/admin/*` routes.
3. **Faculty cannot access** `/student/*` or `/admin/*` routes.
4. **Admin can access all routes.**
5. **Unauthenticated users** must be redirected to `/login`.
6. **Never expose other users' personal data** — students can only see faculty name, department, and available slots. Not email, not other students' bookings.
7. **Passwords must be hashed** — never store or log plain text passwords.

### Prompt Rule for Auth:
> Always begin page-generation prompts with:
> `"This page is for [ROLE] users only. Add a role check at the top — if the logged-in user's role is not [ROLE], redirect them to /login."`

---

## 🧠 Booking Logic Rules

These rules must be enforced in every booking-related prompt:

```
RULE 1: Slot Uniqueness
A slot (faculty_id + slot_datetime) can have at most ONE appointment
with status = pending OR confirmed at any given time.
→ Enforce with DB unique constraint AND application-level check.

RULE 2: Booking Window
Students may not book a slot that starts within 60 minutes of NOW().
→ Check: slot_datetime > NOW() + INTERVAL '1 hour'

RULE 3: No Past Bookings
slot_datetime must be in the future at time of booking.

RULE 4: Blocked Date Override
If faculty has a blocked_date entry for the date of a slot,
that slot must NOT appear as available — even if office_hours exist.

RULE 5: Cancellation Window
Students may cancel only if slot_datetime > NOW() + INTERVAL '1 hour'.
Faculty may cancel at any time.
Admin may cancel at any time.

RULE 6: Status Transitions (only these are valid)
pending     → confirmed   (faculty approves)
pending     → cancelled   (faculty rejects OR student cancels)
confirmed   → cancelled   (student or faculty cancels)
confirmed   → rescheduled (student reschedules)
confirmed   → no_show     (faculty marks after slot time passes)
rescheduled → [new appointment created with status: pending]
```

---

## 🖥️ UI / Frontend Rules

1. **Mobile-responsive by default** — use flexible layouts, not fixed pixel widths.
2. **Loading states are required** on every async action (booking, approving, cancelling).
3. **Error messages must be user-friendly** — no raw API errors shown to users.
4. **Confirmation dialogs required** before any destructive action (cancel, reject, delete).
5. **Status badges** must use consistent color coding:

| Status | Color |
|--------|-------|
| Pending | Yellow / Amber |
| Confirmed | Green |
| Cancelled | Red |
| Rescheduled | Blue |
| No Show | Grey |

6. **Date/time display** must always show the timezone explicitly (e.g., `Mon, 14 Aug 2026 · 2:00 PM IST`).
7. **Empty states** — every list must show a helpful message when empty (not a blank screen).

---

## 📝 Prompt Writing Rules for Antigravity

Follow this structure for every prompt:

```
[MODEL CHOICE]: Use [Gemini 2.5 Flash / Claude Sonnet 4.6] for this.

[ROLE CONTEXT]: This screen is for [student / faculty / admin] users only.

[WHAT TO BUILD]: Build a [page / component / logic block] that does:
  1. ...
  2. ...
  3. ...

[DATA CONTEXT]: Connect this to the [table name] table. The relevant fields are: [list fields].

[RULES TO ENFORCE]: Apply these rules:
  - [Rule 1]
  - [Rule 2]

[UI REQUIREMENTS]: The UI must:
  - Show a loading spinner during data fetch
  - Show [error/empty state] if no data
  - Use status badge colors as defined in coding_rules.md

[DO NOT]: Do not [common mistake or shortcut to avoid].
```

---

## 🔁 Slot Generation Logic

When prompting Claude to generate availability slots, always use this spec:

```
Input:
  - office_hours records for a faculty member (day, start_time, end_time, slot_duration)
  - blocked_dates for that faculty
  - existing appointments (pending or confirmed)
  - date range: today to today + 14 days

Output:
  - Array of available slot objects: { datetime, faculty_id, duration }

Logic:
  1. For each day in the date range, check if day_of_week matches office_hours
  2. If the date is in blocked_dates → skip entire day
  3. Generate time slots from start_time to end_time in slot_duration increments
  4. Remove slots where datetime <= NOW() + 1 hour
  5. Remove slots where a pending/confirmed appointment already exists
  6. Return remaining slots as available
```

---

## ✅ Code Quality Checklist

Before considering any screen or module complete, verify:

- [ ] Role check is present at the top of the page
- [ ] All DB queries use parameterised inputs (no string concatenation)
- [ ] Loading state shown during async operations
- [ ] Error state handled and shown to user
- [ ] Empty state handled and shown to user
- [ ] Confirmation dialog before destructive actions
- [ ] Status values match the allowed enum list
- [ ] Booking rules enforced (not just on UI but also in backend logic)
- [ ] No hardcoded user IDs, faculty IDs, or slot times
- [ ] Timestamps stored in UTC, displayed in local timezone

---

## 🚫 Anti-Patterns — Never Do These

| Anti-Pattern | Why It's Banned |
|-------------|-----------------|
| Store plain text passwords | Security violation |
| Use auto-increment integer IDs | Predictable, enumerable — use UUIDs |
| Show raw DB errors to users | Leaks schema info, bad UX |
| Allow booking without role check | Any user could book as anyone |
| Hard-delete appointments | Breaks audit trail — use soft delete |
| Skip the blocked_date check | Creates ghost slots on holidays |
| Auto-confirm bookings | Faculty must approve — no exceptions in MVP |
| Allow past-date office hours | Faculty can't set hours in the past |
| Use free-text for status fields | Always use defined enum values |

---

## 🧪 Testing Scenarios to Validate After Each Build

### Booking Flow
- Student books a slot → status is `pending`
- Second student tries same slot → gets "unavailable" error
- Faculty approves → status becomes `confirmed`
- Faculty rejects → status becomes `cancelled`, slot is freed

### Cancellation
- Student cancels 2 hours before → allowed, slot freed
- Student cancels 30 minutes before → blocked with error
- Faculty cancels a confirmed booking → allowed, slot freed

### Availability
- Faculty sets Mon 2–4 PM with 30-min slots → 4 slots generated
- Faculty blocks next Monday → no slots shown that day
- All 4 slots booked → faculty's calendar shows no availability

### Role Guards
- Student navigates to `/admin/dashboard` → redirected to `/login`
- Faculty navigates to `/student/faculty` → redirected to `/login`
- Admin navigates to any page → access granted
