# Test script for User Profile & CNIC Verification endpoints

Write-Host "`n=== User Profile & CNIC Verification API Tests ===" -ForegroundColor Cyan

# Step 1: Login to get access token
Write-Host "`n=== 1. Login to get Access Token ===" -ForegroundColor Cyan

$loginBody = @{
    email = "testuser@example.com"
    password = "SecurePass123!"
} | ConvertTo-Json

Write-Host "Logging in..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/v1/auth/login" -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Login successful!" -ForegroundColor Green
    $accessToken = $loginResponse.data.accessToken
    Write-Host "Access Token: $($accessToken.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Login failed:" -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message
    exit
}

# Setup headers for authenticated requests
$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

# Step 2: Get Current Profile
Write-Host "`n=== 2. Get Current User Profile ===" -ForegroundColor Cyan
Write-Host "GET /users/profile" -ForegroundColor Yellow

try {
    $profileResponse = Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/v1/users/profile" -Headers $headers
    Write-Host "✅ Profile retrieved successfully!" -ForegroundColor Green
    Write-Host ($profileResponse | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ Failed to get profile:" -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message
}

# Step 3: Update Profile
Write-Host "`n=== 3. Update User Profile ===" -ForegroundColor Cyan
Write-Host "PATCH /users/profile" -ForegroundColor Yellow

$updateProfileBody = @{
    fullName = "Updated Test User"
    city = "Islamabad"
    address = "Flat 789, Sector F-7, Islamabad"
    phoneNumber = "+923119876543"
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/api/v1/users/profile" -Headers $headers -Body $updateProfileBody
    Write-Host "✅ Profile updated successfully!" -ForegroundColor Green
    Write-Host ($updateResponse | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ Failed to update profile:" -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message
}

# Step 4: Test Phone Uniqueness (should fail if duplicate)
Write-Host "`n=== 4. Test Phone Number Uniqueness ===" -ForegroundColor Cyan
Write-Host "PATCH /users/profile (with duplicate phone)" -ForegroundColor Yellow

$duplicatePhoneBody = @{
    phoneNumber = "+923001234567"  # Assuming this is another user's phone
} | ConvertTo-Json

try {
    $dupResponse = Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/api/v1/users/profile" -Headers $headers -Body $duplicatePhoneBody
    Write-Host "⚠️ Warning: Duplicate phone was accepted (might be same user or no conflict)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "✅ Correctly rejected duplicate phone number!" -ForegroundColor Green
        Write-Host "Error:" $_.ErrorDetails.Message
    } else {
        Write-Host "❌ Unexpected error:" -ForegroundColor Red
        Write-Host $_.ErrorDetails.Message
    }
}

# Step 5: Test Profile Update Validation
Write-Host "`n=== 5. Test Profile Validation ===" -ForegroundColor Cyan
Write-Host "PATCH /users/profile (invalid data)" -ForegroundColor Yellow

$invalidProfileBody = @{
    fullName = "X"  # Too short (min 2 chars)
    phoneNumber = "invalid-phone"  # Wrong format
    city = "A"  # Too short
} | ConvertTo-Json

try {
    $invalidResponse = Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/api/v1/users/profile" -Headers $headers -Body $invalidProfileBody
    Write-Host "⚠️ Warning: Invalid data was accepted" -ForegroundColor Yellow
} catch {
    Write-Host "✅ Correctly rejected invalid data!" -ForegroundColor Green
    Write-Host "Validation errors:" -ForegroundColor Yellow
    Write-Host $_.ErrorDetails.Message
}

# Step 6: Get Dashboard Stats
Write-Host "`n=== 6. Get Dashboard Statistics ===" -ForegroundColor Cyan
Write-Host "GET /users/dashboard" -ForegroundColor Yellow

try {
    $dashboardResponse = Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/v1/users/dashboard" -Headers $headers
    Write-Host "✅ Dashboard retrieved successfully!" -ForegroundColor Green
    Write-Host ($dashboardResponse | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ Failed to get dashboard:" -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message
}

# Step 7: Change Password
Write-Host "`n=== 7. Change Password ===" -ForegroundColor Cyan
Write-Host "POST /users/change-password" -ForegroundColor Yellow

$changePasswordBody = @{
    currentPassword = "SecurePass123!"
    newPassword = "NewSecurePass456!"
} | ConvertTo-Json

try {
    $passwordResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/v1/users/change-password" -Headers $headers -Body $changePasswordBody
    Write-Host "✅ Password changed successfully!" -ForegroundColor Green
    Write-Host ($passwordResponse | ConvertTo-Json -Depth 3)
    
    # Login again with new password
    Write-Host "`nTesting login with new password..." -ForegroundColor Yellow
    $newLoginBody = @{
        email = "testuser@example.com"
        password = "NewSecurePass456!"
    } | ConvertTo-Json
    
    $newLoginResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/v1/auth/login" -Body $newLoginBody -ContentType "application/json"
    Write-Host "✅ Login successful with new password!" -ForegroundColor Green
    $accessToken = $newLoginResponse.data.accessToken
    
    # Update headers with new token
    $headers["Authorization"] = "Bearer $accessToken"
    
    # Change password back to original
    Write-Host "`nChanging password back to original..." -ForegroundColor Yellow
    $revertPasswordBody = @{
        currentPassword = "NewSecurePass456!"
        newPassword = "SecurePass123!"
    } | ConvertTo-Json
    
    $revertResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/v1/users/change-password" -Headers $headers -Body $revertPasswordBody
    Write-Host "✅ Password reverted successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Failed to change password:" -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message
}

# Step 8: Test Password Change with Wrong Current Password
Write-Host "`n=== 8. Test Wrong Current Password ===" -ForegroundColor Cyan
Write-Host "POST /users/change-password (wrong current password)" -ForegroundColor Yellow

# Login again to get fresh token
$loginBody = @{
    email = "testuser@example.com"
    password = "SecurePass123!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/v1/auth/login" -Body $loginBody -ContentType "application/json"
$accessToken = $loginResponse.data.accessToken
$headers["Authorization"] = "Bearer $accessToken"

$wrongPasswordBody = @{
    currentPassword = "WrongPassword123!"
    newPassword = "NewSecurePass456!"
} | ConvertTo-Json

try {
    $wrongResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/v1/users/change-password" -Headers $headers -Body $wrongPasswordBody
    Write-Host "⚠️ Warning: Wrong password was accepted" -ForegroundColor Yellow
} catch {
    Write-Host "✅ Correctly rejected wrong current password!" -ForegroundColor Green
    Write-Host "Error:" $_.ErrorDetails.Message
}

# Step 9: Test Password Validation
Write-Host "`n=== 9. Test New Password Validation ===" -ForegroundColor Cyan
Write-Host "POST /users/change-password (weak password)" -ForegroundColor Yellow

$weakPasswordBody = @{
    currentPassword = "SecurePass123!"
    newPassword = "weak"  # Too short, missing requirements
} | ConvertTo-Json

try {
    $weakResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/v1/users/change-password" -Headers $headers -Body $weakPasswordBody
    Write-Host "⚠️ Warning: Weak password was accepted" -ForegroundColor Yellow
} catch {
    Write-Host "✅ Correctly rejected weak password!" -ForegroundColor Green
    Write-Host "Validation errors:" -ForegroundColor Yellow
    Write-Host $_.ErrorDetails.Message
}

# Note about file upload tests
Write-Host "`n=== Note: File Upload Tests ===" -ForegroundColor Cyan
Write-Host "⚠️ File upload tests (CNIC and Avatar) require actual image files" -ForegroundColor Yellow
Write-Host "To test file uploads, use Postman or curl with:" -ForegroundColor Gray
Write-Host "  - POST /users/upload-avatar (form-data: avatar=<file>)" -ForegroundColor Gray
Write-Host "  - POST /users/upload-cnic (form-data: cnic=<file>)" -ForegroundColor Gray
Write-Host "  - Both require Bearer token in Authorization header" -ForegroundColor Gray
Write-Host "  - Max file size: 5MB" -ForegroundColor Gray
Write-Host "  - Allowed formats: JPG, PNG, WEBP" -ForegroundColor Gray

Write-Host "`n=== Profile API Tests Complete ===" -ForegroundColor Cyan
Write-Host "`nSummary:" -ForegroundColor Green
Write-Host "✓ Profile retrieval" -ForegroundColor Green
Write-Host "✓ Profile update with validation" -ForegroundColor Green
Write-Host "✓ Phone uniqueness check" -ForegroundColor Green
Write-Host "✓ Dashboard statistics" -ForegroundColor Green
Write-Host "✓ Password change with security" -ForegroundColor Green
Write-Host "✓ Password validation" -ForegroundColor Green
Write-Host "⚠ File uploads (test manually with Postman)" -ForegroundColor Yellow
