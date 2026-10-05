# HRMS

Quickslogx Human Resource Management System (HRMS) - Enterprise Employee, Manager & Super Admin Portal.

## Features
- **Role-Based Access Control**:
  - Super Admin: System overview, manager management, global policy controls.
  - Manager: Employee onboarding, project & task assignments, attendance validation, client reports generation, chat groups creation.
  - Employee: Dedicated task board, check-in / check-out attendance with shift tracking, daily reports, payslip views, live chat.
- **In-App Live Chat**:
  - WhatsApp-like real-time messaging interface.
  - Manager-created teams & groups with email invitation system.
  - Privacy-preserving: Employee real names shown in chat bubbles (never raw emails).
  - Laptop / desktop native push notifications via HTML5 Web Notifications API.
- **Attendance & Compliance Engine**:
  - Daily check-in / check-out modal on first login.
  - Enforced checkout and daily report submission prior to logout.
  - Manager shift timings configuration and overtime/late calculation.
- **Reporting & Export**:
  - Filtered client-ready report exports by project/custom timeframes.
  - Monthly employee attendance and salary slips.
- **Security & Modern UI**:
  - Clean light and dark theme with high-contrast text rendering.
  - User profile image upload directly from device with automatic canvas compression.
  - Zero mock/test data footprint.

## Tech Stack
- Next.js 14 (App Router)
- React 18, TypeScript, Tailwind CSS
- Lucide Icons
- LocalStorage persistence with versioned stores

## Getting Started

First, install the dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```

Or build and run for production:
```bash
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
