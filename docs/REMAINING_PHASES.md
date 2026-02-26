# Remaining Phases — Backend Tasks Left to Complete

> **Current State:** All 52 API endpoints are coded across 14 modules  
> **What's Missing:** Testing, hardening, disabled features, new features, deployment  
> **Estimated Remaining Effort:** ~3–4 weeks  
> **Last Updated:** February 26, 2026

---

## PHASE 4: Testing, Bug Fixes & Hardening

**Priority:** HIGH  
**Estimated Time:** 1–1.5 weeks  
**New Endpoints:** 0

### 4.1 — Unit Tests (Jest)

| Task | Module | Details |
|------|--------|---------|
| Auth service tests | `auth/` | Test register, login, refresh, logout, password hashing, token generation |
| Users service tests | `users/` | Test profile get/update, password change, CNIC upload, dashboard stats |
| Car catalog service tests | `car-catalog/` | Test CRUD, filters, bulk create, image upload |
| User cars service tests | `user-cars/` | Test register car, duplicate registration check, ownership validation |
| Car images service tests | `car-images/` | Test registration images (permanent), periodic versioning, single upload |
| Car listings service tests | `car-listings/` | Test create (with verification check), filters, contact seller email |
| Rentals service tests | `rentals/` | Test create, complete, cancel, stats calculation |
| Damage detection service tests | `damage-detection/` | Test YOLOv8 service call mock, result storage |
| Notifications service tests | `notifications/` | Test CRUD, unread count, mark-all-read |
| PDF service tests | `pdf/` | Test PDF generation for damage and rental reports |
| Admin service tests | `admin/` | Test user management, verification queue, stats aggregation |

### 4.2 — Integration Tests

| Task | Details |
|------|---------|
| Auth flow E2E | Register → Login → Refresh → Logout |
| Car registration flow E2E | Browse catalog → Register car → Upload images → Verify images exist |
| Marketplace flow E2E | Create listing (verified user) → Browse → Contact seller → Mark sold |
| Rental flow E2E | Create rental → Upload periodic images → Complete rental → Download PDF |
| Damage detection flow E2E | Upload periodic images → Run detection → View history → Download report |
| Admin flow E2E | Login as admin → Manage users → Verify CNIC → Send notification → View stats |
| Guard tests | Test JwtAuthGuard, RolesGuard, VerificationGuard with wrong tokens/roles |

### 4.3 — Error Handling & Validation Hardening

| Task | Details |
|------|---------|
| Review all DTOs | Ensure all fields have proper class-validator decorators |
| Review all service error handling | Ensure proper HttpException thrown for all edge cases |
| File upload validation | Enforce max 10MB, jpg/png/webp only at controller level (not just Cloudinary) |
| Database constraint tests | Test unique constraints, cascade deletes, null handling |
| Rate limiting | Add `@nestjs/throttler` — 100 requests/min for API, 5 requests/min for auth |
| Request logging | Add morgan or custom logger middleware for API request/response logging |
| Input sanitization | Review for SQL injection, XSS in user-supplied strings |

### 4.4 — Bug Fixes & Polish

| Task | Details |
|------|---------|
| Review OAuth strategies | Ensure Google/Facebook strategies handle edge cases (email exists, etc.) |
| Review Prisma queries | Check for N+1 queries, optimize includes |
| Review PDF generation | Test with real data, fix formatting issues |
| Review email service | Test email sending with actual provider (not console) |
| Review damage detection | Test with actual YOLOv8 service running |
| Soft delete consistency | Ensure `isActive: false` is checked in all queries |
| Pagination consistency | Ensure all list endpoints return consistent meta: `{ total, page, limit, totalPages }` |

---

## PHASE 5: Deployment & DevOps

**Priority:** HIGH  
**Estimated Time:** 3–5 days  
**New Endpoints:** 0

### 5.1 — Environment Configuration

| Task | Details |
|------|---------|
| Create `.env.production` | Production database URL (Neon), production JWT secrets, Cloudinary production |
| Create `.env.staging` | Staging database, staging secrets |
| Validate all env vars on startup | Use `@nestjs/config` schema validation (Joi) |
| Document env vars | Create `.env.example` with all required variables described |

### 5.2 — Staging Deployment

| Task | Details |
|------|---------|
| Choose hosting | Railway / Render / AWS EC2 for NestJS backend |
| Deploy backend to staging | Build production, configure env, run migrations |
| Test all 52 endpoints on staging | Smoke test each endpoint |
| Test Cloudinary in staging | Verify image uploads work |
| Test database connection | Verify Neon PostgreSQL connection |
| Configure CORS for staging frontend | Update `FRONTEND_URL` to staging URL |

