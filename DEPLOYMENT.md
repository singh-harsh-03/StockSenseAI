# StockSense AI - Free Deployment Guide

This guide will walk you through deploying your application for **100% free**, making it accessible via a public web link. We will use three services:
1. **Supabase**: Free PostgreSQL database (to store users, portfolios, AI history persistently).
2. **Render**: Free PaaS for the FastAPI backend.
3. **Vercel**: Free static hosting for the React frontend.

---

## Step 1: Push your code to GitHub
If you haven't already, push this entire project to a free GitHub repository. This is required because Vercel and Render will pull the code directly from GitHub.

## Step 2: Create a Free Database (Supabase)
Render's free tier has an "ephemeral" short-lived disk. If you use SQLite (as the app currently does locally), your users and data will be wiped out every few hours. To fix this, you will use a free managed database.

1. Go to [Supabase](https://supabase.com/) and create a free account.
2. Create a new Project. Choose a secure database password.
3. Once the project is created, go to **Project Settings > Database**.
4. Scroll down to **Connection string** -> **URI**.
5. Copy the PostgreSQL URI. **Important:** Replace `[YOUR-PASSWORD]` with the password you just created.
   *Example: `postgresql://postgres.[you]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`*
   *Keep this URI handy for Step 3.*

## Step 3: Deploy Backend (Render)
1. Go to [Render](https://dashboard.render.com/) and create a free account.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub account and select your `StockSenseAI` repository.
4. Render will automatically detect the `backend/render.yaml` file I created for you.
5. In the Environment Variables section during setup, you **must** supply:
   - `DATABASE_URL`: Add the Supabase connection string you copied in Step 2.
   - `JWT_SECRET`: Put any random long string here (e.g., `openssl rand -hex 32` or just smash your keyboard).
   - `ANTHROPIC_API_KEY`: Add your Claude API key.
6. Click **Deploy Web Service**.
7. Wait 5-10 minutes for it to deploy. Once it says "Live", copy the Render URL (e.g., `https://stocksense-backend.onrender.com`).

*(Note: Render free services spin down after 15 minutes of inactivity. When you visit it after sleeping, it will take ~50 seconds to boot up).*

## Step 4: Deploy Frontend (Vercel)
1. Go to [Vercel](https://vercel.com/) and create a free account.
2. Click **Add New... > Project**.
3. Import your `StockSenseAI` GitHub repository.
4. **Important Configuration:**
   - **Framework Preset**: Vite (should be auto-detected).
   - **Root Directory**: Click "Edit" and select `frontend`.
5. Expand **Environment Variables** and add:
   - Name: `VITE_API_URL`
   - Value: Add the Render URL you copied in Step 3 (No trailing slash!).
   *Example: `https://stocksense-backend.onrender.com`*
6. Click **Deploy**. Vercel will install dependencies and build your frontend.
7. Once finished, click **Continue to Dashboard** and visit your free `something.vercel.app` domain!

## Done! 🚀
You now have a production-ready application accessible via a generic web link. You can share the Vercel link with anyone.
