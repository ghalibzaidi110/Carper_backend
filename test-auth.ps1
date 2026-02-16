# Test script for authentication endpoints

Write-Host "`n=== Testing Registration Endpoint ===" -ForegroundColor Cyan

$registerBody = @{
    email = "testuser@example.com"
    password = "SecurePass123!"
    fullName = "Test User"
    phoneNumber = "+923001234567"
    city = "Karachi"
    address = "House 123, Street 5, DHA Phase 6, Karachi"
    accountType = "INDIVIDUAL"
    country = "Pakistan"
} | ConvertTo-Json

Write-Host "Registering new user..." -ForegroundColor Yellow
try {
    $registerResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/v1/auth/register" -Body $registerBody -ContentType "application/json"
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    Write-Host ($registerResponse | ConvertTo-Json -Depth 5)
    $accessToken = $registerResponse.data.accessToken
} catch {
    Write-Host "❌ Registration failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host $_.ErrorDetails.Message
}

Write-Host "`n=== Testing Login Endpoint ===" -ForegroundColor Cyan

$loginBody = @{
    email = "testuser@example.com"
    password = "SecurePass123!"
} | ConvertTo-Json

Write-Host "Logging in..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/v1/auth/login" -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host ($loginResponse | ConvertTo-Json -Depth 5)
    $accessToken = $loginResponse.data.accessToken
} catch {
    Write-Host "❌ Login failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host $_.ErrorDetails.Message
}

Write-Host "`n=== Testing Protected Route (Get Current User) ===" -ForegroundColor Cyan

if ($accessToken) {
    Write-Host "Fetching current user with access token..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $accessToken"
        }
        $meResponse = Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/v1/auth/me" -Headers $headers
        Write-Host "✅ Protected route accessible!" -ForegroundColor Green
        Write-Host ($meResponse | ConvertTo-Json -Depth 5)
    } catch {
        Write-Host "❌ Protected route failed:" -ForegroundColor Red
        Write-Host $_.Exception.Message
    }
} else {
    Write-Host "⚠️ No access token available, skipping protected route test" -ForegroundColor Yellow
}

Write-Host "`n=== Testing Login with Invalid Credentials ===" -ForegroundColor Cyan

$invalidLoginBody = @{
    email = "testuser@example.com"
    password = "WrongPassword123!"
} | ConvertTo-Json

Write-Host "Attempting login with wrong password..." -ForegroundColor Yellow
try {
    $invalidLogin = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/v1/auth/login" -Body $invalidLoginBody -ContentType "application/json"
    Write-Host "⚠️ Unexpected: Login should have failed!" -ForegroundColor Yellow
} catch {
    Write-Host "✅ Correctly rejected invalid credentials" -ForegroundColor Green
    Write-Host "Error:" $_.ErrorDetails.Message
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
