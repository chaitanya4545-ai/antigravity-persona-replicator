# Deployment Guide

Complete guide for deploying the Antigravity Persona Replicator to production.

## Recommended Stack: Vercel + Railway

This guide uses **Vercel** for the frontend and **Railway** for the backend + database.

### Why This Stack?
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Easy environment variable management
- ✅ Git-based deployments
- ✅ Built-in PostgreSQL on Railway

---

## Part 1: Deploy Backend to Railway

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account
4. Select the `antigravity-persona-replicator` repository

### Step 3: Add PostgreSQL Database
1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will provision a database automatically

### Step 4: Configure Backend Service
1. Click on your backend service
2. Go to "Settings" → "Root Directory"
3. Set to: `backend`

### Step 5: Set Environment Variables
In Railway, go to your backend service → "Variables" and add:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-random-secret-key-here
OPENAI_API_KEY=sk-your-openai-key-here
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
PORT=5000
```

**Important**: 
- The `${{Postgres.DATABASE_URL}}` will auto-reference your Railway PostgreSQL
- Generate a random JWT_SECRET (use a password generator)
- Get your OpenAI API key from [platform.openai.com](https://platform.openai.com)

### Step 6: Deploy
1. Railway will automatically deploy on push to main branch
2. Wait for build to complete
3. Copy your backend URL (e.g., `https://your-app.up.railway.app`)

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

### Step 2: Import Project
1. Click "Add New" → "Project"
2. Import your `antigravity-persona-replicator` repository
3. Vercel will detect it as a Vite project

### Step 3: Configure Build Settings
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 4: Set Environment Variables
Add this environment variable:

```
VITE_API_URL=https://your-backend.up.railway.app/api
```

Replace with your actual Railway backend URL from Part 1.

### Step 5: Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Your app will be live at `https://your-app.vercel.app`

### Step 6: Update Backend CORS
Go back to Railway → Backend service → Variables:
- Update `FRONTEND_URL` to your Vercel URL: `https://your-app.vercel.app`

---

## Part 3: Database Migration

After deploying to Railway, run migrations:

### Option A: Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npm run migrate
```

### Option B: Manual SQL
1. Go to Railway → PostgreSQL → "Data" tab
2. Click "Query"
3. Copy and paste the contents of `backend/db/schema.sql`
4. Execute

---

## Part 4: Testing Your Deployment

1. Visit your Vercel URL
2. Sign up for a new account
3. Upload some writing samples
4. Test generating a reply

---

## Alternative: Deploy to Render

If you prefer an all-in-one platform:

### Backend + Database on Render

1. Go to [render.com](https://render.com)
2. Create a new "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run migrate && npm start`

5. Add PostgreSQL database:
   - Click "New" → "PostgreSQL"
   - Copy the Internal Database URL

6. Set environment variables (same as Railway)

### Frontend on Render

1. Create new "Static Site"
2. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

3. Set `VITE_API_URL` environment variable

---

## Environment Variables Checklist

### Backend (Railway/Render)
- ✅ `DATABASE_URL` - Auto-provided by Railway/Render
- ✅ `JWT_SECRET` - Random secret (generate with password tool)
- ✅ `OPENAI_API_KEY` - From OpenAI platform
- ✅ `FRONTEND_URL` - Your Vercel/Render frontend URL
- ✅ `NODE_ENV` - Set to `production`

### Frontend (Vercel/Render)
- ✅ `VITE_API_URL` - Your backend API URL

---

## Post-Deployment

### 1. Custom Domain (Optional)
- **Vercel**: Settings → Domains → Add domain
- **Railway**: Settings → Domains → Generate domain or add custom

### 2. Monitor Logs
- **Railway**: Click on service → "Logs" tab
- **Vercel**: Deployments → Click deployment → "Logs"

### 3. Set Up Monitoring
- Add error tracking (Sentry)
- Set up uptime monitoring (UptimeRobot)

### 4. Security Checklist
- ✅ HTTPS enabled (automatic on Vercel/Railway)
- ✅ Environment variables secured
- ✅ JWT secret is random and strong
- ✅ Database has strong password
- ✅ CORS configured correctly

---

## Troubleshooting

### Backend won't start
- Check Railway logs for errors
- Verify DATABASE_URL is set correctly
- Ensure migrations ran successfully

### Frontend can't connect to backend
- Verify VITE_API_URL is correct
- Check CORS settings (FRONTEND_URL in backend)
- Check browser console for errors

### Database connection fails
- Verify DATABASE_URL format
- Check if database is running
- Ensure SSL is enabled for production

### OpenAI API errors
- Verify OPENAI_API_KEY is correct
- Check OpenAI account has credits
- Review API rate limits

---

## Scaling Considerations

### When to scale:
- **Database**: Upgrade Railway PostgreSQL plan
- **Backend**: Enable autoscaling on Railway
- **Frontend**: Vercel scales automatically

### Cost estimates:
- **Hobby tier**: Free - $20/month
- **Production tier**: $50-200/month
- **Enterprise**: Custom pricing

---

## Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Deploy frontend to Vercel
3. ✅ Run database migrations
4. ✅ Test the application
5. ✅ Set up custom domain (optional)
6. ✅ Add monitoring and error tracking
7. ✅ Configure Gmail integration (future)

---

Need help? Check the logs or open a GitHub issue!
