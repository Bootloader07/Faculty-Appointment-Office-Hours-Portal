# 🏗️ Architecture — Faculty Appointment & Office Hours Portal

## Overview

This portal is a role-based web application built on **Antigravity** with AI-assisted code generation using **Gemini 2.5 Flash** (UI & CRUD) and **Claude Sonnet 4.6** (logic, rules, edge cases). It serves three user types — Students, Faculty, and Admins — each with isolated views and permissions.

---

## System Layers

```
┌──────────────────────────────────────────────────────┐
│                    CLIENT LAYER                      │
│         Browser-based Web App (Antigravity)          │
│   Student UI | Faculty UI | Admin UI                 │
└────────────────────┬─────────────────────────────────┘
                     │ HTTP / REST
┌────────────────────▼─────────────────────────────────┐
│                 APPLICATION LAYER                    │
│          Antigravity Pages + Workflows               │
│   Auth | Booking Logic | Availability Engine         │
│   Conflict Detector | Notification Triggers          │
└──────────┬──────────────────────┬────────────────────┘
           │                      │
┌──────────▼──────────┐  ┌────────▼──────────────────┐
│    DATABASE LAYER   │  │       AI MODEL LAYER       │
│  Users, Bookings,   │  │  Gemini 2.5 Flash (UI)    │
│  OfficeHours,       │  │  Claude Sonnet 4.6 (Logic) │
│  BlockedDates,      │  └───────────────────────────┘
│  Notifications      │
└──────────┬──────────┘
           │
┌──────────▼──────────────────────────────────────────┐
│              INTEGRATION LAYER (Phase 2+)           │
│   University Email | Google Calendar | LMS | SSO    │
└─────────────────────────────────────────────────────┘
```

---

## User Roles & Access

| Role | Access Scope | Key Permissions |
|------|-------------|-----------------|
| **Student** | Own bookings only | Browse faculty, book/cancel/reschedule |
| **Faculty** | Own schedule only | Set hours, approve/reject, mark no-show |
| **Admin** | Full system | View all, override, manage users |

---

## Data Models

### `users`
```
id              UUID, primary key
name            string
email           string, unique
password_hash   string
role            enum: student | faculty | admin
department      string
created_at      timestamp
```

### `office_hours`
```
id              UUID, primary key
faculty_id      FK → users.id
day_of_week     enum: Mon | Tue | Wed | Thu | Fri | Sat
start_time      time (HH:MM)
end_time        time (HH:MM)
slot_duration   integer (minutes, default: 30)
is_recurring    boolean
effective_from  date
effective_until date (nullable)
```

### `blocked_dates`
```
id              UUID, primary key
faculty_id      FK → users.id
blocked_date    date
reason          string (optional)
```

### `appointments`
```
id              UUID, primary key
student_id      FK → users.id
faculty_id      FK → users.id
slot_datetime   datetime
duration        integer (minutes)
reason          string
status          enum: pending | confirmed | cancelled | rescheduled | no_show
created_at      timestamp
updated_at      timestamp
```

### `notifications`
```
id              UUID, primary key
user_id         FK → users.id
type            enum: booking_confirmed | booking_cancelled | reminder | reschedule
message         string
is_read         boolean
created_at      timestamp
```

---

## Page Map

```
/login                        → Auth page (all roles)
/register                     → Registration with role selection

/student/dashboard            → Upcoming appointments
/student/faculty              → Browse faculty directory
/student/faculty/:id          → View faculty slots + book
/student/appointments         → My bookings list
/student/appointments/:id     → Detail + cancel/reschedule

/faculty/dashboard            → Today's schedule overview
/faculty/office-hours         → Set/edit weekly availability
/faculty/blocked-dates        → Manage blocked dates
/faculty/appointments         → All requests (pending/confirmed)
/faculty/appointments/:id     → Approve/reject/mark no-show

/admin/dashboard              → System-wide stats
/admin/users                  → Manage all users
/admin/bookings               → All appointments across system
/admin/conflicts              → Conflict detection view
```

---

## Core Logic Flows

### Booking Flow
```
Student selects faculty
  → System fetches office_hours (excluding blocked_dates)
  → System checks existing appointments (removes taken slots)
  → Student picks available slot + enters reason
  → Appointment created with status: pending
  → Faculty notified
  → Faculty approves → status: confirmed → Student notified
  → Faculty rejects → status: cancelled → slot freed
```

### Conflict Prevention
```
On each booking attempt:
  → Query appointments WHERE faculty_id = X AND slot_datetime = Y AND status IN (pending, confirmed)
  → If count > 0 → reject with "Slot no longer available"
  → Use database-level unique constraint as backup lock
```

### Cancellation Rules
```
Student cancels:
  → Allowed if slot_datetime > NOW() + 1 hour
  → Status → cancelled, slot freed

Faculty cancels:
  → Allowed anytime
  → All students in affected slots notified
  → Status → cancelled
```

---

## AI Model Usage Strategy

| Module | Model | Reason |
|--------|-------|--------|
| Page layouts, forms, tables | Gemini 2.5 Flash | Fast UI generation |
| Booking logic, conflict detection | Claude Sonnet 4.6 | Complex conditional reasoning |
| CRUD operations | Gemini 2.5 Flash | Repetitive, fast |
| Notification triggers | Claude Sonnet 4.6 | Multi-step logic |
| Admin analytics | Gemini 2.5 Flash | Charts and summaries |
| Data model design | Claude Sonnet 4.6 | Schema accuracy |

---

## Future Integration Points

| Integration | Phase | Method |
|-------------|-------|--------|
| University Email (SMTP) | Phase 2 | Nodemailer / SendGrid |
| Google Calendar | Phase 2 | Google Calendar API + .ics |
| SSO / LDAP | Phase 2 | OAuth2 / SAML |
| LMS (Moodle/Canvas) | Phase 3 | REST API plugins |
| WhatsApp / SMS | Phase 3 | Twilio API |
| AI Meeting Summarizer | Phase 3 | Claude API |
