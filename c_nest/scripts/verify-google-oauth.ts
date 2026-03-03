/**
 * Google OAuth Setup Verification Script
 * Run: npx ts-node scripts/verify-google-oauth.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

console.log('🔍 Verifying Google OAuth Setup...\n');

// Check required environment variables
const requiredVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
  'FRONTEND_URL',
];

let allValid = true;

console.log('📋 Environment Variables Check:');
console.log('─'.repeat(50));

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive values
    const displayValue =
      varName.includes('SECRET') || varName.includes('SECRET')
        ? value.substring(0, 10) + '...' + value.substring(value.length - 4)
        : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allValid = false;
  }
});

console.log('─'.repeat(50));

// Validate callback URL format
const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
if (callbackUrl) {
  const urlPattern = /^https?:\/\/.+\/api\/v1\/auth\/google\/callback$/;
  if (urlPattern.test(callbackUrl)) {
    console.log('✅ Callback URL format is correct');
  } else {
    console.log('⚠️  Callback URL format might be incorrect');
    console.log('   Expected format: http(s)://domain/api/v1/auth/google/callback');
    allValid = false;
  }
}

// Validate Client ID format
const clientId = process.env.GOOGLE_CLIENT_ID;
if (clientId) {
  if (clientId.includes('.apps.googleusercontent.com')) {
    console.log('✅ Google Client ID format looks correct');
  } else {
    console.log('⚠️  Google Client ID format might be incorrect');
    console.log('   Expected format: xxx.apps.googleusercontent.com');
  }
}

console.log('\n📝 Code Configuration Check:');
console.log('─'.repeat(50));

// Check if routes are uncommented (basic check)
const fs = require('fs');
const authControllerPath = resolve(__dirname, '../src/auth/auth.controller.ts');
const authControllerContent = fs.readFileSync(authControllerPath, 'utf-8');

if (authControllerContent.includes('@Get(\'google\')') && !authControllerContent.includes('// @Get(\'google\')')) {
  console.log('✅ Google OAuth routes are enabled in auth.controller.ts');
} else {
  console.log('❌ Google OAuth routes are still commented out');
  console.log('   Please uncomment the routes in src/auth/auth.controller.ts');
  allValid = false;
}

if (authControllerContent.includes('GoogleAuthGuard')) {
  console.log('✅ GoogleAuthGuard is imported');
} else {
  console.log('❌ GoogleAuthGuard is not imported');
  allValid = false;
}

// Check if GoogleStrategy is registered
const authModulePath = resolve(__dirname, '../src/auth/auth.module.ts');
const authModuleContent = fs.readFileSync(authModulePath, 'utf-8');

if (authModuleContent.includes('GoogleStrategy')) {
  console.log('✅ GoogleStrategy is registered in auth.module.ts');
} else {
  console.log('❌ GoogleStrategy is not registered');
  allValid = false;
}

// Check if googleLogin method exists
const authServicePath = resolve(__dirname, '../src/auth/auth.service.ts');
const authServiceContent = fs.readFileSync(authServicePath, 'utf-8');

if (authServiceContent.includes('async googleLogin')) {
  console.log('✅ googleLogin method exists in auth.service.ts');
} else {
  console.log('❌ googleLogin method not found');
  allValid = false;
}

console.log('─'.repeat(50));

console.log('\n🧪 Testing Endpoints:');
console.log('─'.repeat(50));
console.log('1. Initiate OAuth: GET http://localhost:3000/api/v1/auth/google');
console.log('2. Callback URL: GET http://localhost:3000/api/v1/auth/google/callback');
console.log('   (This will be called by Google automatically)');

console.log('\n📚 Next Steps:');
console.log('─'.repeat(50));
if (allValid) {
  console.log('✅ All checks passed!');
  console.log('\n1. Start your server: npm run start:dev');
  console.log('2. Test the OAuth flow:');
  console.log('   - Open: http://localhost:3000/api/v1/auth/google');
  console.log('   - You should be redirected to Google login');
  console.log('   - After login, you\'ll be redirected back with tokens');
  console.log('\n3. Make sure your Google Cloud Console has:');
  console.log('   - Authorized redirect URI matching GOOGLE_CALLBACK_URL');
  console.log('   - OAuth consent screen configured');
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
}

console.log('\n');

