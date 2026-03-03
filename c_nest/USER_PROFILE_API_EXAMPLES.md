# User Profile & CNIC Verification API Examples

Base URL: `http://localhost:3000/api/v1`

**Authentication Required**: All endpoints require Bearer token in Authorization header.

---

## 1. Get Current User Profile

**Endpoint**: `GET /users/profile`

**Headers**:
```
Authorization: Bearer <your_access_token>
```

**Response** (200 OK):
```json
{
  "id": "cm5f2g3h4-i5j6-k7l8-m9n0-o1p2q3r4s5t6",
  "email": "johndoe@example.com",
  "accountType": "INDIVIDUAL",
  "accountStatus": "ACTIVE",
  "fullName": "John Doe",
  "phoneNumber": "+923001234567",
  "address": "House 123, Street 45, DHA Phase 5",
  "city": "Lahore",
  "country": "Pakistan",
  "postalCode": "54000",
  "businessName": null,
  "businessLicense": null,
  "cnicImageUrl": "https://res.cloudinary.com/carper/image/upload/v1234567890/cnic/abc123.jpg",
  "isVerified": true,
  "avatarUrl": "https://res.cloudinary.com/carper/image/upload/v1234567890/avatars/xyz789.jpg",
  "createdAt": "2025-02-13T21:30:00.000Z",
  "lastLogin": "2025-02-14T10:15:00.000Z"
}
```

---

## 2. Update User Profile

**Endpoint**: `PATCH /users/profile`

**Headers**:
```
Authorization: Bearer <your_access_token>
Content-Type: application/json
```

**Request Body** (all fields optional):
```json
{
  "fullName": "John Smith",
  "phoneNumber": "+923009876543",
  "city": "Karachi",
  "address": "Flat 456, Block B, Clifton"
}
```

**Response** (200 OK):
```json
{
  "id": "cm5f2g3h4-i5j6-k7l8-m9n0-o1p2q3r4s5t6",
  "email": "johndoe@example.com",
  "accountType": "INDIVIDUAL",
  "fullName": "John Smith",
  "phoneNumber": "+923009876543",
  "address": "Flat 456, Block B, Clifton",
  "city": "Karachi",
  "avatarUrl": "https://res.cloudinary.com/carper/image/upload/v1234567890/avatars/xyz789.jpg",
  "updatedAt": "2025-02-14T11:00:00.000Z"
}
```

**Error Response** (409 Conflict - Phone already exists):
```json
{
  "statusCode": 409,
  "message": "Phone number is already registered by another user",
  "error": "Conflict"
}
```

**Validation Rules**:
- `fullName`: 2-100 characters
- `phoneNumber`: International format (e.g., +923001234567), checked for uniqueness
- `city`: 2-50 characters
- `address`: 5-200 characters

---

## 3. Change Password

**Endpoint**: `POST /users/change-password`

**Headers**:
```
Authorization: Bearer <your_access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "currentPassword": "OldPass@123",
  "newPassword": "NewSecure@456"
}
```

**Response** (201 Created):
```json
{
  "message": "Password changed successfully. Please login again."
}
```

**Error Response** (400 Bad Request - Incorrect current password):
```json
{
  "statusCode": 400,
  "message": "Current password is incorrect",
  "error": "Bad Request"
}
```

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&#)

**Security Note**: After password change, all refresh tokens are invalidated and user must login again on all devices.

---

## 4. Upload CNIC Image

**Endpoint**: `POST /users/upload-cnic`

**Headers**:
```
Authorization: Bearer <your_access_token>
Content-Type: multipart/form-data
```

**Form Data**:
```
cnic: <file> (image file)
```

**Postman Setup**:
1. Select `Body` tab
2. Choose `form-data`
3. Add key `cnic` with type `File`
4. Select your CNIC image file

**Response** (201 Created):
```json
{
  "message": "CNIC image uploaded. Awaiting admin verification.",
  "cnicImageUrl": "https://res.cloudinary.com/carper/image/upload/v1234567890/cnic/user_cnic_abc123.jpg"
}
```

**File Requirements**:
- **Allowed formats**: JPG, PNG, WEBP
- **Max file size**: 5MB
- **Verification**: After upload, `isVerified` is set to `false` and admin must manually verify

**Re-upload Policy**: Users can re-upload CNIC anytime (even if currently under review or rejected).

---

## 5. Upload Avatar/Profile Picture

**Endpoint**: `POST /users/upload-avatar`

**Headers**:
```
Authorization: Bearer <your_access_token>
Content-Type: multipart/form-data
```

**Form Data**:
```
avatar: <file> (image file)
```

**Postman Setup**:
1. Select `Body` tab
2. Choose `form-data`
3. Add key `avatar` with type `File`
4. Select your avatar image file

