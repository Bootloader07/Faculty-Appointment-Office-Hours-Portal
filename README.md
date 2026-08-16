# 🎓 UniPortal — Faculty Appointment & Office Hours Portal

A role-based web application that lets students book appointments with faculty during office hours, lets faculty manage their availability, and gives admins full system-wide oversight — replacing scattered emails and messages with a structured, self-service booking system.



---

## ✨ Features

- **Role-based authentication** — Student / Faculty / Admin, each with isolated views
- **Faculty office hours** — recurring weekly availability + blocked-date overrides
- **Student booking flow** — browse faculty → view open slots → book → await approval
- **Faculty approval workflow** — approve, reject, or mark no-show
- **Real-time conflict detection** — one slot can never be double-booked
- **Cancellation & rescheduling** — with a 1-hour cutoff window for students
- **Admin dashboard** — full visibility across all users and bookings, with conflict override

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | JavaScript, React (JSX) |
| Backend | Node.js |
| Database | SQL (parameterised queries only) |
| Auth | Role-based, session/token-based (no third-party SSO in MVP) |

---

## 📁 Project Structure

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
  seed.js         → Sample/demo data for testing
```

---

## 🚀 Quick Start

No API keys, no third-party accounts, no `.env` secrets to hunt down — clone it and run it.

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd faculty-appointment-portal
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up the database

The app uses a local/self-hosted database — no external service or API key needed.

```bash
npm run db:migrate   # creates tables: users, office_hours, blocked_dates, appointments, notifications
npm run db:seed      # optional: loads demo accounts + sample data
```

> If your setup uses Antigravity's built-in DB instead of a separate database step, skip this and just run the app — Antigravity provisions it automatically on first run.

### 4. Run the app

```bash
npm run dev
```

The app will be available at:

```
http://localhost:3000
```

### 5. Log in with demo credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@uni.edu | Admin@123 |
| Faculty | dr.sharma@uni.edu | Faculty@123 |
| Student | alice@uni.edu | Student@123 |

Or click **Register** to create your own account with a valid email format.

---

## 🔐 Key Rules Enforced

- One slot = one student (DB-level unique constraint + app-level check)
- Students can't book within 1 hour of a slot's start time
- Faculty must approve every booking — no auto-confirm
- Blocked dates always override recurring office hours
- Passwords are hashed — never stored or logged in plain text
- Every page checks the logged-in user's role before rendering content

---

## 🗺️ Roadmap

| Phase | Scope |
|---|---|
| **Phase 1 (current)** | Role auth, booking flow, approvals, admin oversight |
| **Phase 2** | Email/SMS notifications, Google Calendar sync, SSO/LDAP |
| **Phase 3** | LMS integration (Moodle/Canvas), WhatsApp/SMS, AI meeting summarizer, mobile app |

---

