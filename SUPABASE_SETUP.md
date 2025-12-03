# Supabase Database Setup Guide

This guide explains how to set up Supabase to persist your logins and jobs instead of using in-memory storage.

## What is Supabase?

Supabase is an open-source Firebase alternative that provides:
- PostgreSQL database
- Real-time APIs
- Authentication
- Easy setup with free tier

## Step 1: Create a Supabase Project

1. Go to https://supabase.com
2. Click **"Start your project"** and sign up (free)
3. Once signed in, click **"New Project"**
4. Fill in the form:
   - **Project name**: `walumbe-jobs` (or anything you like)
   - **Database password**: Create a strong password (you'll need this)
   - **Region**: Choose closest to you
5. Click **"Create new project"** and wait (takes ~2 minutes)

## Step 2: Create Database Tables

Once your project is ready:

1. In the left sidebar, click **"SQL Editor"**
2. Click **"New Query"**
3. Copy and paste this SQL:

```sql
-- Create users table
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE jobs (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'NOT_ALLOCATED',
  assigned_to_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed some initial users
INSERT INTO users (username, name, password, is_admin) VALUES
  ('admin', 'Admin User', 'password', TRUE),
  ('employee', 'Electrician Mike', 'password', FALSE),
  ('sarah', 'Installer Sarah', 'password', FALSE);

-- Seed some initial jobs
INSERT INTO jobs (title, description, status, assigned_to_id) VALUES
  ('Install Alarm System - Client A', 'Full alarm system setup for new residential client including motion sensors and door contacts.', 'ALLOCATED', 2),
  ('CCTV Maintenance - Office B', 'Routine check and lens cleaning for all 8 CCTV cameras at main office.', 'DONE', 3),
  ('Quote for Solar Panel Installation', 'Site visit and proposal generation for 5kW solar system at a commercial property.', 'NOT_ALLOCATED', NULL),
  ('Electrical Fence Repair - Farm C', 'Repair damaged section of electrical fence and test voltage.', 'ALLOCATED', 2),
  ('New Alarm System Setup - Admin', 'Internal setup for new security system in company workshop.', 'ALLOCATED', 1);
```

4. Click **"Run"** button (or Ctrl+Enter)
5. You should see a success message

## Step 3: Get Your Credentials

1. Go to **Project Settings** (bottom left, gear icon)
2. Click **"API"** tab
3. You'll see:
   - **Project URL** (copy this)
   - **Anon Public** (copy this key)

## Step 4: Create .env File

1. Open a text editor (Notepad, VS Code, etc.)
2. Create a file named `.env` in your `backend/` folder
3. Paste this and replace with your credentials:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_anon_key_here
```

Example (with real values):
```
SUPABASE_URL=https://abcdefgh123456.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. Save as `.env` (not `.env.txt`)

## Step 5: Install Python Packages

In your `backend/` folder, with venv activated:

```powershell
pip install -r requirements.txt
```

This installs:
- Flask & Flask-CORS
- Supabase Python client
- python-dotenv (to read .env file)

## Step 6: Restart the Backend

```powershell
# Stop the current Flask app (Ctrl+C)
# Then restart:
cd backend
.\venv\Scripts\Activate.ps1
python app.py
```

You should see:
```
Connected to Supabase at https://your-project-id.supabase.co
Supabase configured: True
```

## Step 7: Test It

1. Visit http://localhost:5500 in your browser
2. Register a new user or login with:
   - **Username**: admin
   - **Password**: password
3. If you login as admin, you can:
   - Assign jobs by typing a user's name in the text field
   - Jobs will be saved in the Supabase database
4. Data persists across page refreshes and restarts!

## Troubleshooting

**Error: "Failed to fetch users" or "Database not configured"**
- Make sure `.env` file exists in `backend/` folder
- Check that `SUPABASE_URL` and `SUPABASE_KEY` are correct
- Verify the file is named `.env` (not `.env.txt`)
- Restart Flask backend

**Error: "relation 'users' does not exist"**
- The SQL query didn't run successfully
- Go back to **SQL Editor** in Supabase and check the result
- Copy-paste the SQL again

**Login fails with correct credentials**
- Check that the seed users exist in the database
- Go to **Table Editor** in Supabase, click `users` table
- Should see: admin, employee, sarah

**Can't find Supabase settings**
- Make sure you're logged into the right Supabase account
- Project should appear in the dashboard
- Click on your project name

## Keeping .env Secret

**IMPORTANT**: Never commit `.env` to GitHub or share your keys!

- `.env` is already in `.gitignore` (if using Git)
- Keep credentials private
- If you accidentally leak a key, go to Supabase → Project Settings → API → Regenerate key

## Next Steps

- Explore Supabase dashboard to view your data
- Add more fields to users or jobs tables as needed
- Consider adding JWT authentication for production
- Add password hashing (bcrypt) instead of storing plain text

## Useful Supabase Links

- **Dashboard**: https://app.supabase.com
- **Documentation**: https://supabase.com/docs
- **Python Client**: https://github.com/supabase-community/supabase-py
