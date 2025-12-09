# Troubleshooting Firebase Permission Errors

## Quick Fix Steps

If you're still seeing "Missing or insufficient permissions" errors:

### Step 1: Verify You're Logged In
1. Make sure you're authenticated in the app
2. Check browser console for authentication status
3. Try logging out and logging back in

### Step 2: Check Firestore Rules Deployment
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: `sankat-mochan-348fd`
3. Navigate to **Firestore Database** → **Rules**
4. Verify the rules are published (not just saved)
5. Check that the rules include:
   ```firestore
   match /weather_alerts/{alertId} {
     allow read: if isAuthenticated();
     allow create, update: if isAuthenticated();
   }
   
   match /ndma_alerts/{alertId} {
     allow read: if isAuthenticated();
     allow create, update: if isAuthenticated();
   }
   ```

### Step 3: Verify User Profile Exists
1. Go to Firebase Console → **Firestore Database** → **Data**
2. Check if `users` collection exists
3. Verify your user ID exists in the `users` collection
4. Check that `userType` field is set (citizen, rescue_agency, or admin)

### Step 4: Test with Temporary Permissive Rules (Development Only)

If you need to test quickly, temporarily use these rules in Firebase Console:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ WARNING:** These rules allow any authenticated user to read/write everything. Only use for testing!

### Step 5: Clear Browser Cache
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Or clear browser cache completely
3. Try incognito/private browsing mode

### Step 6: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for specific error messages
4. Check Network tab for failed Firestore requests

## Common Issues

### Issue: Collections Don't Exist
- **Solution:** The collections will be created automatically when you sync alerts
- Click "Sync Now" button on the advisories page to create the collections

### Issue: User Not Authenticated
- **Solution:** Make sure you're logged in before accessing the advisories page
- The page now checks for authentication before fetching data

### Issue: Rules Not Deployed
- **Solution:** Rules must be published, not just saved
- Use Firebase CLI: `firebase deploy --only firestore:rules`
- Or publish manually in Firebase Console

## Still Having Issues?

1. Check the exact error message in browser console
2. Verify which collection is causing the error
3. Make sure you're using the correct Firebase project
4. Check `.firebaserc` file matches your Firebase project ID



## Quick Fix Steps

If you're still seeing "Missing or insufficient permissions" errors:

### Step 1: Verify You're Logged In
1. Make sure you're authenticated in the app
2. Check browser console for authentication status
3. Try logging out and logging back in

### Step 2: Check Firestore Rules Deployment
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: `sankat-mochan-348fd`
3. Navigate to **Firestore Database** → **Rules**
4. Verify the rules are published (not just saved)
5. Check that the rules include:
   ```firestore
   match /weather_alerts/{alertId} {
     allow read: if isAuthenticated();
     allow create, update: if isAuthenticated();
   }
   
   match /ndma_alerts/{alertId} {
     allow read: if isAuthenticated();
     allow create, update: if isAuthenticated();
   }
   ```

### Step 3: Verify User Profile Exists
1. Go to Firebase Console → **Firestore Database** → **Data**
2. Check if `users` collection exists
3. Verify your user ID exists in the `users` collection
4. Check that `userType` field is set (citizen, rescue_agency, or admin)

### Step 4: Test with Temporary Permissive Rules (Development Only)

If you need to test quickly, temporarily use these rules in Firebase Console:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ WARNING:** These rules allow any authenticated user to read/write everything. Only use for testing!

### Step 5: Clear Browser Cache
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Or clear browser cache completely
3. Try incognito/private browsing mode

### Step 6: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for specific error messages
4. Check Network tab for failed Firestore requests

## Common Issues

### Issue: Collections Don't Exist
- **Solution:** The collections will be created automatically when you sync alerts
- Click "Sync Now" button on the advisories page to create the collections

### Issue: User Not Authenticated
- **Solution:** Make sure you're logged in before accessing the advisories page
- The page now checks for authentication before fetching data

### Issue: Rules Not Deployed
- **Solution:** Rules must be published, not just saved
- Use Firebase CLI: `firebase deploy --only firestore:rules`
- Or publish manually in Firebase Console

## Still Having Issues?

1. Check the exact error message in browser console
2. Verify which collection is causing the error
3. Make sure you're using the correct Firebase project
4. Check `.firebaserc` file matches your Firebase project ID

