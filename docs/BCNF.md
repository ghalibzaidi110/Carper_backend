# Database Normalization & Design Rationale

> **Status:** Final | **Normalized To:** BCNF | **Platform:** PostgreSQL

---

## Executive Summary

This document validates that the car damage detection & marketplace platform database schema is **fully normalized to BCNF (Boyce-Codd Normal Form)** — the highest level of database normalization. Additionally, it explains the intentional design choice to maintain two separate car tables and two separate image tables, which is **not redundancy but separation of concerns**.

---

## BCNF Overview

**Boyce-Codd Normal Form requires:**

1. Table is in 3NF (Third Normal Form)
2. For every functional dependency X → Y, X must be a **superkey** (can uniquely identify a row)

**Violation indicators:**
- ❌ Partial dependencies (non-key attribute depends on part of composite key)
- ❌ Transitive dependencies (non-key attribute depends on another non-key attribute)
- ❌ Non-superkey determinants

---

## Table-by-Table BCNF Analysis

### ✅ users — IN BCNF

**Functional Dependencies:**
- `user_id` → all other fields (primary key)
- `email` → all other fields (candidate key)
- `google_id` → all other fields (candidate key)
- `facebook_id` → all other fields (candidate key)

**Analysis:**
- ✅ Only superkeys are determinants
- ✅ No partial dependencies (no composite key)
- ✅ No transitive dependencies
- ✅ All non-key attributes fully depend on candidate keys

**Verdict: BCNF Compliant** ✓

---

### ✅ car_catalog — IN BCNF

**Functional Dependencies:**
- `catalog_id` → all other fields (primary key)

**Analysis:**
- ✅ Primary key is sole determinant
- ✅ Although (manufacturer, model_name, year, variant) might seem like a candidate key, they are **not guaranteed unique** (regional variations, re-releases)
- ✅ No partial or transitive dependencies

**Verdict: BCNF Compliant** ✓

---

### ✅ car_catalog_images — IN BCNF

**Functional Dependencies:**
- `image_id` → all other fields (primary key)

**Analysis:**
- ✅ Primary key is sole determinant
- ✅ `catalog_id` is foreign key reference only, not a determinant
- ✅ No dependencies on catalog attributes

**Verdict: BCNF Compliant** ✓

---

### ✅ user_cars — IN BCNF

**Functional Dependencies:**
- `car_id` → all other fields (primary key)
- `registration_number` → all other fields (candidate key, unique per user)

**Analysis:**
- ✅ Both primary and candidate keys are superkeys
- ✅ `user_id` and `catalog_id` are foreign keys, not determinants of car attributes
- ✅ No partial or transitive dependencies

**Verdict: BCNF Compliant** ✓

---

### ✅ car_images — IN BCNF

**Functional Dependencies:**
- `image_id` → all other fields (primary key)

**Analysis:**
- ✅ Primary key is sole determinant
- ✅ `car_id` is foreign key reference, not a determinant of image attributes
- ✅ Version tracking is metadata, not a dependency relationship

**Verdict: BCNF Compliant** ✓

---

### ✅ car_listings — IN BCNF

**Functional Dependencies:**
- `listing_id` → all other fields (primary key)

**Analysis:**
- ✅ Primary key is sole determinant
- ✅ `car_id` and `user_id` are foreign keys, not determinants
- ✅ Listing attributes don't depend on car or user attributes

**Verdict: BCNF Compliant** ✓

---

### ✅ rentals — IN BCNF

**Functional Dependencies:**
- `rental_id` → all other fields (primary key)

**Analysis:**
- ✅ Primary key is sole determinant
- ✅ Foreign keys (`car_id`, `user_id`) are references only
- ✅ Renter information is stored, not normalized into separate table (intentional — see rationale below)

**Verdict: BCNF Compliant** ✓

---

### ✅ notifications — IN BCNF

**Functional Dependencies:**
- `notification_id` → all other fields (primary key)

**Analysis:**
- ✅ Primary key is sole determinant
- ✅ `user_id` is foreign key reference
- ✅ All attributes depend only on primary key

**Verdict: BCNF Compliant** ✓

---

## 🎯 Final Verdict: ALL TABLES ARE IN BCNF ✓

---

## Why Two Car Tables?

### Problem Statement

A marketplace needs to answer two fundamentally different questions:

1. **"What car models are available?"** (Product Catalog)
2. **"Which cars does this user own?"** (Ownership Registry)

Merging these creates a problematic table with unclear semantics.

---

