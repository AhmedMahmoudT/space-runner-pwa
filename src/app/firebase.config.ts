// Firebase configuration
// Configuration values are loaded from environment files
// See FIREBASE_SETUP.md for instructions on setting up Firebase

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getAuth, Auth } from 'firebase/auth';
import { environment } from '../environments/environment';

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const config = environment.firebase;
  const requiredFields: (keyof typeof config)[] = [
    'apiKey',
    'authDomain',
    'databaseURL',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  const missingFields = requiredFields.filter(
    (field) => !config[field] || config[field].includes('YOUR_'),
  );

  if (missingFields.length > 0) {
    console.error(
      '⚠️ Firebase configuration is incomplete. Missing or placeholder values for:',
      missingFields.join(', '),
    );
    console.error(
      'Please update your environment files with Firebase credentials. See FIREBASE_SETUP.md for instructions.',
    );
  }

  return config;
};

const firebaseConfig = validateFirebaseConfig();

// Initialize Firebase
export const app: FirebaseApp = initializeApp(firebaseConfig);
export const database: Database = getDatabase(app);
export const auth: Auth = getAuth(app);

// Offline support for PWA:
// 1. Service worker (ngsw-config.json) caches Firebase API calls
// 2. LeaderboardService uses localStorage as fallback for scores
// 3. Automatic sync when connection is restored
// Note: Firebase Realtime Database offline persistence API may vary by version
// The service worker configuration provides the primary offline caching mechanism
