# Pre-Deployment Checklist

## ✅ Before Deploying to Vercel

### 1. Environment Variables
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `WEATHER_MAP_API_KEY` (optional, has default)
- [ ] `NEXT_PUBLIC_WEATHER_MAP_API_KEY` (optional, has default)

### 2. Video Files Check
- [ ] All videos in `public/videos/` are under 100MB each
- [ ] If videos are too large, move them to Firebase Storage or CDN
- [ ] Update video paths in code if moved to external storage

### 3. Code Changes Applied
- [x] Build script updated (removed cross-env)
- [x] PWA disabled on Vercel
- [x] Postinstall script made fail-safe
- [x] vercel.json created with proper config

### 4. Test Locally
```bash
npm run build
npm start
```
- [ ] Build completes without errors
- [ ] App runs on localhost
- [ ] All pages load correctly
- [ ] Videos play correctly

### 5. Git Commit
- [ ] All changes committed
- [ ] Pushed to GitHub/GitLab/Bitbucket
- [ ] Repository is connected to Vercel

### 6. Deploy
- [ ] Environment variables added in Vercel dashboard
- [ ] Deployment triggered
- [ ] Build logs checked for errors
- [ ] Live site tested

## 🎯 Quick Deploy Commands

```bash
# 1. Test build locally
npm run build

# 2. If successful, deploy
vercel

# Or use Vercel dashboard to deploy from Git
```

## 📊 Video Size Check Script

Run this to check video sizes:

**Windows PowerShell:**
```powershell
Get-ChildItem "public\videos\*.mp4" | ForEach-Object { 
    [PSCustomObject]@{
        File=$_.Name; 
        SizeMB=[math]::Round($_.Length/1MB, 2);
        Status=if($_.Length/1MB -gt 100){"❌ TOO LARGE"}else{"✅ OK"}
    } 
} | Format-Table -AutoSize
```

**Mac/Linux:**
```bash
ls -lh public/videos/*.mp4 | awk '{print $9, $5}'
```