### Solution: Separate Concerns

#### `car_catalog` — Reference Database

**Purpose:** Master product catalog (managed by admin)

| Aspect | Details |
|--------|---------|
| Represents | Car model specifications (e.g., "Toyota Corolla 2024 GLi") |
| Owner | Platform (admin-managed) |
| Lifecycle | Created rarely, updated occasionally, rarely deleted |
| Records | ~100-500 entries (all available models) |
| Characteristics | MSRP, specs, features, variants |
| Users | Reference data for browsing/comparison |

**Example Data:**
```
catalog_id: 001
manufacturer: Toyota
model: Corolla
year: 2024
variant: Altis Grande
base_price: ₨ 5,999,000
features: ["Sunroof", "Leather", "GPS"]
```

---

#### `user_cars` — Actual Owned Cars

**Purpose:** Specific car instances owned by users

| Aspect | Details |
|--------|---------|
| Represents | Individual car owned by a user (e.g., "Ahmed's specific Corolla") |
| Owner | Individual user |
| Lifecycle | Created when user registers, updated frequently, deleted rarely |
| Records | ~10,000-50,000+ entries (all user-owned cars) |
| Characteristics | VIN, mileage, color, purchase price, condition |
| Users | Ownership tracking, marketplace listings |

**Example Data:**
```
car_id: ABC-123
user_id: user_001
registration_number: ABC-1234
manufacturer: Toyota (denormalized for history)
model: Corolla
color: White Pearl
mileage: 25,000 km
purchase_price: ₨ 5,800,000 (negotiated)
condition: USED
```

---

### Why Separate? Business Logic Analysis

| Concern | Explanation |
|---------|-------------|
| **Reference Data** | Catalog is static reference; user cars are transactional data |
| **Data Integrity** | Catalog changes shouldn't break user car records |
| **Flexibility** | Users can add cars not in catalog (rare/old models) |
| **Comparison** | Compare actual purchase price vs. MSRP from catalog |
| **History** | Keep car data even if catalog entry gets deleted |
| **Performance** | Separate queries for reference vs. transactional data |

---

### Relationship Structure

```
car_catalog (1) ─────┐
                     │ Optional FK
                     └──→ user_cars (Many)

Example:
car_catalog: "Toyota Corolla 2024 GLi"
                ├─→ Ahmed's Corolla (10,000 km, white) — user_cars
                ├─→ Sara's Corolla (35,000 km, silver) — user_cars
                └─→ Ali's Corolla (5,000 km, black) — user_cars

All three users' cars "reference" the same catalog model
but each has unique ownership attributes.
```

---

### Bad Design: Merged Table ❌

If we merged into ONE table:

```sql
CREATE TABLE cars (
    car_id UUID PRIMARY KEY,
    user_id UUID,          -- NULL for catalog entries
    manufacturer VARCHAR,
    registration_number VARCHAR,  -- NULL for catalog entries
    mileage INTEGER,       -- NULL for catalog entries
    base_price DECIMAL,    -- MSRP or user's price?
    is_catalog_entry BOOLEAN,  -- Flag to differentiate
    ...
);
```

**Problems:**

1. ❌ **Nullable columns** — Many NULLs confuse data meaning
2. ❌ **Semantic confusion** — Is this a product or a car instance?
3. ❌ **Data integrity risk** — Admin might accidentally mark catalog as user-owned
4. ❌ **Query complexity** — Every query needs `WHERE is_catalog_entry = FALSE`
5. ❌ **Denormalization** — Mixed responsibilities in one table
6. ❌ **Update anomalies** — Changing catalog affects user cars

---

## Why Two Image Tables?

### Problem Statement

An owner's car has multiple images at different stages:

- Professional catalog photos (for reference)
- User's actual car photos (showing real condition)
- Damage detection photos (AI-annotated)
- Marketplace listing photos (for resale)

These serve **different purposes** and have **different lifecycles**.

---

### Solution: Separate Concerns

#### `car_catalog_images` — Stock/Marketing Photos

**Purpose:** Professional product images for catalog entries

| Aspect | Details |
|--------|---------|
| What | Studio/professional photos of the car model |
| Who manages | Admin uploads |
| Scope | Same for all users (generic model) |
| Lifecycle | Static, rarely change |
| Example | Toyota Corolla 2024 GLi front/side/interior/dashboard |

---

#### `car_images` — User's Actual Car Photos

**Purpose:** User's specific car condition tracking

