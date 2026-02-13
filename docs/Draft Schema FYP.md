# Database Schema Reference

## Car Damage Detection & Marketplace Platform

**Platform:** Car damage detection AI system with integrated marketplace for vehicle resale and rental management  
**Database:** PostgreSQL (Neon cloud hosting)  
**ORM:** Prisma v7  
**Environment:** Pakistan-focused (PKR currency, CNIC verification)

---

## 📋 Quick Navigation

- [Core Tables](#core-tables) — 8 main tables and their relationships
- [Enums](#enums) — Status types and categories
- [Key Design Decisions](#key-design-decisions) — Why tables are structured this way
- [Relationships](#relationships) — How tables connect
- [Performance Features](#performance-features) — Indexes and optimization
- [Row-Level Security](#row-level-security) — Data access control

**For detailed schema information, see:**
- [DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) — Complete ER diagram, field specs, and SQL migrations
- [BCNF.md](./BCNF.md) — Normalization analysis and design justification
- [complete flow.md](./complete flow.md) — User flows and data access permissions

---

## 🗂️ Core Tables

### 1. **users** — All platform accounts

Stores individual users, car rental businesses, and admins.

**Key Fields:**
- `user_id` (UUID, PK) — Unique identifier
- `email` (VARCHAR, UNIQUE) — Login credential
- `account_type` — individual | car_rental | admin
- `account_status` — active | suspended | deleted
- `business_name`, `business_license` — For rental companies only

**Indexes:** email, account_type

---

### 2. **car_catalog** — Reference catalog of car models

Admin-maintained catalog of available new car models with specifications and pricing.

**Key Fields:**
- `catalog_id` (UUID, PK)
- `manufacturer`, `model_name`, `year`, `variant` — Car identification
- `body_type`, `fuel_type`, `transmission`, `engine_capacity` — Specs
- `base_price` (PKR) — MSRP
- `features` (JSONB) — Array of features

**Purpose:** Single source of truth for car models. Users reference this when registering existing cars.

**Indexes:** manufacturer, model_name, year, active status

---

### 3. **car_catalog_images** — Catalog stock photos

Professional marketing images for each car model in catalog.

**Key Fields:**
- `image_id` (UUID, PK)
- `catalog_id` (FK to car_catalog)
- `image_url`, `image_order`, `is_primary`

---

### 4. **user_cars** — Actual cars owned by users

Specific car instances owned by individual users or rental businesses.

**Key Fields:**
- `car_id` (UUID, PK)
- `user_id` (FK) — Owner
- `catalog_id` (FK, optional) — Links to reference model
- `registration_number` (VARCHAR, UNIQUE) — License plate
- `vin_number` — Vehicle ID
- `color`, `mileage`, `condition` — Current state
- `purchase_date`, `purchase_price` — Ownership info
- `is_for_resale` — Listed on marketplace?

**Note:** Can include custom cars not in catalog (old/rare vehicles)

**Indexes:** user_id, registration_number, resale status

---

### 5. **car_images** ⭐ **CRITICAL** — All car photos

**PERMANENT** registration images (baseline condition) + **OVERWRITABLE** periodic inspection images.

**Key Fields:**
- `image_id` (UUID, PK)
- `car_id` (FK to user_cars)
- `image_category` — registration_front | registration_back | registration_left | registration_right | periodic_front | periodic_back | periodic_left | periodic_right | damage_detection | listing_image
- `image_url`, `thumbnail_url`
- `version` — Increments for periodic inspections
- `is_current` — Only latest inspection version is TRUE
- `is_permanent` — TRUE for registration (locked), FALSE for periodic (overwritable)
- `has_damage_detected` — YOLOv8 analysis performed?
- `damage_detection_data` (JSONB) — Bounding boxes, confidence scores, severity

**Critical Behavior:**
- **Registration images** (4 photos): Uploaded at car registration, CANNOT be changed, CANNOT be deleted, serve as baseline
- **Periodic images**: Version 1, 2, 3... Only version N marked `is_current=TRUE`
- **Damage detection**: AI results stored in damage_detection_data JSON

**Indexes:** car_id, category, is_current, is_permanent

---

### 6. **car_listings** — Marketplace resale listings

Active and historical listings when users sell registered cars.

**Key Fields:**
- `listing_id` (UUID, PK)
- `car_id` (FK) — Car being sold
- `user_id` (FK) — Seller
- `asking_price` (PKR) — Listed price
- `title`, `description` — Listing text
- `is_negotiable` — Can price be negotiated?
- `listing_status` — active | sold | pending | inactive
- `view_count` — Analytics
- `listed_at`, `sold_at` — Timeline

**Indexes:** status, user_id, car_id, asking_price

---

### 7. **notifications** — User alerts

Event-driven notifications for users (future: email/push).

**Key Fields (Optional):**
- `notification_id` (UUID, PK)
- `user_id` (FK)
- `type` — listing_view | inquiry | damage_detected | inspection_due | rental_return
- `data` (JSONB) — Event-specific data
- `is_read`

---

### 8. **rentals** — Rental transactions (Future expansion)

For car rental businesses to track rental contracts.

**Planned Fields:**
- `rental_id` (UUID, PK)
- `car_id` (FK) — Car being rented
- `user_id` (FK) — Customer renting
- `start_date`, `end_date` — Rental period
- `rental_status` — active | completed | cancelled
- `mileage_start`, `mileage_end` — Track distance
- `damage_charges` (PKR) — If car damaged during rental

---

## 📌 Enums

### **user_account_type**
- `individual` — Personal car owner
- `car_rental` — Business renting fleet
- `admin` — System administrator

### **account_status**
- `active` — Account operational
- `suspended` — Temporarily disabled
- `deleted` — Soft-deleted

### **car_condition**
- `new` — Brand new
- `used` — Used but functional
- `damaged` — Known damage

### **listing_status**
- `active` — Publicly visible
- `sold` — Transaction complete
- `pending` — Under negotiation
- `inactive` — Hidden from marketplace

### **image_category**
- `registration_*` (4 values) — Permanent baseline photos
- `periodic_*` (4 values) — Versioned inspection photos
- `damage_detection` — AI analysis images
- `listing_image` — Additional marketplace photos

### **rental_status** (Future)
- `pending` — Awaiting confirmation
- `active` — In progress
- `completed` — Finished
- `cancelled` — Aborted

---

## 🎯 Key Design Decisions

### Why Two Car Tables? (car_catalog vs. user_cars)

**car_catalog** (6 entries)
- Admin-maintained reference data
- Generic specifications (Toyota Corolla 2024 Altis)
- MSRP pricing
- Used for browsing/comparison

**user_cars** (12,000+ entries)
- User-owned instances
- Specific details (Ahmed's white Corolla, 25,000 km, purchased for 5.8M)
- Actual purchase price
- Registration ID, VIN, mileage

**Result:** No data duplication, flexibility for custom cars, easy model updates

---

### Why Two Image Tables? (car_catalog_images vs. car_images)

**car_catalog_images** (4 per model)
- Professional stock photos
- Show ideal/new condition
- Static reference

**car_images** (100+ per user car)
- User's actual car photos
- Track degradation over time
- Permanent baseline + versioned inspections
- Damage detection results

**Result:** Buyers see car history, transparency on condition, no hiding defects

---

### Why Immutable Registration Images?

**Design Principle:** Legal baseline for condition verification

1. **First 4 photos** (registration_front/back/left/right) are locked at registration
2. Cannot be deleted, cannot be edited, cannot be replaced
3. Act as "as-is" proof at time of ownership
4. When selling, buyers compare registration (original) vs. latest periodic (current)
5. Prevents fraud (hiding damage history)

---

### Why Versioned Periodic Images?

**Design Principle:** Track condition degradation over time

1. First inspection → version=1, is_current=TRUE
2. Second inspection (1 month later):
   - Old images → version=1, is_current=FALSE (archived)
   - New images → version=2, is_current=TRUE
3. User can see complete timeline
4. Damage detection runs on each version
5. Buyers see full vehicle history when checking listings

---

### Why JSONB for damage_detection_data?

**Flexibility for AI results:**
```json
{
  "model_version": "yolov8n",
  "timestamp": "2026-02-05T10:30:00Z",
  "damages": [
    {
      "type": "dent",
      "confidence": 0.89,
      "bbox": [120, 45, 200, 180],
      "severity": "moderate"
    }
  ]
}
```

Allows updating schema without database migrations.

---

## 🔗 Relationships

### **One-to-Many Relationships**

```
users (1) ─────┬─────────→ (∞) user_cars
               ├─────────→ (∞) car_listings
               └─────────→ (∞) notifications

car_catalog (1) ─┬──────→ (∞) car_catalog_images
                 └──────→ (∞) user_cars (optional)

user_cars (1) ───┬──────→ (∞) car_images
                 ├──────→ (∞) car_listings
                 └──────→ (∞) rentals (future)
```

### **Cascade Rules**

- `users` deleted → cascades to user_cars, car_listings, notifications
- `user_cars` deleted → cascades to car_images, car_listings, rentals
- `car_catalog` deleted → car_catalog_images deleted (but doesn't affect user_cars)

---

## ⚡ Performance Features

### **Indexes by Use Case**

| Use Case | Indexes |
|----------|---------|
| **Search catalog** | manufacturer, model_name, year, is_active |
| **Find user cars** | user_id, registration_number |
| **Browse marketplace** | listing_status, asking_price |
| **Track images** | car_id, image_category, is_current |
| **User login** | email (unique) |
| **Resale tracking** | is_for_resale, user_id |

### **Query Optimization**

```sql
-- Fast: Find active listings by price range
SELECT * FROM car_listings
WHERE listing_status = 'active' 
  AND asking_price BETWEEN 2000000 AND 5000000
ORDER BY asking_price;
-- Uses: idx_listings_status, idx_listings_price

-- Fast: Get all images for current inspection
SELECT * FROM car_images
WHERE car_id = $1 
  AND image_category LIKE 'periodic%'
  AND is_current = TRUE;
-- Uses: idx_car_images_car, idx_car_images_current, idx_car_images_category
```

---

## 🔒 Row-Level Security

Database enforces data privacy (for Supabase/PostgreSQL with RLS):

| Policy | Access |
|--------|--------|
| **users_select_own** | Users see only own profile |
| **user_cars_select_own** | Users see only own cars |
| **car_images_select_own** | Users see only their car images |
| **car_listings_select_public** | Everyone sees active listings |
| **car_listings_manage_own** | Users edit only own listings |

---

## 📊 Audit & Compliance

### **Timestamp Tracking**
All tables include:
- `created_at` — Record creation
- `updated_at` — Last modification (automatic trigger)
- `last_login` (users only) — For activity tracking

### **Immutable Records**
- Registration images cannot be changed (legal requirement)
- Damage reports cannot be deleted (consumer protection)
- Rental history preserved (business audit)

### **Data Retention**
- Deleted users → soft-delete (account_status = 'deleted'), not removed
- Periodic images → archived (is_current = FALSE), not deleted
- Listings → marked as 'sold'/'inactive', not removed

---

## 🚀 Migration & Deployment

For complete migration commands and Prisma setup, see:

- [DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) — Full ER diagram and migration guide
- Backend source code: `/backend/prisma/schema.prisma`

**Quick Start:**
```bash
# Apply migrations to development database
prisma migrate dev

# Apply migrations to production (Neon)
prisma migrate deploy

# View database in UI
prisma studio
```

---

## 📚 Related Documentation

| Document | Purpose |
|----------|---------|
| [DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) | Complete ER diagram, field specifications, SQL |
| [BCNF.md](./BCNF.md) | Database normalization analysis (all tables in BCNF) |
| [complete flow.md](./complete flow.md) | User flows and permission matrix by role |
| [API_REFERENCE.md](./docs/API_REFERENCE.md) | All 52 API endpoints with examples |
| [USER_FLOWS.md](./docs/USER_FLOWS.md) | Step-by-step user journeys |

---

**Last Updated:** February 2026  
**Version:** 1.0 (Production Ready)  
**Status:** ✅ All tables in BCNF, indexes optimized, RLS policies active

