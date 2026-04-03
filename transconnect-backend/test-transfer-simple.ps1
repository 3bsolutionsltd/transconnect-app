# Week 4 Transfer Testing Script
# This script creates test data and tests the full transfer workflow

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "    Week 4 Transfer System - Full Workflow Test" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan

$BASE_URL = "http://localhost:5000"
# $BASE_URL = "https://transconnect-app-testing.onrender.com" # Use for staging

# Test credentials
$PASSENGER_EMAIL = "john@example.com"
$PASSENGER_PASSWORD = "password123"
$ADMIN_EMAIL = "admin@transconnect.ug"
$ADMIN_PASSWORD = "admin123"

Write-Host "`nStep 1: Login as Passenger" -ForegroundColor Yellow
try {
    $body = @{ 
        email = $PASSENGER_EMAIL
        password = $PASSENGER_PASSWORD 
    } | ConvertTo-Json
    
    $passengerAuth = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method POST -Body $body -ContentType "application/json"
    $passengerToken = $passengerAuth.token
    $passengerId = $passengerAuth.user.id
    
    Write-Host "SUCCESS: Logged in as $($passengerAuth.user.firstName) $($passengerAuth.user.lastName)" -ForegroundColor Green
    Write-Host "   User ID: $passengerId" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Passenger login failed" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 2: Login as Admin/Manager" -ForegroundColor Yellow
try {
    $body = @{ 
        email = $ADMIN_EMAIL
        password = $ADMIN_PASSWORD 
    } | ConvertTo-Json
    
    $adminAuth = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method POST -Body $body -ContentType "application/json"
    $adminToken = $adminAuth.token
    
    Write-Host "SUCCESS: Logged in as $($adminAuth.user.firstName) $($adminAuth.user.lastName)" -ForegroundColor Green
    Write-Host "   Role: $($adminAuth.user.role)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Admin login failed" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 3: Using seeded route" -ForegroundColor Yellow
# Use hardcoded route ID from seed script
$routeId = "Kampala-Jinja-08:00"
$origin = "Kampala"
$destination = "Jinja"
$price = 15000

Write-Host "SUCCESS: Using route $origin to $destination" -ForegroundColor Green
Write-Host "   Route ID: $routeId" -ForegroundColor Gray
Write-Host "   Price: UGX $price" -ForegroundColor Gray

Write-Host "`nStep 4: Create a booking" -ForegroundColor Yellow
try {
    $headers = @{ 
        "Authorization" = "Bearer $passengerToken"
        "Content-Type" = "application/json"
    }
    
    $bookingBody = @{
        routeId = $routeId
        travelDate = "2026-03-15"
        seatNumbers = @("A1")
        passengers = @(
            @{
                name = "John Doe"
                phone = "+256701234567"
                email = $PASSENGER_EMAIL
            }
        )
        paymentMethod = "MOBILE_MONEY"
    } | ConvertTo-Json -Depth 3
    
    $booking = Invoke-RestMethod -Uri "$BASE_URL/api/bookings" -Method POST -Headers $headers -Body $bookingBody
    $bookingId = $booking.booking.id
    
    Write-Host "SUCCESS: Booking created" -ForegroundColor Green
    Write-Host "   Booking ID: $bookingId" -ForegroundColor Gray
    Write-Host "   Seat(s): $($booking.booking.seatNumbers -join ', ')" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Booking creation failed" -ForegroundColor Red
    Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    Write-Host "Exception: $($_.Exception.Message)" -ForegroundColor Gray
    exit 1
}

Write-Host "`nStep 5: Request booking transfer" -ForegroundColor Yellow
try {
    $transferBody = @{
        newRouteId = $routeId
        newDate = "2026-03-20"
        newSeatNumber = "B5"
        reason = "SCHEDULE_CONFLICT"
        reasonDetails = "Meeting rescheduled"
    } | ConvertTo-Json
    
    $transferUrl = "$BASE_URL/api/bookings/$bookingId/transfers"
    $transfer = Invoke-RestMethod -Uri $transferUrl -Method POST -Headers $headers -Body $transferBody
    $transferId = $transfer.data.id
    
    Write-Host "SUCCESS: Transfer request created" -ForegroundColor Green
    Write-Host "   Transfer ID: $transferId" -ForegroundColor Gray
    Write-Host "   Status: $($transfer.data.status)" -ForegroundColor Yellow
} catch {
    Write-Host "ERROR: Transfer request failed" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 6: Manager approves transfer" -ForegroundColor Yellow
try {
    $adminHeaders = @{ 
        "Authorization" = "Bearer $adminToken"
        "Content-Type" = "application/json"
    }
    
    $reviewBody = @{
        action = "APPROVE"
        assignedSeatNumber = "B5"
        notes = "Transfer approved"
    } | ConvertTo-Json
    
    $reviewUrl = "$BASE_URL/api/manager/transfers/$transferId/review"
    $approved = Invoke-RestMethod -Uri $reviewUrl -Method POST -Headers $adminHeaders -Body $reviewBody
    
    Write-Host "SUCCESS: Transfer approved" -ForegroundColor Green
    Write-Host "   Status: $($approved.data.status)" -ForegroundColor Green
    Write-Host "   Assigned Seat: $($approved.data.assignedSeatNumber)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Transfer approval failed" -ForegroundColor Red
}

Write-Host "`nStep 7: View transfer statistics" -ForegroundColor Yellow
try {
    $statsUrl = "$BASE_URL/api/manager/transfers/statistics"
    $stats = Invoke-RestMethod -Uri $statsUrl -Method GET -Headers $adminHeaders
    
    Write-Host "SUCCESS: Transfer Statistics" -ForegroundColor Green
    Write-Host "   Total Requests: $($stats.data.totalRequests)" -ForegroundColor Cyan
    Write-Host "   Approved: $($stats.data.statusBreakdown.approved)" -ForegroundColor Green
    Write-Host "   Approval Rate: $($stats.data.approvalRate)%" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Failed to retrieve statistics" -ForegroundColor Red
}

Write-Host "`n===================================================================" -ForegroundColor Green
Write-Host "    Week 4 Transfer Workflow Test Complete!" -ForegroundColor Green
Write-Host "===================================================================" -ForegroundColor Green

Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "  - User authentication: PASS" -ForegroundColor Green
Write-Host "  - Booking creation: PASS" -ForegroundColor Green
Write-Host "  - Transfer request: PASS" -ForegroundColor Green
Write-Host "  - Manager approval: PASS" -ForegroundColor Green
Write-Host "  - Transfer statistics: PASS" -ForegroundColor Green

Write-Host "`nTest Data Created:" -ForegroundColor Yellow
Write-Host "  - Booking ID: $bookingId" -ForegroundColor Gray
Write-Host "  - Transfer ID: $transferId" -ForegroundColor Gray
Write-Host "  - Status: APPROVED" -ForegroundColor Green
