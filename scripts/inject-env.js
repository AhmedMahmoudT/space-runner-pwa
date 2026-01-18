#!/usr/bin/env node

/**
 * Script to inject environment variables into Angular environment files
 * This runs before the build to replace placeholders with actual values
 * 
 * Loads environment variables from:
 * 1. .env file (for local development)
 * 2. System environment variables (for Vercel/CI)
 */

const fs = require('fs');
const path = require('path');

// Load .env file if it exists (for local development)
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value;
        }
      }
    }
  });
  // console.log('📄 Loaded .env file');
}

const envFiles = [
  'src/environments/environment.ts',
  'src/environments/environment.prod.ts'
];

// Get Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT_ID.firebaseapp.com',
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId: process.env.FIREBASE_APP_ID || 'YOUR_APP_ID'
};

// Check if we're in a CI/production environment and variables are missing
const isCI = process.env.CI || process.env.VERCEL || process.env.NODE_ENV === 'production';
const hasPlaceholders = Object.values(firebaseConfig).some(val => 
  val.includes('YOUR_') || val === 'YOUR_API_KEY' || val === 'YOUR_SENDER_ID' || val === 'YOUR_APP_ID'
);

if (isCI && hasPlaceholders) {
  // console.error('❌ ERROR: Firebase environment variables are missing!');
  // console.error('Required variables:');
  // console.error('  - FIREBASE_API_KEY');
  // console.error('  - FIREBASE_AUTH_DOMAIN');
  // console.error('  - FIREBASE_DATABASE_URL');
  // console.error('  - FIREBASE_PROJECT_ID');
  // console.error('  - FIREBASE_STORAGE_BUCKET');
  // console.error('  - FIREBASE_MESSAGING_SENDER_ID');
  // console.error('  - FIREBASE_APP_ID');
  // console.error('\nPlease set these in your Vercel project settings:');
  // console.error('Settings → Environment Variables');
  process.exit(1);
}

if (hasPlaceholders) {
  // console.warn('⚠️  Using placeholder values. Set environment variables for actual Firebase config.');
} else {
  // console.log('✅ All Firebase environment variables found');
}

envFiles.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    // console.warn(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace placeholders with actual values
  content = content.replace(
    /apiKey:\s*['"](.*?)['"]/,
    `apiKey: '${firebaseConfig.apiKey}'`
  );
  content = content.replace(
    /authDomain:\s*['"](.*?)['"]/,
    `authDomain: '${firebaseConfig.authDomain}'`
  );
  content = content.replace(
    /databaseURL:\s*['"](.*?)['"]/,
    `databaseURL: '${firebaseConfig.databaseURL}'`
  );
  content = content.replace(
    /projectId:\s*['"](.*?)['"]/,
    `projectId: '${firebaseConfig.projectId}'`
  );
  content = content.replace(
    /storageBucket:\s*['"](.*?)['"]/,
    `storageBucket: '${firebaseConfig.storageBucket}'`
  );
  content = content.replace(
    /messagingSenderId:\s*['"](.*?)['"]/,
    `messagingSenderId: '${firebaseConfig.messagingSenderId}'`
  );
  content = content.replace(
    /appId:\s*['"](.*?)['"]/,
    `appId: '${firebaseConfig.appId}'`
  );

  fs.writeFileSync(fullPath, content, 'utf8');
  // console.log(`✅ Injected environment variables into ${filePath}`);
});

