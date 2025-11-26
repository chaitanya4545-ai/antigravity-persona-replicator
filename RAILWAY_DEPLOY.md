# Railway Deployment - Step by Step Guide

## ✅ Prerequisites Completed
- Git repository initialized
- Code committed and ready

## 📋 What You Need

1. **GitHub Account** - To push your code
2. **Railway Account** - Sign up at [railway.app](https://railway.app)
3. **OpenAI API Key** - Get from [platform.openai.com](https://platform.openai.com)

---

## 🚀 Deployment Steps

### Step 1: Push to GitHub

1. **Create a new repository on GitHub:**
   - Go to [github.com/new](https://github.com/new)
   - Name: `antigravity-persona-replicator`
   - Make it **Public** or **Private** (your choice)
   - **Don't** initialize with README (we already have code)
   - Click "Create repository"

2. **Push your code:**
   ```bash
   cd "C:\Users\Chaitanya\Downloads\Chaitanya Python\antigravity-persona-replicator"
   git remote add origin https://github.com/YOUR-USERNAME/antigravity-persona-replicator.git
   git branch -M main
   git push -u origin main
   ```
   Replace `YOUR-USERNAME` with your GitHub username.

---

### Step 2: Deploy Backend to Railway

1. **Go to [railway.app](https://railway.app)**
   - Click "Login" → Sign in with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `antigravity-persona-replicator`

3. **Add PostgreSQL Database:**
   - In your project, click "New"
   - Select "Database" → "Add PostgreSQL"
   - Railway will provision it automatically

4. **Configure Backend Service:**
   - Click on your backend service (should auto-detect)
   - Go to "Settings"
   - **Root Directory**: Set to `backend`
   - **Start Command**: Should auto-detect as `npm start`

5. **Set Environment Variables:**
   - Click on backend service → "Variables" tab
   - Click "New Variable" and add each:

   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=your-random-secret-key-here-make-it-long-and-random
   OPENAI_API_KEY=sk-your-openai-api-key-here
   FRONTEND_URL=https://your-app.vercel.app
   NODE_ENV=production
   PORT=5000
   ```

   **Important Notes:**
   - `${{Postgres.DATABASE_URL}}` - Railway auto-fills this from your PostgreSQL service
   - `JWT_SECRET` - Generate a random string (use a password generator, 32+ characters)
   - `OPENAI_API_KEY` - Get from OpenAI platform
   - `FRONTEND_URL` - We'll update this after deploying frontend

6. **Deploy:**
   - Railway will automatically build and deploy
   - Wait for deployment to complete (2-3 minutes)
   - Copy your backend URL (e.g., `https://antigravity-backend-production.up.railway.app`)

---

### Step 3: Deploy Frontend to Vercel

1. **Go to [vercel.com](https://vercel.com)**
   - Sign in with GitHub

2. **Import Project:**
   - Click "Add New" → "Project"
   - Select `antigravity-persona-replicator` repository
   - Click "Import"

3. **Configure Build Settings:**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Set Environment Variable:**
   - Click "Environment Variables"
   - Add:
     ```
     VITE_API_URL=https://your-backend.up.railway.app/api
     ```
   - Replace with your actual Railway backend URL from Step 2

5. **Deploy:**
   - Click "Deploy"
   - Wait for build (1-2 minutes)
   - Copy your Vercel URL (e.g., `https://antigravity-persona-replicator.vercel.app`)

---

### Step 4: Update Backend CORS

1. **Go back to Railway**
   - Click on backend service → "Variables"
   - Update `FRONTEND_URL` to your Vercel URL:
     ```
     FRONTEND_URL=https://antigravity-persona-replicator.vercel.app
     ```
   - Railway will automatically redeploy

---

### Step 5: Run Database Migrations

**Option A: Using Railway CLI (Recommended)**

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login and link:
   ```bash
   railway login
   railway link
   ```

3. Run migrations:
   ```bash
   railway run npm run migrate
   ```

4. (Optional) Seed demo data:
   ```bash
   railway run npm run seed
   ```

**Option B: Manual SQL**

1. Go to Railway → PostgreSQL service → "Data" tab
2. Click "Query"
3. Copy contents of `backend/db/schema.sql`
4. Paste and execute

---

## ✅ Verification

1. **Visit your Vercel URL**
2. **Sign up** for a new account
3. **Upload** some writing samples
4. **Generate** a reply to test the AI

---

## 🔧 Troubleshooting

### Backend won't start
- Check Railway logs: Backend service → "Deployments" → Click latest → "View Logs"
- Verify all environment variables are set
- Ensure `DATABASE_URL` is connected

### Frontend shows connection error
- Verify `VITE_API_URL` matches your Railway backend URL
- Check Railway backend is running
- Verify CORS (`FRONTEND_URL`) is set correctly

### Database errors
- Ensure migrations ran successfully
- Check Railway PostgreSQL is running
- Verify `DATABASE_URL` format

---

## 📊 Monitor Your App

**Railway:**
- View logs: Backend service → "Deployments"
- Monitor usage: Project → "Usage"
- Database metrics: PostgreSQL service → "Metrics"

**Vercel:**
- View deployments: Project → "Deployments"
- Check logs: Click deployment → "Logs"
- Analytics: Project → "Analytics"

---

## 💰 Costs

**Free Tier Limits:**
- Railway: $5 free credit/month
- Vercel: Unlimited for personal projects
- PostgreSQL: Included in Railway

**Estimated costs after free tier:**
- Hobby: ~$5-10/month
- Production: ~$20-50/month

---

## 🎉 You're Done!

Your app is now live at:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.up.railway.app

Share the frontend URL with users!

---

## Next Steps

1. ✅ Test all features
2. ✅ Add custom domain (optional)
3. ✅ Set up monitoring/alerts
4. ✅ Configure Gmail integration (future)

Need help? Check the logs or refer to [DEPLOYMENT.md](file:///C:/Users/Chaitanya/Downloads/Chaitanya%20Python/antigravity-persona-replicator/DEPLOYMENT.md)