**Response** (201 Created):
```json
{
  "message": "Avatar uploaded successfully",
  "avatarUrl": "https://res.cloudinary.com/carper/image/upload/v1234567890/avatars/user_avatar_xyz789.jpg"
}
```

**File Requirements**:
- **Allowed formats**: JPG, PNG, WEBP
- **Max file size**: 5MB

---

## 6. Get User Dashboard Statistics

**Endpoint**: `GET /users/dashboard`

**Headers**:
```
Authorization: Bearer <your_access_token>
```

### Response for INDIVIDUAL User (200 OK):
```json
{
  "totalCars": 3,
  "activeListings": 1,
  "totalDamageDetections": 5,
  "cnicVerificationStatus": "VERIFIED"
}
```

### Response for CAR_RENTAL User (200 OK):
```json
{
  "totalCars": 25,
  "activeListings": 12,
  "totalDamageDetections": 48,
  "cnicVerificationStatus": "VERIFIED",
  "activeRentalBookings": 8,
  "totalRevenue": 450000,
  "fleetUtilization": "32.00%"
}
```

**CNIC Verification Status Values**:
- `NOT_UPLOADED`: User has not uploaded CNIC yet
- `PENDING`: CNIC uploaded, awaiting admin verification
- `VERIFIED`: CNIC verified by admin

**Dashboard Metrics**:

**For All Users**:
- `totalCars`: Count of active registered cars
- `activeListings`: Count of active marketplace listings
- `totalDamageDetections`: Count of damage detection runs (CarImages with hasDamageDetected=true)
- `cnicVerificationStatus`: Current CNIC verification status

**Additional for CAR_RENTAL**:
- `activeRentalBookings`: Count of currently active rental bookings
- `totalRevenue`: Total revenue from completed rentals (sum of totalCharges)
- `fleetUtilization`: Percentage of fleet currently rented (activeRentals / totalCars * 100)

---

## Complete Testing Flow

### Step 1: Login to get access token
```bash
POST http://localhost:3000/api/v1/auth/login
Body: {
  "email": "johndoe@example.com",
  "password": "YourPass@123"
}
```

### Step 2: Get current profile
```bash
GET http://localhost:3000/api/v1/users/profile
Headers: Authorization: Bearer <access_token>
```

### Step 3: Update profile information
```bash
PATCH http://localhost:3000/api/v1/users/profile
Headers: Authorization: Bearer <access_token>
Body: {
  "fullName": "Updated Name",
  "city": "Islamabad"
}
```

### Step 4: Upload avatar
```bash
POST http://localhost:3000/api/v1/users/upload-avatar
Headers: 
  Authorization: Bearer <access_token>
  Content-Type: multipart/form-data
Form Data: avatar=<select_file>
```

### Step 5: Upload CNIC for verification
```bash
POST http://localhost:3000/api/v1/users/upload-cnic
Headers: 
  Authorization: Bearer <access_token>
  Content-Type: multipart/form-data
Form Data: cnic=<select_file>
```

### Step 6: View dashboard stats
```bash
GET http://localhost:3000/api/v1/users/dashboard
Headers: Authorization: Bearer <access_token>
```

### Step 7: Change password
```bash
POST http://localhost:3000/api/v1/users/change-password
Headers: 
  Authorization: Bearer <access_token>
  Content-Type: application/json
Body: {
  "currentPassword": "OldPass@123",
  "newPassword": "NewSecure@456"
}
```

---

## Common Error Responses

### 401 Unauthorized (Invalid/Expired Token)
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 400 Bad Request (Validation Error)
```json
{
  "statusCode": 400,
  "message": [
    "Phone number must be in valid international format",
    "Full name must be at least 2 characters long"
  ],
  "error": "Bad Request"
}
```

### 409 Conflict (Duplicate Phone)
```json
{
  "statusCode": 409,
  "message": "Phone number is already registered by another user",
  "error": "Conflict"
}
```

### 400 Bad Request (File Size Exceeded)
```json
{
  "statusCode": 400,
  "message": "File size exceeds 5MB limit",
  "error": "Bad Request"
}
```

### 400 Bad Request (Invalid File Type)
```json
{
  "statusCode": 400,
  "message": "Invalid file type. Allowed: JPG, PNG, WEBP",
  "error": "Bad Request"
}
```

---

## Notes

1. **Authentication**: All endpoints require valid Bearer token from login
2. **Phone Uniqueness**: When updating phone number, system checks if it's already used by another user
3. **CNIC Workflow**: Upload → Admin reviews → Sets isVerified flag
4. **Password Security**: After password change, all sessions are invalidated
5. **File Uploads**: Max 5MB for avatar and CNIC images
6. **Re-upload**: CNIC can be re-uploaded anytime (resets verification to pending)
7. **Dashboard**: CAR_RENTAL users see additional rental business metrics
8. **Immutable Fields**: Email, accountType, and business fields cannot be updated via profile endpoint
