# Deployment Guide

This guide covers deploying RuralIQ to production using free/low-cost services.

## Architecture Overview

```
Frontend (Vercel) ↔ Backend (Render) ↔ Database (MongoDB Atlas)
                                    ↕
                              File Storage (Cloudinary)
```

## Prerequisites

- GitHub account (for code hosting)
- Vercel account (frontend hosting)
- Render account (backend hosting)
- MongoDB Atlas account (database)
- Cloudinary account (image storage)

## Database Setup (MongoDB Atlas)

1. **Create Cluster**:
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create free M0 cluster
   - Choose a region close to your users

2. **Configure Access**:
   - Create database user with read/write permissions
   - Add IP addresses to whitelist (0.0.0.0/0 for development)

3. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

## Backend Deployment (Render)

1. **Prepare Repository**:
   - Push your code to GitHub
   - Ensure `requirements.txt` is in the backend directory

2. **Create Render Service**:
   - Go to [Render](https://render.com)
   - Connect your GitHub account
   - Create new "Web Service"
   - Connect your repository

3. **Configure Service**:
   ```
   Name: ruraliq-backend
   Environment: Python 3
   Build Command: pip install -r backend/requirements.txt
   Start Command: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

4. **Environment Variables**:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster0.mongodb.net/ruraliq?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_production_key_here
   JWT_ALGORITHM=HS256
   JWT_EXPIRE_HOURS=24
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ENVIRONMENT=production
   ```

5. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy

## Image Storage Setup (Cloudinary)

1. **Create Account**:
   - Go to [Cloudinary](https://cloudinary.com)
   - Sign up for free account

2. **Get Credentials**:
   - Go to Dashboard
   - Copy Cloud Name, API Key, and API Secret
   - Add these to your Render environment variables

## Frontend Deployment (Vercel)

1. **Prepare Environment**:
   - Create `frontend/.env.production`:
   ```
   VITE_API_BASE_URL=https://your-render-app.onrender.com/api
   ```

2. **Deploy to Vercel**:
   - Go to [Vercel](https://vercel.com)
   - Connect your GitHub account
   - Import your repository
   - Set root directory to `frontend`

3. **Configure Build**:
   ```
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Environment Variables**:
   ```
   VITE_API_BASE_URL=https://your-render-app.onrender.com/api
   ```

5. **Deploy**:
   - Vercel will automatically build and deploy
   - Your app will be available at `https://your-app.vercel.app`

## Post-Deployment Setup

1. **Update CORS Settings**:
   - Update backend `main.py` to include your Vercel domain:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[
           "http://localhost:3000",
           "https://your-app.vercel.app"
       ],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. **Seed Production Database**:
   - Update `MONGO_URI` in your local `.env` to production database
   - Run: `python backend/seed_mock_data.py`
   - Change back to local database URI

3. **Test Deployment**:
   - Visit your Vercel URL
   - Test login with demo credentials
   - Verify all features work

## Custom Domain (Optional)

1. **Vercel Domain**:
   - Go to your Vercel project settings
   - Add custom domain
   - Update DNS records as instructed

2. **Backend Domain**:
   - Render provides custom domain options
   - Update frontend environment variables accordingly

## CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: |
          curl -X POST ${{ secrets.VERCEL_DEPLOY_HOOK }}
```

## Monitoring and Maintenance

1. **Render Monitoring**:
   - Check service logs in Render dashboard
   - Set up alerts for downtime

2. **MongoDB Monitoring**:
   - Monitor database performance in Atlas
   - Set up alerts for high usage

3. **Error Tracking**:
   - Consider integrating Sentry for error tracking
   - Monitor API response times

## Scaling Considerations

1. **Database**:
   - Monitor connection limits
   - Consider upgrading to M2/M5 for production traffic

2. **Backend**:
   - Render free tier has limitations
   - Upgrade to paid plan for better performance

3. **CDN**:
   - Vercel includes global CDN
   - Cloudinary provides image optimization

## Security Checklist

- ✅ Use strong JWT secret in production
- ✅ Enable HTTPS (automatic with Vercel/Render)
- ✅ Restrict MongoDB IP whitelist
- ✅ Use environment variables for secrets
- ✅ Enable CORS only for your domains
- ✅ Regularly update dependencies

## Backup Strategy

1. **Database Backups**:
   - MongoDB Atlas provides automatic backups
   - Consider exporting critical data regularly

2. **Code Backups**:
   - GitHub serves as primary backup
   - Consider multiple branch protection

## Cost Estimation

- **MongoDB Atlas**: Free (M0 cluster)
- **Render**: Free tier (hobby apps)
- **Vercel**: Free tier (personal projects)
- **Cloudinary**: Free tier (25GB storage)

**Total**: $0/month for small-scale deployment

For production scale:
- MongoDB Atlas M2: ~$9/month
- Render Standard: ~$7/month
- Vercel Pro: ~$20/month
- Cloudinary Plus: ~$89/month

**Production Total**: ~$125/month