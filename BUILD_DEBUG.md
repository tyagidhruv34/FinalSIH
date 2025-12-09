# Build Debugging Guide

## Quick Fixes for "npm build failed" Error

### Step 1: Test Build Locally
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

**Windows PowerShell:**
```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```

### Step 2: Check for Common Issues

#### A. TypeScript Errors
```bash
npm run typecheck
```
Fix any TypeScript errors before building.

#### B. Missing Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### C. Check for Duplicate Exports
We already fixed:
- ✅ `ndma-alerts/route.ts` - Removed duplicate GET function

Check if there are others:
```bash
# Search for duplicate function declarations
grep -r "export.*function GET" src/app/api
grep -r "export.*function POST" src/app/api
```

---

## Common Build Errors & Solutions

### Error 1: "Module not found"
**Solution:**
```bash
npm install
# If still failing, check package.json has all dependencies
```

### Error 2: "Cannot find module '@/...'"
**Solution:** Check `tsconfig.json` paths are correct:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Error 3: "SyntaxError" or "Parse error"
**Solution:** 
- Check for unclosed brackets, quotes, or parentheses
- Run `npm run lint` to find syntax errors

### Error 4: "Out of memory"
**Solution:** Increase Node memory:
```json
// package.json
"scripts": {
  "build": "NODE_OPTIONS=--max_old_space_size=4096 next build"
}
```

### Error 5: "Genkit initialization failed"
**Solution:** Already fixed with lazy imports, but if still failing:
- Ensure `GOOGLE_GENAI_API_KEY` is optional
- Check genkit imports are dynamic

---

## Build Optimization for Vercel

### Option 1: Disable Source Maps (Faster Build)
Add to `next.config.ts`:
```typescript
productionBrowserSourceMaps: false,
```

### Option 2: Reduce Bundle Size
Check large dependencies:
```bash
npm run build -- --analyze
```

### Option 3: Skip Type Checking During Build
Already done in `next.config.ts`:
```typescript
typescript: {
  ignoreBuildErrors: true,
}
```

---

## Step-by-Step Debugging

### 1. Get Exact Error Message
```bash
npm run build 2>&1 | tee build-error.log
```
This saves the error to a file.

### 2. Check Build Logs
Look for:
- ❌ Red error messages
- ⚠️ Yellow warnings (usually OK)
- ✅ Green success messages

### 3. Isolate the Problem
Comment out problematic code temporarily:
```typescript
// Temporarily disable
// export async function GET() { ... }
```

### 4. Test Incrementally
- Build with minimal code
- Add features one by one
- Find which feature breaks the build

---

## Vercel-Specific Issues

### Issue: Build Works Locally but Fails on Vercel

**Check:**
1. **Node Version**: Vercel uses Node 18 by default
   - Add to `package.json`:
   ```json
   "engines": {
     "node": "18.x"
   }
   ```

2. **Environment Variables**: All required vars set in Vercel dashboard?

3. **File Size Limits**: Videos or assets > 100MB?

4. **Build Command**: Vercel should auto-detect, but check:
   - Build Command: `npm run build`
   - Output Directory: `.next`

---

## Emergency Workaround: Minimal Build

If build keeps failing, create a minimal version:

1. **Comment out problematic features:**
   - Genkit/AI features
   - Large dependencies
   - Complex API routes

2. **Build minimal version:**
   ```bash
   npm run build
   ```

3. **Add features back one by one**

---

## Quick Checklist

Before deploying:
- [ ] `npm run build` works locally
- [ ] `npm run typecheck` passes (or errors are ignored)
- [ ] No duplicate function declarations
- [ ] All environment variables documented
- [ ] Video files < 100MB each
- [ ] No syntax errors
- [ ] Dependencies installed (`npm install`)

---

## Get Help

If build still fails:
1. Copy the **exact error message** from build logs
2. Check which file is causing the error
3. Share the error message for specific help

---

## Build Command Reference

```bash
# Clean build
rm -rf .next && npm run build

# Build with verbose output
npm run build -- --debug

# Check for TypeScript errors
npm run typecheck

# Lint code
npm run lint

# Install dependencies
npm install

# Clear all caches
rm -rf .next node_modules package-lock.json
npm install
```

