# Car Damage Detection & Marketplace Platform — Project Overview

> **Version:** 1.0  
> **Last Updated:** February 2026  
> **Platform:** Web Application (Pakistan-focused)  
> **Currency:** PKR (Pakistani Rupees)

---

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [Problem Statement](#2-problem-statement)
3. [Solution](#3-solution)
4. [Tech Stack](#4-tech-stack)
5. [Architecture Overview](#5-architecture-overview)
6. [User Roles & Permissions](#6-user-roles--permissions)
7. [Core Feature Modules](#7-core-feature-modules)
8. [Third-Party Integrations](#8-third-party-integrations)
9. [Security & Authentication](#9-security--authentication)
10. [Deployment & Infrastructure](#10-deployment--infrastructure)
11. [Project Structure (Backend)](#11-project-structure-backend)
12. [Environment Variables](#12-environment-variables)
13. [Getting Started](#13-getting-started)

---

## 1. Project Summary

This is a **full-stack web application** that combines two core functionalities:

1. **AI-Powered Car Damage Detection** — Uses YOLOv8 (deep learning model) to automatically detect and classify damage on car body images.
2. **Car Marketplace & Rental Management** — A platform where individual car owners can list cars for resale, and car rental businesses can manage their fleet, track rentals, and generate inspection reports.

The platform serves **three distinct user types**: Individual car owners, Car Rental Businesses, and Platform Administrators.

---

## 2. Problem Statement

- Manual car damage inspection is **subjective, time-consuming, and inconsistent**.
- Car buyers in Pakistan lack a **trusted digital marketplace** with verifiable car condition data.
- Car rental businesses lack **affordable digital tools** to track rentals, inspections, and damage history.
- There is no platform in Pakistan that combines **AI damage detection with a car marketplace**.

---

## 3. Solution

A unified platform that:

- Allows users to **register their cars** (from a curated catalog) and upload images for **AI-based damage detection**.
- Provides a **marketplace** for car resale with verified seller identities (CNIC).
- Offers **rental management tools** for car rental businesses with pre/post inspection tracking.
- Generates **PDF reports** for damage assessments and rental summaries.
- Ensures trust via **CNIC (National ID) verification** before any transaction.

---

## 4. Tech Stack

| Layer              | Technology                     | Purpose                             |
|--------------------|--------------------------------|-------------------------------------|
| **Frontend**       | Next.js (React)                | Web UI, SSR, routing                |
| **Backend API**    | NestJS (Node.js / TypeScript)  | REST API, business logic            |
| **Database**       | PostgreSQL (Neon)              | Primary data store                  |
| **ORM**            | Prisma v7                      | Type-safe database access           |
| **Auth**           | JWT + Passport.js              | Access/refresh tokens, OAuth        |
| **OAuth**          | Google + Facebook              | Social login                        |
| **AI/ML Service**  | Python FastAPI + YOLOv8        | Damage detection microservice       |
| **Image Storage**  | Cloudinary                     | All image uploads & CDN delivery    |
| **Email**          | Pluggable (SendGrid/Mailgun)   | Transactional emails                |
| **PDF Generation** | PDFKit                         | Damage & rental reports             |
| **API Docs**       | Swagger (OpenAPI)              | Auto-generated API documentation    |

---

## 5. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│          Browser → Pages → Components → API Calls               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS (REST API)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS API)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │   Auth   │ │  Users   │ │ Catalog  │ │   Car Listings    │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │User Cars │ │Car Images│ │ Rentals  │ │Damage Detection   │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │  Admin   │ │  Email   │ │   PDF    │ │  Notifications    │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
│                        │         │                               │
│                    Prisma ORM    │                               │
│                        │         │                               │
└────────────────────────┼─────────┼──────────────────────────────┘
                         │         │
              ┌──────────▼──┐  ┌───▼──────────────────┐
              │ PostgreSQL  │  │ Python FastAPI        │
              │   (Neon)    │  │ YOLOv8 Microservice   │
              └─────────────┘  └──────────────────────┘
                                        │
                               ┌────────▼────────┐
                               │   Cloudinary    │
                               │  (Image CDN)    │
                               └─────────────────┘
```

**Key Architecture Decisions:**
- Images are uploaded **Client → NestJS Backend → Cloudinary** (backend controls access).
- Damage detection runs on a **separate Python FastAPI microservice** (YOLOv8 model).
- The NestJS backend sends the image URL to the Python service and stores the results.
- All authentication uses **JWT (access + refresh tokens)** with optional Google/Facebook OAuth.

---

## 6. User Roles & Permissions

### 6.1 Individual User (`INDIVIDUAL`)

| Capability                   | Requires CNIC Verification? |
|------------------------------|-----------------------------|
| Register & login             | No                          |
| Browse marketplace           | No                          |
| View car listings            | No                          |
| Register own cars            | No                          |
| Upload car images            | No                          |
| Run damage detection         | No                          |
| **Create a listing (sell)**  | **Yes**                     |
| **Contact a seller**         | **Yes**                     |
| Download damage report PDF   | No                          |
| Manage profile               | No                          |
| View notifications           | No                          |

### 6.2 Car Rental Business (`CAR_RENTAL`)

All Individual capabilities **plus**:

| Capability                       | Requires CNIC Verification? |
|----------------------------------|-----------------------------|
| Create rental records            | **Yes**                     |
| Complete/cancel rentals          | **Yes**                     |
| Track pre/post inspection        | **Yes**                     |
| View rental stats & analytics    | No                          |
| Download rental report PDF       | **Yes**                     |
| Business profile (name, license) | No                          |

### 6.3 Platform Admin (`ADMIN`)

| Capability                         | Notes                      |
|------------------------------------|----------------------------|
| Manage all users (view/suspend)    | Full user management       |
| Verify/reject CNIC submissions     | Verification queue         |
| Manage car catalog (CRUD)          | Add/edit/delete car models |
| Upload catalog images              | Professional/stock photos  |
| View platform analytics            | Users, listings, rentals   |
| Send system notifications          | To all or specific users   |
| Cannot be registered via UI        | Created via DB seed only   |

---

## 7. Core Feature Modules

### 7.1 Authentication
- Email/password registration with account type selection
- Login with JWT token pair (access 15m + refresh 7d)
- Google OAuth & Facebook OAuth login
- Auto-registration on first OAuth login
- Refresh token rotation

### 7.2 User Management
- Profile view & edit (name, phone, address, city, avatar)
- Password change
- CNIC image upload for verification (admin approves)
- User dashboard with stats

### 7.3 Car Catalog (Admin-Managed)
- Curated database of car models with specs & pricing
- Admin creates/edits/deletes catalog entries
- Bulk import support
- Professional images per catalog entry
- Users can only register cars that exist in the catalog

### 7.4 User Car Registration
- Register a car by selecting from catalog + entering registration number
- Duplicate registration number check
- Car details inherited from catalog (manufacturer, model, year)
- Additional fields: color, mileage, condition, purchase info

### 7.5 Car Images (4-Tier System)
1. **Registration Images** (4 angles: front, back, left, right) — uploaded once, **permanent**, cannot be changed
2. **Periodic Images** (same 4 angles) — versioned, can be re-uploaded; old versions archived
3. **Damage Detection Images** — images processed by YOLOv8
4. **Listing Images** — images attached to marketplace listings

### 7.6 Damage Detection (YOLOv8)
- Run detection on a single image or all current periodic images
- Calls Python FastAPI microservice
- Stores detection results (bounding boxes, labels, confidence scores)
- Damage history tracking across versions
- PDF report generation

### 7.7 Car Marketplace
- Create resale listings with price, title, description, negotiability
- Browse & filter: manufacturer, model, year range, price range, city, condition
- Sort: price, date, views
- View count tracking
- Contact seller via email (requires CNIC verification)
- Listing status management (active → sold/inactive)

### 7.8 Rental Management (CAR_RENTAL only)
- Create rental records with renter info (name, phone, CNIC)
- Set rental period, pricing, mileage tracking
- Pre-rental inspection version captured automatically
- Complete rental: post-inspection, damage charges, total calculation
- Cancel rentals
- Business dashboard with stats & revenue

### 7.9 Notifications
- In-app notification system
- Types: INFO, WARNING, SUCCESS, ERROR, SYSTEM
- Mark as read / mark all as read
- Unread count badge
- Triggered by: verification approval, account suspension, rental completion, system broadcasts

### 7.10 PDF Reports
- **Damage Report**: Car info, owner info, all detected damages with details
- **Rental Report**: Business info, vehicle, renter, dates, financials, notes

### 7.11 Admin Panel
- User management with filters & search
- CNIC verification queue with approve/reject
- Platform analytics dashboard
- System notification broadcasting
- Car catalog management

---

## 8. Third-Party Integrations

| Service         | Purpose                    | Configuration                   |
|-----------------|----------------------------|---------------------------------|
| **Google OAuth** | Social login              | Google Cloud Console → OAuth2   |
| **Facebook OAuth** | Social login           | Meta Developer Portal → App     |
| **Cloudinary**  | Image storage & CDN        | Cloud name, API key, API secret |
| **Neon**        | PostgreSQL hosting         | Connection string               |
| **YOLOv8 API**  | Damage detection inference | FastAPI URL (self-hosted)       |
| **Email Provider** | Transactional emails    | Pluggable (SendGrid/Mailgun)    |

---

## 9. Security & Authentication

| Feature                   | Implementation                              |
|---------------------------|---------------------------------------------|
| Password hashing          | bcryptjs (12 rounds)                        |
| JWT access token          | 15 minutes, signed with ACCESS_SECRET       |
| JWT refresh token         | 7 days, signed with REFRESH_SECRET          |
| Refresh token storage     | Hashed in DB (bcrypt)                       |
| Route protection          | Global JwtAuthGuard (opt-out via @Public()) |
| Role-based access         | @Roles() decorator + RolesGuard             |
| CNIC verification gate    | @RequireVerification() + VerificationGuard  |
| Input validation          | class-validator (whitelist + transform)      |
| HTTP security headers     | Helmet middleware                            |
| CORS                      | Configured for frontend origin              |
| File upload validation    | Max 10MB, jpg/png/webp only                 |

---

## 10. Deployment & Infrastructure

| Component         | Recommended Hosting            |
|-------------------|--------------------------------|
| Frontend (Next.js)| Vercel                         |
| Backend (NestJS)  | Railway / Render / AWS EC2     |
| Database          | Neon (serverless PostgreSQL)   |
| YOLOv8 Service    | GPU Server / AWS EC2 with GPU  |
| Images            | Cloudinary (CDN)               |

---

## 11. Project Structure (Backend)

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema (7 models, 7 enums)
│   ├── prisma.config.ts       # Prisma v7 config (DB URL)
│   └── seed.ts                # Admin seed script
├── src/
│   ├── main.ts                # App bootstrap, Swagger, CORS, pipes
│   ├── app.module.ts          # Root module, global guards/filters
│   ├── admin/                 # Admin panel module
│   │   ├── dto/
│   │   ├── admin.controller.ts
│   │   ├── admin.service.ts
│   │   └── admin.module.ts
│   ├── auth/                  # Authentication module
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── strategies/        # JWT, Google, Facebook
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── car-catalog/           # Admin-managed car catalog
│   │   ├── dto/
│   │   ├── car-catalog.controller.ts
│   │   ├── car-catalog.service.ts
│   │   └── car-catalog.module.ts
│   ├── car-images/            # All car image management
│   │   ├── dto/
│   │   ├── car-images.controller.ts
│   │   ├── car-images.service.ts
│   │   └── car-images.module.ts
│   ├── car-listings/          # Marketplace listings
│   │   ├── dto/
│   │   ├── car-listings.controller.ts
│   │   ├── car-listings.service.ts
│   │   └── car-listings.module.ts
│   ├── cloudinary/            # Image upload service
│   │   ├── cloudinary.service.ts
│   │   └── cloudinary.module.ts
│   ├── common/                # Shared utilities
│   │   ├── decorators/        # @CurrentUser, @Roles, @Public, @RequireVerification
│   │   ├── filters/           # AllExceptionsFilter
│   │   ├── guards/            # RolesGuard, VerificationGuard
│   │   └── interceptors/      # TransformInterceptor
│   ├── damage-detection/      # YOLOv8 integration
│   │   ├── dto/
│   │   ├── damage-detection.controller.ts
│   │   ├── damage-detection.service.ts
│   │   └── damage-detection.module.ts
│   ├── email/                 # Email service (pluggable)
│   │   ├── email.service.ts
│   │   └── email.module.ts
│   ├── notifications/         # In-app notifications
│   │   ├── dto/
│   │   ├── notifications.controller.ts
│   │   ├── notifications.service.ts
│   │   └── notifications.module.ts
│   ├── pdf/                   # PDF report generation
│   │   ├── pdf.controller.ts
│   │   ├── pdf.service.ts
│   │   └── pdf.module.ts
│   ├── prisma/                # Database service
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── rentals/               # Rental management
│   │   ├── dto/
│   │   ├── rentals.controller.ts
│   │   ├── rentals.service.ts
│   │   └── rentals.module.ts
│   ├── user-cars/             # User car registration
│   │   ├── dto/
│   │   ├── user-cars.controller.ts
│   │   ├── user-cars.service.ts
│   │   └── user-cars.module.ts
│   └── users/                 # User profile management
│       ├── dto/
│       ├── users.controller.ts
│       ├── users.service.ts
│       └── users.module.ts
├── .env                       # Environment variables
├── package.json
└── tsconfig.json
```

---

## 12. Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host/dbname

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
FACEBOOK_CALLBACK_URL=http://localhost:3000/api/v1/auth/facebook/callback

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# YOLOv8 Microservice
DAMAGE_DETECTION_SERVICE_URL=http://localhost:8000

# Email
EMAIL_PROVIDER=console  # console | sendgrid | mailgun
EMAIL_FROM=noreply@carplatform.pk

# Frontend
FRONTEND_URL=http://localhost:3001

# Admin Seed
ADMIN_EMAIL=admin@carplatform.pk
ADMIN_PASSWORD=Admin@123456

# Server
PORT=3000
```

---

## 13. Getting Started

```bash
# 1. Clone and install
cd backend
npm install

# 2. Setup environment
cp .env.example .env
# Fill in all values

# 3. Generate Prisma client
npx prisma generate

# 4. Push schema to database
npx prisma db push

# 5. Seed admin account
npm run seed

# 6. Start development server
npm run start:dev

# 7. View API docs
# Open http://localhost:3000/api/docs
```

---

*This document serves as the high-level reference for the entire project. See companion documents for detailed API endpoints, screen designs, user flows, and database schema.*
