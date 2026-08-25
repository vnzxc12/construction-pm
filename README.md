# 🏗️ BuildPulse — Construction Project Management Platform

A modern, cloud-native Construction Project Management System built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**, powered by **Supabase** (PostgreSQL, Auth, Storage, and Row Level Security), and optimized for **Vercel** zero-config continuous deployment.

---

## ⚡ Tech Stack & Architecture

* **Frontend / Full-Stack**: Next.js 14 (App Router, Server Components & Server Actions)
* **Styling**: Tailwind CSS & Lucide React
* **Backend Database**: Supabase PostgreSQL
* **Security**: Row Level Security (RLS) policies per tenant and user role
* **File Storage**: Supabase Storage (`blueprints`, `site-photos`, `project-documents`)
* **Deployment & CI/CD**: Vercel & GitHub Actions

---

## 📂 Project Structure

```
construction-pm/
├── README.md                             # GitHub & Vercel deployment guide
├── .env.example                          # Environment variables template
├── package.json                          # App dependencies & scripts
├── tailwind.config.ts                    # Styling & color tokens
├── supabase/
│   └── schema.sql                        # Complete PostgreSQL schema, RLS, storage buckets
└── src/
    ├── app/
    │   ├── page.tsx                      # Landing & Overview page
    │   ├── (auth)/                       # Login & Signup flows
    │   ├── dashboard/                    # Executive portfolio dashboard
    │   │   ├── projects/                 # Projects directory & creation modal
    │   │   │   └── [id]/
    │   │   │       ├── overview/         # Job site overview & stats
    │   │   │       ├── daily-logs/       # Daily field reports & weather
    │   │   │       ├── tasks/            # Critical path Kanban board
    │   │   │       ├── drawings/         # Blueprints & document storage
    │   │   │       ├── punch-list/       # Punch list & defect tracking
    │   │   │       ├── rfis/             # RFIs & Change Orders
    │   │   │       └── budget/           # Budget & cost control
    │   │   └── settings/                 # Backend status & organization config
    │   └── auth/callback/route.ts        # Supabase OAuth/Auth exchange handler
    ├── components/                       # Reusable UI primitives & layout
    ├── lib/
    │   ├── supabase/                     # Supabase SSR client, server, and middleware
    │   ├── mock-data.ts                  # Mock data for immediate out-of-the-box demo
    │   └── utils.ts                      # Formatting utilities
    └── types/
        └── database.ts                   # TypeScript interfaces matching Supabase schema
```

---

## 🚀 Step 1: Push to GitHub

### 1. Initialize Git Repository
In your terminal, navigate to this project folder and run:

```bash
cd C:\Users\vonn.serrano\.gemini\antigravity\scratch\construction-pm

git init
git add .
git commit -m "feat: initial commit of BuildPulse Construction PM System"
```

### 2. Create Repository on GitHub & Push
Using GitHub CLI (`gh`):
```bash
gh repo create construction-pm --public --source=. --remote=origin --push
```

Or manually on [github.com/new](https://github.com/new):
```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/construction-pm.git
git branch -M main
git push -u origin main
```

---

## 🗄️ Step 2: Set Up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard.
3. Open `supabase/schema.sql` from this repository, paste the contents into the SQL Editor, and click **Run**.
   * This creates all tables (`projects`, `tasks`, `daily_logs`, `punch_items`, `rfis`, `drawings_documents`, `change_orders`, etc.), enables Row Level Security (RLS), and provisions storage buckets.
4. Go to **Project Settings > API** and copy:
   * **Project URL**
   * **anon / public key**
   * **service_role key** (optional, for admin tasks)

---

## 🌐 Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select **"Import Git Repository"** and choose your `construction-pm` repository.
3. In **Environment Variables**, add:
   * `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project-id.supabase.co`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   * `SUPABASE_SERVICE_ROLE_KEY` = `your-service-role-key`
4. Click **Deploy**.

Vercel will build and deploy your project with a live HTTPS URL in under a minute! Every subsequent `git push` to your GitHub `main` branch will automatically trigger a new production deployment.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.