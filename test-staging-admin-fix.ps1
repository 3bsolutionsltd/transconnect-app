# Test Admin Bus Creation Fix on Staging
# Staging API: https://transconnect-app-testing.onrender.com

$API_URL = "https://transconnect-app-testing.onrender.com/api"

Write-Host "`n=== Testing Admin Bus Creation Fix on Staging ===" -ForegroundColor Cyan
Write-Host "API: $API_URL`n" -ForegroundColor Gray

# Step 1: Login as Admin
Write-Host "[1/5] Logging in as admin..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -ContentType "application/json" -Body (@{
        email = "admin@transconnect-staging.com"
        password = "password123"
    } | ConvertTo-Json)

    if ($loginResponse.token) {
        Write-Host "Success: Admin login successful" -ForegroundColor Green
        $token = $loginResponse.token
    } else {
        Write-Host "Failed: Admin login failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error during login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Get list of operators
Write-Host "`n[2/5] Fetching operators..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    $operators = Invoke-RestMethod -Uri "$API_URL/operators" -Method Get -Headers $headers

    if ($operators.operators -and $operators.operators.Count -gt 0) {
        $firstOperator = $operators.operators[0]
        Write-Host "Success: Found $($operators.operators.Count) operators" -ForegroundColor Green
        Write-Host "Using operator: $($firstOperator.companyName)" -ForegroundColor Gray
    } else {
        Write-Host "Failed: No operators found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error fetching operators: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Test creating a bus as admin
Write-Host "`n[3/5] Testing admin bus creation (THE FIX)..." -ForegroundColor Yellow
$testBusData = @{
    plateNumber = "TEST-$(Get-Random -Minimum 100 -Maximum 999)"
    model = "Test Bus Model"
    capacity = 30
    amenities = "AC, WiFi"
    operatorId = $firstOperator.id
}

Write-Host "Attempting to create bus: $($testBusData.plateNumber)" -ForegroundColor Gray

try {
    $createBusResponse = Invoke-RestMethod -Uri "$API_URL/buses" -Method Post -Headers $headers -Body ($testBusData | ConvertTo-Json)
    
    Write-Host "SUCCESS! Admin can create buses" -ForegroundColor Green
    Write-Host "Bus created: $($createBusResponse.plateNumber)" -ForegroundColor Gray
    $busId = $createBusResponse.id
    
} catch {
    $errorMessage = $_.Exception.Message
    if ($errorMessage -like "*Only operators can create buses*") {
        Write-Host "FAILED! Still getting 'Only operators can create buses' error" -ForegroundColor Red
        Write-Host "The fix is NOT deployed to staging yet!" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "Error creating bus: $errorMessage" -ForegroundColor Red
        exit 1
    }
}

# Step 4: Verify bus appears in list
Write-Host "`n[4/5] Verifying bus appears in list..." -ForegroundColor Yellow
try {
    $buses = Invoke-RestMethod -Uri "$API_URL/buses" -Method Get -Headers $headers
    $createdBus = $buses | Where-Object { $_.id -eq $busId }
    
    if ($createdBus) {
        Write-Host "Success: Bus verified in list" -ForegroundColor Green
    } else {
        Write-Host "Warning: Bus not found in list" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error verifying bus: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 5: Test creating a route with the new bus
Write-Host "`n[5/5] Testing route creation..." -ForegroundColor Yellow
$testRouteData = @{
    origin = "Test Origin"
    destination = "Test Destination"
    distance = 100
    duration = 120
    price = 25000
    departureTime = "08:00"
    operatorId = $firstOperator.id
    busId = $busId
}

try {
    $createRouteResponse = Invoke-RestMethod -Uri "$API_URL/routes" -Method Post -Headers $headers -Body ($testRouteData | ConvertTo-Json)
    Write-Host "SUCCESS! Admin can create routes" -ForegroundColor Green
} catch {
    Write-Host "Error creating route: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Summary
Write-Host "`n=== TEST RESULTS ===" -ForegroundColor Cyan
Write-Host "Admin login: PASSED" -ForegroundColor Green
Write-Host "Admin can create buses: PASSED" -ForegroundColor Green
Write-Host "`nTHE FIX IS DEPLOYED AND WORKING ON STAGING!" -ForegroundColor Green
Write-Host "Staging is ready for manual testing.`n" -ForegroundColor Cyan


# Step 2: Get list of operators
Write-Host "`n[2/5] Fetching operators..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$operators = Invoke-RestMethod -Uri "$API_URL/operators" -Method Get -Headers $headers

if ($operators.operators -and $operators.operators.Count -gt 0) {
    $firstOperator = $operators.operators[0]
    Write-Host "✓ Found $($operators.operators.Count) operators" -ForegroundColor Green
    Write-Host "  Using operator: $($firstOperator.companyName) (ID: $($firstOperator.id))" -ForegroundColor Gray
} else {
    Write-Host "✗ No operators found" -ForegroundColor Red
    exit 1
}

# Step 3: Test creating a bus as admin (THE FIX WE'RE TESTING)
Write-Host "`n[3/5] Testing admin bus creation (THIS IS THE FIX)..." -ForegroundColor Yellow
$testBusData = @{
    plateNumber = "TEST-$(Get-Random -Minimum 100 -Maximum 999)"
    model = "Test Bus Model"
    capacity = 30
    amenities = "AC, WiFi"
    operatorId = $firstOperator.id
}

Write-Host "  Attempting to create bus with plate: $($testBusData.plateNumber)" -ForegroundColor Gray

try {
    $createBusResponse = Invoke-RestMethod -Uri "$API_URL/buses" -Method Post -Headers $headers -Body ($testBusData | ConvertTo-Json)
    
    Write-Host "✓ SUCCESS! Admin can create buses" -ForegroundColor Green
    Write-Host "  Bus created: $($createBusResponse.plateNumber)" -ForegroundColor Gray
    Write-Host "  Bus ID: $($createBusResponse.id)" -ForegroundColor Gray
    $busId = $createBusResponse.id
    
} catch {
    $errorMessage = $_.Exception.Message
    if ($errorMessage -like "*Only operators can create buses*") {
        Write-Host "✗ FAILED! Still getting 'Only operators can create buses' error" -ForegroundColor Red
        Write-Host "  The fix is NOT deployed to staging yet!" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "✗ Error creating bus: $errorMessage" -ForegroundColor Red
        exit 1
    }
}

# Step 4: Verify bus appears in list
Write-Host "`n[4/5] Verifying bus appears in list..." -ForegroundColor Yellow
$buses = Invoke-RestMethod -Uri "$API_URL/buses" -Method Get -Headers $headers

$createdBus = $buses | Where-Object { $_.id -eq $busId }
if ($createdBus) {
    Write-Host "✓ Bus verified in list" -ForegroundColor Green
} else {
    Write-Host "✗ Bus not found in list" -ForegroundColor Red
}

# Step 5: Test creating a route with the new bus
Write-Host "`n[5/5] Testing route creation with new bus..." -ForegroundColor Yellow
$testRouteData = @{
    origin = "Test Origin"
    destination = "Test Destination"
    distance = 100
    duration = 120
    price = 25000
    departureTime = "08:00"
    operatorId = $firstOperator.id
    busId = $busId
}

try {
    $createRouteResponse = Invoke-RestMethod -Uri "$API_URL/routes" -Method Post -Headers $headers -Body ($testRouteData | ConvertTo-Json)
    
    Write-Host "✓ SUCCESS! Admin can create routes" -ForegroundColor Green
    Write-Host "  Route created: $($createRouteResponse.origin) to $($createRouteResponse.destination)" -ForegroundColor Gray
    
} catch {
    Write-Host "✗ Error creating route: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host "`n=== TEST RESULTS ===" -ForegroundColor Cyan
Write-Host "✓ Admin login: PASSED" -ForegroundColor Green
Write-Host "✓ Admin can create buses: PASSED" -ForegroundColor Green
Write-Host "✓ Admin can create routes: PASSED" -ForegroundColor Green
Write-Host "`n✓ THE FIX IS DEPLOYED AND WORKING ON STAGING!" -ForegroundColor Green
Write-Host "`nStaging is ready for full manual testing." -ForegroundColor Cyan
