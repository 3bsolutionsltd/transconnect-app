const BASE_URL = 'https://transconnect-app-44ie.onrender.com/api';

async function testDashboardCalculations() {
    try {
        console.log('🧮 Testing Dashboard Calculations...\n');

        // Test login first
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@transconnect.ug',
                password: 'admin123'
            })
        });

        const { token } = await loginResponse.json();
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Get all data
        const [usersRes, routesRes, operatorsRes] = await Promise.all([
            fetch(`${BASE_URL}/users`, { headers }),
            fetch(`${BASE_URL}/routes`, { headers }),
            fetch(`${BASE_URL}/operators`, { headers })
        ]);

        const users = await usersRes.json();
        const routes = await routesRes.json();
        const operators = await operatorsRes.json();

        console.log('📊 Raw Data:');
        console.log(`Total Users: ${users.length}`);
        console.log(`Total Routes: ${routes.length}`);
        console.log(`Total Operators: ${operators.length}`);

        // Calculate exactly what dashboard should show
        const passengers = users.filter(u => u.role === 'PASSENGER');
        const activeRoutes = routes.filter(r => r.active);
        
        // Calculate estimated revenue based on routes and average bookings
        const estimatedTotalBookings = passengers.length * 3; // Assume 3 bookings per passenger average
        const avgRoutePrice = routes.length > 0 ? routes.reduce((sum, r) => sum + (r.price || 15000), 0) / routes.length : 15000;
        const estimatedRevenue = estimatedTotalBookings * avgRoutePrice;
        
        const dashboardStats = {
            totalBookings: estimatedTotalBookings,
            totalRevenue: estimatedRevenue,
            activeRoutes: activeRoutes.length,
            totalPassengers: passengers.length,
            todayBookings: Math.floor(passengers.length * 0.15), // 15% of passengers book today
            monthlyRevenue: Math.floor(estimatedRevenue * 0.6), // 60% of total revenue this month
            averageOccupancy: 75 + Math.floor(Math.random() * 15), // Realistic occupancy
            popularRoute: routes.length > 0 ? `${routes[0].origin} → ${routes[0].destination}` : 'Kampala → Jinja'
        };

        console.log('\n🎯 Expected Dashboard Numbers:');
        console.log(`Total Passengers: ${dashboardStats.totalPassengers}`);
        console.log(`Active Routes: ${dashboardStats.activeRoutes}`);
        console.log(`Total Bookings: ${dashboardStats.totalBookings}`);
        console.log(`Total Revenue: UGX ${dashboardStats.totalRevenue.toLocaleString()}`);
        console.log(`Today's Bookings: ${dashboardStats.todayBookings}`);
        console.log(`Monthly Revenue: UGX ${dashboardStats.monthlyRevenue.toLocaleString()}`);
        console.log(`Popular Route: ${dashboardStats.popularRoute}`);

        console.log('\n📋 User Breakdown:');
        const usersByRole = {
            passengers: users.filter(u => u.role === 'PASSENGER').length,
            operators: users.filter(u => u.role === 'OPERATOR').length,
            admins: users.filter(u => u.role === 'ADMIN').length,
            verified: users.filter(u => u.verified).length,
            unverified: users.filter(u => !u.verified).length
        };
        console.log(usersByRole);

        console.log('\n🛣️ Route Details:');
        routes.forEach((route, i) => {
            console.log(`${i + 1}. ${route.origin} → ${route.destination} - UGX ${route.price} (Active: ${route.active})`);
        });

        console.log('\n💰 Revenue Calculation Details:');
        console.log(`Passengers: ${passengers.length}`);
        console.log(`Estimated bookings per passenger: 3`);
        console.log(`Total estimated bookings: ${passengers.length} × 3 = ${estimatedTotalBookings}`);
        console.log(`Average route price: UGX ${Math.round(avgRoutePrice)}`);
        console.log(`Total estimated revenue: ${estimatedTotalBookings} × ${Math.round(avgRoutePrice)} = UGX ${estimatedRevenue.toLocaleString()}`);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testDashboardCalculations();