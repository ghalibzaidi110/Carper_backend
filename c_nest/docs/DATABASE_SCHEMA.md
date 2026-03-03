# Database Schema — Complete Reference

> **ORM:** Prisma v7  
> **Database:** PostgreSQL (Neon)  
> **Naming:** All database tables/columns use `snake_case` via `@@map` / `@map`

---

## Table of Contents

1. [Entity Relationship Diagram](#1-entity-relationship-diagram)
2. [Enums](#2-enums)
3. [Tables](#3-tables)
4. [Relationships Deep Dive](#4-relationships-deep-dive)
5. [Indexes](#5-indexes)
6. [Query Patterns](#6-query-patterns)
7. [Migration Notes](#7-migration-notes)

---

## 1. Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────────────┐
│     USERS        │       │       CAR_CATALOG         │
│──────────────────│       │──────────────────────────│
│ id (PK)          │       │ id (PK)                  │
│ email (UNIQUE)   │       │ manufacturer             │
│ password_hash    │       │ model_name               │
│ google_id (UNQ)  │       │ year                     │
│ facebook_id (UNQ)│       │ variant                  │
│ account_type     │       │ body_type, fuel_type     │
│ account_status   │       │ transmission, engine     │
│ full_name        │       │ base_price               │
│ phone_number     │       │ features (JSON)          │
│ city, address    │       │ is_active                │
│ business_name    │       │ created_at, updated_at   │
│ cnic_image_url   │       └──────────┬───────────────┘
│ is_verified      │                  │ 1
│ avatar_url       │                  │
│ refresh_token    │                  │ has many
│ created_at       │                  │
│ updated_at       │                  ▼ N
│ last_login       │       ┌──────────────────────────┐
└───────┬──────────┘       │   CAR_CATALOG_IMAGES     │
        │ 1                │──────────────────────────│
        │                  │ id (PK)                  │
        │                  │ catalog_id (FK)          │
        │ has many         │ image_url                │
        │                  │ image_order              │
        ├──────────────┐   │ is_primary               │
        │              │   │ uploaded_at              │
        │              │   └──────────────────────────┘
        ▼ N            │
┌──────────────────┐   │
│    USER_CARS     │   │
│──────────────────│   │
│ id (PK)          │   │
│ user_id (FK) ────┘   │
│ catalog_id (FK) ─────┤ optional link to CAR_CATALOG
│ registration_no  │   │
│ vin_number       │   │
│ manufacturer     │   │
│ model_name, year │   │
│ color, mileage   │   │
│ condition        │   │
│ purchase_date    │   │
│ purchase_price   │   │
│ is_for_resale    │   │
│ is_active        │   │
│ registered_at    │   │
│ updated_at       │   │
└──┬───┬───┬───────┘   │
   │   │   │            │
   │   │   │            │
   │   │   │ has many   │
   │   │   ▼ N          │
   │   │  ┌─────────────────────────┐
   │   │  │      CAR_IMAGES         │
   │   │  │─────────────────────────│
   │   │  │ id (PK)                 │
   │   │  │ car_id (FK) ────────────┤
   │   │  │ image_category (ENUM)   │
   │   │  │ image_url               │
   │   │  │ thumbnail_url           │
   │   │  │ cloudinary_public_id    │
   │   │  │ file_size, file_type    │
   │   │  │ version                 │
   │   │  │ is_current              │
   │   │  │ is_permanent            │
   │   │  │ has_damage_detected     │
   │   │  │ damage_detection_data   │
   │   │  │ uploaded_at             │
   │   │  └─────────────────────────┘
   │   │
   │   │ has many
   │   ▼ N
   │  ┌──────────────────────────┐
   │  │     CAR_LISTINGS         │
   │  │──────────────────────────│
   │  │ id (PK)                  │
   │  │ car_id (FK) ─────────────┤ from USER_CARS
   │  │ user_id (FK) ────────────┤ from USERS
   │  │ asking_price             │
   │  │ title, description       │
   │  │ is_negotiable            │
   │  │ listing_status (ENUM)    │
   │  │ view_count               │
   │  │ listed_at, updated_at    │
   │  │ sold_at                  │
   │  └──────────────────────────┘
   │
   │ has many
   ▼ N
┌──────────────────────────┐
│        RENTALS           │
│──────────────────────────│
│ id (PK)                  │
│ car_id (FK) ─────────────┤ from USER_CARS
│ user_id (FK) ────────────┤ from USERS (owner)
│ renter_name              │
│ renter_phone, email,cnic │
│ start_date, end_date     │
│ actual_return_date       │
│ mileage_at_start/end     │
│ pre/post_rental_notes    │
│ damage_charges           │
│ damage_description       │
│ rental_price             │
│ total_charges            │
│ status (ENUM)            │
│ pre/post_inspection_ver  │
│ created_at, updated_at   │
└──────────────────────────┘

        ┌──────────────────────────┐
        │     NOTIFICATIONS        │
        │──────────────────────────│
USERS──►│ id (PK)                  │
1:N     │ user_id (FK)             │
        │ title, message           │
        │ type (ENUM)              │
        │ is_read                  │
        │ action_url               │
        │ metadata (JSON)          │
        │ created_at               │
        └──────────────────────────┘
```

---

## 2. Enums

### 2.1 AccountType
| Value | Description |
|-------|-------------|
| `INDIVIDUAL` | Regular user — can register cars, list for sale, run detection |
| `CAR_RENTAL` | Business user — has all Individual features + rental management |
| `ADMIN` | Platform admin — manages catalog, users, verifications |

### 2.2 AccountStatus
| Value | Description |
|-------|-------------|
| `ACTIVE` | Normal active account |
| `SUSPENDED` | Account suspended by admin (cannot login) |
| `DELETED` | Soft-deleted account |

### 2.3 CarCondition
| Value | Description |
|-------|-------------|
| `NEW` | Brand new car |
| `USED` | Pre-owned in working condition |
| `DAMAGED` | Car with known damage |

### 2.4 ListingStatus
| Value | Description |
|-------|-------------|
| `ACTIVE` | Live on marketplace |
| `SOLD` | Marked as sold |
| `PENDING` | Under review |
| `INACTIVE` | Deactivated by owner |

### 2.5 ImageCategory
| Value | Description |
|-------|-------------|
| `REGISTRATION_FRONT` | Permanent front image (at registration) |
| `REGISTRATION_BACK` | Permanent back image |
| `REGISTRATION_LEFT` | Permanent left image |
| `REGISTRATION_RIGHT` | Permanent right image |
| `PERIODIC_FRONT` | Versioned periodic front inspection |
| `PERIODIC_BACK` | Versioned periodic back inspection |
| `PERIODIC_LEFT` | Versioned periodic left inspection |
| `PERIODIC_RIGHT` | Versioned periodic right inspection |
| `DAMAGE_DETECTION` | AI-annotated damage detection output |
| `LISTING_IMAGE` | Image uploaded for marketplace listing |

### 2.6 RentalStatus
| Value | Description |
|-------|-------------|
| `ACTIVE` | Car is currently rented out |
| `COMPLETED` | Rental completed, car returned |
| `CANCELLED` | Rental was cancelled |

### 2.7 NotificationType
| Value | Description |
|-------|-------------|
| `INFO` | Informational notification |
| `WARNING` | Warning/attention needed |
| `SUCCESS` | Positive confirmation |
| `ERROR` | Something went wrong |
| `SYSTEM` | System/admin broadcast |

---

## 3. Tables

### 3.1 `users`

| Column | Prisma Field | Type | Constraints | Description |
|--------|-------------|------|-------------|-------------|
| id | id | UUID | PK, auto-generated | Unique identifier |
| email | email | String | UNIQUE, NOT NULL | Login email |
| password_hash | passwordHash | String? | Nullable | Bcrypt hash (null for OAuth-only users) |
| google_id | googleId | String? | UNIQUE | Google OAuth provider ID |
| facebook_id | facebookId | String? | UNIQUE | Facebook OAuth provider ID |
| account_type | accountType | AccountType | NOT NULL, default INDIVIDUAL | User role |
| account_status | accountStatus | AccountStatus | NOT NULL, default ACTIVE | Account state |
| full_name | fullName | String | NOT NULL | Display name |
| phone_number | phoneNumber | String? | Nullable | Contact phone |
| address | address | String? | Nullable | Street address |
| city | city | String? | Nullable | City (for marketplace filtering) |
| country | country | String? | Nullable | Country |
| postal_code | postalCode | String? | Nullable | ZIP/postal |
| business_name | businessName | String? | Nullable | For CAR_RENTAL accounts |
| business_license | businessLicense | String? | Nullable | License number |
| cnic_image_url | cnicImageUrl | String? | Nullable | Cloudinary URL of CNIC photo |
| is_verified | isVerified | Boolean | NOT NULL, default false | Admin-verified CNIC status |
| avatar_url | avatarUrl | String? | Nullable | Profile picture URL |
| refresh_token | refreshToken | String? | Nullable | JWT refresh token |
| created_at | createdAt | DateTime | NOT NULL, auto | Registration timestamp |
| updated_at | updatedAt | DateTime | NOT NULL, auto-update | Last modification |
| last_login | lastLogin | DateTime? | Nullable | Last login timestamp |

**Indexes:** `email`, `account_type`, `account_status`

---

### 3.2 `car_catalog`

| Column | Prisma Field | Type | Constraints | Description |
|--------|-------------|------|-------------|-------------|
| id | id | UUID | PK | Unique identifier |
| manufacturer | manufacturer | String | NOT NULL | e.g., Toyota, Honda |
| model_name | modelName | String | NOT NULL | e.g., Corolla, Civic |
| year | year | Int | NOT NULL | Model year |
| variant | variant | String? | Nullable | e.g., GLi, VTi |
| body_type | bodyType | String? | Nullable | Sedan, SUV, Hatchback |
| fuel_type | fuelType | String? | Nullable | Petrol, Diesel, Hybrid |
| transmission | transmission | String? | Nullable | Manual, Automatic, CVT |
| engine_capacity | engineCapacity | String? | Nullable | e.g., 1800cc |
| seating_capacity | seatingCapacity | Int? | Nullable | Number of seats |
| base_price | basePrice | Decimal(12,2) | NOT NULL | Base MSRP in PKR |
| currency | currency | String | NOT NULL, default "PKR" | Currency code |
| description | description | String? | Nullable | General description |
| features | features | JSON? | Nullable | Array of feature strings |
| is_active | isActive | Boolean | NOT NULL, default true | Catalog active flag |
| created_at | createdAt | DateTime | NOT NULL, auto | Created timestamp |
| updated_at | updatedAt | DateTime | NOT NULL, auto-update | Updated timestamp |

**Indexes:** `manufacturer`, `model_name`, `year`, `is_active`

---

### 3.3 `car_catalog_images`

| Column | Prisma Field | Type | Constraints | Description |
|--------|-------------|------|-------------|-------------|
| id | id | UUID | PK | Unique identifier |
| catalog_id | catalogId | UUID | FK → car_catalog.id, CASCADE | Parent catalog entry |
| image_url | imageUrl | String | NOT NULL | Cloudinary URL |
| image_order | imageOrder | Int | NOT NULL, default 0 | Display order |
| is_primary | isPrimary | Boolean | NOT NULL, default false | Primary display image |
| alt_text | altText | String? | Nullable | Accessibility text |
| uploaded_at | uploadedAt | DateTime | NOT NULL, auto | Upload timestamp |

**Indexes:** `catalog_id`  
**On Delete:** CASCADE (deleting catalog entry removes images)

---

### 3.4 `user_cars`

| Column | Prisma Field | Type | Constraints | Description |
|--------|-------------|------|-------------|-------------|
| id | id | UUID | PK | Unique identifier |
| user_id | userId | UUID | FK → users.id, CASCADE | Owner |
| catalog_id | catalogId | UUID? | FK → car_catalog.id, SET NULL | Optional catalog link |
| registration_number | registrationNumber | String | UNIQUE, NOT NULL | e.g., LEA-1234 |
| vin_number | vinNumber | String? | Nullable | Vehicle identification |
| manufacturer | manufacturer | String | NOT NULL | Denormalized from catalog |
| model_name | modelName | String | NOT NULL | Denormalized from catalog |
| year | year | Int | NOT NULL | Denormalized from catalog |
| variant | variant | String? | Nullable | Denormalized from catalog |
| color | color | String? | Nullable | Car color |
| mileage | mileage | Int? | Nullable | Kilometers driven |
| condition | condition | CarCondition | NOT NULL, default USED | Physical condition |
| purchase_date | purchaseDate | DateTime? | Nullable | When user bought it |
| purchase_price | purchasePrice | Decimal(12,2)? | Nullable | What user paid (PKR) |
| is_for_resale | isForResale | Boolean | NOT NULL, default false | Listed for sale flag |
| is_active | isActive | Boolean | NOT NULL, default true | Soft-delete flag |
| registered_at | registeredAt | DateTime | NOT NULL, auto | Registration timestamp |
| updated_at | updatedAt | DateTime | NOT NULL, auto-update | Updated timestamp |

**Indexes:** `user_id`, `registration_number`, `is_for_resale`, `is_active`

**Design Note:** `manufacturer`, `modelName`, `year`, `variant` are denormalized from `car_catalog` into `user_cars`. This ensures car data persists even if the catalog entry changes or is deleted.

---

### 3.5 `car_images`

| Column | Prisma Field | Type | Constraints | Description |
|--------|-------------|------|-------------|-------------|
| id | id | UUID | PK | Unique identifier |
| car_id | carId | UUID | FK → user_cars.id, CASCADE | Parent car |
| image_category | imageCategory | ImageCategory | NOT NULL | Which type of image |
| image_url | imageUrl | String | NOT NULL | Full-size Cloudinary URL |
| thumbnail_url | thumbnailUrl | String? | Nullable | Smaller preview URL |
| cloudinary_public_id | cloudinaryPublicId | String? | Nullable | For Cloudinary management |
| file_size | fileSize | Int? | Nullable | Size in bytes |
| file_type | fileType | String? | Nullable | jpg, png, webp |
| version | version | Int | NOT NULL, default 1 | Inspection version number |
| is_current | isCurrent | Boolean | NOT NULL, default true | Is this the latest version? |
| is_permanent | isPermanent | Boolean | NOT NULL, default false | Registration images = true |
| has_damage_detected | hasDamageDetected | Boolean | NOT NULL, default false | YOLOv8 found damage? |
| damage_detection_data | damageDetectionData | JSON? | Nullable | Full YOLOv8 results |
| uploaded_at | uploadedAt | DateTime | NOT NULL, auto | Upload timestamp |

**Indexes:** `car_id`, `image_category`, `is_current`, `is_permanent`

**`damage_detection_data` JSON Structure:**
```json
{
  "detections": [
    {
      "type": "dent",
      "confidence": 0.95,
      "bbox": [x1, y1, x2, y2],
      "area": 1250
    },
    {
      "type": "scratch",
      "confidence": 0.87,
      "bbox": [x1, y1, x2, y2],
      "area": 800
    }
  ],
  "annotatedImageUrl": "https://cloudinary.com/.../annotated.jpg",
  "processingTime": 1.23,
  "modelVersion": "yolov8n-damage-v2"
}
```

---

### 3.6 `car_listings`

| Column | Prisma Field | Type | Constraints | Description |
|--------|-------------|------|-------------|-------------|
| id | id | UUID | PK | Unique identifier |
| car_id | carId | UUID | FK → user_cars.id, CASCADE | Listed car |
| user_id | userId | UUID | FK → users.id, CASCADE | Listing owner |
| asking_price | askingPrice | Decimal(12,2) | NOT NULL | Asking price in PKR |
| currency | currency | String | NOT NULL, default "PKR" | Currency code |
| title | title | String | NOT NULL | Listing headline |
| description | description | String? | Nullable | Full description |
| is_negotiable | isNegotiable | Boolean | NOT NULL, default true | Open to negotiation |
| listing_status | listingStatus | ListingStatus | NOT NULL, default ACTIVE | Current status |
| view_count | viewCount | Int | NOT NULL, default 0 | Times viewed |
| listed_at | listedAt | DateTime | NOT NULL, auto | When listed |
| updated_at | updatedAt | DateTime | NOT NULL, auto-update | Last modified |
| sold_at | soldAt | DateTime? | Nullable | When marked as sold |

**Indexes:** `listing_status`, `user_id`, `car_id`, `asking_price`

---

### 3.7 `rentals`

| Column | Prisma Field | Type | Constraints | Description |
|--------|-------------|------|-------------|-------------|
| id | id | UUID | PK | Unique identifier |
| car_id | carId | UUID | FK → user_cars.id, CASCADE | Rented car |
| user_id | userId | UUID | FK → users.id, CASCADE | Rental business owner |
| renter_name | renterName | String | NOT NULL | Person renting the car |
| renter_phone | renterPhone | String? | Nullable | Renter phone |
| renter_email | renterEmail | String? | Nullable | Renter email |
| renter_cnic | renterCnic | String? | Nullable | Renter CNIC number |
| start_date | startDate | DateTime | NOT NULL | Rental start |
| end_date | endDate | DateTime | NOT NULL | Expected return date |
| actual_return_date | actualReturnDate | DateTime? | Nullable | Actual return (set on complete) |
| mileage_at_start | mileageAtStart | Int? | Nullable | Odometer reading at pickup |
| mileage_at_end | mileageAtEnd | Int? | Nullable | Odometer reading at return |
| pre_rental_notes | preRentalNotes | String? | Nullable | Condition notes before rental |
| post_rental_notes | postRentalNotes | String? | Nullable | Condition notes after return |
| damage_charges | damageCharges | Decimal(12,2)? | Nullable | Extra charges for damage |
| damage_description | damageDescription | String? | Nullable | Description of damage found |
| rental_price | rentalPrice | Decimal(12,2) | NOT NULL | Base rental rate |
| total_charges | totalCharges | Decimal(12,2)? | Nullable | rental_price + damage_charges |
| currency | currency | String | NOT NULL, default "PKR" | Currency code |
| status | status | RentalStatus | NOT NULL, default ACTIVE | Current rental state |
| pre_inspection_version | preInspectionVersion | Int? | Nullable | car_images version before rental |
| post_inspection_version | postInspectionVersion | Int? | Nullable | car_images version after return |
| created_at | createdAt | DateTime | NOT NULL, auto | Record created |
| updated_at | updatedAt | DateTime | NOT NULL, auto-update | Last modified |

**Indexes:** `car_id`, `user_id`, `status`, `start_date`

---

### 3.8 `notifications`

| Column | Prisma Field | Type | Constraints | Description |
|--------|-------------|------|-------------|-------------|
| id | id | UUID | PK | Unique identifier |
| user_id | userId | UUID | FK → users.id, CASCADE | Notification recipient |
| title | title | String | NOT NULL | Notification headline |
| message | message | String | NOT NULL | Full message text |
| type | type | NotificationType | NOT NULL, default INFO | Notification category |
| is_read | isRead | Boolean | NOT NULL, default false | Read status |
| action_url | actionUrl | String? | Nullable | Deep link within app |
| metadata | metadata | JSON? | Nullable | Extra context data |
| created_at | createdAt | DateTime | NOT NULL, auto | Created timestamp |

**Indexes:** `user_id`, `is_read`, `created_at`

**`metadata` JSON Examples:**
```json
// CNIC verification
{ "verificationType": "approved" }

// Listing inquiry
{ "listingId": "uuid", "buyerName": "Hassan Ali" }

// Rental event
{ "rentalId": "uuid", "carId": "uuid", "totalCharges": 20000 }
```

---

## 4. Relationships Deep Dive

### 4.1 Relationship Map

| Parent | Child | Type | FK Column | On Delete |
|--------|-------|------|-----------|-----------|
| users | user_cars | 1:N | user_id | CASCADE |
| users | car_listings | 1:N | user_id | CASCADE |
| users | rentals | 1:N | user_id | CASCADE |
| users | notifications | 1:N | user_id | CASCADE |
| car_catalog | car_catalog_images | 1:N | catalog_id | CASCADE |
| car_catalog | user_cars | 1:N | catalog_id | SET NULL |
| user_cars | car_images | 1:N | car_id | CASCADE |
| user_cars | car_listings | 1:N | car_id | CASCADE |
| user_cars | rentals | 1:N | car_id | CASCADE |

### 4.2 CASCADE Delete Chains

When a **User is deleted:**
```
User DELETE
  ├── user_cars CASCADE
  │    ├── car_images CASCADE
  │    ├── car_listings CASCADE
  │    └── rentals CASCADE
  ├── car_listings CASCADE (direct)
  ├── rentals CASCADE (direct)
  └── notifications CASCADE
```

When a **Car Catalog entry is deleted:**
```
CarCatalog DELETE
  ├── car_catalog_images CASCADE
  └── user_cars.catalog_id SET NULL
      (user_cars record preserved, just unlinked)
```

When a **UserCar is deleted:**
```
UserCar DELETE
  ├── car_images CASCADE (all images deleted)
  ├── car_listings CASCADE (all listings removed)
  └── rentals CASCADE (all rental records removed)
```

### 4.3 Why Denormalization?

The `user_cars` table stores `manufacturer`, `modelName`, `year`, and `variant` directly even though they exist in `car_catalog`. This is intentional:

1. **Data preservation**: If admin edits/deletes a catalog entry, user car records are unaffected
2. **Query performance**: No need to JOIN with car_catalog for basic car listings
3. **Historical accuracy**: The car model at registration time is preserved

---

## 5. Indexes

### 5.1 Complete Index List

| Table | Column(s) | Type | Purpose |
|-------|-----------|------|---------|
| users | email | UNIQUE | Login lookup |
| users | google_id | UNIQUE | OAuth lookup |
| users | facebook_id | UNIQUE | OAuth lookup |
| users | account_type | INDEX | Filter by role |
| users | account_status | INDEX | Filter by status |
| car_catalog | manufacturer | INDEX | Filter marketplace |
| car_catalog | model_name | INDEX | Filter marketplace |
| car_catalog | year | INDEX | Year range filter |
| car_catalog | is_active | INDEX | Active catalog only |
| car_catalog_images | catalog_id | INDEX | Image lookup |
| user_cars | user_id | INDEX | User's cars |
| user_cars | registration_number | UNIQUE | Uniqueness check |
| user_cars | is_for_resale | INDEX | Marketplace filter |
| user_cars | is_active | INDEX | Active cars only |
| car_images | car_id | INDEX | Car's images |
| car_images | image_category | INDEX | Category filter |
| car_images | is_current | INDEX | Latest version |
| car_images | is_permanent | INDEX | Registration images |
| car_listings | listing_status | INDEX | Active listings |
| car_listings | user_id | INDEX | User's listings |
| car_listings | car_id | INDEX | Car's listing |
| car_listings | asking_price | INDEX | Price sorting |
| rentals | car_id | INDEX | Car's rentals |
| rentals | user_id | INDEX | Business's rentals |
| rentals | status | INDEX | Status filter |
| rentals | start_date | INDEX | Date filter |
| notifications | user_id | INDEX | User's notifications |
| notifications | is_read | INDEX | Unread filter |
| notifications | created_at | INDEX | Chronological sort |

---

## 6. Query Patterns

### 6.1 Common Prisma Queries

**Get user with all cars and listings:**
```typescript
prisma.user.findUnique({
  where: { id: userId },
  include: {
    cars: {
      include: {
        images: { where: { isCurrent: true } },
        listings: true,
      },
    },
  },
});
```

**Marketplace search with filters:**
```typescript
prisma.carListing.findMany({
  where: {
    listingStatus: 'ACTIVE',
    askingPrice: { gte: minPrice, lte: maxPrice },
    car: {
      manufacturer: { contains: manufacturer, mode: 'insensitive' },
      year: { gte: minYear, lte: maxYear },
      condition: condition,
    },
  },
  include: {
    car: {
      include: {
        images: { where: { imageCategory: 'LISTING_IMAGE' } },
      },
    },
    user: { select: { fullName: true, city: true } },
  },
  orderBy: { askingPrice: 'asc' },
  skip: (page - 1) * limit,
  take: limit,
});
```

**Get latest periodic images for damage detection:**
```typescript
// Find max version
const maxVersion = await prisma.carImage.aggregate({
  where: { carId, imageCategory: { startsWith: 'PERIODIC' } },
  _max: { version: true },
});

// Get images at that version
prisma.carImage.findMany({
  where: {
    carId,
    version: maxVersion._max.version,
    imageCategory: { startsWith: 'PERIODIC' },
  },
});
```

**Admin platform stats (aggregated):**
```typescript
const [userStats, carStats, listingStats, rentalStats] = await Promise.all([
  prisma.user.groupBy({
    by: ['accountType'],
    _count: { id: true },
  }),
  prisma.userCar.count({ where: { isActive: true } }),
  prisma.carListing.groupBy({
    by: ['listingStatus'],
    _count: { id: true },
  }),
  prisma.rental.groupBy({
    by: ['status'],
    _count: { id: true },
    _sum: { totalCharges: true },
  }),
]);
```

**Rental revenue aggregation:**
```typescript
prisma.rental.aggregate({
  where: {
    userId: businessUserId,
    status: 'COMPLETED',
    createdAt: { gte: startOfMonth, lte: endOfMonth },
  },
  _sum: { rentalPrice: true, damageCharges: true, totalCharges: true },
  _count: { id: true },
  _avg: { rentalPrice: true },
});
```

---

## 7. Migration Notes

### 7.1 Prisma v7 Configuration

Prisma v7 does **not** use `url` in the datasource block. The database URL is configured in `prisma.config.ts`:

```typescript
// prisma/prisma.config.ts
import path from 'node:path';
import type { PrismaConfig } from 'prisma';

export default {
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),
} satisfies PrismaConfig;
```

The `DATABASE_URL` is read from `.env` and passed at runtime.

### 7.2 Running Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name init

# Reset database (DESTRUCTIVE)
npx prisma migrate reset

# Deploy to production
npx prisma migrate deploy

# View current migration status
npx prisma migrate status
```

### 7.3 Seeding

The seed script creates the initial admin account:

```bash
npx prisma db seed
```

Creates:
- **Email:** admin@carplatform.pk
- **Password:** Admin@123456
- **Type:** ADMIN
- **Status:** ACTIVE
- **Verified:** true

### 7.4 Data Types Reference

| Prisma Type | PostgreSQL Type | Notes |
|-------------|----------------|-------|
| String | TEXT | Variable-length text |
| Int | INTEGER | 32-bit integer |
| Boolean | BOOLEAN | true/false |
| DateTime | TIMESTAMP(3) | Millisecond precision |
| Decimal @db.Decimal(12,2) | NUMERIC(12,2) | For money (supports up to 9,999,999,999.99) |
| Json | JSONB | Binary JSON (queryable) |

---

*This document provides the complete database schema specification. Use it for database understanding, query building, and migration planning.*
