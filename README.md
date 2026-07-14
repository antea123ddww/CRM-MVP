# CRM MVP

CRM MVP is a web-based Customer Relationship Management platform for managing companies, contacts, leads, deals, tasks, activities, notes, users, settings and reports.

## Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- Recharts
- jsPDF / XLSX export

### Backend
- Node.js
- Express.js
- Prisma ORM
- JWT authentication
- Refresh tokens
- CSRF token checks
- Bcrypt password hashing
- PostgreSQL

## Project Structure

```txt
my_crm/
  backend/
    prisma/
    src/
      controllers/
      routes/
      services/
      middleware/
      validators/
      lib/
  frontend/
    app/
    components/
    services/
    schemas/
  deploy/
    ecosystem.config.js
    nginx.conf
  scripts/
    backup.bat
    backup-schedule.ps1
  backups/
```

Root contains only project-wide documentation and deployment config such as `render.yaml`.

## Main Features

- Authentication: login, logout, refresh token, password reset, protected user creation.
- RBAC: admin-only user/settings/audit access, manager/admin dashboards, sales ownership filtering.
- CRM modules: companies, contacts, leads, deals, tasks, activities and notes.
- Dashboard and reports with CSV, Excel and PDF export.
- Audit logs for successful write operations.
- Docker Compose for PostgreSQL, backend and frontend.

## Development

```bash
cd backend
npm run build

cd ../frontend
npm run build
```

## Docker

Docker Compose files live in `backend/`:

```bash
cd backend
docker compose up --build
```

## Backup

Run `scripts/backup.bat` on Windows to create PostgreSQL backups in `backups/`. The script removes `.sql` backup files older than 30 days.

To schedule daily backups on Windows, run PowerShell as administrator:

```powershell
.\scripts\backup-schedule.ps1
```

The scheduled task runs `scripts/backup.bat` every day at 02:00 and keeps the same 30-day retention policy.

## Non-Functional Readiness

- Performance: the backend records request duration and warns when an API request exceeds the 300ms target.
- Dashboard load: dashboard statistics are fetched in parallel with Prisma queries.
- Availability: Docker services use `restart: always`, health checks and `/api/health` for uptime monitoring.
- Scalability: `deploy/nginx.conf` uses upstream blocks, and `backend/docker-compose.scale.yml` provides a replica-ready override for frontend/backend services.
- Multi-tenant readiness: `Tenant` and optional `tenantId` fields exist on users and CRM records; services apply tenant filters when a logged-in user has a tenant.
- Backup: `scripts/backup.bat` creates PostgreSQL backups and removes `.sql` files older than 30 days.
