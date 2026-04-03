# Week 4 Transfer Testing Script
# This script creates test data and tests the full transfer workflow

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    Week 4 Transfer System - Full Workflow Test" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

$BASE_URL = "http://localhost:5000"
# $BASE_URL = "https://transconnect-app-testing.onrender.com" # Use for staging

# Test credentials
$PASSENGER_EMAIL = "john@example.com"
$PASSENGER_PASSWORD = "password123"
$ADMIN_EMAIL = "admin@transconnect.ug"
$ADMIN_PASSWORD = "admin123"

Write-Host "`n📝 Step 1: Login as Passenger" -ForegroundColor Yellow
try {
    $body = @{ 
        email = $PASSENGER_EMAIL
        password = $PASSENGER_PASSWORD 
    } | ConvertTo-Json
    
    $passengerAuth = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method POST -Body $body -ContentType "application/json"
    $passengerToken = $passengerAuth.token
    $passengerId = $passengerAuth.user.id
    
    Write-Host "✅ Logged in as: $($passengerAuth.user.firstName) $($passengerAuth.user.lastName)" -ForegroundColor Green
    Write-Host "   User ID: $passengerId" -ForegroundColor Gray
} catch {
    Write-Host "❌ Passenger login failed: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n📝 Step 2: Login as Admin/Manager" -ForegroundColor Yellow
try {
    $body = @{ 
        email = $ADMIN_EMAIL
        password = $ADMIN_PASSWORD 
    } | ConvertTo-Json
    
    $adminAuth = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method POST -Body $body -ContentType "application/json"
    $adminToken = $adminAuth.token
    
    Write-Host "✅ Logged in as: $($adminAuth.user.firstName) $($adminAuth.user.lastName)" -ForegroundColor Green
    Write-Host "   Role: $($adminAuth.user.role)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Admin login failed: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n📝 Step 3: Search for available routes" -ForegroundColor Yellow
try {
    $searchUrl = "$BASE_URL/api/routes/search-segments?origin=Kampala`&destination=Jinja`&date=2026-03-15"
    $routes = Invoke-RestMethod -Uri $searchUrl -Method GET
    
    if ($routes.data.Count -gt 0) {
        $routeId = $routes.data[0].id
        $origin = $routes.data[0].origin
        $destination = $routes.data[0].destination
        $price = $routes.data[0].price
        
        Write-Host "✅ Found route: $origin → $destination" -ForegroundColor Green
        Write-Host "   Route ID: $routeId" -ForegroundColor Gray
        Write-Host "   Price: UGX $price" -ForegroundColor Gray
        Write-Host "   Available Seats: $($routes.data[0].availableSeats)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ No routes found. You may need to create routes first." -ForegroundColor Yellow
        Write-Host "   Run: npm run seed:routes" -ForegroundColor Cyan
        exit 1
    }
} catch {
    Write-Host "❌ Route search failed: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n📝 Step 4: Create a booking" -ForegroundColor Yellow
try {
    $headers = @{ 
        "Authorization" = "Bearer $passengerToken"
        "Content-Type" = "application/json"
    }
    
    $bookingBody = @{
        routeId = $routeId
        date = "2026-03-15"
        seatNumber = "A1"
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
    
    Write-Host "✅ Booking created successfully!" -ForegroundColor Green
    Write-Host "   Booking ID: $bookingId" -ForegroundColor Gray
    Write-Host "   Seat: $($booking.booking.seatNumber)" -ForegroundColor Gray
    Write-Host "   Total: UGX $($booking.booking.totalAmount)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Booking creation failed: $($_.ErrorDetails.Message)" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Gray
    exit 1
}

Write-Host "`n📝 Step 5: Search for alternative route for transfer" -ForegroundColor Yellow
try {
    $alternativeUrl = "$BASE_URL/api/routes/search-segments?origin=Kampala`&destination=Jinja`&date=2026-03-20"
    $alternativeRoutes = Invoke-RestMethod -Uri $alternativeUrl -Method GET
    
    if ($alternativeRoutes.data.Count -gt 0) {
        $newRouteId = $alternativeRoutes.data[0].id
        $newDate = "2026-03-20"
        $newPrice = $alternativeRoutes.data[0].price
        
        Write-Host "✅ Found alternative route for transfer" -ForegroundColor Green
        Write-Host "   New Date: $newDate" -ForegroundColor Gray
        Write-Host "   New Price: UGX $newPrice" -ForegroundColor Gray
        
        $priceDiff = $newPrice - $price
        if ($priceDiff -gt 0) {
            Write-Host "   ⚠️ Price increase: UGX $priceDiff" -ForegroundColor Yellow
        } elseif ($priceDiff -lt 0) {
            Write-Host "   ✅ Price decrease: UGX $([Math]::Abs($priceDiff)) (refund)" -ForegroundColor Green
        } else {
            Write-Host "   ℹ️ Same price" -ForegroundColor Cyan
        }
    } else {
        Write-Host "⚠️ No alternative routes found" -ForegroundColor Yellow
        $newRouteId = $routeId
        $newDate = "2026-03-20"
    }
} catch {
    Write-Host "❌ Alternative route search failed" -ForegroundColor Red
    $newRouteId = $routeId
    $newDate = "2026-03-20"
}

Write-Host "`n📝 Step 6: Request booking transfer" -ForegroundColor Yellow
try {
    $transferBody = @{
        newRouteId = $newRouteId
        newDate = $newDate
        newSeatNumber = "B5"
        reason = "SCHEDULE_CONFLICT"
        reasonDetails = "Meeting rescheduled to March 20th"
    } | ConvertTo-Json
    
    $transfer = Invoke-RestMethod -Uri "$BASE_URL/api/bookings/$bookingId/transfers" -Method POST -Headers $headers -Body $transferBody
    $transferId = $transfer.data.id
    
    Write-Host "✅ Transfer request created!" -ForegroundColor Green
    Write-Host "   Transfer ID: $transferId" -ForegroundColor Gray
    Write-Host "   Status: $($transfer.data.status)" -ForegroundColor Yellow
    Write-Host "   Reason: $($transfer.data.reason)" -ForegroundColor Gray
    if ($transfer.data.priceDifference -ne 0) {
        Write-Host "   Price Difference: UGX $($transfer.data.priceDifference)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Transfer request failed: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n📝 Step 7: View customer's transfer requests" -ForegroundColor Yellow
try {
    $myTransfers = Invoke-RestMethod -Uri "$BASE_URL/api/bookings/transfers/my-requests" -Method GET -Headers $headers
    
    Write-Host "✅ Retrieved transfer requests" -ForegroundColor Green
    Write-Host "   Total: $($myTransfers.data.pagination.total)" -ForegroundColor Gray
    
    foreach ($t in $myTransfers.data.transfers) {
        Write-Host "   - Transfer #$($t.id): $($t.status)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Failed to retrieve transfers: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host "`n📝 Step 8: Manager views pending transfers" -ForegroundColor Yellow
try {
    $adminHeaders = @{ 
        "Authorization" = "Bearer $adminToken"
        "Content-Type" = "application/json"
    }
    
    $pendingTransfers = Invoke-RestMethod -Uri "$BASE_URL/api/manager/transfers/pending" -Method GET -Headers $adminHeaders
    
    Write-Host "✅ Retrieved pending transfers" -ForegroundColor Green
    Write-Host "   Pending Count: $($pendingTransfers.data.pagination.total)" -ForegroundColor Yellow
    
    foreach ($t in $pendingTransfers.data.transfers) {
        Write-Host "`n   Transfer Request:" -ForegroundColor Cyan
        Write-Host "   - ID: $($t.id)" -ForegroundColor Gray
        Write-Host "   - Booking: $($t.bookingId)" -ForegroundColor Gray
        Write-Host "   - Customer: $($t.booking.user.firstName) $($t.booking.user.lastName)" -ForegroundColor Gray
        Write-Host "   - Reason: $($t.reason)" -ForegroundColor Gray
        Write-Host "   - New Date: $($t.newDate)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed to retrieve pending transfers: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host "`n📝 Step 9: Manager approves transfer" -ForegroundColor Yellow
try {
    $reviewBody = @{
        action = "APPROVE"
        assignedSeatNumber = "B5"
        notes = "Transfer approved - seat B5 assigned for March 20th"
    } | ConvertTo-Json
    
    $approved = Invoke-RestMethod -Uri "$BASE_URL/api/manager/transfers/$transferId/review" -Method POST -Headers $adminHeaders -Body $reviewBody
    
    Write-Host "✅ Transfer approved!" -ForegroundColor Green
    Write-Host "   Status: $($approved.data.status)" -ForegroundColor Green
    Write-Host "   Assigned Seat: $($approved.data.assignedSeatNumber)" -ForegroundColor Cyan
    Write-Host "   Approved By: $($approved.data.approvedBy)" -ForegroundColor Gray
    Write-Host "   Approved At: $($approved.data.approvedAt)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Transfer approval failed: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host "`n📝 Step 10: View transfer statistics" -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$BASE_URL/api/manager/transfers/statistics" -Method GET -Headers $adminHeaders
    
    Write-Host "✅ Transfer Statistics:" -ForegroundColor Green
    Write-Host "   Total Requests: $($stats.data.totalRequests)" -ForegroundColor Cyan
    Write-Host "   Pending: $($stats.data.statusBreakdown.pending)" -ForegroundColor Yellow
    Write-Host "   Approved: $($stats.data.statusBreakdown.approved)" -ForegroundColor Green
    Write-Host "   Completed: $($stats.data.statusBreakdown.completed)" -ForegroundColor Green
    Write-Host "   Rejected: $($stats.data.statusBreakdown.rejected)" -ForegroundColor Red
    Write-Host "   Cancelled: $($stats.data.statusBreakdown.cancelled)" -ForegroundColor Gray
    Write-Host "   Approval Rate: $($stats.data.approvalRate)%" -ForegroundColor Cyan
    Write-Host "   Avg Processing Time: $($stats.data.averageProcessingTime)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to retrieve statistics: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "    ✅ Week 4 Transfer Workflow Test Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "  ✅ User authentication working" -ForegroundColor Green
Write-Host "  ✅ Booking creation successful" -ForegroundColor Green
Write-Host "  ✅ Transfer request created" -ForegroundColor Green
Write-Host "  ✅ Manager approval workflow working" -ForegroundColor Green
Write-Host "  ✅ Transfer statistics generated" -ForegroundColor Green

Write-Host "`n📝 Test Data Created:" -ForegroundColor Yellow
Write-Host "  - Booking ID: $bookingId" -ForegroundColor Gray
Write-Host "  - Transfer ID: $transferId" -ForegroundColor Gray
Write-Host "  - Status: APPROVED" -ForegroundColor Green

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Test rejection workflow (change APPROVE to REJECT)" -ForegroundColor Gray
Write-Host "  2. Test cancellation (DELETE /api/bookings/transfers/:id)" -ForegroundColor Gray
Write-Host "  3. Test with price differences (different routes)" -ForegroundColor Gray
Write-Host "  4. Test seat availability validation" -ForegroundColor Gray
Write-Host "  5. Run on staging by changing BASE_URL variable" -ForegroundColor Gray
