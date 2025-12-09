# Vercel Deployment Troubleshooting Guide

## Common Build Errors and Solutions

### 1. ❌ Error: "Cannot find module 'genkit'" or Genkit-related errors

**Problem**: Genkit is trying to initialize during build time and failing.

**Solution Applied**: 
- Made genkit imports lazy (dynamic imports)
- Added error handling in genkit initialization
- Added genkit to `serverComponentsExternalPackages` in next.config.ts

**If still failing**, add to `next.config.ts`:
```typescript
webpack: (config, { isServer }) => {
  if (isServer) {
    config.externals = config.externals || [];
    config.externals.push('genkit', '@genkit-ai/googleai');
  }
  return config;
}
```

---

### 2. ❌ Error: "File too large" or "Asset size limit exceeded"

**Problem**: Video files exceed Vercel's 100MB limit.

**Solution**:
1. Check video sizes:
   ```bash
   # Windows PowerShell
   Get-ChildItem "public\videos\*.mp4" | ForEach-Object { 
       [PSCustomObject]@{File=$_.Name; SizeMB=[math]::Round($_.Length/1MB, 2)} 
   }
   ```

2. If videos are > 100MB:
   - **Option A**: Move to Firebase Storage
   - **Option B**: Compress videos
   - **Option C**: Use external CDN

3. Add to `.vercelignore` (create if doesn't exist):
   ```
   public/videos/*.mp4
   ```

---

### 3. ❌ Error: "Environment variable not found"

**Problem**: Missing Firebase environment variables.

**Solution**: Add all required variables in Vercel Dashboard:
- Go to Project → Settings → Environment Variables
- Add all `NEXT_PUBLIC_FIREBASE_*` variables
- Redeploy after adding

---

### 4. ❌ Error: "Build timeout" or "Function timeout"

**Problem**: Build or API routes taking too long.

**Solution**: 
- Check `vercel.json` has correct timeout settings
- Optimize slow API routes
- Check for infinite loops in build process

---

### 5. ❌ Error: "Module parse failed" or "Syntax error"

**Problem**: TypeScript/JavaScript syntax errors.

**Solution**:
- Run `npm run build` locally first
- Check for TypeScript errors: `npm run typecheck`
- Ensure all imports are correct

---

### 6. ❌ Error: "postinstall script failed"

**Problem**: The postinstall script tries to install functions dependencies.

**Solution Applied**: Made postinstall script fail-safe:
```json
"postinstall": "cd src/functions && npm install || echo 'Functions install skipped (optional)'"
```

If still failing, remove the postinstall script entirely (functions are optional).

---

### 7. ❌ Error: "PWA build failed"

**Problem**: next-pwa causing build issues.

**Solution Applied**: PWA is now automatically disabled on Vercel.

If still failing, check `next.config.ts` - PWA should be conditional.

---

## Step-by-Step Debugging

### Step 1: Test Build Locally
```bash
npm run build
```
If this fails locally, fix errors before deploying.

### Step 2: Check for Large Files
```bash
# Check video sizes
Get-ChildItem "public\videos\*.mp4" | Measure-Object -Property Length -Sum
```

### Step 3: Verify Environment Variables
Make sure all Firebase env vars are set in Vercel dashboard.

### Step 4: Check Build Logs
In Vercel dashboard, check the build logs for specific error messages.

### Step 5: Try Minimal Build
Temporarily comment out genkit imports to see if that's the issue:
```typescript
// Temporarily disable genkit
// import { assessDamage } from '@/ai/flows/assess-damage-flow';
```

---

## Quick Fixes Checklist

- [ ] All environment variables set in Vercel
- [ ] Video files < 100MB each
- [ ] Build works locally (`npm run build`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] Genkit imports are lazy (dynamic imports)
- [ ] PWA disabled on Vercel
- [ ] Postinstall script is fail-safe

---

## Emergency Workaround: Disable Genkit Entirely

If genkit continues to cause issues, you can temporarily disable it:

1. **In API routes**, wrap genkit calls:
```typescript
try {
  const { assessDamage } = await import('@/ai/flows/assess-damage-flow');
  // ... use it
} catch (error) {
  // Return fallback response
  return NextResponse.json({ error: 'AI feature temporarily unavailable' });
}
```

2. **In pages**, make genkit optional:
```typescript
const hasGenkit = process.env.GOOGLE_GENAI_API_KEY;
if (!hasGenkit) {
  // Show fallback UI
}
```

---

## Still Having Issues?

1. **Check Vercel Build Logs**: Look for the exact error message
2. **Share Error**: Copy the full error from Vercel dashboard
3. **Check Dependencies**: Ensure all packages are in `package.json`
4. **Node Version**: Vercel uses Node 18 by default (check `package.json` engines)

---

## Contact Points

- Vercel Support: https://vercel.com/support
- Next.js Docs: https://nextjs.org/docs
- Check build logs in Vercel dashboard for specific errors

