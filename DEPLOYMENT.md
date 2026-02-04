# 🚀 Deployment Guide

This guide walks you through deploying Pocket Bass to production on Vercel with Turso and Cloudflare R2.

## Prerequisites Checklist

- [ ] GitHub account
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] Cloudflare account (sign up at https://cloudflare.com)
- [ ] Turso account (sign up at https://turso.tech)
- [ ] Code pushed to GitHub repository

## Step 1: Set Up Turso Database

1. **Install Turso CLI**:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```

2. **Authenticate**:
   ```bash
   turso auth signup
   turso auth login
   ```

3. **Create Production Database**:
   ```bash
   # Create database in EU region (Frankfurt)
   turso db create pocket-bass-prod --location fra

   # Get database URL
   turso db show pocket-bass-prod --url
   # Copy this URL - you'll need it later
   ```

4. **Generate Auth Token**:
   ```bash
   turso db tokens create pocket-bass-prod
   # Copy this token - you'll need it later
   ```

5. **Optional: Create Staging Database**:
   ```bash
   turso db create pocket-bass-staging --location fra
   turso db show pocket-bass-staging --url
   turso db tokens create pocket-bass-staging
   ```

## Step 2: Set Up Cloudflare R2

1. **Create R2 Bucket**:
   - Go to Cloudflare Dashboard
   - Navigate to R2 Object Storage
   - Click "Create bucket"
   - Name: `pocket-bass-prod` (or your preferred name)
   - Location: Automatic (uses nearest EU location)
   - Click "Create bucket"

2. **Generate API Token**:
   - Click "Manage R2 API Tokens"
   - Click "Create API token"
   - Token name: `pocket-bass-vercel`
   - Permissions: Object Read & Write
   - Bucket: Select your bucket or "All buckets"
   - Click "Create API Token"
   - **IMPORTANT**: Copy both:
     - Access Key ID
     - Secret Access Key
     - Account ID (from the endpoint URL)

3. **Note Your Endpoint**:
   - Format: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
   - Example: `https://abc123def456.r2.cloudflarestorage.com`

## Step 3: Deploy to Vercel

### Option A: Vercel Dashboard (Recommended for First Deploy)

1. **Import Project**:
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your GitHub repository
   - Click "Import"

2. **Configure Project**:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Add Environment Variables**:
   Click "Environment Variables" and add:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `PAYLOAD_SECRET` | Generate with: `openssl rand -base64 32` | Production |
   | `DATABASE_URI` | Your Turso database URL | Production |
   | `DATABASE_AUTH_TOKEN` | Your Turso auth token | Production |
   | `R2_ACCESS_KEY_ID` | Cloudflare R2 Access Key ID | Production |
   | `R2_SECRET_ACCESS_KEY` | Cloudflare R2 Secret Access Key | Production |
   | `R2_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` | Production |
   | `R2_BUCKET_NAME` | `pocket-bass-prod` | Production |
   | `NEXT_PUBLIC_SERVER_URL` | `https://your-app.vercel.app` | Production |

   **Tips**:
   - Check "Production", "Preview", and "Development" for each variable
   - For `NEXT_PUBLIC_SERVER_URL`, use your Vercel domain (you can update this after first deploy)

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app is live! 🎉

### Option B: Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Add Environment Variables**:
   ```bash
   vercel env add PAYLOAD_SECRET production
   vercel env add DATABASE_URI production
   vercel env add DATABASE_AUTH_TOKEN production
   vercel env add R2_ACCESS_KEY_ID production
   vercel env add R2_SECRET_ACCESS_KEY production
   vercel env add R2_ENDPOINT production
   vercel env add R2_BUCKET_NAME production
   vercel env add NEXT_PUBLIC_SERVER_URL production
   ```

5. **Redeploy with Environment Variables**:
   ```bash
   vercel --prod
   ```

## Step 4: Post-Deployment Setup

1. **Update Server URL**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Update `NEXT_PUBLIC_SERVER_URL` to your actual Vercel domain
   - Example: `https://pocket-bass.vercel.app`
   - Redeploy: `vercel --prod` or push to main branch

2. **Create Admin User**:
   - Visit: `https://your-domain.vercel.app/admin`
   - Fill in the registration form
   - First user is automatically an admin

3. **Test APIs**:
   ```bash
   # REST API
   curl https://your-domain.vercel.app/api/posts

   # GraphQL
   curl -X POST https://your-domain.vercel.app/api/graphql \
     -H "Content-Type: application/json" \
     -d '{"query": "{ Posts { docs { id title } } }"}'
   ```

4. **Test File Upload**:
   - Go to Admin Panel → Media
   - Upload an image
   - Verify it appears in Cloudflare R2 dashboard

## Step 5: Custom Domain (Optional)

1. **Add Domain in Vercel**:
   - Go to Project Settings → Domains
   - Add your custom domain (e.g., `api.yourdomain.com`)
   - Follow Vercel's DNS instructions

2. **Update Environment Variables**:
   - Update `NEXT_PUBLIC_SERVER_URL` to your custom domain
   - Redeploy

## Monitoring & Maintenance

### Vercel Analytics
- Go to Project → Analytics
- Monitor requests, errors, and performance

### Database Monitoring
```bash
# Check Turso database stats
turso db show pocket-bass-prod

# View database size
turso db inspect pocket-bass-prod
```

### Cloudflare R2 Monitoring
- Go to Cloudflare Dashboard → R2
- View storage usage and request metrics

### Backup Database
```bash
# Dump database to SQL file
turso db shell pocket-bass-prod .dump > backup.sql

# Restore from backup
turso db shell pocket-bass-prod < backup.sql
```

## Troubleshooting

### Build Fails

1. **Check build logs** in Vercel Dashboard
2. **Verify all environment variables** are set correctly
3. **Test locally**:
   ```bash
   npm run build
   ```

### Database Connection Issues

1. **Verify Turso credentials**:
   ```bash
   turso db show pocket-bass-prod
   turso db tokens create pocket-bass-prod
   ```

2. **Check environment variables** in Vercel

3. **Test connection locally**:
   ```typescript
   // Create a test file
   import { createClient } from '@libsql/client'

   const client = createClient({
     url: process.env.DATABASE_URI!,
     authToken: process.env.DATABASE_AUTH_TOKEN!,
   })

   const result = await client.execute('SELECT 1')
   console.log(result)
   ```

### R2 Storage Issues

1. **Verify R2 credentials** in Cloudflare Dashboard
2. **Check CORS settings** on R2 bucket (if needed for direct uploads)
3. **Test with curl**:
   ```bash
   aws s3 ls s3://pocket-bass-prod \
     --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com \
     --profile r2
   ```

### Admin Panel 404

1. **Check route configuration** in `src/app/(payload)/admin/[[...segments]]/page.tsx`
2. **Verify build output** includes admin assets
3. **Clear Vercel cache** and redeploy

## Scaling

### Database Scaling (Turso)

- **Vertical**: Upgrade Turso plan for more storage/requests
- **Horizontal**: Use Turso replicas for read scaling
  ```bash
  turso db replicate pocket-bass-prod --location lhr
  ```

### Storage Scaling (R2)

- R2 automatically scales
- Consider CDN for frequently accessed images:
  - Cloudflare Images
  - Cloudflare CDN with R2 as origin

### Compute Scaling (Vercel)

- Automatically scales with serverless functions
- Upgrade to Vercel Pro for:
  - More function execution time
  - Higher bandwidth
  - Team features

## Security Checklist

- [ ] Strong `PAYLOAD_SECRET` (32+ random characters)
- [ ] R2 bucket is private (not public)
- [ ] Environment variables are encrypted in Vercel
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Database auth token rotated periodically
- [ ] Admin user uses strong password
- [ ] CORS configured for your domain only

## Cost Optimization

### Free Tier Limits
- Vercel: 100GB bandwidth, 100 hours compute/month
- Turso: 8GB storage, 1B row reads/month
- R2: 10GB storage, 1M reads/month

### Tips
- Enable caching for static assets
- Use image optimization (built-in with Next.js)
- Monitor usage in each platform's dashboard
- Set up billing alerts

## Production Checklist

- [ ] All environment variables set in Vercel
- [ ] Turso database created and accessible
- [ ] Cloudflare R2 bucket configured
- [ ] First admin user created
- [ ] File upload tested
- [ ] API endpoints tested
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring enabled
- [ ] Backups scheduled
- [ ] Security checklist completed

---

**Need help?** Check the [main README](./README.md) or open an issue on GitHub.
