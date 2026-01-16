# Firebase Setup Guide

This guide will walk you through setting up Firebase for the Space Runner game, including Realtime Database and Anonymous Authentication.

## Prerequisites

- A Google account
- Access to [Firebase Console](https://console.firebase.google.com/)

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., "space-runner")
4. Click **"Continue"**
5. (Optional) Enable Google Analytics - you can skip this for now
6. Click **"Create project"**
7. Wait for the project to be created, then click **"Continue"**

## Step 2: Register Your Web App

1. In your Firebase project dashboard, click the **Web icon** (`</>`) or **"Add app"** → **"Web"**
2. Register your app:
   - **App nickname**: "Space Runner" (or any name you prefer)
   - **Firebase Hosting**: You can skip this for now (uncheck the box)
3. Click **"Register app"**
4. **Important**: Copy the Firebase configuration object that appears. It looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project-id.firebaseapp.com",
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

**Note**: You can also find this later by going to **Project Settings** → **General** → **Your apps** → **Web app** → **Config**

## Step 3: Enable Realtime Database

1. In the Firebase Console, click **"Build"** in the left sidebar
2. Click **"Realtime Database"**
3. Click **"Create Database"**
4. Choose a location (select the closest region to your users)
5. Click **"Next"**
6. Choose **"Start in test mode"** (we'll set up security rules next)
7. Click **"Enable"**

## Step 4: Set Up Database Security Rules

1. In the Realtime Database section, click on the **"Rules"** tab
2. Replace the default rules with the following:

```json
{
  "rules": {
    "leaderboard": {
      ".read": true,
      ".write": "auth != null",
      "$entry": {
        ".validate": "newData.hasChildren(['name', 'score', 'timestamp']) && newData.child('name').isString() && newData.child('score').isNumber() && newData.child('timestamp').isNumber()"
      }
    }
  }
}
```

**What these rules do:**
- `leaderboard.read: true` - Anyone can read the leaderboard
- `leaderboard.write: auth != null` - Only authenticated users can write
- The validation ensures entries have the correct structure (name, score, timestamp)

3. Click **"Publish"**

## Step 5: Enable Anonymous Authentication

1. In the Firebase Console, click **"Build"** → **"Authentication"**
2. Click **"Get started"** (if you haven't used Authentication before)
3. Click on the **"Sign-in method"** tab
4. Find **"Anonymous"** in the list
5. Click on it to enable
6. Toggle **"Enable"** to ON
7. Click **"Save"**

## Step 6: Add Firebase Credentials to Your App

1. Open `src/environments/environment.ts` (for development)
2. Replace the placeholder values with your actual Firebase config values:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIza...', // Your actual API key
    authDomain: 'your-project-id.firebaseapp.com',
    databaseURL: 'https://your-project-id-default-rtdb.firebaseio.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project-id.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef',
  } as FirebaseConfig,
};
```

3. Do the same for `src/environments/environment.prod.ts` (for production builds)

**Important**: 
- Keep the quotes around the values
- Make sure there are no trailing commas after the last property
- The `databaseURL` should match the URL shown in your Realtime Database console

## Step 7: Verify the Setup

1. Start your development server:
   ```bash
   npm start
   ```

2. Open your browser's developer console (F12)
3. Look for these messages:
   - ✅ `Authenticated anonymously: [user-id]` - Authentication is working
   - ✅ `Leaderboard updated: X entries` - Database connection is working
   - ⚠️ If you see warnings about incomplete configuration, double-check your environment files

4. Play the game and submit a score to test the leaderboard functionality

## Troubleshooting

### "Firebase configuration is incomplete" Error

**Problem**: Console shows warnings about missing Firebase configuration.

**Solution**: 
- Verify all values in `src/environments/environment.ts` are replaced (no `YOUR_` placeholders remain)
- Check that all values are wrapped in quotes
- Ensure there are no typos in the property names

### "Permission denied" Error in Database

**Problem**: Cannot write to the database.

**Solution**:
- Verify Anonymous Authentication is enabled in Firebase Console
- Check that your database security rules are published (Step 4)
- Ensure the rules allow writes for authenticated users: `".write": "auth != null"`

### "Failed to submit score (offline?)" Warning

**Problem**: Scores aren't being saved to Firebase.

**Possible causes**:
- No internet connection - scores will be saved locally and synced when online
- Anonymous authentication failed - check browser console for auth errors
- Database rules are too restrictive - verify security rules allow authenticated writes

### Database URL Mismatch

**Problem**: Database connection fails.

**Solution**:
- Go to Firebase Console → Realtime Database
- Copy the exact URL from the top of the page
- Update `databaseURL` in your environment files to match exactly

### Authentication Not Working

**Problem**: Users aren't being authenticated anonymously.

**Solution**:
- Verify Anonymous Authentication is enabled (Step 5)
- Check browser console for specific error messages
- Try clearing browser cache and reloading
- Check if your browser blocks third-party cookies (some privacy settings can interfere)

## Security Notes

⚠️ **Important**: Firebase configuration values are client-side and will be visible in your compiled JavaScript bundle. This is normal and expected for Firebase web apps. The security comes from:

1. **Database Security Rules** - Control what data can be read/written
2. **Authentication** - Verify user identity
3. **API Key Restrictions** - You can restrict API keys in Firebase Console → Project Settings → General → Your apps

### Optional: Restrict API Key (Recommended for Production)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **APIs & Services** → **Credentials**
4. Find your Web API Key and click on it
5. Under **"Application restrictions"**, select **"HTTP referrers"**
6. Add your domain(s) (e.g., `https://yourdomain.com/*`)
7. Click **"Save"**

## Next Steps

- Your Firebase setup is complete! The app will now:
  - Authenticate users anonymously
  - Save scores to the Realtime Database
  - Display the leaderboard in real-time
  - Work offline and sync when back online

- For production deployment, make sure to:
  - Update `src/environments/environment.prod.ts` with production Firebase config
  - Review and tighten database security rules if needed
  - Set up API key restrictions
  - Consider enabling Firebase Hosting for easy deployment

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Realtime Database Guide](https://firebase.google.com/docs/database/web/start)
- [Anonymous Authentication](https://firebase.google.com/docs/auth/web/anonymous-auth)
- [Database Security Rules](https://firebase.google.com/docs/database/security)