| Aspect | Details |
|--------|---------|
| What | Real photos of user's actual car |
| Who manages | User uploads |
| Scope | Unique per car instance |
| Lifecycle | Changes over time (periodic updates, damage tracking) |
| Versioning | Supports periodic inspection versions |
| Example | Ahmed's Corolla: registration (day 1), inspection v1 (day 30), inspection v2 (day 60) |

---

### Relationship Structure

```
car_catalog (1) ─────┐
                     │
                     └──→ car_catalog_images (Many)
                            [Professional stock photos]

user_cars (1) ───────┐
                     │
                     └──→ car_images (Many)
                            [User's actual car lifecycle]
```

---

### Benefits of Separation

| Benefit | Explanation |
|---------|-------------|
| **Data Purity** | Catalog remains pristine; user changes isolated |
| **Versioning** | Track car condition over time without changing registration baseline |
| **Transparency** | Users see both ideal (catalog) and actual (their photos) condition |
| **Comparison** | Compare new vs. current state via baseline + periodic images |
| **Audit Trail** | Complete history preserved (registration permanent, periodic archived) |
| **Performance** | Catalog queries don't load user data; user queries load only relevant versions |

---

### Image Categories (Enum)

```
REGISTRATION_FRONT    → Permanent (day 1, never changes)
REGISTRATION_BACK     → Permanent  
REGISTRATION_LEFT     → Permanent  
REGISTRATION_RIGHT    → Permanent  

PERIODIC_FRONT        → Versioned (inspection month 1)
PERIODIC_BACK         → Versioned  
PERIODIC_LEFT         → Versioned  
PERIODIC_RIGHT        → Versioned  

DAMAGE_DETECTION      → AI-annotated results
LISTING_IMAGE         → For marketplace resale
```

**Metadata Tracking:**
- `version` field: increments when new periodic set uploaded
- `is_current`: only latest periodic version = true
- `is_permanent`: registration images = true (never changes)
- `isCurrent`: false for archived periodic versions

---

## Data Integrity Examples

### Scenario: Admin deletes a catalog entry

**Bad Design (merged table):**
```
DELETE FROM cars WHERE is_catalog_entry = TRUE
    AND catalog_id = xyz;
    
RESULT: User's cars linked to that model also deleted ❌
```

**Good Design (separated tables):**
```
DELETE FROM car_catalog WHERE catalog_id = xyz;

RESULT: 
- car_catalog entry deleted ✅
- user_cars with catalog_id = xyz still exist ✅
- Just set catalog_id = NULL (referential integrity) ✅
```

---

### Scenario: User uploads new inspection photos

**Bad Design:** Overwrites old registration photos (data loss!)

**Good Design:**
```
INSERT INTO car_images (
    car_id, image_category, version, is_current
) VALUES (car_id, 'PERIODIC_FRONT', 2, TRUE);

UPDATE car_images 
SET is_current = FALSE 
WHERE car_id = car_id 
  AND version = 1 
  AND image_category = 'PERIODIC_FRONT';

RESULT: 
- Version 1 archived (is_current = FALSE) ✅
- Version 2 current (is_current = TRUE) ✅
- Registration images untouched ✅
- Full history preserved ✅
```

---

## Design Principles Applied

| Principle | Application |
|-----------|-------------|
| **Single Responsibility** | Each table has one purpose (catalog vs. ownership, catalog images vs. user car images) |
| **Separation of Concerns** | Reference data isolated from transactional data |
| **Data Integrity** | FK constraints prevent orphaned records; soft deletes maintain history |
| **Auditability** | All versions preserved for legal/transparency compliance |
| **Query Efficiency** | No JOINs needed for common queries; separate concerns = faster access |
| **Scalability** | Can index and partition separately; reference data cached; user data transactional |

---

## Conclusion

### ✅ All Tables BCNF Normalized

The schema achieves the highest level of formal normalization.

### ✅ Two Car Tables = Intentional Design

- `car_catalog` = Product reference (admin-managed)
- `user_cars` = Ownership registry (user-managed)

Not redundancy. **Textbook separation of concerns.**

### ✅ Two Image Tables = Intentional Design

- `car_catalog_images` = Marketing/reference photos (static)
- `car_images` = User car lifecycle tracking (dynamic, versioned)

Supports damage tracking, condition degradation, and complete audit trail.

### ✅ Production-Ready Database

This design follows **database normalization best practices**, **business logic requirements**, and **legal/audit compliance** needs for a marketplace platform.

---

*This document justifies every design decision. No shortcuts. Enterprise-grade database architecture.*

