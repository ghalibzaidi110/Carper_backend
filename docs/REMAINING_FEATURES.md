# Remaining Features Documentation

> **Last Updated:** February 2026  
> **Status:** Planning & Implementation Required

---

## Table of Contents

1. [Messaging System](#1-messaging-system)
2. [Cost Estimation](#2-cost-estimation)
3. [Rate Limiting & Logging](#3-rate-limiting--logging)
4. [Bulk Import Features](#4-bulk-import-features)
5. [OCR for CNIC](#5-ocr-for-cnic-extraction)
6. [Testing Suite](#6-testing-suite)
7. [Production Deployment](#7-production-deployment)

---

## 1. Messaging System

### Overview
A messaging system to allow users to communicate with each other, particularly for marketplace transactions (buyers contacting sellers).

### Requirements

#### Database Schema
```prisma
model Message {
  id            String   @id @default(uuid())
  conversationId String
  senderId      String
  recipientId   String
  content      String
  isRead        Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  sender       User     @relation("SentMessages", fields: [senderId], references: [id])
  recipient    User     @relation("ReceivedMessages", fields: [recipientId], references: [id])
  conversation Conversation @relation(fields: [conversationId], references: [id])

  @@index([conversationId])
  @@index([recipientId, isRead])
  @@map("messages")
}

model Conversation {
  id            String   @id @default(uuid())
  participant1Id String
  participant2Id String
  lastMessageAt DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  participant1 User     @relation("Conversations1", fields: [participant1Id], references: [id])
  participant2 User     @relation("Conversations2", fields: [participant2Id], references: [id])
  messages     Message[]

  @@unique([participant1Id, participant2Id])
  @@index([participant1Id, participant2Id])
  @@map("conversations")
}
```

#### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/messages` | 🔐 | Send a message |
| `GET` | `/messages/conversations` | 🔐 | Get all conversations |
| `GET` | `/messages/conversations/:id` | 🔐 | Get conversation with messages |
| `GET` | `/messages/unread-count` | 🔐 | Get unread message count |
| `PUT` | `/messages/:id/read` | 🔐 | Mark message as read |
| `PUT` | `/messages/conversations/:id/read-all` | 🔐 | Mark all messages in conversation as read |

#### Request/Response Examples

**Send Message:**
```json
POST /api/v1/messages
{
  "recipientId": "uuid",
  "content": "Is this car still available?",
  "listingId": "uuid" // optional, if related to a listing
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "conversationId": "uuid",
    "senderId": "uuid",
    "recipientId": "uuid",
    "content": "Is this car still available?",
    "isRead": false,
    "createdAt": "2026-02-15T10:30:00Z"
  }
}
```

**Get Conversations:**
```json
GET /api/v1/messages/conversations

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "participant": {
        "id": "uuid",
        "fullName": "Ahmed Khan",
        "avatarUrl": "https://..."
      },
      "lastMessage": {
        "content": "Is this car still available?",
        "createdAt": "2026-02-15T10:30:00Z"
      },
      "unreadCount": 2
    }
  ]
}
```

#### Implementation Notes
- Create `src/messages/` module
- Auto-create conversation if doesn't exist
- Send notification when new message received
- Optional: WebSocket for real-time updates
- Rate limit: Max 10 messages per minute per user

---

## 2. Cost Estimation

### Overview
A feature to estimate repair costs for detected damages, helping users understand potential repair expenses.

### Requirements

#### Database Schema
```prisma
model RepairEstimate {
  id              String   @id @default(uuid())
  damageReportId  String   // Reference to CarImage with damage
  carId           String
  userId          String
  estimatedCost   Decimal  @db.Decimal(10, 2)
  currency        String   @default("PKR")
  severity        String   // MINOR, MODERATE, SEVERE
  repairShops     Json?    // Array of nearby repair shop suggestions
  createdAt       DateTime @default(now())

  car             UserCar  @relation(fields: [carId], references: [id])
  user            User     @relation(fields: [userId], references: [id])

  @@index([carId])
  @@index([userId])
  @@map("repair_estimates")
}
```

#### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/estimates/repair/:imageId` | 🔐 | Generate repair estimate for damage |
| `GET` | `/estimates/car/:carId` | 🔐 | Get all estimates for a car |
| `GET` | `/estimates/:id` | 🔐 | Get specific estimate |

#### Request/Response Examples

**Generate Estimate:**
```json
POST /api/v1/estimates/repair/{imageId}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "damageReportId": "uuid",
    "carId": "uuid",
    "estimatedCost": 15000.00,
    "currency": "PKR",
    "severity": "MODERATE",
    "repairShops": [
      {
        "name": "Auto Repair Shop",
        "address": "Lahore",
        "phone": "+923001234567",
        "estimatedCost": 15000,
        "distance": "2.5 km"
      }
    ],
    "breakdown": {
      "labor": 5000,
      "parts": 8000,
      "paint": 2000
    },
    "createdAt": "2026-02-15T10:30:00Z"
  }
}
```

#### Implementation Notes
- Create `src/estimates/` module
- Integrate with damage detection results
- Use pricing database or API for cost calculation
- Consider location-based repair shop suggestions
- Severity-based cost multipliers:
  - MINOR: 5,000 - 15,000 PKR
  - MODERATE: 15,000 - 50,000 PKR
  - SEVERE: 50,000+ PKR

---

## 3. Rate Limiting & Logging

### Overview
Production-ready middleware for API rate limiting and comprehensive request/response logging.

### Rate Limiting

#### Implementation
```typescript
// src/common/middleware/rate-limit.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Configuration
- Global: 100 requests per 15 minutes per IP
- Auth endpoints: 5 requests per 15 minutes per IP
- Image upload: 10 requests per hour per user
- Damage detection: 5 requests per hour per user
```

#### Environment Variables
```env
RATE_LIMIT_TTL=900  # 15 minutes in seconds
RATE_LIMIT_MAX=100  # Max requests per TTL
RATE_LIMIT_AUTH_MAX=5
RATE_LIMIT_IMAGE_MAX=10
RATE_LIMIT_DAMAGE_MAX=5
```

### Logging

#### Implementation
```typescript
// src/common/interceptors/logging.interceptor.ts
- Log all requests (method, URL, IP, user agent)
- Log all responses (status, response time)
- Log errors with stack traces
- Use Winston or Pino for structured logging
- Log to file and console (production: file only)
```

#### Log Format
```json
{
  "timestamp": "2026-02-15T10:30:00Z",
  "level": "info",
  "method": "POST",
  "url": "/api/v1/auth/login",
  "ip": "192.168.1.1",
  "userId": "uuid",
  "statusCode": 200,
  "responseTime": 45,
  "userAgent": "Mozilla/5.0..."
}
```

#### Environment Variables
```env
LOG_LEVEL=info  # debug, info, warn, error
LOG_FILE_PATH=./logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5
```

---

## 4. Bulk Import Features

### 4.1 Bulk Car Import (Rental Businesses)

#### Overview
Allow rental businesses to import multiple cars via CSV file.

#### CSV Format
```csv
registrationNumber,manufacturer,modelName,year,variant,color,mileage,condition,purchasePrice
ABC-123,Toyota,Corolla,2020,GLI,White,50000,EXCELLENT,2500000
XYZ-789,Honda,Civic,2021,RS,Black,30000,EXCELLENT,3200000
```

#### API Endpoint
```typescript
POST /api/v1/user-cars/bulk-import
Content-Type: multipart/form-data

Request:
- file: CSV file
- validateOnly: boolean (optional)

Response:
{
  "success": true,
  "data": {
    "totalRows": 10,
    "successful": 8,
    "failed": 2,
    "errors": [
      {
        "row": 3,
        "error": "Duplicate registration number: ABC-123"
      }
    ],
    "importedCars": [...]
  }
}
```

### 4.2 Bulk Catalog Import (Admin)

#### Overview
Allow admins to import car catalog entries via CSV.

#### CSV Format
```csv
manufacturer,modelName,year,variant,bodyType,fuelType,transmission,engineSize,priceRangeMin,priceRangeMax
Toyota,Corolla,2020,GLI,SEDAN,PETROL,AUTOMATIC,1800,2500000,2800000
Honda,Civic,2021,RS,SEDAN,PETROL,MANUAL,1500,3000000,3500000
```

#### API Endpoint
```typescript
POST /api/v1/car-catalog/bulk-import
Content-Type: multipart/form-data
Auth: 🛡️ ADMIN only
```

---

## 5. OCR for CNIC Extraction

### Overview
Automatically extract CNIC number and details from uploaded CNIC images using OCR (Optical Character Recognition).

### Requirements

#### Options
1. **Google Cloud Vision API** (Recommended)
   - High accuracy
   - Supports Urdu/English text
   - Cost: ~$1.50 per 1000 images

2. **Tesseract OCR** (Open Source)
   - Free but lower accuracy
   - Requires preprocessing

3. **Custom ML Model**
   - Train on Pakistani CNIC format
   - Higher accuracy for specific use case

#### Implementation
```typescript
// src/common/services/ocr.service.ts
interface CNICData {
  cnicNumber: string;  // Format: 12345-1234567-1
  name: string;
  fatherName?: string;
  dateOfBirth?: string;
  address?: string;
}

async extractCNICData(imageUrl: string): Promise<CNICData>
```

#### Database Update
```prisma
model User {
  // ... existing fields
  cnicNumber      String?  // Extracted CNIC number
  cnicExtractedAt DateTime? // When OCR was run
  cnicExtractionData Json?  // Full OCR result
}
```

#### API Flow
1. User uploads CNIC image
2. Backend calls OCR service
3. Extract CNIC number and validate format
4. Store extracted data
5. Admin reviews both image and extracted data
6. Admin approves/rejects

---

## 6. Testing Suite

### Overview
Comprehensive testing strategy for production readiness.

### Test Structure
```
test/
├── unit/
│   ├── auth.service.spec.ts
│   ├── users.service.spec.ts
│   ├── car-images.service.spec.ts
│   └── ...
├── integration/
│   ├── auth-flow.spec.ts
│   ├── car-registration-flow.spec.ts
│   ├── rental-flow.spec.ts
│   └── ...
├── e2e/
│   ├── user-journey.spec.ts
│   ├── admin-journey.spec.ts
│   └── ...
└── fixtures/
    ├── users.fixture.ts
    └── cars.fixture.ts
```

### Test Coverage Goals

| Module | Unit Tests | Integration Tests | E2E Tests |
|--------|-----------|-------------------|-----------|
| Auth | ✅ | ✅ | ✅ |
| Users | ✅ | ✅ | - |
| Car Catalog | ✅ | ✅ | - |
| User Cars | ✅ | ✅ | ✅ |
| Car Images | ✅ | ✅ | ✅ |
| Listings | ✅ | ✅ | ✅ |
| Rentals | ✅ | ✅ | ✅ |
| Damage Detection | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ |
| PDF | ✅ | - | - |

**Target: 80%+ overall coverage**

### Test Commands
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### Test Database
- Use separate test database
- Reset between test suites
- Use transactions for isolation

---

## 7. Production Deployment

### Overview
Complete production deployment guide and checklist.

### Pre-Deployment Checklist

#### Backend
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] SSL/TLS certificates configured
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Error tracking (Sentry) setup
- [ ] Health check endpoint
- [ ] API documentation updated
- [ ] Security audit completed

#### Database
- [ ] Backup strategy configured
- [ ] Connection pooling optimized
- [ ] Indexes verified
- [ ] Migration rollback plan

#### Infrastructure
- [ ] CDN configured (Cloudinary)
- [ ] Monitoring setup (Uptime, performance)
- [ ] Alerting configured
- [ ] Auto-scaling rules
- [ ] Load balancer configured

### Deployment Platforms

#### Backend Options
1. **Railway** (Recommended for NestJS)
   - Easy PostgreSQL integration
   - Auto-deploy from Git
   - Free tier available

2. **Render**
   - Similar to Railway
   - Good for Node.js apps

3. **AWS EC2/Elastic Beanstalk**
   - More control
   - Requires more setup

#### Database
- **Neon PostgreSQL** (Recommended)
  - Serverless PostgreSQL
  - Auto-scaling
  - Branching for staging

### Environment Variables (Production)
```env
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://... (Neon connection string)

# JWT
JWT_ACCESS_SECRET=... (strong secret)
JWT_REFRESH_SECRET=... (strong secret)
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/v1/auth/google/callback

FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
FACEBOOK_CALLBACK_URL=https://api.yourdomain.com/api/v1/auth/facebook/callback

# YOLOv8 Service
DAMAGE_DETECTION_SERVICE_URL=https://yolo-api.yourdomain.com

# Email
EMAIL_PROVIDER=sendgrid  # or mailgun
SENDGRID_API_KEY=...
EMAIL_FROM=noreply@yourdomain.com

# Frontend
FRONTEND_URL=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_TTL=900
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log
```

### Health Check Endpoint
```typescript
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2026-02-15T10:30:00Z",
  "uptime": 3600,
  "database": "connected",
  "cloudinary": "connected",
  "damageDetection": "connected"
}
```

### Monitoring
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry
- **Performance**: New Relic, DataDog (optional)
- **Logs**: CloudWatch, Loggly

### Backup Strategy
- Database: Daily automated backups
- Retention: 30 days
- Test restore monthly

---

## Implementation Priority

### Phase 1 (Critical - Week 1)
1. ✅ Rate Limiting
2. ✅ Logging
3. ✅ Health Check Endpoint

### Phase 2 (Important - Week 2-3)
4. ✅ OCR for CNIC
5. ✅ Basic Testing Suite

### Phase 3 (Features - Week 5)
6. ✅ Messaging System
7. ✅ Cost Estimation
8. ✅ Bulk Import

### Phase 4 (Production - Week 7-8)
9. ✅ Comprehensive Testing
10. ✅ Production Deployment
11. ✅ CI/CD Pipeline

---

**Last Updated:** February 2026  
**Next Review:** After Phase 1 completion

