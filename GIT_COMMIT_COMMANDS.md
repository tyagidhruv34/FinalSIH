# Git Commit Commands - Copy and Paste

## Quick Commit (All Critical Fixes)

```bash
# Add all the critical fixes
git add next.config.ts
git add package.json
git add src/ai/genkit.ts
git add src/app/api/assess-damage/route.ts
git add src/app/api/ndma-alerts/route.ts
git add src/app/api/predict-impact/route.ts

# Commit
git commit -m "Fix: Remove duplicate GET function and update Next.js config for Vercel deployment"

# Push to GitHub
git push origin main
```

## Optional: Add Documentation Files

If you want to include the documentation files:

```bash
# Add documentation
git add *.md
git add check-build.js
git add vercel.json

# Commit everything
git commit -m "Fix: Build errors and add deployment documentation"

# Push
git push origin main
```

## One-Line Version (All Files)

```bash
git add . && git commit -m "Fix: Build errors for Vercel deployment" && git push origin main
```

---

## After Pushing

1. Go to Vercel dashboard
2. Wait for automatic redeploy (or trigger manually)
3. Build should now succeed! ✅