### 5.3 — Production Deployment

| Task | Details |
|------|---------|
| Final staging sign-off | All tests pass, all endpoints working |
| Deploy to production | Same process as staging with production env |
| Apply database migrations | `prisma migrate deploy` on production |
| Seed admin account | Run seed script on production |
| SSL/TLS setup | Ensure HTTPS on production |
| Domain configuration | Point API domain to backend server |

### 5.4 — CI/CD Pipeline

| Task | Details |
|------|---------|
| GitHub Actions workflow | Lint → Test → Build → Deploy on push to main |
| Pre-commit hooks | ESLint + Prettier check |
| Branch protection | Require PR reviews before merge to main |
| Automated migration check | Run `prisma migrate status` in CI |

### 5.5 — Monitoring & Logging

| Task | Details |
|------|---------|
| Application logging | Structured JSON logs with request ID |
| Error tracking | Sentry or similar service |
| Performance monitoring | Response time tracking per endpoint |
| Database monitoring | Neon dashboard, query performance |
| Uptime monitoring | External health check service |
| Alerting | Notify on 500 errors, high response times, downtime |

### 5.6 — Database Operations

| Task | Details |
|------|---------|
| Backup strategy | Neon automated backups + manual backup schedule |
| Backup restore testing | Verify backups can be restored |
| Data export | Admin endpoint for data export (future GDPR compliance) |

---

## PHASE 6: Frontend Integration Support & New Features

**Priority:** MEDIUM–HIGH  
**Estimated Time:** 1–2 weeks  
**New/Modified Endpoints:** ~5+

### 6.1 — Enable OAuth (Currently Disabled)

| Task | Details |
|------|---------|
| Configure Google OAuth | Get credentials from Google Cloud Console, set in `.env` |
| Configure Facebook OAuth | Get credentials from Meta Developer Portal, set in `.env` |
| Uncomment OAuth routes | Enable the 4 commented routes in `auth.controller.ts` |
| Test OAuth flow | Browser redirect → OAuth consent → Callback → Token delivery |
| Frontend callback page | Frontend `/auth/callback` reads tokens from URL params |

**Endpoints to Enable:**
```
GET  /api/v1/auth/google                → Redirects to Google
GET  /api/v1/auth/google/callback       → Processes callback, redirects to frontend
GET  /api/v1/auth/facebook              → Redirects to Facebook
GET  /api/v1/auth/facebook/callback     → Processes callback, redirects to frontend
```

### 6.2 — CNIC OCR Service (New Feature — Optional)

| Task | Details |
|------|---------|
| Choose OCR service | Google Vision API / Tesseract / custom |
| Create CNIC OCR module | Extract name, CNIC number, date of birth from CNIC image |
| Auto-fill user profile | Pre-fill fields from OCR results |
| Validation | Cross-check OCR data with user-entered data |

**New Endpoint:**
```
POST /api/v1/users/verify-cnic-ocr
Body: { "cnicImageUrl": "https://cloudinary..." }
Response: { "name": "Ahmed Khan", "cnicNumber": "35201-1234567-8", "dob": "1990-05-15" }
```

### 6.3 — Messaging System (New Feature — From Roadmap Week 5)

| Task | Details |
|------|---------|
| Create `messages` table in Prisma | conversations, messages, participants |
| Create MessagingModule | Service + Controller |
| Implement basic messaging | Send message, get conversations, get messages |
| Optional: WebSocket | Real-time message delivery with Socket.IO |

**New Endpoints:**
```
POST   /api/v1/messages/send                    → Send message
GET    /api/v1/messages/conversations            → Get all conversations
GET    /api/v1/messages/conversations/:id        → Get messages in conversation
PATCH  /api/v1/messages/:id/read                 → Mark message as read
```

**Schema Addition:**
```prisma
model Conversation {
  id           String    @id @default(uuid())
  participant1 String
  participant2 String
  lastMessage  String?
  updatedAt    DateTime  @updatedAt
  messages     Message[]
  @@map("conversations")
}

model Message {
  id             String       @id @default(uuid())
  conversationId String
  senderId       String
  content        String
  isRead         Boolean      @default(false)
  createdAt      DateTime     @default(now())
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  @@map("messages")
}
```

### 6.4 — Cost Estimation (New Feature — From Roadmap Week 5)

| Task | Details |
|------|---------|
| Create cost estimation module | Based on damage detection results |
| Price database | Store repair costs by damage type and severity |
| Estimate endpoint | Calculate repair cost from damage report |

**New Endpoint:**
```
POST /api/v1/estimate/repair/:carId
Response: {
  "carId": "uuid",
  "estimates": [
    { "damageType": "dent", "severity": "moderate", "estimatedCost": 15000 },
    { "damageType": "scratch", "severity": "minor", "estimatedCost": 5000 }
  ],
  "totalEstimate": 20000,
  "currency": "PKR"
}
```

