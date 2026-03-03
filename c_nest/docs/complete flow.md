# Complete User Flow & Permissions Guide

> **Reference:** This document provides a quick reference for user roles, permissions, and limitations across the platform.  
> **For detailed step-by-step flows:** See [USER_FLOWS.md](../docs/USER_FLOWS.md)

---

## Table of Contents

1. [User Types Overview](#1-user-types-overview)
2. [Permission Matrix](#2-permission-matrix)
3. [By-Role Feature Access](#3-by-role-feature-access)
4. [Business Rules & Restrictions](#4-business-rules--restrictions)

---

## 1. User Types Overview

| User Type | Purpose | Can Do | Cannot Do |
|-----------|---------|--------|-----------|
| **INDIVIDUAL** | Regular person, car owner | Register cars, list for sale, damage detection, browse marketplace | Manage fleet, rental tracking, admin functions |
| **CAR_RENTAL** | Business owner, fleet manager | All Individual features + rental management, bulk operations, business dashboard | Access admin panel, modify catalog |
| **ADMIN** | Platform administrator | Manage users, catalog, verifications, analytics, system notifications | Create customer accounts (seed only) |

---

## 2. Permission Matrix

### Register & Login
| Feature | Individual | Car Rental | Admin |
|---------|:----------:|:----------:|:-----:|
| Email Register | ✅ | ✅ | ❌ |
| Email Login | ✅ | ✅ | ✅ |
| Google OAuth | ✅ | ✅ | ❌ |
| Facebook OAuth | ✅ | ✅ | ❌ |
| Change Password | ✅ | ✅ | ✅ |
| 2FA enabled (future) | ✅ | ✅ | ✅ |

### CNIC Verification
| Feature | Individual | Car Rental | Admin |
|---------|:----------:|:----------:|:-----:|
| Upload CNIC | ✅ | ✅ | N/A |
| View own status | ✅ | ✅ | N/A |
| Request verification | ✅ | ✅ | N/A |
| Approve/Reject CNIC | ❌ | ❌ | ✅ |
| View verification queue | ❌ | ❌ | ✅ |

### Car Management
| Feature | Individual | Car Rental | Admin |
|---------|:----------:|:----------:|:-----:|
| Register car (catalog) | ✅ | ✅ | ❌ |
| Edit car details | ✅ | ✅ | ❌ |
| Delete car | ✅ (conditional) | ✅ (conditional) | ❌ |
| Upload registration images | ✅ (required) | ✅ (required) | ❌ |
| Upload periodic images | ✅ | ✅ | ❌ |
| View car history | ✅ | ✅ | ❌ |
| Bulk car import | ❌ | ✅ | ❌ |

### Image Management
| Feature | Individual | Car Rental | Admin |
|---------|:----------:|:----------:|:-----:|
| Upload images | ✅ | ✅ | ❌ |
| Run damage detection | ✅ | ✅ | ❌ |
| Download damage reports | ✅ | ✅ | ❌ |
| View detection history | ✅ | ✅ | ❌ |

### Marketplace
| Feature | Individual | Car Rental | Admin |
|---------|:----------:|:----------:|:-----:|
| Browse listings | ✅ | ✅ | ❌ |
| Create listing | ✅ (conditional) | ✅ (conditional) | ❌ |
| Edit listing | ✅ (own only) | ✅ (own only) | ❌ |
| Contact seller | ✅ (if verified) | ✅ (if verified) | ❌ |
| Manage listing status | ✅ (own only) | ✅ (own only) | ❌ |
| Analytics on listings | ✅ (own) | ✅ (own) | ❌ |

### Rentals (Car Rental Only)
| Feature | Individual | Car Rental | Admin |
|---------|:----------:|:----------:|:-----:|
| Create rental | ❌ | ✅ | ❌ |
| Complete rental | ❌ | ✅ | ❌ |
| Cancel rental | ❌ | ✅ | ❌ |
| View rental history | ❌ | ✅ | ❌ |
| Download rental reports | ❌ | ✅ | ❌ |
| Rental analytics | ❌ | ✅ | ❌ |

### Admin Functions
| Feature | Individual | Car Rental | Admin |
|---------|:----------:|:----------:|:-----:|
| Manage users | ❌ | ❌ | ✅ |
| Manage car catalog | ❌ | ❌ | ✅ |
| Platform analytics | ❌ | ❌ | ✅ |
| Send notifications | ❌ | ❌ | ✅ |
| Verify CNIC | ❌ | ❌ | ✅ |
| Suspend users | ❌ | ❌ | ✅ |

---

## 3. By-Role Feature Access

### Individual User Features

**✅ Can Access:**
- Own dashboard with stats/activity
- Register multiple cars (from catalog)
- Upload and manage car images (registration, periodic)
- Run damage detection on car images
- Download damage reports (PDF)
- Create listings for sale
- Edit own listings (price, title, description)
- Mark listings as sold/inactive
- Browse marketplace
- Search and filter cars
- Contact sellers (if CNIC verified)
- View own notifications
- Manage profile (name, address, email)
- Upload/verify CNIC
- View account activity history

**❌ Cannot Access:**
- Other users' cars/listings
- Rental management features
- Admin panel
- Bulk operations
- User management
- Catalog editing
- System notifications (admin only)

---

### Car Rental Business Features

**✅ Can Access:**
- All Individual features
- Fleet management dashboard
- Bulk car import (CSV/Excel)
- Pre-rental damage inspection
- Post-rental damage inspection
- Damage comparison (pre vs post)
- Rental tracking (create, complete, cancel)
- Rental history
- Business analytics (revenue, rentals, fleet stats)
- Bulk listing operations
- Business seller badge on marketplace
- Download rental reports (PDF)
- Rental invoice generation

**❌ Cannot Access:**
- Admin panel
- User management
- Catalog editing
- Platform analytics
- CNIC verification queue
- System notifications (sending)

---

### Admin Features

**✅ Can Access:**
- User management (view, search, filter, suspend)
- User detail view (all fields)
- CNIC verification queue (approve/reject)
- Car catalog management (CRUD)
- Bulk catalog import
- Platform analytics (users, cars, listings, revenue)
- System notifications (broadcast to users)
- User statistics dashboard
- Account type management
- Account status management
- Verification status override

**❌ Cannot Access:**
- User car data (individual's cars)
- User listings (not for edit, view only)
- User profile editing (except status/verification)
- Damage detection results (not stored for privacy)

---

## 4. Business Rules & Restrictions

### Registration & Account Rules

| Rule | Details |
|------|---------|
| **Email Uniqueness** | One account per email |
| **Account Type Selection** | INDIVIDUAL or CAR_RENTAL only; ADMIN seeded by system |
| **Password Requirements** | Min 8 chars, 1 uppercase, 1 number, 1 special char |
| **Business Verification** | CAR_RENTAL accounts require license verification by admin |
| **OAuth Account** | Created as INDIVIDUAL by default; can upgrade to CAR_RENTAL later |

### Car Registration Rules

| Rule | Details |
|------|---------|
| **Catalog Requirement** | Cars MUST be registered from catalog (no custom entries) |
| **Registration # Uniqueness** | Per-user unique; prevents duplicate registrations |
| **Registration Images** | MANDATORY; 4 images required (front, back, left, right) |
| **Images Permanent** | Once uploaded, registration images can NEVER be changed/deleted |
| **VIN Optional** | Vehicle Identification Number captured but not required |
| **Active Listing Check** | Cannot reregister car if active listing exists |

### Image Rules

| Rule | Details |
|------|---------|
| **Registration Images** | Uploaded during car registration; marked as permanent; baseline for all comparisons |
| **Periodic Images** | Versioned; new uploads create new version (old archived) |
| **Max File Size** | 10MB per image |
| **Supported Formats** | JPG, PNG, WEBP only |
| **Thumbnail Generation** | Auto-generated for storage/display optimization |
| **Damage Detection** | Results stored in `damageDetectionData` JSON field |

### CNIC Verification Rules

| Rule | Details |
|------|---------|
| **Required For** | Contacting sellers, creating rentals |
| **Admin Review** | All uploads go to verification queue; manual admin review |
| **Status Tracking** | Pending → Approved/Rejected |
| **Re-upload Option** | Users can re-submit if rejected |
| **Notification** | Auto-notification sent when approved/rejected |

### Marketplace Listing Rules

| Rule | Details |
|------|---------|
| **CNIC Requirement** | Seller must be CNIC verified |
| **Active Listing Limit** | One active listing per car max |
| **Status Transitions** | ACTIVE → SOLD or INACTIVE (not directly deleted) |
| **Edit Restrictions** | Can edit price, title, description; NOT registration images |
| **Buyers Must Verify** | Buyers need CNIC verification to contact seller |
| **View Tracking** | Each listing view auto-incremented |
| **Private Contact** | Sellers don't share personal email publicly (through platform) |

### Rental Rules (Car Rental Only)

| Rule | Details |
|------|---------|
| **Pre-Rental Required** | Must upload damage inspection before rental |
| **Post-Rental Required** | Must upload damage inspection and complete rental |
| **Mileage Tracking** | Start and end mileage recorded |
| **Damage Charges** | Optional; calculated as addition to base rental price |
| **Status Flow** | ACTIVE → COMPLETED or CANCELLED (no pause/resume) |
| **Renter Info** | Name, phone, email, CNIC stored for audit trail |
| **History Permanent** | Cannot delete rental records (legal compliance) |

### Deletion & Soft-Delete Rules

| Rule | Details |
|------|---------|
| **Car with Active Listing** | Cannot delete car with active listing; mark listing sold/inactive first |
| **Car with Active Rental** | Cannot delete car with active rental; complete rental first |
| **User with Active Cars** | Account can be deleted but cars are cascade-deleted |
| **Listings' Status** | Never hard-deleted; marked SOLD or INACTIVE |
| **Registration Images** | Permanent; never deleted even if car is deleted |

### Permission Enforcement Rules

| Rule | Details |
|------|---------|
| **VerificationGuard** | Routes requiring CNIC verification will return 403 if not verified |
| **RolesGuard** | Routes requiring specific roles will return 403 if wrong role |
| **OwnershipGuard** | Users can only access their own cars/listings (admin exception) |
| **JwtAuthGuard** | All protected routes require valid JWT access token |

---

## Cross-Reference

- **For detailed step-by-step flows:** [USER_FLOWS.md](../docs/USER_FLOWS.md)
- **For API endpoints:** [API_REFERENCE.md](../docs/API_REFERENCE.md)  
- **For screen layouts:** [SCREENS_AND_UI.md](../docs/SCREENS_AND_UI.md)
- **For database schema:** [DATABASE_SCHEMA.md](../docs/DATABASE_SCHEMA.md)

---

*Last Updated: February 2026 | Subject to change as platform evolves*

**Restrictions:**

* ❌ Cannot use duplicate registration number  
* ❌ Cannot add car without registration images (next step)

**Database Impact:**

INSERT INTO user\_cars (  
    user\_id, catalog\_id, registration\_number,  
    manufacturer, model\_name, year, color, mileage  
) VALUES (...);

---

#### **Step 4: Upload Registration Images (CRITICAL \- PERMANENT)**

**Actions Allowed:**

* ✅ **MUST** upload 4 images (required):  
  1. Front view  
  2. Back view  
  3. Left side view  
  4. Right side view

**Requirements:**

* Each image clearly shows the car  
* Good lighting  
* Full car visible in frame  
* File formats: JPG, PNG, WEBP  
* Max file size: 10MB per image

**What Happens:**

* Images marked as `is_permanent = TRUE`  
* Images marked as `image_category = 'registration_front/back/left/right'`  
* **These images can NEVER be changed or deleted**  
* Serve as baseline for all future comparisons

**Restrictions:**

* ❌ Cannot skip this step  
* ❌ Cannot proceed without all 4 images  
* ❌ Cannot delete these images later  
* ❌ Cannot replace these images later

**Database Impact:**

INSERT INTO car\_images (  
    car\_id, image\_category, image\_url,   
    is\_permanent, version, is\_current  
) VALUES   
    (car\_id, 'registration\_front', url1, TRUE, 1, TRUE),  
    (car\_id, 'registration\_back', url2, TRUE, 1, TRUE),  
    (car\_id, 'registration\_left', url3, TRUE, 1, TRUE),  
    (car\_id, 'registration\_right', url4, TRUE, 1, TRUE);

**User Confirmation:**

⚠️ Warning Message:  
"These registration images will be permanently saved and cannot be changed.   
They will serve as the baseline for tracking your car's condition over time.   
Please ensure images are clear and show your car's current condition."

\[✓ I understand\] \[Upload Images\]

---

### **PHASE 3: Using the Platform (Ongoing)**

#### **Step 5: Dashboard Access**

**Actions Allowed:**

* ✅ View all registered cars  
* ✅ View car details for each car:  
  * Specifications  
  * Registration images (view only)  
  * Latest periodic inspection images  
  * Damage detection history  
  * Estimated value/depreciation  
* ✅ Add more cars (repeat Steps 3-4)

**What User Sees:**

MY CARS DASHBOARD

┌─────────────────────────────────────┐  
│ Toyota Corolla 2023 \- ABC-1234      │  
│ Registered: Jan 15, 2024            │  
│ Last Inspection: Feb 5, 2026        │  
│ Condition: Good                     │  
│ \[View Details\] \[New Inspection\]     │  
│ \[List for Sale\]                     │  
└─────────────────────────────────────┘

\+ Add Another Car

---

#### **Step 6: Periodic Inspection (Optional but Recommended)**

**Actions Allowed:**

* ✅ Upload new inspection images anytime  
* ✅ Upload same 4 angles:  
  1. Front view  
  2. Back view  
  3. Left side view  
  4. Right side view

**What Happens:**

**First Time** (e.g., 1 month after registration):

 INSERT INTO car\_images VALUES  
    (car\_id, 'periodic\_front', url, FALSE, 1, TRUE),  
    (car\_id, 'periodic\_back', url, FALSE, 1, TRUE),  
    ...

* 

**Second Time** (e.g., 2 months after registration):

 \-- Old periodic images: set is\_current \= FALSE  
UPDATE car\_images   
SET is\_current \= FALSE   
WHERE image\_category LIKE 'periodic\_%' AND version \= 1;

\-- New periodic images: version \= 2, is\_current \= TRUE  
INSERT INTO car\_images VALUES  
    (car\_id, 'periodic\_front', url, FALSE, 2, TRUE),  
    ...

* 

**What User Can Do:**

* ✅ Compare current inspection with registration (baseline)  
* ✅ View all previous inspection versions  
* ✅ See condition degradation timeline  
* ✅ View damage detection results

**Restrictions:**

* ❌ Cannot change registration images  
* ❌ Old periodic inspection images archived (not deleted)

---

#### **Step 7: Damage Detection Service**

**Actions Allowed:**

* ✅ Upload image(s) for damage detection  
* ✅ Receive YOLOv8 analysis showing:  
  * Detected damages (dents, scratches, cracks)  
  * Bounding boxes around damages  
  * Confidence scores  
  * Severity levels  
* This thing will be modified after reviewing our model response

**What Happens:**

UPDATE car\_images   
SET   
    has\_damage\_detected \= TRUE,  
    damage\_detection\_data \= '{  
        "model\_version": "yolov8n",  
        "damages": \[  
            {  
                "type": "dent",  
                "confidence": 0.89,  
                "bbox": \[120, 45, 200, 180\],  
                "severity": "moderate"  
            }  
        \]  
    }'  
WHERE image\_id \= ...;

**User Sees:**

DAMAGE DETECTION RESULT

Image: Front view  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
✓ Analysis Complete

Damages Found: 2

1\. \[DENT\] Moderate severity  
   Location: Front bumper (left)  
   Confidence: 89%  
     
2\. \[SCRATCH\] Minor severity  
   Location: Hood  
   Confidence: 76%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
\[Get Repair Cost Estimate\]  
\[Save Report\]

---

#### **Step 8: Cost Estimation (Future Feature)**

**Actions Allowed:**

* ✅ Request repair cost estimate based on detected damages  
* ✅ View itemized cost breakdown  
* ✅ Get multiple quotes from repair shops

**What User Sees:**

REPAIR COST ESTIMATE

Based on detected damages:  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Front Bumper Dent (Moderate)  
\- Labor: PKR 8,000  
\- Parts: PKR 12,000  
\- Paint: PKR 5,000

Hood Scratch (Minor)  
\- Polish & Touch-up: PKR 3,000  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
TOTAL ESTIMATE: PKR 28,000

\[Find Repair Shops\]  
\[Get Detailed Quote\]

---

### **PHASE 4: Marketplace (Buying & Selling)**

#### **Step 9: Browse Marketplace**

**Actions Allowed:**

* ✅ View all active car listings  
* ✅ Filter by:  
  * Manufacturer  
  * Model  
  * Year range  
  * Price range  
  * Condition  
  * Location  
* ✅ View listing details:  
  * Car specifications  
  * Seller information  
  * Listing images  
  * Price (negotiable/fixed)  
  * Registration images (baseline condition)  
  * Latest inspection images  
  * Damage detection reports (if available)  
* ✅ Contact seller (through platform messaging)  
* ✅ Save favorites/watchlist

**Restrictions:**

* ❌ Cannot see seller's personal contact info (privacy)  
* ❌ Cannot see cars marked as "sold" (unless searching history)

Connection established via mail

---

#### **Step 10: Sell Your Car (List for Resale)**

**Actions Allowed:**

* ✅ Select car from "My Cars"  
* ✅ Click "List for Sale"  
* ✅ Fill listing details:  
  * Asking price  
  * Is price negotiable? (Yes/No)  
  * Title (e.g., "Well-maintained Toyota Corolla 2023")  
  * Description (condition, features, service history)  
  * Additional images (optional \- beyond registration/inspection)

**What Happens:**

\-- Mark car as for resale  
UPDATE user\_cars   
SET is\_for\_resale \= TRUE   
WHERE car\_id \= ...;

\-- Create listing  
INSERT INTO car\_listings (  
    car\_id, user\_id, asking\_price,   
    title, description, listing\_status  
) VALUES (car\_id, user\_id, 6500000, 'title', 'desc', 'active');

**What Buyers See:**

* All car specifications  
* Registration images (shows original condition)  
* Latest inspection images (shows current condition)  
* Comparison timeline (degradation over time)  
* Damage detection reports (transparency)  
* Asking price  
* Negotiability

**Restrictions:**

* ❌ Cannot list car they don't own  
* ❌ Cannot edit registration images to hide damage  
* ❌ Cannot delete damage detection reports  
* ❌ Must keep listing active or mark as sold (can't just delete)

---

#### **Step 11: Manage Listing**

**Actions Allowed:**

* ✅ Edit listing details (price, description)  
* ✅ Upload additional listing images  
* ✅ Mark as "sold"  
* ✅ Mark as "inactive" (temporarily hide)  
* ✅ View listing analytics:  
  * Number of views  
  * Interested buyers  
  * Messages received

**Restrictions:**

* ❌ Cannot change registration images  
* ❌ Cannot hide damage reports  
* ❌ Cannot delete old inspection images

---

#### **Step 12: Buy Parts (Future Feature)  (can be implemented but work on later)**

**Actions Allowed:**

* ✅ Browse parts catalog  
* ✅ Filter by car model/compatibility  
* ✅ Add to cart  
* ✅ Checkout & payment

---

### **PHASE 5: Account Management**

#### **Step 13: Profile Settings**

**Actions Allowed:**

* ✅ Update personal information:  
  * Name, phone, address  
  * Password change  
* ✅ Manage email preferences/notifications  
* ✅ View account activity history

**Restrictions:**

* ❌ Cannot change email (use for login)  
* ❌ Cannot change account type (individual → rental)

---

#### **Step 14: View History & Reports**

**Actions Allowed:**

* ✅ View all inspection history  
* ✅ Download damage reports (PDF)  
* ✅ View transaction history (future: parts purchases)  
* ✅ Export data (privacy compliance)

---

## **🚫 INDIVIDUAL USER RESTRICTIONS SUMMARY**

### **What Individual Users CANNOT Do:**

1. ❌ **Delete/Change Registration Images** (permanently locked)  
2. ❌ **Add cars without images** (4 registration images mandatory)  
3. ❌ **Access admin panel** (catalog management)  
4. ❌ **Manage other users' cars** (only their own)  
5. ❌ **See sold cars in active marketplace** (privacy)  
6. ❌ **Bypass damage detection** (when selling, reports are visible)  
7. ❌ **Delete account with active listings** (must close listings first)  
8. ❌ **Use duplicate registration numbers** (each car unique)  
9. ❌ **Edit other users' listings** (only their own)  
10. ❌ **Access rental fleet management tools**

---

# **Car Rental Business Flow**

## **🏢 Business User Journey**

### **PHASE 1: Business Registration**

#### **Step 1: Sign Up as Business**

**Actions Allowed:**

* ✅ Create account with account\_type \= 'car\_rental'  
* ✅ Provide business information:  
  * Business name  
  * Business license number  
  * Business address  
  * Contact person details  
  * Phone number

**Additional Requirements:**

* Must upload business license document  
* Must verify business registration

**Database Impact:**

INSERT INTO users (  
    email, password\_hash, account\_type,  
    full\_name, business\_name, business\_license  
) VALUES (..., 'car\_rental', ...);

---

### **PHASE 2: Fleet Management**

#### **Step 2: Add Fleet Vehicles**

**Actions Allowed:**

* ✅ **Bulk upload** multiple cars (CSV import)  
* ✅ Add individual cars (same as individual user)  
* ✅ Categorize cars:  
  * Available for rent  
  * Under maintenance  
  * Rented out  
  * For resale  
* Figure out later how we can categorize

**Special Features for Rental:**

* ✅ Track rental history per car  
* ✅ Assign cars to renters  
* ✅ Set rental periods  
* ✅ Track mileage before/after rental  
* ✅ Damage comparison (before rent → after return)

---

#### **Step 3: Pre-Rental Inspection**

**Actions Allowed:**

* ✅ Upload pre-rental inspection images  
* ✅ Run damage detection  
* ✅ Document existing damages  
* ✅ Generate pre-rental condition report

**Example Workflow:**

1\. Customer wants to rent Toyota Corolla (ABC-1234)  
2\. Staff uploads 4 inspection images (pre-rental)  
3\. YOLOv8 detects: 1 minor scratch on door  
4\. System generates report:  
   "Car condition before rental: Minor scratch on driver door"  
5\. Customer signs acknowledgment  
6\. Car rented out

---

#### **Step 4: Post-Rental Inspection**

**Actions Allowed:**

* ✅ Upload post-rental inspection images  
* ✅ Run damage detection  
* ✅ **Compare with pre-rental images**  
* ✅ Identify new damages  
* ✅ Calculate damage charges

**Example Workflow:**

1\. Customer returns car after 7 days  
2\. Staff uploads 4 inspection images (post-rental)  
3\. YOLOv8 detects:   
   \- Original scratch (unchanged)  
   \- NEW dent on bumper  
4\. System compares:  
   PRE-RENTAL: 1 damage  
   POST-RENTAL: 2 damages  
   NEW DAMAGE: 1 dent  
5\. Generate damage charge invoice  
6\. Charge customer for dent repair

**Database Impact:**

\-- Pre-rental images  
INSERT INTO car\_images (..., image\_category \= 'periodic\_front', version \= 5);

\-- Post-rental images    
INSERT INTO car\_images (..., image\_category \= 'periodic\_front', version \= 6);

\-- Compare versions 5 and 6 for damage delta

---

#### **Step 5: Fleet Dashboard**

**What Business Sees:**

FLEET MANAGEMENT DASHBOARD

Total Fleet: 50 cars  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Available:      25 cars  \[View\]  
Currently Rented: 20 cars  \[Track\]  
Under Repair:    3 cars  \[Details\]  
For Sale:        2 cars  \[Manage\]

ALERTS:  
⚠️ 3 cars due for periodic inspection  
⚠️ 1 car overdue for return  
✓ 2 cars completed rental today

\[Add New Car\] \[Bulk Import\] \[Generate Report\]

---

### **PHASE 3: Rental-Specific Features**

#### **Step 6: Rental Management**

**Actions Allowed:**

* ✅ Create rental agreements  
* ✅ Assign car to customer  
* ✅ Set rental period  
* ✅ Track rental status (active/completed)  
* ✅ Record mileage at start/end  
* ✅ Generate rental invoices  
* ✅ Track damage charges

**Restrictions:**

* ❌ Cannot rent out car with unresolved damages  
* ❌ Cannot skip pre-rental inspection  
* ❌ Cannot delete rental history (audit trail)

---

#### **Step 7: Bulk Operations**

**Actions Allowed:**

* ✅ Bulk upload cars (CSV/Excel)  
* ✅ Bulk update car status  
* ✅ Bulk periodic inspections  
* ✅ Generate fleet reports (PDF/Excel)

**CSV Import Format:**

registration\_number,manufacturer,model,year,color,mileage  
ABC-1234,Toyota,Corolla,2023,White,15000  
XYZ-5678,Honda,Civic,2024,Black,8000

---

### **PHASE 4: Marketplace (Same as Individual \+ Extra)**

#### **Step 8: Sell Fleet Cars**

**Actions Allowed:**

* ✅ All individual user selling features  
* ✅ **Plus:** Bulk list multiple cars  
* ✅ **Plus:** Business seller badge on listings  
* ✅ **Plus:** Show rental history (transparency)  
  * "This car was part of our rental fleet"  
  * "Total rentals: 25 times"  
  * "Well-maintained with regular inspections"

---

## **🚫 CAR RENTAL BUSINESS RESTRICTIONS**

### **What Rental Businesses CANNOT Do:**

1. ❌ **Skip damage inspections** (mandatory before/after rental)  
2. ❌ **Delete rental history** (audit & legal compliance)  
3. ❌ **Hide damages from customers** (transparency required)  
4. ❌ **Rent damaged cars without disclosure**  
5. ❌ **Access other businesses' fleet data**  
6. ❌ **Manipulate damage reports**

### **What Rental Businesses CAN Do (vs Individual):**

1. ✅ **Bulk operations** (individual cannot)  
2. ✅ **Rental tracking** (individual doesn't need)  
3. ✅ **Before/after comparison** (individual uses different workflow)  
4. ✅ **Customer damage charges** (individual doesn't charge)  
5. ✅ **Fleet analytics & reporting** (individual has basic stats only)

---

# **Admin Flow**

## **👨‍💼 Administrator Journey**

### **PHASE 1: Admin Access**

#### **Step 1: Admin Login**

**Access Level:**

* ✅ Full system access  
* ✅ Manage all users  
* ✅ Manage car catalog  
* ✅ View all transactions  
* ✅ Platform analytics

**Admin Dashboard:**

ADMIN CONTROL PANEL

USERS:  
\- Total Users: 5,432  
\- Individual: 4,800  
\- Businesses: 632  
\- New Today: 23

CARS:  
\- Total Registered: 12,450  
\- Catalog Entries: 285  
\- Active Listings: 1,234

SYSTEM HEALTH:  
✓ All services running  
✓ Database: OK  
✓ Storage: 78% used

\[Manage Users\] \[Manage Catalog\] \[Reports\] \[Settings\]

---

### **PHASE 2: Catalog Management**

#### **Step 2: Add New Car Models to Catalog (also bulk upload)**

**Actions Allowed:**

* ✅ Add new manufacturer  
* ✅ Add new model  
* ✅ Add variants  
* ✅ Set specifications:  
  * Body type, fuel type, transmission  
  * Engine capacity, seating  
  * Base price  
  * Features (JSONB)  
* ✅ Upload catalog images (professional photos)  
* ✅ Mark as active/inactive

**Example:**

ADD NEW CAR TO CATALOG

Manufacturer: \[Honda          ▼\]  
Model Name:   \[City            \]  
Year:         \[2026            \]  
Variant:      \[Aspire CVT      \]

Body Type:    \[Sedan          ▼\]  
Fuel Type:    \[Petrol         ▼\]  
Transmission: \[CVT            ▼\]  
Engine:       \[1500cc          \]  
Seats:        \[5               \]

Base Price:   \[PKR 4,850,000   \]

Features:  
\[✓\] Cruise Control  
\[✓\] Sunroof  
\[✓\] Navigation System  
\[✓\] Lane Assist

Upload Images: \[Choose Files\]

\[Save to Catalog\]

**Database Impact:**

INSERT INTO car\_catalog (  
    manufacturer, model\_name, year, variant,  
    body\_type, fuel\_type, transmission,  
    base\_price, features  
) VALUES (...);

INSERT INTO car\_catalog\_images (catalog\_id, image\_url, is\_primary)  
VALUES (...);

---

#### **Step 3: Update Catalog Pricing**

**Actions Allowed:**

* ✅ Update base prices (for new model years)  
* ✅ Mark old models as inactive  
* ✅ Update specifications  
* ✅ Add/remove features

**Restrictions:**

* ❌ Cannot delete catalog entries with linked user cars  
* ❌ Must mark as inactive instead

---

### **PHASE 3: User Management**

#### **Step 4: Manage Users**

**Actions Allowed:**

* ✅ View all users (individual \+ business)  
* ✅ Search/filter users  
* ✅ View user details:  
  * Account info  
  * Registered cars  
  * Listings  
  * Activity history  
* ✅ Suspend/unsuspend accounts  
* ✅ Delete accounts (with confirmation)  
* ✅ Verify business accounts  
* ✅ Handle disputes 

Registration need CNIC image and the account will be verified after admin review and then user can rent or buy car

**Admin Actions on Users:**

\-- Suspend user  
UPDATE users   
SET account\_status \= 'suspended'   
WHERE user\_id \= '...';

\-- Delete user (cascade deletes cars & listings)  
DELETE FROM users WHERE user\_id \= '...';

---

#### **Step 5: Moderate Listings**

**Actions Allowed:**

* ✅ View all listings (active, sold, inactive)  
* ✅ Flag suspicious listings  
* ✅ Remove fraudulent listings  
* ✅ Verify listing accuracy  
* ✅ Handle user reports

**Restrictions:**

* ❌ Cannot change user's data without permission  
* ❌ Must document all moderation actions

---

### **PHASE 4: Analytics & Reports**

#### **Step 6: Platform Analytics**

**Actions Allowed:**

* ✅ View platform metrics:  
  * Total users, cars, listings  
  * Damage detection usage  
  * Popular car models  
  * Average prices  
  * User growth trends  
* ✅ Generate reports:  
  * Monthly user activity  
  * Revenue reports (future: parts sales)  
  * Damage detection statistics  
  * Marketplace performance

**Example Report:**

MONTHLY PLATFORM REPORT \- January 2026

USERS:  
New Registrations: 450  
  \- Individual: 380  
  \- Business: 70  
Active Users: 4,200

CARS:  
New Registrations: 520  
Damage Detections: 1,240  
Average Mileage: 35,000 km

MARKETPLACE:  
New Listings: 180  
Cars Sold: 95  
Avg. Selling Price: PKR 3,850,000

TOP MODELS:  
1\. Toyota Corolla (85 listings)  
2\. Honda Civic (62 listings)  
3\. Suzuki Alto (48 listings)

---

### **PHASE 5: System Configuration**

#### **Step 7: Platform Settings**

**Actions Allowed:**

* ✅ Configure system settings:  
  * Maximum image upload size  
  * Allowed file types  
  * Damage detection sensitivity  
  * Pricing algorithms  
* ✅ Manage payment gateways (future)  
* ✅ Set commission rates (future)  
* ✅ Configure notifications

---

## **🚫 ADMIN RESTRICTIONS**

### **What Admins CANNOT Do:**

1. ❌ **Change user's registration images** (data integrity)  
2. ❌ **Delete damage reports** (legal compliance)  
3. ❌ **Arbitrarily change user data** (must follow process)  
4. ❌ **Access user passwords** (encrypted/hashed)

### **What Admins CAN Do (vs Others):**

1. ✅ **Manage entire catalog** (users cannot)  
2. ✅ **Suspend any account** (users cannot)  
3. ✅ **View all platform data** (users see only their own)  
4. ✅ **Generate system reports** (users cannot)  
5. ✅ **Moderate all content** (users manage only their own)

---

# **Permissions Matrix**

## **Feature Access by User Type**

| Feature | Individual | Car Rental | Admin | Notes |
| ----- | ----- | ----- | ----- | ----- |
| **ACCOUNT** |  |  |  |  |
| Create Account | ✅ | ✅ | ❌ | Admin assigned by system |
| Login | ✅ | ✅ | ✅ | All can login |
| Update Profile | ✅ | ✅ | ✅ | Own profile only |
| Delete Account | ✅ | ✅ | ❌ | Cannot delete with active data |
| **CAR MANAGEMENT** |  |  |  |  |
| Add Car | ✅ | ✅ | ❌ | Admin manages catalog only |
| Upload Registration Images | ✅ | ✅ | ❌ | Mandatory 4 images |
| Change Registration Images | ❌ | ❌ | ❌ | PERMANENTLY LOCKED |
| Upload Periodic Images | ✅ | ✅ | ❌ | Overwritable |
| Delete Periodic Images | ❌ | ❌ | ❌ | Archived, not deleted |
| View Own Cars | ✅ | ✅ | ✅ | Admins see all |
| View Others' Cars | ❌ | ❌ | ✅ | Only admin can |
| Delete Car | ✅ | ✅ | ✅ | Must not have active listing |
| **DAMAGE DETECTION** |  |  |  |  |
| Upload for Detection | ✅ | ✅ | ✅ | Core feature |
| View Detection Results | ✅ | ✅ | ✅ | Own cars only (users) |
| Download Reports | ✅ | ✅ | ✅ | PDF export |
| Delete Detection Reports | ❌ | ❌ | ❌ | Permanent record |
| **COST ESTIMATION** |  |  |  |  |
| Request Estimate | ✅ | ✅ | ❌ | Based on damages |
| View Estimate | ✅ | ✅ | ✅ | Own estimates (users) |
| **MARKETPLACE** |  |  |  |  |
| Browse Listings | ✅ | ✅ | ✅ | Public access |
| Create Listing | ✅ | ✅ | ❌ | Must own car |
| Edit Own Listing | ✅ | ✅ | ❌ | Title, price, desc only |
| Delete Any Listing | ❌ | ❌ | ✅ | Admin moderation |
| Contact Seller | ✅ | ✅ | ❌ | Through platform |
| View Registration Images (Listing) | ✅ | ✅ | ✅ | Transparency |
| Hide Damage Reports | ❌ | ❌ | ❌ | Mandatory transparency |
| **CATALOG** |  |  |  |  |
| View Catalog | ✅ | ✅ | ✅ | Public access |
| Add to Catalog | ❌ | ❌ | ✅ | Admin only |
| Edit Catalog | ❌ | ❌ | ✅ | Admin only |
| Delete from Catalog | ❌ | ❌ | ✅ | Admin only |
| **RENTAL (Business Only)** |  |  |  |  |
| Bulk Upload Cars | ❌ | ✅ | ❌ | CSV import |
| Track Rentals | ❌ | ✅ | ✅ | Rental history |
| Pre/Post Inspection | ❌ | ✅ | ❌ | Rental workflow |
| Damage Charge Customers | ❌ | ✅ | ❌ | Business feature |
| Fleet Reports | ❌ | ✅ | ✅ | Analytics |
| **ADMIN** |  |  |  |  |
| Manage All Users | ❌ | ❌ | ✅ | Admin panel |
| Suspend Accounts | ❌ | ❌ | ✅ | Moderation |
| View All Data | ❌ | ❌ | ✅ | System oversight |
| Platform Analytics | ❌ | ❌ | ✅ | Reports |
| System Settings | ❌ | ❌ | ✅ | Configuration |
| **PARTS STORE (Future)** |  |  |  |  |
| Browse Parts | ✅ | ✅ | ✅ | Public catalog |
| Purchase Parts | ✅ | ✅ | ❌ | Checkout |
| Manage Parts Catalog | ❌ | ❌ | ✅ | Admin only |

---

# **Feature Access Summary**

## **🟢 Universal Access (All Users)**

* Browse car catalog  
* Browse marketplace listings  
* View damage detection results  
* Download personal reports  
* Update own profile

## **🔵 Individual \+ Rental (Not Admin)**

* Register cars  
* Upload images (registration \+ periodic)  
* Damage detection service  
* Create marketplace listings  
* Buy/sell cars  
* Contact sellers

## **🟡 Rental Only**

* Bulk car management  
* Rental tracking  
* Pre/post rental inspections  
* Charge customers for damages  
* Fleet analytics

## **🔴 Admin Only**

* Manage car catalog  
* Add/edit car models  
* Suspend user accounts  
* View all platform data  
* Platform analytics & reports  
* Moderate listings  
* System configuration

---

# **Key Workflow Diagrams**

## **Individual User: Complete Journey**

SIGN UP  
   ↓  
LOGIN → DASHBOARD  
   ↓  
ADD CAR ──────────────→ Select from Catalog / Custom Entry  
   ↓  
UPLOAD REGISTRATION IMAGES ⚠️ PERMANENT  
   ↓                           (Front, Back, Left, Right)  
   │  
   ├──→ PERIODIC INSPECTION (Optional, Monthly)  
   │         ↓  
   │    Upload New Images → Compare with Registration  
   │         ↓  
   │    Damage Detection → Get Results  
   │         ↓  
   │    Cost Estimation  
   │  
   └──→ LIST FOR SALE  
            ↓  
       Create Listing → Publish  
            ↓  
       Buyers Contact → Negotiate  
            ↓  
       Mark as SOLD → Transaction Complete

## **Car Rental Business: Rental Workflow**

ADD FLEET CARS  
   ↓  
CUSTOMER RENTS CAR  
   ↓  
PRE-RENTAL INSPECTION  
   ↓  
Upload 4 Images → Damage Detection → Document Condition  
   ↓  
GENERATE PRE-RENTAL REPORT  
   ↓  
CUSTOMER SIGNS & TAKES CAR  
   ↓  
\[7 DAYS RENTAL PERIOD\]  
   ↓  
CUSTOMER RETURNS CAR  
   ↓  
POST-RENTAL INSPECTION  
   ↓  
Upload 4 Images → Damage Detection → Compare with Pre-Rental  
   ↓  
IDENTIFY NEW DAMAGES  
   ↓  
Calculate Damage Charges → Invoice Customer  
   ↓  
CLOSE RENTAL → Update Fleet Status

## **Admin: Catalog Management**

LOGIN TO ADMIN PANEL  
   ↓  
CATALOG MANAGEMENT  
   ↓  
ADD NEW CAR MODEL  
   ↓  
Enter Specs → Set Price → Upload Images  
   ↓  
PUBLISH TO CATALOG  
   ↓  
USERS CAN NOW SELECT THIS MODEL  
   ↓  
\[LATER: Price Update Needed\]  
   ↓  
EDIT CATALOG ENTRY → Update Price  
   ↓  
\[Old Model Discontinued\]  
   ↓  
MARK AS INACTIVE (Keep in DB for existing user cars)

---

# **Important Notes**

## **🔒 Data Security & Privacy**

1. **Registration Images:**

   * Immutable (cannot be changed)  
   * Used as legal baseline  
   * Critical for resale transparency  
2. **Damage Reports:**

   * Cannot be deleted  
   * Visible to potential buyers  
   * Legal compliance (consumer protection)  
3. **Personal Data:**

   * Users see only their own data  
   * Admin can view (with audit trail)  
   * GDPR/privacy compliance

## **⚖️ Legal Compliance**

1. **Transparency:**

   * All damages must be disclosed when selling  
   * Registration images show original condition  
   * Buyers have full information  
2. **Audit Trail:**

   * All inspections logged  
   * Rental history preserved  
   * Cannot be tampered with  
3. **Consumer Protection:**

   * Buyers see car history  
   * Damage reports mandatory  
   * No hiding defects

---

# **Summary: Who Can Do What?**

| User Type | Primary Use Case | Key Features | Main Restrictions |
| ----- | ----- | ----- | ----- |
| **Individual** | Own & sell personal car(s) | Damage detection, marketplace, inspections | Cannot change registration images, cannot manage catalog |
| **Car Rental** | Manage rental fleet | All individual features \+ bulk ops, rental tracking, before/after comparison | Cannot skip inspections, cannot hide damages from renters |
| **Admin** | Platform management | Catalog management, user moderation, analytics | Cannot change user's core data (images, reports) |

---

**End of Complete User Flow Documentation** 🎯

