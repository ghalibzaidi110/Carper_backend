# Bulk Import Features Guide

> **Last Updated:** February 2026  
> **Status:** ✅ Implemented

---

## Overview

Two bulk import features have been implemented:

1. **Bulk Car Import** - For rental businesses to import multiple cars via CSV
2. **Bulk Catalog Import** - For admins to import multiple catalog entries via CSV

---

## 1. Bulk Car Import (Rental Businesses)

### Endpoint
```
POST /api/v1/user-cars/bulk-import
```

**Auth:** 🔐 JWT Token Required  
**Role:** 👔 CAR_RENTAL only  
**Content-Type:** `multipart/form-data`

### Request

**Form Data:**
- `file` (required): CSV file
- `validateOnly` (optional query param): `true` to only validate without importing

### CSV Format

```csv
registrationNumber,manufacturer,modelName,year,variant,color,mileage,condition,purchasePrice,vinNumber,purchaseDate
ABC-123,Toyota,Corolla,2020,GLI,White,50000,USED,2500000,VIN123456789,2020-01-15
XYZ-789,Honda,Civic,2021,RS,Black,30000,USED,3200000,VIN987654321,2021-03-20
DEF-456,Toyota,Corolla,2019,Altis,Silver,75000,USED,2200000,,2019-05-10
```

**Required Fields:**
- `registrationNumber` - Unique car registration number
- `manufacturer` - Car manufacturer (must exist in catalog)
- `modelName` - Car model name (must exist in catalog)
- `year` - Manufacturing year (must exist in catalog)

**Optional Fields:**
- `variant` - Car variant (must match catalog)
- `color` - Car color
- `mileage` - Current mileage (number)
- `condition` - NEW, USED, or SALVAGE (default: USED)
- `purchasePrice` - Purchase price in PKR (number)
- `vinNumber` - Vehicle Identification Number
- `purchaseDate` - Purchase date (YYYY-MM-DD format)

### Response

```json
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
      },
      {
        "row": 5,
        "error": "Car model not found in catalog: Invalid Brand Invalid Model 2020"
      }
    ],
    "importedCars": [
      {
        "id": "uuid",
        "registrationNumber": "XYZ-789",
        "manufacturer": "Honda",
        "modelName": "Civic",
        "year": 2021,
        // ... other car fields
      }
    ]
  }
}
```

### Validation Rules

1. **Registration Number:** Must be unique across all cars
2. **Catalog Match:** Car must exist in catalog (manufacturer, model, year, variant must match)
3. **Year:** Must be between 1900 and current year + 1
4. **Mileage:** Must be a positive number if provided
5. **Purchase Price:** Must be a positive number if provided
6. **Condition:** Must be NEW, USED, or SALVAGE

### Example Usage

**Using cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/user-cars/bulk-import \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@cars.csv" \
  -F "validateOnly=false"
```

**Using Postman:**
1. Method: POST
2. URL: `http://localhost:3000/api/v1/user-cars/bulk-import`
3. Headers: `Authorization: Bearer YOUR_TOKEN`
4. Body: form-data
   - Key: `file`, Type: File, Value: Select your CSV file
   - Key: `validateOnly` (optional), Type: Text, Value: `false`

**Validate Only (Dry Run):**
```bash
curl -X POST "http://localhost:3000/api/v1/user-cars/bulk-import?validateOnly=true" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@cars.csv"
```

---

## 2. Bulk Catalog Import (Admin)

### Endpoint
```
POST /api/v1/car-catalog/bulk-import
```

**Auth:** 🔐 JWT Token Required  
**Role:** 🛡️ ADMIN only  
**Content-Type:** `multipart/form-data`

### Request

**Form Data:**
- `file` (required): CSV file
- `validateOnly` (optional query param): `true` to only validate without importing

### CSV Format

```csv
manufacturer,modelName,year,variant,bodyType,fuelType,transmission,engineCapacity,seatingCapacity,basePrice,description,features
Toyota,Corolla,2020,GLI,SEDAN,PETROL,AUTOMATIC,1800cc,5,2500000,Reliable sedan with modern features,"Sunroof, Cruise Control, Apple CarPlay"
Honda,Civic,2021,RS,SEDAN,PETROL,MANUAL,1500cc,5,3000000,Sporty and efficient,"LED Headlights, Sport Mode, Touchscreen"
Toyota,Corolla,2019,Altis,SEDAN,PETROL,AUTOMATIC,1800cc,5,2200000,Previous generation model,"Keyless Entry, Reverse Camera"
```