### 6.5 — Bulk Car Import CSV (Enhancement — For CAR_RENTAL Users)

| Task | Details |
|------|---------|
| CSV parser | Use `csv-parse` or `papaparse` |
| Bulk import endpoint | Upload CSV → validate → create cars |
| Error reporting | Return success/failure per row |

**New Endpoint:**
```
POST /api/v1/user-cars/bulk-import
Authorization: Bearer <token>  (CAR_RENTAL only)
Content-Type: multipart/form-data
Field: csv=<file.csv>

CSV Format:
registrationNumber,catalogId,color,mileage,condition
LEA-1234,catalog-uuid,White,15000,USED
XYZ-5678,catalog-uuid,Black,8000,NEW

Response: { "imported": 2, "failed": 0, "errors": [] }
```

### 6.6 — API Rate Limiting

| Task | Details |
|------|---------|
| Install `@nestjs/throttler` | `npm install @nestjs/throttler` |
| Configure global rate limits | 100 requests/min general, 10 requests/min for auth |
| Custom rate limits | Lower limits for sensitive endpoints (login, register) |

### 6.7 — Redis Caching (Performance)

| Task | Details |
|------|---------|
| Install Redis | `npm install cache-manager @nestjs/cache-manager` |
| Cache catalog data | Car catalog rarely changes — cache for 1 hour |
| Cache manufacturer list | Static data — cache for 24 hours |
| Cache platform stats | Admin stats — cache for 5 minutes |
| Cache user dashboard | User stats — cache for 1 minute |

### 6.8 — CORS & Security Tuning for Frontend

| Task | Details |
|------|---------|
| Update CORS origin | Allow staging + production frontend URLs |
| Cookie-based tokens | Optional: Switch from Bearer to httpOnly cookies for better security |
| CSRF protection | Add if using cookie-based auth |
| Content Security Policy | Configure Helmet CSP headers |

---

## Summary Checklist

### Phase 4: Testing & Hardening
- [ ] Unit tests for all 11 service files
- [ ] Integration tests for 6 critical flows
- [ ] Review all DTOs and validation
- [ ] Add rate limiting (`@nestjs/throttler`)
- [ ] Add request logging
- [ ] Input sanitization review
- [ ] Fix any bugs found during testing
- [ ] Pagination consistency check
- [ ] Soft delete consistency check

### Phase 5: Deployment & DevOps
- [ ] Create `.env.production` and `.env.staging`
- [ ] Add env validation on startup
- [ ] Create `.env.example` template
- [ ] Deploy to staging (Railway/Render)
- [ ] Smoke test all 52 endpoints on staging
- [ ] Deploy to production
- [ ] Setup CI/CD (GitHub Actions)
- [ ] Setup monitoring (Sentry)
- [ ] Setup database backups
- [ ] Configure SSL/HTTPS
- [ ] Setup uptime monitoring

### Phase 6: New Features & Enhancements
- [ ] Enable Google OAuth (uncomment routes, configure credentials)
- [ ] Enable Facebook OAuth (uncomment routes, configure credentials)
- [ ] CNIC OCR service (optional)
- [ ] Messaging system (new module + schema)
- [ ] Cost estimation (new module)
- [ ] Bulk car import CSV (new endpoint)
- [ ] API rate limiting
- [ ] Redis caching
- [ ] CORS tuning for production frontend

---

## Mapping to 8-Week Roadmap

| Roadmap Week | Backend Task | Status |
|-------------|-------------|--------|
| Week 1 | Foundation, Auth, Deploy staging | **DONE** (code) — Deploy remaining |
| Week 2 | CNIC verification, Damage Detection API | **DONE** |
| Week 3 | Car images API, Marketplace API | **DONE** |
| Week 4 | Damage Detection integration, Admin APIs | **DONE** |
| Week 5 | Rental features, Messaging, Cost Estimation | **PARTIAL** — Rentals done, Messaging & Cost Estimation NOT done |
| Week 6 | Admin analytics, Performance optimization | **PARTIAL** — Admin stats done, Redis caching NOT done |
| Week 7 | Comprehensive testing, Bug fixes | **NOT DONE** |
| Week 8 | Production deployment, Monitoring | **NOT DONE** |

**Current Position: You are roughly at end of Week 4 / start of Week 5 in terms of code completeness. Testing, deployment, and new features (messaging, cost estimation) remain.**

---

*This document covers all remaining backend work. Prioritize Phase 4 (testing) and Phase 5 (deployment) before Phase 6 (new features).*
