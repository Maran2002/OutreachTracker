# 🎯 OutreachTracker

> A full-stack, self-hosted web application to track, manage, and follow up on cold outreach efforts during a job search — built for personal use and open to all job seekers.

---

## 📌 Why I Built This

During an intensive job search period, I was sending dozens of cold emails, LinkedIn messages, and follow-up notes every week. Tracking all of that across spreadsheets was messy, error-prone, and time-consuming.

**OutreachTracker** was created to solve that personal pain point — a single, structured, and beautiful place to:
- Record every cold contact I make
- Know exactly who to follow up with and when
- Understand which outreach methods work best
- Never let a response slip through the cracks

This is a personal project built from scratch, tailored to my own workflow.

---

## 🚀 What It Does

OutreachTracker is a multi-user platform with two access levels:

### 👤 User Features
- **Log outreach records** — Company, contact name, role, email/URL, date, type, method
- **Status tracking** — Sent, Responded, Interview Scheduled, Rejected, No Response, etc.
- **Follow-up reminders** — Automated reminder scheduling (up to 2 per record)
- **Detailed view + edit** — Read-only detail view with a separate edit form
- **Dashboard metrics** — Overview of total outreach, response rates, upcoming follow-ups
- **Search & filter** — Filter by status, type, method; search by company or contact
- **Email Gallery** — Store and manage contact emails (name, email, position, company) from different organisations with add, edit, delete, and detailed view
- **Profile management** — Update personal details and name reflects instantly in the header
- **Responsive dark-mode UI** — Works across all screen sizes

### 🔐 Admin Features
- **Admin console** with granular, role-based permission system
- **User directory** — View all registered users with outreach counts
- **Global outreach audit** — Read-only view of all outreach records across all users
- **Global Email Gallery** — Read-only view of all users' email contacts with user-based filter
- **Admin management** — Create/edit/deactivate other admins with custom permissions
- **Admin profile** — Update admin credentials including password change (requires `profile.edit` permission)
- **System Control Dashboard** — Consolidated stats endpoint; only `dashboard.view` is required
- **Access control** — Pages and sidebar items hidden/locked based on permission set
- **Live header name update** — Header reflects the new name immediately after profile save

---

