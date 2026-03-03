"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const path_1 = require("path");
dotenv.config({ path: (0, path_1.resolve)(__dirname, '../.env') });
console.log('🔍 Verifying Google OAuth Setup...\n');
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
        const displayValue = varName.includes('SECRET') || varName.includes('SECRET')
            ? value.substring(0, 10) + '...' + value.substring(value.length - 4)
            : value;
        console.log(`✅ ${varName}: ${displayValue}`);
    }
    else {
        console.log(`❌ ${varName}: NOT SET`);
        allValid = false;
    }
});
console.log('─'.repeat(50));
const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
if (callbackUrl) {
    const urlPattern = /^https?:\/\/.+\/api\/v1\/auth\/google\/callback$/;
    if (urlPattern.test(callbackUrl)) {
        console.log('✅ Callback URL format is correct');
    }
    else {
        console.log('⚠️  Callback URL format might be incorrect');
        console.log('   Expected format: http(s)://domain/api/v1/auth/google/callback');
        allValid = false;
    }
}
const clientId = process.env.GOOGLE_CLIENT_ID;
if (clientId) {
    if (clientId.includes('.apps.googleusercontent.com')) {
        console.log('✅ Google Client ID format looks correct');
    }
    else {
        console.log('⚠️  Google Client ID format might be incorrect');
        console.log('   Expected format: xxx.apps.googleusercontent.com');
    }
}
console.log('\n📝 Code Configuration Check:');
console.log('─'.repeat(50));
const fs = require('fs');
const authControllerPath = (0, path_1.resolve)(__dirname, '../src/auth/auth.controller.ts');
const authControllerContent = fs.readFileSync(authControllerPath, 'utf-8');
if (authControllerContent.includes('@Get(\'google\')') && !authControllerContent.includes('// @Get(\'google\')')) {
    console.log('✅ Google OAuth routes are enabled in auth.controller.ts');
}
else {
    console.log('❌ Google OAuth routes are still commented out');
    console.log('   Please uncomment the routes in src/auth/auth.controller.ts');
    allValid = false;
}
if (authControllerContent.includes('GoogleAuthGuard')) {
    console.log('✅ GoogleAuthGuard is imported');
}
else {
    console.log('❌ GoogleAuthGuard is not imported');
    allValid = false;
}
const authModulePath = (0, path_1.resolve)(__dirname, '../src/auth/auth.module.ts');
const authModuleContent = fs.readFileSync(authModulePath, 'utf-8');
if (authModuleContent.includes('GoogleStrategy')) {
    console.log('✅ GoogleStrategy is registered in auth.module.ts');
}
else {
    console.log('❌ GoogleStrategy is not registered');
    allValid = false;
}
const authServicePath = (0, path_1.resolve)(__dirname, '../src/auth/auth.service.ts');
const authServiceContent = fs.readFileSync(authServicePath, 'utf-8');
if (authServiceContent.includes('async googleLogin')) {
    console.log('✅ googleLogin method exists in auth.service.ts');
}
else {
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
}
else {
    console.log('❌ Some checks failed. Please fix the issues above.');
}
console.log('\n');
//# sourceMappingURL=verify-google-oauth.js.map