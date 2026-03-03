# API Reference — Complete Endpoint Documentation

> **Base URL:** `http://localhost:3000/api/v1`  
> **Auth:** Bearer Token (JWT) — unless marked `PUBLIC`  
> **Swagger Docs:** `http://localhost:3000/api/docs`  
> **Response Format:** `{ success: boolean, data: any, timestamp: string }`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Users](#2-users)
3. [Car Catalog](#3-car-catalog)
4. [User Cars](#4-user-cars)
5. [Car Images](#5-car-images)
6. [Car Listings (Marketplace)](#6-car-listings-marketplace)
7. [Rentals](#7-rentals)
8. [Damage Detection](#8-damage-detection)
9. [Notifications](#9-notifications)
10. [PDF Reports](#10-pdf-reports)
11. [Admin](#11-admin)

---

## Authentication Legend

| Symbol | Meaning |
|--------|---------|
| 🔓 | Public — no auth required |
| 🔐 | Requires JWT access token |
| ✅ | Requires CNIC verification |
| 👔 | CAR_RENTAL accounts only |
| 🛡️ | ADMIN accounts only |

---

## 1. Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | 🔓 | Register a new account |
| `POST` | `/auth/login` | 🔓 | Login with email & password |
| `POST` | `/auth/refresh` | 🔐 | Refresh access token using refresh token |
| `POST` | `/auth/logout` | 🔐 | Logout (invalidate refresh token) |
| `GET`  | `/auth/google` | 🔓 | Initiate Google OAuth flow |
| `GET`  | `/auth/google/callback` | 🔓 | Google OAuth callback (auto-redirect) |
| `GET`  | `/auth/facebook` | 🔓 | Initiate Facebook OAuth flow |
| `GET`  | `/auth/facebook/callback` | 🔓 | Facebook OAuth callback (auto-redirect) |
| `GET`  | `/auth/me` | 🔐 | Get currently authenticated user |

### `POST /auth/register`

Creates a new user account. Returns JWT tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "StrongP@ss123",
  "fullName": "Ahmed Khan",
  "accountType": "INDIVIDUAL",       // or "CAR_RENTAL"
  "phoneNumber": "+923001234567",     // optional
  "city": "Lahore",                   // optional
  "businessName": "Khan Rentals",     // optional (CAR_RENTAL only)
  "businessLicense": "BL-12345"       // optional (CAR_RENTAL only)
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "Ahmed Khan",
      "accountType": "INDIVIDUAL",
      "isVerified": false
    },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

### `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "StrongP@ss123"
}
```

**Response (200):** Same shape as register response.

### `POST /auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response (200):**
```json
{
  "data": {
    "accessToken": "eyJhbGci...(new)",
    "refreshToken": "eyJhbGci...(new)"
  }
}
```

### OAuth Callbacks

After Google/Facebook login, the user is redirected to:
```
{FRONTEND_URL}/auth/callback?accessToken=xxx&refreshToken=xxx
```
The frontend reads the query params and stores the tokens.

---

## 2. Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/users/profile` | 🔐 | Get my full profile |
| `PATCH` | `/users/profile` | 🔐 | Update profile fields |
| `POST` | `/users/change-password` | 🔐 | Change password |
| `POST` | `/users/upload-cnic` | 🔐 | Upload CNIC image for verification |
| `GET` | `/users/dashboard` | 🔐 | Get user dashboard stats |

### `PATCH /users/profile`

**Request Body (all optional):**
```json
{
  "fullName": "Ahmed Khan",
  "phoneNumber": "+923001234567",
  "address": "123 Main St",
  "city": "Lahore",
  "country": "Pakistan",
  "postalCode": "54000",
  "businessName": "Khan Rentals"
}
```

### `POST /users/upload-cnic`

**Request:** `multipart/form-data`  
**Field:** `cnic` (image file, max 10MB, jpg/png/webp)

Uploads the CNIC image to Cloudinary. Admin must then approve it from the verification queue.

### `GET /users/dashboard`

**Response:**
```json
{
  "data": {
    "totalCars": 3,
    "totalListings": 1,
    "activeListings": 1,
    "totalRentals": 5,
    "activeRentals": 2
  }
}
```

---

## 3. Car Catalog

### Public Endpoints (No Auth)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/car-catalog` | 🔓 | Browse catalog with filters |
| `GET` | `/car-catalog/manufacturers` | 🔓 | Get all manufacturers list |
| `GET` | `/car-catalog/manufacturers/:name/models` | 🔓 | Get models by manufacturer |
| `GET` | `/car-catalog/:id` | 🔓 | Get single catalog entry with images |

### Admin Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/car-catalog` | 🛡️ | Create new catalog entry |
| `POST` | `/car-catalog/bulk` | 🛡️ | Bulk create catalog entries |
| `PATCH` | `/car-catalog/:id` | 🛡️ | Update catalog entry |
| `DELETE` | `/car-catalog/:id` | 🛡️ | Delete catalog entry (soft if linked) |
| `POST` | `/car-catalog/:id/image` | 🛡️ | Upload catalog image |

### `GET /car-catalog` — Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `manufacturer` | string | Filter by manufacturer |
| `modelName` | string | Filter by model name |
| `yearFrom` | number | Minimum year |
| `yearTo` | number | Maximum year |
| `bodyType` | string | Sedan, SUV, Hatchback, etc. |
| `fuelType` | string | Petrol, Diesel, Hybrid, Electric |
| `transmission` | string | Manual, Automatic, CVT |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

### `POST /car-catalog` — Create Catalog Entry

**Request Body:**
```json
{
  "manufacturer": "Toyota",
  "modelName": "Corolla",
  "year": 2024,
  "variant": "GLi",
  "bodyType": "Sedan",
  "fuelType": "Petrol",
  "transmission": "Automatic",
  "engineCapacity": "1800cc",
  "seatingCapacity": 5,
  "basePrice": 5500000,
  "description": "Pakistan's best-selling sedan",
  "features": ["ABS", "Airbags", "Cruise Control"]
}
```

---

## 4. User Cars

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/user-cars` | 🔐 | Register a new car |
| `GET` | `/user-cars` | 🔐 | Get all my cars |
| `GET` | `/user-cars/:id` | 🔐 | Get single car details |
| `PATCH` | `/user-cars/:id` | 🔐 | Update car details |
| `DELETE` | `/user-cars/:id` | 🔐 | Delete car (soft-delete if has listings/rentals) |
| `GET` | `/user-cars/:id/has-registration-images` | 🔐 | Check if registration images exist |

### `POST /user-cars` — Register Car

Cars can **only** be registered from the catalog. Users select a catalog entry and provide their car-specific details.

**Request Body:**
```json
{
  "catalogId": "catalog-uuid",
  "registrationNumber": "LEA-1234",
  "vinNumber": "1HGCM82633A004352",
  "color": "White",
  "mileage": 45000,
  "condition": "USED",
  "purchaseDate": "2022-06-15",
  "purchasePrice": 4200000
}
```

**Validations:**
- `catalogId` must reference an existing active catalog entry
- `registrationNumber` must be unique across the platform
- Car details (manufacturer, model, year) are auto-copied from the catalog

---

## 5. Car Images

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/car-images/:carId/registration` | 🔐 | Upload 4 registration images (one-time) |
| `POST` | `/car-images/:carId/periodic` | 🔐 | Upload periodic images (versioned) |
| `POST` | `/car-images/:carId/upload` | 🔐 | Upload a single image (damage/listing) |
| `GET` | `/car-images/:carId` | 🔐 | Get all images for a car |
| `GET` | `/car-images/:carId/registration` | 🔐 | Get registration images only |
| `GET` | `/car-images/:carId/inspection-history` | 🔐 | Get inspection history grouped by version |

### `POST /car-images/:carId/registration`

Uploads exactly **4 images** (front, back, left, right). These are **permanent** and cannot be re-uploaded.

**Request:** `multipart/form-data`  
**Fields:**
- `front` — Front view image
- `back` — Back view image
- `left` — Left side image
- `right` — Right side image

**Validations:** Max 10MB each, jpg/png/webp only.

### `POST /car-images/:carId/periodic`

Uploads a new set of 4 periodic images. Creates a new version; old images are marked as `isCurrent: false`.

**Request:** `multipart/form-data`  
**Fields:** `front`, `back`, `left`, `right`

### `GET /car-images/:carId/inspection-history`

Returns inspection images grouped by version number, showing the history of periodic uploads.

**Response:**
```json
{
  "data": {
    "carId": "uuid",
    "versions": [
      {
        "version": 3,
        "isCurrent": true,
        "uploadedAt": "2026-02-10T10:00:00Z",
        "images": [
          { "category": "PERIODIC_FRONT", "imageUrl": "...", "hasDamage": false },
          { "category": "PERIODIC_BACK", "imageUrl": "...", "hasDamage": true }
        ]
      },
      {
        "version": 2,
        "isCurrent": false,
        "uploadedAt": "2026-01-15T10:00:00Z",
        "images": [...]
      }
    ]
  }
}
```

---

## 6. Car Listings (Marketplace)

### Public Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/car-listings` | 🔓 | Browse marketplace with filters |
| `GET` | `/car-listings/:id` | 🔓 | Get listing details (increments view count) |

### Authenticated Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/car-listings` | 🔐 ✅ | Create a new listing |
| `GET` | `/car-listings/my/listings` | 🔐 | Get all my listings |
| `PATCH` | `/car-listings/:id` | 🔐 | Update listing (price, title, description) |
| `PATCH` | `/car-listings/:id/status` | 🔐 | Update listing status |
| `POST` | `/car-listings/:id/contact` | 🔐 ✅ | Contact seller via email |

### `GET /car-listings` — Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `manufacturer` | string | Filter by manufacturer |
| `modelName` | string | Filter by model name |
| `yearFrom` | number | Min year |
| `yearTo` | number | Max year |
| `priceFrom` | number | Min price (PKR) |
| `priceTo` | number | Max price (PKR) |
| `city` | string | Filter by seller's city |
| `condition` | string | NEW, USED, DAMAGED |
| `sortBy` | string | `price_asc`, `price_desc`, `date_desc`, `views_desc` |
| `page` | number | Page (default: 1) |
| `limit` | number | Per page (default: 20) |

### `POST /car-listings` — Create Listing

**Request Body:**
```json
{
  "carId": "user-car-uuid",
  "askingPrice": 4500000,
  "title": "Toyota Corolla GLi 2022 - Excellent Condition",
  "description": "Single owner, maintained by authorized dealer...",
  "isNegotiable": true
}
```

**Validations:**
- Car must belong to the user
- Car must have registration images uploaded
- Car must not have another active listing
- User must be CNIC-verified

### `POST /car-listings/:id/contact`

**Request Body:**
```json
{
  "buyerName": "Ali Hassan",
  "buyerEmail": "ali@example.com",
  "message": "I'm interested in your Corolla. Is the price negotiable?"
}
```

Sends an email to the seller with the buyer's message and contact info.

### `PATCH /car-listings/:id/status`

**Request Body:**
```json
{
  "status": "SOLD"
}
```

**Possible values:** `ACTIVE`, `SOLD`, `INACTIVE`  
When set to `SOLD`, the `soldAt` timestamp is recorded.

---

## 7. Rentals

> All rental endpoints require `CAR_RENTAL` account type.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/rentals` | 🔐 👔 ✅ | Create a new rental record |
| `GET` | `/rentals` | 🔐 👔 | Get all my rentals (filtered) |
| `GET` | `/rentals/stats` | 🔐 👔 | Get business rental stats |
| `GET` | `/rentals/:id` | 🔐 👔 | Get rental details |
| `PATCH` | `/rentals/:id/complete` | 🔐 👔 | Complete rental (car returned) |
| `PATCH` | `/rentals/:id/cancel` | 🔐 👔 | Cancel rental |

### `POST /rentals` — Create Rental

**Request Body:**
```json
{
  "carId": "user-car-uuid",
  "renterName": "Hassan Ali",
  "renterPhone": "+923009876543",
  "renterEmail": "hassan@example.com",
  "renterCnic": "35201-1234567-8",
  "startDate": "2026-02-15",
  "endDate": "2026-02-20",
  "mileageAtStart": 45000,
  "preRentalNotes": "Minor scratch on rear bumper",
  "rentalPrice": 15000
}
```

**Validations:**
- Car must belong to the business user
- Car must not have another active rental
- End date must be after start date
- Pre-inspection version is captured automatically

### `PATCH /rentals/:id/complete` — Complete Rental

**Request Body:**
```json
{
  "mileageAtEnd": 45350,
  "postRentalNotes": "New dent on front-left door",
  "damageCharges": 5000,
  "damageDescription": "Dent approximately 3cm, front-left door panel",
  "totalCharges": 20000
}
```

### `GET /rentals` — Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | ACTIVE, COMPLETED, CANCELLED |
| `carId` | string | Filter by specific car |
| `fromDate` | string | Rentals starting from this date |
| `toDate` | string | Rentals starting before this date |
| `page` | number | Page (default: 1) |
| `limit` | number | Per page (default: 20) |

### `GET /rentals/stats` — Business Dashboard Stats

**Response:**
```json
{
  "data": {
    "activeRentals": 3,
    "completedRentals": 47,
    "totalRentals": 52,
    "totalRevenue": 1250000
  }
}
```

---

## 8. Damage Detection

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/damage-detection/image` | 🔐 ✅ | Run detection on a single image |
| `POST` | `/damage-detection/car` | 🔐 ✅ | Run detection on all current periodic images |
| `GET` | `/damage-detection/history/:carId` | 🔐 | Get damage detection history |

### `POST /damage-detection/image`

**Request Body:**
```json
{
  "imageId": "car-image-uuid"
}
```

**Response:**
```json
{
  "data": {
    "hasDamage": true,
    "confidence": 0.92,
    "detections": [
      {
        "label": "dent",
        "confidence": 0.95,
        "bbox": [120, 340, 280, 450]
      },
      {
        "label": "scratch",
        "confidence": 0.87,
        "bbox": [50, 200, 150, 220]
      }
    ],
    "processedImageUrl": "https://..."
  }
}
```

### `POST /damage-detection/car`

Runs detection on all 4 current periodic images at once.

**Request Body:**
```json
{
  "carId": "user-car-uuid"
}
```

**Response:**
```json
{
  "data": {
    "carId": "uuid",
    "registrationNumber": "LEA-1234",
    "totalImagesScanned": 4,
    "imagesWithDamage": 2,
    "results": [
      {
        "imageId": "uuid",
        "category": "PERIODIC_FRONT",
        "hasDamage": false,
        "confidence": 0.12,
        "detections": []
      },
      {
        "imageId": "uuid",
        "category": "PERIODIC_LEFT",
        "hasDamage": true,
        "confidence": 0.94,
        "detections": [
          { "label": "dent", "confidence": 0.94, "bbox": [100, 200, 300, 400] }
        ]
      }
    ]
  }
}
```

---

## 9. Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/notifications` | 🔐 | Get my notifications (paginated) |
| `GET` | `/notifications/unread-count` | 🔐 | Get unread notification count |
| `PATCH` | `/notifications/:id/read` | 🔐 | Mark notification as read |
| `PATCH` | `/notifications/read-all` | 🔐 | Mark all notifications as read |
| `DELETE` | `/notifications/:id` | 🔐 | Delete a notification |

### `GET /notifications` — Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `unreadOnly` | boolean | Only show unread |
| `type` | string | INFO, WARNING, SUCCESS, ERROR, SYSTEM |
| `page` | number | Page (default: 1) |
| `limit` | number | Per page (default: 20) |

**Response:**
```json
{
  "data": {
    "data": [
      {
        "id": "uuid",
        "title": "CNIC Verified",
        "message": "Your CNIC has been verified. You can now create listings.",
        "type": "SUCCESS",
        "isRead": false,
        "actionUrl": "/profile",
        "createdAt": "2026-02-14T12:00:00Z"
      }
    ],
    "unreadCount": 3,
    "meta": { "total": 15, "page": 1, "limit": 20, "totalPages": 1 }
  }
}
```

---

## 10. PDF Reports

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/reports/damage/:carId` | 🔐 ✅ | Download damage report PDF |
| `GET` | `/reports/rental/:rentalId` | 🔐 ✅ | Download rental summary PDF |

Both endpoints return a `application/pdf` file as a download.

**Damage Report includes:**
- Vehicle information (registration, make, model, year, color, mileage)
- Owner information (name, email, phone)
- All detected damages with labels, confidence scores, timestamps
- Summary: total images with damage

**Rental Report includes:**
- Business information
- Vehicle details
- Renter information (name, phone, CNIC)
- Rental period, mileage tracking
- Financial summary (rental price, damage charges, total)
- Pre/post rental notes

---

## 11. Admin

> All admin endpoints require `ADMIN` account type.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/admin/users` | 🛡️ | Get all users (paginated, filtered) |
| `GET` | `/admin/users/:id` | 🛡️ | Get user detail |
| `PATCH` | `/admin/users/:id` | 🛡️ | Update user (status, type, verification) |
| `GET` | `/admin/verifications` | 🛡️ | Get pending CNIC verification queue |
| `POST` | `/admin/notifications` | 🛡️ | Send system notification |
| `GET` | `/admin/stats` | 🛡️ | Get platform analytics |

### `GET /admin/users` — Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `accountType` | string | INDIVIDUAL, CAR_RENTAL, ADMIN |
| `accountStatus` | string | ACTIVE, SUSPENDED, DELETED |
| `isVerified` | boolean | Filter by verification status |
| `search` | string | Search by name or email |
| `page` | number | Page (default: 1) |
| `limit` | number | Per page (default: 20) |

### `PATCH /admin/users/:id` — Update User

**Request Body:**
```json
{
  "accountStatus": "SUSPENDED",
  "isVerified": true,
  "accountType": "CAR_RENTAL"
}
```

When `isVerified` is set to `true`:
- User receives an in-app SUCCESS notification
- Verification approval email is sent

When `accountStatus` is set to `SUSPENDED`:
- User receives a WARNING notification

### `POST /admin/notifications` — Send System Notification

**Request Body:**
```json
{
  "title": "Platform Maintenance",
  "message": "The platform will be under maintenance on Feb 20 from 2 AM to 6 AM.",
  "sendToAll": true
}
```

Or send to specific users:
```json
{
  "title": "Account Notice",
  "message": "Please update your business license.",
  "userIds": ["uuid-1", "uuid-2"]
}
```

### `GET /admin/stats` — Platform Analytics

**Response:**
```json
{
  "data": {
    "users": {
      "total": 1250,
      "individuals": 1100,
      "rentalBusinesses": 148,
      "suspended": 12,
      "pendingVerifications": 23
    },
    "cars": {
      "total": 850
    },
    "listings": {
      "total": 320,
      "active": 180
    },
    "rentals": {
      "total": 2100,
      "active": 45
    }
  }
}
```

---

## Error Response Format

All errors follow a standardized format:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2026-02-14T12:00:00.000Z"
}
```

**Common Status Codes:**

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation error |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (wrong role or not verified) |
| 404 | Not Found |
| 409 | Conflict (duplicate data) |
| 500 | Internal Server Error |

---

*Total Endpoints: **52** across 11 modules.*
