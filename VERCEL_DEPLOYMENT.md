# Vercel Deployment Guide

## ✅ Fixes Applied

### 1. **Fixed Build Script**
- Removed `cross-env` dependency (not needed on Vercel)
- Made `postinstall` script fail-safe (won't break build if functions install fails)

### 2. **Fixed PWA Configuration**
- Made PWA optional on Vercel (disabled automatically)
- PWA only enabled for non-Vercel production builds

### 3. **Added Vercel Configuration**
- Created `vercel.json` with optimized settings
- Added video caching headers
- Set API route timeout to 30 seconds

## 📋 Required Setup Steps

### Step 1: Environment Variables
Go to **Vercel Dashboard → Your Project → Settings → Environment Variables** and add:

**Required Firebase Variables:**
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Optional Weather API (has defaults):**
```
WEATHER_MAP_API_KEY=c7836e6f71da09d60e0a00f506446f5d
NEXT_PUBLIC_WEATHER_MAP_API_KEY=c7836e6f71da09d60e0a00f506446f5d
```

### Step 2: Check Video File Sizes
Vercel has a **100MB limit per file**. Check your videos:

```bash
# On Windows PowerShell:
Get-ChildItem "public\videos\*.mp4" | ForEach-Object { 
    [PSCustomObject]@{
        File=$_.Name; 
        SizeMB=[math]::Round($_.Length/1MB, 2)
    } 
}

# On Mac/Linux:
ls -lh public/videos/*.mp4
```

**If videos exceed 100MB:**
- **Option A (Recommended):** Move videos to Firebase Storage or Vercel Blob Storage
- **Option B:** Compress videos using tools like HandBrake or FFmpeg
- **Option C:** Host videos on external CDN (Cloudflare, AWS S3, etc.)

### Step 3: Deploy to Vercel

**Option A: Via Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect Next.js
5. Add environment variables (Step 1)
6. Click "Deploy"

**Option B: Via Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel
```

### Step 4: Verify Deployment
After deployment, check:
- ✅ Build completes successfully
- ✅ Environment variables are set
- ✅ Videos load correctly (if under 100MB)
- ✅ Firebase connection works
- ✅ API routes respond

## 🚨 Common Errors & Solutions

### Error: "Module not found" or "Cannot find module"
**Solution:** Ensure all dependencies are in `package.json`, not just `package-lock.json`

### Error: "Build failed" or "Function timeout"
**Solution:** 
- Check API routes don't exceed 30 seconds
- Review `vercel.json` timeout settings
- Optimize slow API calls

### Error: "File too large" (videos)
**Solution:** 
- Move videos to external storage (Firebase Storage recommended)
- Update video paths in code to use CDN URLs
- Or compress videos before deployment

### Error: "Environment variable not found"
**Solution:**
- Double-check all Firebase env vars are set in Vercel dashboard
- Ensure variable names match exactly (case-sensitive)
- Redeploy after adding variables

### Error: "PWA build failed"
**Solution:** Already fixed - PWA is now disabled on Vercel automatically

## 📝 Additional Notes

1. **Genkit Dependencies:** These are heavy but won't break deployment. They're only used in development.

2. **Functions Folder:** The `src/functions` folder is for Firebase Cloud Functions, not Vercel. The postinstall script is now optional.

3. **Video Storage:** For production, consider:
   - Firebase Storage (integrated with your Firebase project)
   - Vercel Blob Storage (native Vercel solution)
   - Cloudflare R2 (cost-effective CDN)

4. **Build Time:** First build may take 5-10 minutes. Subsequent builds are faster.

5. **Custom Domain:** After deployment, you can add a custom domain in Vercel settings.

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables Guide](https://vercel.com/docs/concepts/projects/environment-variables)
- [File Size Limits](https://vercel.com/docs/platform/limits)

