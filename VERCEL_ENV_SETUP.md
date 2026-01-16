# Vercel Environment Variables Setup

This guide explains how to set up Firebase credentials as environment variables in Vercel, keeping them secure and out of your repository.

## Why This Setup?

- ✅ Firebase credentials are NOT committed to GitHub
- ✅ Different credentials can be used for different environments
- ✅ Credentials are injected at build time, not stored in code
- ✅ Follows security best practices

## Setting Up Environment Variables in Vercel

### Step 1: Get Your Firebase Credentials

If you haven't already, get your Firebase configuration from:
- Firebase Console → Project Settings → General → Your apps → Web app → Config

You'll need these values:
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_DATABASE_URL` (optional, may be auto-detected)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

### Step 2: Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each Firebase configuration value:

   | Variable Name | Example Value |
   |--------------|---------------|
   | `FIREBASE_API_KEY` | `AIzaSyA2HwCC8Uowa9Px2uiqKXUaeEQUgzMy8Ns` |
   | `FIREBASE_AUTH_DOMAIN` | `space-runner-pwa.firebaseapp.com` |
   | `FIREBASE_DATABASE_URL` | `https://space-runner-pwa-default-rtdb.firebaseio.com` |
   | `FIREBASE_PROJECT_ID` | `space-runner-pwa` |
   | `FIREBASE_STORAGE_BUCKET` | `space-runner-pwa.firebasestorage.app` |
   | `FIREBASE_MESSAGING_SENDER_ID` | `383954222651` |
   | `FIREBASE_APP_ID` | `1:383954222651:web:0913fc318ab205dd79261e` |

4. For each variable:
   - Select the environments where it should be available (Production, Preview, Development)
   - Click **Save**

### Step 3: Deploy

After adding the environment variables:
1. Push your code to trigger a new deployment, OR
2. Go to **Deployments** → Click **Redeploy** on the latest deployment

The build process will automatically:
1. Run `prebuild` script (injects environment variables)
2. Run `ng build` (builds the Angular app with injected values)

## How It Works

1. **Repository**: Contains placeholder values (`YOUR_API_KEY`, etc.)
2. **Build Time**: The `scripts/inject-env.js` script runs before the build
3. **Injection**: Script reads Vercel environment variables and replaces placeholders
4. **Build**: Angular builds with the actual Firebase credentials
5. **Result**: Credentials are in the built bundle (as expected for client-side apps) but NOT in your source code

## Local Development

For local development, create a `.env` file in the project root:

### Step 1: Copy the Example File
```bash
cp .env.example .env
```

### Step 2: Fill in Your Firebase Credentials
Edit `.env` and replace the placeholder values with your actual Firebase credentials:

```env
FIREBASE_API_KEY=AIzaSyA2HwCC8Uowa9Px2uiqKXUaeEQUgzMy8Ns
FIREBASE_AUTH_DOMAIN=space-runner-pwa.firebaseapp.com
FIREBASE_DATABASE_URL=https://space-runner-pwa-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=space-runner-pwa
FIREBASE_STORAGE_BUCKET=space-runner-pwa.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=383954222651
FIREBASE_APP_ID=1:383954222651:web:0913fc318ab205dd79261e
```

### Step 3: Build or Run
The `prebuild` script will automatically load your `.env` file before building:

```bash
npm run build    # For production build
npm start        # For development (runs ng serve, but prebuild still runs)
```

**Note**: 
- `.env` is already in `.gitignore`, so it won't be committed
- The script automatically loads `.env` if it exists
- Environment variables from `.env` are used, but system environment variables take precedence

## Troubleshooting

### Build Fails with "YOUR_API_KEY" Error
- Check that all environment variables are set in Vercel
- Verify they're enabled for the correct environment (Production/Preview)
- Redeploy after adding variables

### Firebase Not Connecting
- Verify environment variables are correct in Vercel
- Check browser console for Firebase errors
- Ensure `databaseURL` is set if using Realtime Database

### Local Development Issues
- Make sure you're using actual Firebase credentials locally
- Check that `.env.local` exists and has correct values (if using that approach)

## Security Notes

- ✅ Credentials are NOT in your Git repository
- ✅ Credentials are injected at build time only
- ⚠️ Credentials WILL be in the compiled JavaScript bundle (this is normal for Firebase web apps)
- 🔒 Protect your Firebase project with proper security rules (see `FIREBASE_SETUP.md`)

## Next Steps

After setting up environment variables:
1. Push your code (with placeholder values)
2. Add environment variables in Vercel
3. Redeploy
4. Verify the app works with Firebase