**Required Fields:**
- `manufacturer` - Car manufacturer
- `modelName` - Car model name
- `year` - Manufacturing year
- `basePrice` - Base price in PKR (number)

**Optional Fields:**
- `variant` - Car variant/trim
- `bodyType` - SEDAN, SUV, HATCHBACK, etc.
- `fuelType` - PETROL, DIESEL, HYBRID, ELECTRIC
- `transmission` - AUTOMATIC, MANUAL, CVT
- `engineCapacity` - Engine size (e.g., "1800cc")
- `seatingCapacity` - Number of seats (1-20)
- `description` - Car description
- `features` - Comma-separated list of features

### Response

```json
{
  "success": true,
  "data": {
    "totalRows": 10,
    "successful": 9,
    "failed": 1,
    "errors": [
      {
        "row": 4,
        "error": "Duplicate catalog entry: Toyota Corolla 2020 GLI"
      }
    ],
    "importedEntries": [
      {
        "id": "uuid",
        "manufacturer": "Honda",
        "modelName": "Civic",
        "year": 2021,
        // ... other catalog fields
      }
    ]
  }
}
```

### Validation Rules

1. **Duplicate Check:** Combination of manufacturer, model, year, and variant must be unique
2. **Year:** Must be between 1900 and current year + 1
3. **Base Price:** Must be a positive number
4. **Seating Capacity:** Must be between 1 and 20 if provided

### Example Usage

**Using cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/car-catalog/bulk-import \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -F "file=@catalog.csv" \
  -F "validateOnly=false"
```

---

## CSV Template Files

### Car Import Template

Create a file `car-import-template.csv`:

```csv
registrationNumber,manufacturer,modelName,year,variant,color,mileage,condition,purchasePrice,vinNumber,purchaseDate
ABC-123,Toyota,Corolla,2020,GLI,White,50000,USED,2500000,VIN123456789,2020-01-15
```

### Catalog Import Template

Create a file `catalog-import-template.csv`:

```csv
manufacturer,modelName,year,variant,bodyType,fuelType,transmission,engineCapacity,seatingCapacity,basePrice,description,features
Toyota,Corolla,2020,GLI,SEDAN,PETROL,AUTOMATIC,1800cc,5,2500000,Reliable sedan,"Sunroof, Cruise Control"
```

---

## Error Handling

### Common Errors

1. **"CSV file is required"**
   - Solution: Make sure you're sending the file in the `file` field

2. **"File must be a CSV file"**
   - Solution: Ensure file has `.csv` extension or `text/csv` MIME type

3. **"Row X: Missing required field: Y"**
   - Solution: Add the missing field to your CSV

4. **"Row X: Car model not found in catalog"**
   - Solution: Ensure the car exists in catalog first, or import to catalog first

5. **"Row X: Duplicate registration number"**
   - Solution: Remove duplicate or use different registration number

6. **"Row X: Invalid year"**
   - Solution: Use a valid year between 1900 and current year + 1

---

## Best Practices

1. **Validate First:** Always use `validateOnly=true` first to check for errors
2. **Small Batches:** Import in batches of 50-100 rows for better error tracking
3. **Backup Data:** Backup your database before large imports
4. **Check Catalog:** For car imports, ensure all cars exist in catalog first
5. **Unique Values:** Ensure registration numbers and catalog entries are unique
6. **Data Format:** Use consistent date formats (YYYY-MM-DD) and number formats

---

## Testing

### Test Car Import

1. Create a test CSV file with 2-3 cars
2. Ensure cars exist in catalog
3. Use a CAR_RENTAL account token
4. Call the endpoint with `validateOnly=true` first
5. If validation passes, import with `validateOnly=false`

### Test Catalog Import

1. Create a test CSV file with 2-3 catalog entries
2. Use an ADMIN account token
3. Call the endpoint with `validateOnly=true` first
4. If validation passes, import with `validateOnly=false`

---

## API Documentation

Full API documentation available at:
- Swagger UI: `http://localhost:3000/api/docs`
- Look for:
  - `POST /user-cars/bulk-import` (User Cars tag)
  - `POST /car-catalog/bulk-import` (Car Catalog tag)

---

**Last Updated:** February 2026  
**Status:** ✅ Ready to use

