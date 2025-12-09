# Deploy Firestore Security Rules

## Quick Fix for Permission Errors

The "Missing or insufficient permissions" error occurs because Firestore security rules need to be deployed to Firebase.

## Steps to Deploy Rules

### Option 1: Using Firebase Console (Easiest)

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com/
   - Select your project (check `.firebaserc` for project ID)

2. **Navigate to Firestore Rules**
   - Click on **Firestore Database** in the left sidebar
   - Click on the **Rules** tab

3. **Copy and Paste Rules**
   - Open `firestore.rules` file from your project
   - Copy ALL the content
   - Paste it into the Firebase Console rules editor

4. **Publish Rules**
   - Click the **Publish** button
   - Wait for confirmation

5. **Verify**
   - Refresh your application
   - The permission errors should be resolved

### Option 2: Using Firebase CLI

If you have Firebase CLI installed:

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

## What the Rules Allow

- **All Authenticated Users** can:
  - Read weather alerts and NDMA alerts
  - Sync/update weather and NDMA alerts (for the sync functionality)
  - Read all other collections (alerts, user_status, etc.)
  - Create their own content (status updates, reports, etc.)

- **Admins** can:
  - Delete weather/NDMA alerts
  - Manage all collections
  - Update user profiles

## Troubleshooting

If you still see permission errors:

1. **Check Authentication**
   - Make sure you're logged in
   - Verify user exists in Firebase Auth

2. **Check User Profile**
   - User profile should exist in `users` collection
   - Check that `userType` field is set

3. **Verify Rules Deployment**
   - Check Firebase Console → Firestore → Rules
   - Make sure rules are published (not just saved)

4. **Clear Browser Cache**
   - Sometimes cached rules cause issues
   - Try incognito/private browsing mode

## Need Help?

If errors persist, check:
- Firebase Console → Firestore → Rules → Validation tab
- Browser console for specific error messages
- Network tab to see which Firestore request is failing



## Quick Fix for Permission Errors

The "Missing or insufficient permissions" error occurs because Firestore security rules need to be deployed to Firebase.

## Steps to Deploy Rules

### Option 1: Using Firebase Console (Easiest)

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com/
   - Select your project (check `.firebaserc` for project ID)

2. **Navigate to Firestore Rules**
   - Click on **Firestore Database** in the left sidebar
   - Click on the **Rules** tab

3. **Copy and Paste Rules**
   - Open `firestore.rules` file from your project
   - Copy ALL the content
   - Paste it into the Firebase Console rules editor

4. **Publish Rules**
   - Click the **Publish** button
   - Wait for confirmation

5. **Verify**
   - Refresh your application
   - The permission errors should be resolved

### Option 2: Using Firebase CLI

If you have Firebase CLI installed:

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

## What the Rules Allow

- **All Authenticated Users** can:
  - Read weather alerts and NDMA alerts
  - Sync/update weather and NDMA alerts (for the sync functionality)
  - Read all other collections (alerts, user_status, etc.)
  - Create their own content (status updates, reports, etc.)

- **Admins** can:
  - Delete weather/NDMA alerts
  - Manage all collections
  - Update user profiles

## Troubleshooting

If you still see permission errors:

1. **Check Authentication**
   - Make sure you're logged in
   - Verify user exists in Firebase Auth

2. **Check User Profile**
   - User profile should exist in `users` collection
   - Check that `userType` field is set

3. **Verify Rules Deployment**
   - Check Firebase Console → Firestore → Rules
   - Make sure rules are published (not just saved)

4. **Clear Browser Cache**
   - Sometimes cached rules cause issues
   - Try incognito/private browsing mode

## Need Help?

If errors persist, check:
- Firebase Console → Firestore → Rules → Validation tab
- Browser console for specific error messages
- Network tab to see which Firestore request is failing