## 🛠️ Technical Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) |
| **UI Library** | React 19 |
| **Database** | MongoDB via [Mongoose 8](https://mongoosejs.com/) |
| **Auth** | JWT (via [jose](https://github.com/panva/jose)) + bcryptjs |
| **Validation** | [Zod](https://zod.dev/) |
| **Styling** | Vanilla CSS + Tailwind CSS v4 utility classes |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **State Management** | React Context + Zustand |
| **Class Utilities** | clsx + tailwind-merge |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (public)/           # Public auth pages (login, register, forgot/reset password)
│   ├── (user)/             # Authenticated user pages
│   │   ├── dashboard/
│   │   ├── outreach/
│   │   │   ├── page.js         # All outreach list with filters
│   │   │   ├── add/page.js     # Add new outreach form
│   │   │   └── [id]/
│   │   │       ├── page.js     # Read-only detail view
│   │   │       └── edit/page.js # Edit form
│   │   ├── email-gallery/      # Email contacts gallery (CRUD)
│   │   ├── reminders/
│   │   └── profile/
│   ├── admin/              # Admin console pages (permission-gated)
│   │   ├── dashboard/
│   │   ├── admins/
│   │   ├── users/
│   │   ├── outreaches/
│   │   ├── email-gallery/      # Global read-only email gallery + user filter
│   │   └── profile/
│   └── api/v1/             # REST API route handlers
│       ├── auth/           # Login, register, logout, forgot/reset password
│       ├── admin/          # Admin-specific APIs
│       │   ├── dashboard/stats/  # Consolidated stats (dashboard.view only)
│       │   ├── email-gallery/    # Global email gallery read
│       │   ├── users/
│       │   ├── outreaches/
│       │   └── admins/
│       ├── outreaches/     # CRUD for outreach records
│       ├── email-gallery/  # User-scoped CRUD for email contacts
│       ├── reminders/      # Reminder listing and management
│       ├── dashboard/      # User dashboard metrics aggregation
│       └── profile/        # Profile update & close account
│
├── components/
│   ├── layout/             # Sidebar, AdminSidebar, Topbar, AppInfoPanel
│   ├── providers/          # AdminProvider & UserProvider (context + live name update)
│   └── ui/                 # Reusable UI components (Input, Button, Modal, etc.)
│
├── constants/              # Outreach types, methods, statuses, admin permissions
├── lib/
│   ├── auth/               # JWT signing/verification, session helpers, password hashing
│   ├── db/                 # MongoDB connection (singleton)
│   ├── permissions/        # Server-side permission check utilities
│   ├── reminders/          # Reminder scheduling logic
│   ├── utils/              # formatDate, apiSuccess, apiError, apiPaginated helpers
│   └── validation/         # Zod schemas for all request bodies and query params
│
├── models/                 # Mongoose models: User, Admin, Outreach, Reminder, EmailRecord
└── middleware.js            # Route protection: user and admin path guards
```

---

## 🔐 Authentication & Security

- JWT sessions stored in **HTTP-only cookies** (not accessible via JS)
- Passwords hashed with **bcrypt (12 rounds)**
- All protected routes guarded at **both middleware level and layout level**
- Admin API routes verify **both session AND per-field permissions** server-side
- Admin permissions are granular:
  - `dashboard.view`, `users.view`, `outreaches.view`, `email_gallery.view`
  - `admins.view`, `admins.create`, `admins.edit`, `admins.delete`
  - `profile.edit` — required for both UI access and API self-update
- Sidebar links and page content dynamically filtered to match permissions
- Dashboard stats use a **dedicated endpoint** (`/api/v1/admin/dashboard/stats`) requiring only `dashboard.view` — never touches the per-feature list endpoints

---

## 📦 Data Models

### User
| Field | Type | Notes |
|---|---|---|
| name | String | Required |
| email | String | Unique, lowercase |
| passwordHash | String | select: false |
| authProvider | Enum | `local` \| `google` |
| status | Enum | `active` \| `inactive` \| `closed` |
| reminderSettings | Object | intervalDays, maxReminders, timezone |
| lastLoginAt | Date | Updated on login |

### Admin
| Field | Type | Notes |
|---|---|---|
| name | String | Required |
| email | String | Unique, lowercase |
| passwordHash | String | select: false |
| permissions | [String] | Granular permission set |
| status | Enum | `active` \| `inactive` |

### Outreach
| Field | Type | Notes |
|---|---|---|
| userId | ObjectId | Reference to User |
| company | String | Required |
| contactName | String | Required |
| contactRole | String | Optional |
| contactUrl | String | Email or LinkedIn URL |
| date | Date | Date contacted |
| outreachType | Enum | cold_email, linkedin, etc. |
| method | Enum | email, phone, linkedin, etc. |
| status | Enum | sent, responded, interview, rejected, etc. |
| followUpDate | Date | Target date for next action |
| interviewScheduled | Boolean | |
| nextAction | String | Plain text action note |
| response | String | Response summary |
| notes | String | Private internal notes |

### Reminder
| Field | Type | Notes |
|---|---|---|
| outreachId | ObjectId | Reference to Outreach |
| userId | ObjectId | Reference to User |
| reminderNumber | Number | 1 or 2 |
| scheduledFor | Date | When reminder fires |
| status | Enum | `pending`, `sent`, `cancelled` |

### EmailRecord
| Field | Type | Notes |
|---|---|---|
| userId | ObjectId | Reference to User (owner) |
| name | String | Contact full name |
| email | String | Contact email address |
| position | String | Contact's job position/role |
| companyName | String | Company or organisation |
| createdAt | Date | Auto-set timestamp |
| updatedAt | Date | Auto-updated timestamp |

---

## ⚙️ Getting Started (Local)

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/outreach-tracker.git
cd outreach-tracker

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Environment Variables

```env
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/outreach-tracker

# JWT configuration (min 64 chars)
JWT_SECRET=your-secret-key-minimum-64-characters-long-for-cold-outreach-tracker

# Cookie name for session
SESSION_COOKIE_NAME=cold_outreach_session

# Node environment
NODE_ENV=development
```

### Running Locally

```bash
npm run dev
# App runs at http://localhost:3000
```

### Creating the First Admin

Since there is no admin registration UI (by design), insert the first admin document manually into MongoDB. Generate a bcrypt hash of your password first:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourPassword@123', 12).then(console.log)"
```

Then insert into the `admins` collection:

```javascript
db.admins.insertOne({
  name: "Super Admin",
  email: "admin@yourdomain.com",
  passwordHash: "<bcrypt-hash-from-above>",
  permissions: [
    "users.view", "outreaches.view",
    "admins.view", "admins.create", "admins.edit", "admins.delete",
    "dashboard.view", "profile.edit"
  ],
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date()
});
```

---

## 🔮 Future Work / Roadmap

- [ ] **Email integration** — Send outreach emails directly from the app and track opens/replies
- [ ] **Analytics & Charts** — Visual breakdown of outreach performance (response rates, method effectiveness)
- [ ] **CSV Import / Export** — Bulk import from spreadsheets, export data for offline review
- [ ] **Browser push notifications** — Get alerted for reminders without checking the app
- [ ] **Kanban view** — Drag-and-drop board view of outreach by status pipeline
- [ ] **Team / organisation accounts** — Shared workspaces for group job hunts or agency use
- [ ] **Google OAuth** — One-click sign-in with Google (model already supports it)
- [ ] **Mobile app** — React Native companion app for logging outreach on the go
- [ ] **AI-powered insights** — Suggest follow-up messages or highlight stale records
- [ ] **Dark/light mode toggle** — Currently dark-mode only

---

## 📸 Pages Overview

| Route | Description |
|---|---|
| `/login` | User login |
| `/register` | User registration |
| `/forgot-password` | Password reset request |
| `/dashboard` | Summary metrics & upcoming reminders |
| `/outreach` | Paginated list of all outreach records |
| `/outreach/add` | Add a new outreach record |
| `/outreach/[id]` | Read-only detailed view of a record |
| `/outreach/[id]/edit` | Edit an existing outreach record |
| `/reminders` | Pending, upcoming, and sent reminders |
| `/email-gallery` | User's email contacts gallery (CRUD) |
| `/profile` | User profile & reminder settings |
| `/admin/login` | Admin login (separate from user login) |
| `/admin/dashboard` | Admin system overview (consolidated stats) |
| `/admin/users` | Read-only user directory |
| `/admin/outreaches` | Read-only global outreach audit |
| `/admin/email-gallery` | Read-only global email gallery + user filter |
| `/admin/admins` | Admin management & permissions |
| `/admin/profile` | Admin profile & credential update (requires `profile.edit`) |

---

## 👨‍💻 Made By

**Elamaran A** — Full-Stack Developer

Built entirely from scratch for personal use during job searching. Open-sourced in case it helps other developers on their own job hunts.

- 🌐 Portfolio: [elamaran-portfolio.web.app](https://elamaran-portfolio.web.app/?por-ref=OutReachTracker_gitRepo)

---

## 📄 License

This project is open for personal and educational use. Feel free to fork and customise for your own job search needs.
