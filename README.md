# Guild Management System

A comprehensive web application for managing guild activities including boss timers, loot distribution, member management, and financial tracking.

## Features

### Public Access (All Users)
- **Boss Timer**: View boss respawn times and countdowns
- **Market Exchange**: Browse all loot items and participants
- **Guild Members**: View member roster and basic information
- **Search**: Find items by boss name, item name, or player name

### Admin Access (Admin Only)
- **Boss Management**: Full CRUD operations for bosses
- **CSV Upload**: Bulk import loot data via CSV
- **Status Management**: Update loot status (Pending → Sold → Settled)
- **Salary Calculations**: Automated salary distribution based on guild rules
- **Financial Dashboard**: Overview of guild finances and integrity checks
- **Reports**: Generate detailed reports for members, market exchange, and finances
- **Member Management**: Add/edit/delete guild members
- **Attendance Tracking**: Sync attendance based on loot participation

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Lucide React icons
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL (Supabase compatible)
- **Authentication**: JWT tokens with bcryptjs
- **Deployment**: Hostinger compatible

## Database Schema

### Core Models
- **Admin**: Administrator accounts with username/password
- **Member**: Guild members with roles (Guild Master, Core, Member)
- **Boss**: Boss entities with respawn timers
- **LootItem**: Individual loot items with values and status
- **LootParticipation**: Many-to-many relationship between members and loot
- **Salary**: Calculated salary distributions
- **Attendance**: Weekly attendance tracking
- **Settlement**: Historical settlement records
- **GuildFinancials**: Overall financial tracking

### Business Logic
- **Guild Master**: Always receives salary for all loot items
- **Core/Members**: Only receive salary for items they participated in
- **Promotion/Demotion Rules**: Applied based on dates relative to loot acquisition
- **Distribution Integrity**: Total distributed + guild fund = total loot value
- **Remainder Handling**: Undivisible amounts go to guild fund

## Setup Instructions

### 1. Environment Variables

The system requires the following environment variables in `.env`:

```env
# Database Configuration (Required)
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"

# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Authentication (Required)
JWT_SECRET="your-64-character-secret-key"
```

#### How to Get Supabase Credentials:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing project
3. Go to Settings → Database → Connection string (for `DATABASE_URL`)
4. Go to Settings → API → Project URL (for `NEXT_PUBLIC_SUPABASE_URL`)
5. Go to Settings → API → anon/public key (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

#### Generate JWT Secret:
```bash
openssl rand -hex 64
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Database Setup

```bash
# Generate Prisma client
bunx prisma generate

# Run database migrations
bunx prisma migrate dev --name initial_setup

# Seed database with default admin account
curl -X POST http://localhost:3000/api/setup
```

### 4. Start Development Server

```bash
bun dev
```

The application will be available at `http://localhost:3000`.

### 5. Default Admin Account

After seeding, use these credentials to login:
- **Username**: `admin`
- **Password**: `admin123`

**⚠️ Important**: Change the default admin password immediately in production!

## Usage Guide

### For Public Users

1. **Boss Timer**: View when bosses will respawn
2. **Market Exchange**: Browse all loot items and see who participated
3. **Guild Members**: View guild roster and member information

### For Admins

1. **Initial Setup**:
   - Add guild members via Guild Members page
   - Set up bosses via Boss Timer page
   - Upload loot data via Market Exchange CSV upload

2. **CSV Upload Format**:
   ```csv
   Item Name,Boss Name,Item Value,Date Acquired,Participants
   Sword of Power,Dragon King,1000,12/25/2023,Player1;Player2;Player3
   Magic Shield,Ice Lord,750,12/26/2023,Player2;Player4
   ```
   
   - Date format: MM/DD/YYYY
   - Participants: semicolon-separated list

3. **Salary Management**:
   - Update loot status to "Sold" when items are sold
   - Click "Recalculate All Sold" to trigger salary calculations
   - View salary breakdown in Admin Dashboard

4. **Reports**:
   - Access via API endpoints:
     - `/api/reports/members` - Member earnings report
     - `/api/reports/market-exchange` - Loot and sales report
     - `/api/reports/financial` - Financial overview report

## Deployment

### Hostinger Deployment

1. **Database Setup**:
   - Use Hostinger's PostgreSQL service or external Supabase
   - Update `DATABASE_URL` with production connection string

2. **Environment Variables**:
   - Set all required environment variables in Hostinger control panel
   - Generate new `JWT_SECRET` for production

3. **Build Process**:
   ```bash
   bun run build
   ```

4. **File Upload**:
   - Upload all files to Hostinger hosting directory
   - Ensure `node_modules` are properly installed on server

5. **Database Migration**:
   - Run migrations on production database
   - Seed initial admin account

## Security Considerations

- Change default admin credentials immediately
- Use strong JWT secret in production
- Enable HTTPS in production
- Regularly backup database
- Monitor access logs for suspicious activity

## API Endpoints

### Public Endpoints
- `GET /api/bosses` - List all bosses
- `GET /api/loot` - List all loot items (with search)
- `GET /api/members` - List all members

### Admin Endpoints (Require Authentication)
- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify token
- `POST/PUT/DELETE /api/bosses/*` - Boss management
- `POST /api/loot` - CSV upload
- `PUT /api/loot/[id]/status` - Update loot status
- `POST /api/loot/recalculate` - Trigger salary calculations
- `POST/PUT/DELETE /api/members/*` - Member management
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/reports/*` - Generate reports

## Support

For issues or questions:
1. Check environment variable configuration at `/env-check`
2. Verify database connection and migrations
3. Check browser console for client-side errors
4. Review server logs for API errors

## License

This project is proprietary software for guild management purposes.