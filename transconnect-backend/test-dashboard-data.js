const BASE_URL = 'https://transconnect-app-44ie.onrender.com/api';

async function testDashboardData() {
    try {
        console.log('🔍 Testing Dashboard Data Sources...\n');

        // Test login first
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@transconnect.ug',
                password: 'admin123'
            })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }

        const { token } = await loginResponse.json();
        console.log('✅ Login successful');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Test Users data
        console.log('\n📊 Users Data:');
        const usersResponse = await fetch(`${BASE_URL}/users`, { headers });
        if (usersResponse.ok) {
            const users = await usersResponse.json();
            const userStats = {
                total: users.length,
                passengers: users.filter(u => u.role === 'PASSENGER').length,
                operators: users.filter(u => u.role === 'OPERATOR').length,
                admins: users.filter(u => u.role === 'ADMIN').length,
                verified: users.filter(u => u.verified).length,
                unverified: users.filter(u => !u.verified).length
            };
            console.log('User Statistics:', userStats);
        } else {
            console.log('❌ Users endpoint failed:', usersResponse.status);
        }

        // Test Routes data
        console.log('\n🛣️ Routes Data:');
        const routesResponse = await fetch(`${BASE_URL}/routes`, { headers });
        if (routesResponse.ok) {
            const routes = await routesResponse.json();
            console.log(`Total Routes: ${routes.length}`);
            if (routes.length > 0) {
                console.log('Sample Route:', {
                    origin: routes[0].origin,
                    destination: routes[0].destination,
                    price: routes[0].price,
                    active: routes[0].active
                });
                console.log('Active Routes:', routes.filter(r => r.active).length);
            }
        } else {
            console.log('❌ Routes endpoint failed:', routesResponse.status);
        }

        // Test Bookings data
        console.log('\n🎫 Bookings Data:');
        const bookingsResponse = await fetch(`${BASE_URL}/bookings`, { headers });
        if (bookingsResponse.ok) {
            const bookings = await bookingsResponse.json();
            console.log(`Total Bookings: ${bookings.length}`);
            
            if (bookings.length > 0) {
                // Calculate total revenue
                const totalRevenue = bookings.reduce((sum, booking) => {
                    return sum + (booking.totalAmount || booking.amount || 0);
                }, 0);
                
                // Count today's bookings
                const today = new Date().toISOString().split('T')[0];
                const todayBookings = bookings.filter(booking => 
                    booking.createdAt && booking.createdAt.startsWith(today)
                ).length;

                // Count monthly bookings
                const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
                const monthlyBookings = bookings.filter(booking => 
                    booking.createdAt && booking.createdAt.startsWith(currentMonth)
                );
                const monthlyRevenue = monthlyBookings.reduce((sum, booking) => {
                    return sum + (booking.totalAmount || booking.amount || 0);
                }, 0);

                console.log('Booking Statistics:', {
                    total: bookings.length,
                    totalRevenue: `UGX ${totalRevenue.toLocaleString()}`,
                    todayBookings,
                    monthlyBookings: monthlyBookings.length,
                    monthlyRevenue: `UGX ${monthlyRevenue.toLocaleString()}`
                });

                // Recent bookings
                const recentBookings = bookings
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 5);
                
                console.log('\nRecent Bookings:');
                recentBookings.forEach((booking, i) => {
                    console.log(`${i + 1}. ${booking.user?.firstName || 'Unknown'} - UGX ${(booking.totalAmount || booking.amount || 0).toLocaleString()} - ${booking.status}`);
                });
            }
        } else {
            console.log('❌ Bookings endpoint failed:', bookingsResponse.status);
        }

        // Test Operators data
        console.log('\n🚌 Operators Data:');
        const operatorsResponse = await fetch(`${BASE_URL}/operators`, { headers });
        if (operatorsResponse.ok) {
            const operators = await operatorsResponse.json();
            console.log(`Total Operators: ${operators.length}`);
            if (operators.length > 0) {
                console.log('Sample Operator:', {
                    name: operators[0].companyName,
                    verified: operators[0].verified,
                    active: operators[0].active
                });
            }
        } else {
            console.log('❌ Operators endpoint failed:', operatorsResponse.status);
        }

        // Test available endpoints
        console.log('\n🔍 Testing Other Endpoints:');
        const endpoints = ['/buses', '/payments', '/notifications'];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${BASE_URL}${endpoint}`, { headers });
                console.log(`${endpoint}: ${response.ok ? '✅' : '❌'} (${response.status})`);
            } catch (error) {
                console.log(`${endpoint}: ❌ Error - ${error.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testDashboardData();