# CivicAI Backend API

A secure, production-ready Express.js REST API integrated with Supabase PostgreSQL and Google Gemini for the **CivicAI** Hyperlocal AI-Powered Civic Issue Reporting Platform.

---

## 🛠️ Tech Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **AI Engine**: Google Gemini 1.5 Flash Vision API
- **File Storage**: Supabase Storage
- **Gamification Engine**: Automated XP and badge-unlock services

---

## 📂 Project Structure

```
backend/
├── config/
│   └── supabase.js         # Supabase client instantiation (Admin & Public)
├── controllers/
│   ├── adminController.js  # Administrative portal & role update operations
│   ├── aiController.js     # AI scanning & image diagnostic orchestrators
│   ├── authController.js   # Citizens and staff profile authentication
│   ├── leaderboard.js      # Leaderboard rankings query logic
│   ├── notification.js     # Citizen system alerts and status updates
│   └── reportController.js # Civic issue reports CRUD & geospatial proximity
├── db/
│   ├── applySchema.js      # Automatic database schema application script
│   ├── checkDb.js          # Diagnostics script to check table state
│   └── schema.sql          # Core SQL tables, functions, triggers, and indices
├── middleware/
│   ├── auth.js             # Supabase JWT authentication & RBAC middleware
│   ├── errorHandler.js     # Global HTTP exception formatter
│   ├── upload.js           # Multer memory storage configuration
│   └── validator.js        # Request schema validation engine
├── routes/
│   ├── admin.js            # Admin /api/admin endpoints
│   ├── ai.js               # AI /api/ai endpoints
│   ├── auth.js             # Auth /api/auth endpoints
│   ├── leaderboard.js      # Leaderboard /api/leaderboard endpoints
│   ├── notifications.js    # Notifications /api/notifications endpoints
│   └── reports.js          # Reports /api/reports endpoints
├── services/
│   ├── aiService.js        # Google Gemini API connector with mock fallbacks
│   └── xpService.js        # Gamification XP history logger & badge unlocker
├── utils/
│   └── storage.js          # Supabase Storage bucket creators & uploader
├── .env.example            # Environment template configuration
├── package.json            # Node dependency configuration
└── server.js               # Express application entrypoint
```

---

## 🔑 Environment Setup

Create a file named `backend/.env` (or verify that the one open in your editor is saved) and populate it with the following configuration:

```ini
# Server Config
PORT=5000
NODE_ENV=development

# Supabase REST API & Auth Settings
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Supabase Direct PostgreSQL Connection (Required for automated migrations)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres

# Google AI Studio Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Security CORS Policy
CLIENT_URL=http://localhost:3000
```

---

## ⚡ Database setup

You can set up the database schema and indexes automatically or manually:

### Option A: Automated Database setup (Recommended)
Once you have populated `DATABASE_URL` in your `.env` file, run the migration runner to execute the schema and seed data directly on Supabase PostgreSQL:
```bash
npm run db:setup
```

### Option B: Manual SQL Editor (Fallback)
If you prefer not to share the PostgreSQL connection string:
1. Open the [Supabase Dashboard](https://supabase.com).
2. Go to **SQL Editor** in the left navigation panel.
3. Click **New query**.
4. Copy the entire contents of `backend/db/schema.sql` and paste it into the editor.
5. Click **Run**.

---

## 🪣 Storage Configuration

The backend contains built-in automated bucket initialization logic. It will check for and create a public bucket named `civic-reports` for report images if your `SUPABASE_SERVICE_ROLE_KEY` is active.

In case you wish to configure policies manually:
1. Go to **Storage** on the Supabase Dashboard.
2. Create a new bucket named `civic-reports`.
3. Set the bucket privacy to **Public**.
4. Add the following bucket Policies to allow public access:
   - **Select policy**: Read access to all folders/files.
   - **Insert policy**: Authenticated/anon upload permissions.

---

## 🧑‍💻 Running the Server

### 1. Verification Diagnostics
Run the diagnostic script to ensure that the backend can connect to Supabase and that the schema tables exist:
```bash
npm run db:check
```

### 2. Launch Local Server
Start the development server with Hot-Reload:
```bash
npm run dev
```

Or start the production server:
```bash
npm run start
```
