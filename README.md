# CampusGuard - Backend API Server

CampusGuard is a secure, anonymous campus safety and incident reporting platform. The backend provides enterprise-grade REST APIs for anonymous incident reporting, encrypted message threading between reporters and university authorities, role-based access control, file attachments, and audit logging.

---

## 🚀 Key Features

- **Anonymous Incident Reporting**: Allows students to submit incident reports without revealing personal identifiable information.
- **Passcode-Protected Report Tracking**: Generates unique hashed passcodes for reporters to check report status and interact with authorities.
- **Two-Way Anonymous Messaging**: Encrypted communication channel between campus security personnel and anonymous whistleblowers/reporters.
- **Role-Based Authority Access**: Secure JWT authentication and authorization for campus safety officers and administrators.
- **Secure File Uploads**: Direct-to-cloud file attachment handling with Supabase Storage and mime-type validation.
- **Robust Security & Rate Limiting**: Built-in rate limiting, security headers, request logging, and centralized error handling.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js & TypeScript
- **Framework**: Express.js
- **ORM**: Prisma ORM
- **Database**: PostgreSQL
- **Cloud Storage**: Supabase Storage
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **Validation & Security**: Express Rate Limit, Helmet, Multer, CORS

---

## 📂 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma              # Database schema & entity definitions
│   └── migrations/                # Database migration history
├── scripts/
│   ├── createAuthority.ts         # Admin/Authority seed script
│   └── testBackend.ts             # E2E integration test suite
├── src/
│   ├── configs/                   # Environment & configuration loader
│   ├── errors/                    # Custom application error classes
│   ├── helpers/                   # Pagination & query utilities
│   ├── interfaces/                # Common error & request interfaces
│   ├── libs/                      # Prisma & Supabase client instances
│   ├── middlewares/               # JWT auth, rate limiting, logging, error handling
│   ├── modules/
│   │   ├── authorities/           # Authority authentication & admin management
│   │   ├── file_upload/           # Media upload endpoints & storage integration
│   │   ├── messages/              # Two-way anonymous chat & communication
│   │   └── reports/               # Incident report submission, tracking & updates
│   ├── routes/                    # Centralized API route aggregation
│   ├── types/                     # Express & ambient TypeScript definitions
│   ├── utils/                     # Async handlers & standardized JSON responses
│   ├── app.ts                     # Express application configuration
│   └── server.ts                  # Server entrypoint and graceful shutdown
├── .env.example                   # Template environment variables
├── package.json                   # Dependencies and npm scripts
└── tsconfig.json                  # TypeScript compiler options
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL database
- Supabase account (for object storage)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Muhiuddin2005/campusGuardBackend.git
   cd campusGuardBackend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your PostgreSQL database URL, JWT secrets, and Supabase credentials.

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. Seed initial authority user:
   ```bash
   npx ts-node scripts/createAuthority.ts
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/authorities/login` | Authority staff login | No |
| `GET` | `/api/v1/authorities/me` | Current authority profile | Yes (Authority) |
| `POST` | `/api/v1/reports` | Submit anonymous incident report | No |
| `POST` | `/api/v1/reports/track` | Track report with report ID & passcode | No |
| `GET` | `/api/v1/reports` | List reports with filtering & pagination | Yes (Authority) |
| `PATCH` | `/api/v1/reports/:id/status` | Update report status (Investigation, Resolved) | Yes (Authority) |
| `GET` | `/api/v1/messages/:reportId` | Fetch message thread for a report | Passcode / Authority |
| `POST` | `/api/v1/messages` | Send message in report thread | Passcode / Authority |
| `POST` | `/api/v1/upload` | Upload media attachments | No / Authority |

---

## 🔒 Security Best Practices

- Passwords and passcodes are hashed using bcrypt with dynamic salts.
- Request rate limiting prevents brute-force attempts on sensitive endpoints.
- Authorization tokens are validated using stateless RS256/HS256 JWT tokens.
- All file uploads are verified against allowed MIME types and size constraints before storage.

---

## 📄 License

This project is licensed under the MIT License.
