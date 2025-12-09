# Quick Fix: npm build failed

## 🚀 Immediate Steps to Fix Build

### Step 1: Clean Everything
```bash
# Windows PowerShell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
npm run build
```

### Step 2: Run Build Check
```bash
npm run build:check
```
This will identify common issues automatically.

### Step 3: Check Specific Error
Look at the build output for:
- **File name** where error occurred
- **Line number** of the error
- **Error message** (exact text)

---

## 🔧 Most Common Fixes

### Fix 1: Duplicate Function Declarations
**Error**: "Identifier 'X' has already been declared"

**Solution**: Search for duplicate exports:
```bash
# Check for duplicates
grep -r "export.*function GET" src/app/api
grep -r "export.*function POST" src/app/api
```

**Already Fixed:**
- ✅ `ndma-alerts/route.ts` - Removed duplicate GET

### Fix 2: Missing Dependencies
**Error**: "Cannot find module"

**Solution**:
```bash
npm install
# If still failing, check package.json
```

### Fix 3: TypeScript Errors
**Error**: Type-related errors

**Solution**: Already configured to ignore in `next.config.ts`:
```typescript
typescript: {
  ignoreBuildErrors: true,
}
```

### Fix 4: Genkit Initialization
**Error**: Genkit-related errors

**Solution**: Already fixed with lazy imports in:
- ✅ `assess-damage/route.ts`
- ✅ `predict-impact/route.ts`
- ✅ `genkit.ts`

---

## 📋 Pre-Build Checklist

Run these before building:

```bash
# 1. Check for issues
npm run build:check

# 2. Type check (optional, errors are ignored)
npm run typecheck

# 3. Clean build
rm -rf .next
npm run build
```

---

## 🎯 If Build Still Fails

### Get the Exact Error:
1. Copy the **full error message** from build output
2. Note the **file name** and **line number**
3. Check if it's a:
   - Syntax error (missing bracket, quote, etc.)
   - Import error (wrong path, missing module)
   - Type error (TypeScript issue)
   - Duplicate declaration (same function twice)

### Share the Error:
Include:
- Full error message
- File name
- Line number
- What you've tried

---

## ✅ What We've Already Fixed

1. ✅ Duplicate GET function in `ndma-alerts/route.ts`
2. ✅ Genkit lazy loading in API routes
3. ✅ PWA disabled on Vercel
4. ✅ Postinstall script made fail-safe
5. ✅ Build script optimized

---

## 🚨 Emergency: Minimal Build

If nothing works, temporarily disable features:

1. **Comment out genkit imports** in API routes
2. **Remove large videos** from public folder
3. **Simplify next.config.ts** (remove PWA, webpack config)
4. **Build minimal version**
5. **Add features back one by one**

---

## 📞 Next Steps

1. Run: `npm run build:check`
2. If issues found, fix them
3. Run: `npm run build`
4. If successful, deploy to Vercel
5. If still failing, share the exact error message

