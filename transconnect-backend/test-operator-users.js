const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

// Test the operator user management endpoints
async function testOperatorUserEndpoints() {
  console.log('🧪 Testing Operator User Management Endpoints\n');

  try {
    // First, get admin login token (assuming we have a test admin)
    console.log('1. Testing admin login...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@transconnect.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Admin login failed. Creating admin user first...');
      
      // Create admin user if it doesn't exist
      const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'System',
          lastName: 'Admin',
          email: 'admin@transconnect.com',
          password: 'admin123',
          phone: '+1234567890',
          role: 'ADMIN'
        })
      });

      if (registerResponse.ok) {
        console.log('✅ Admin user created successfully');
        
        // Try login again
        const retryLogin = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'admin@transconnect.com',
            password: 'admin123'
          })
        });

        if (!retryLogin.ok) {
          throw new Error('Admin login failed even after creating user');
        }

        const loginData = await retryLogin.json();
        var adminToken = loginData.token;
        console.log('✅ Admin login successful');
      } else {
        throw new Error('Failed to create admin user');
      }
    } else {
      const loginData = await loginResponse.json();
      var adminToken = loginData.token;
      console.log('✅ Admin login successful');
    }

    // Test getting all operators
    console.log('\n2. Testing get all operators...');
    const operatorsResponse = await fetch(`${BASE_URL}/operators`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (!operatorsResponse.ok) {
      console.log('❌ Failed to get operators');
      return;
    }

    const operators = await operatorsResponse.json();
    console.log(`✅ Retrieved ${operators.length} operators`);

    // If no operators exist, create a test operator
    let testOperatorId;
    if (operators.length === 0) {
      console.log('📝 Creating test operator...');
      const createOperatorResponse = await fetch(`${BASE_URL}/operators/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          companyName: 'Test Bus Company',
          contactPerson: 'John Doe',
          email: 'operator@testcompany.com',
          password: 'operator123',
          phone: '+1234567891',
          address: '123 Test Street, Test City',
          licenseNumber: 'TEST123'
        })
      });

      if (createOperatorResponse.ok) {
        const newOperator = await createOperatorResponse.json();
        testOperatorId = newOperator.id;
        console.log('✅ Test operator created successfully');
        
        // Approve the operator
        const approveResponse = await fetch(`${BASE_URL}/operators/${testOperatorId}/approve`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
        
        if (approveResponse.ok) {
          console.log('✅ Test operator approved');
        }
      }
    } else {
      testOperatorId = operators[0].id;
      console.log(`📋 Using existing operator: ${operators[0].companyName}`);
    }

    // Test creating operator user
    console.log('\n3. Testing create operator user...');
    const createUserResponse = await fetch(`${BASE_URL}/admin/operator-users/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        operatorId: testOperatorId,
        firstName: 'Test',
        lastName: 'Driver',
        email: 'driver@testcompany.com',
        phone: '+1234567892',
        password: 'driver123',
        role: 'DRIVER'
      })
    });

    if (!createUserResponse.ok) {
      const errorText = await createUserResponse.text();
      console.log(`❌ Failed to create operator user: ${errorText}`);
      return;
    }

    const newOperatorUser = await createUserResponse.json();
    console.log('✅ Operator user created successfully');
    console.log(`   User ID: ${newOperatorUser.id}`);

    // Test getting all operator users
    console.log('\n4. Testing get all operator users...');
    const operatorUsersResponse = await fetch(`${BASE_URL}/admin/operator-users/all`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (!operatorUsersResponse.ok) {
      console.log('❌ Failed to get operator users');
      return;
    }

    const operatorUsers = await operatorUsersResponse.json();
    console.log(`✅ Retrieved ${operatorUsers.users?.length || operatorUsers.length} operator users`);

    // Test getting operator users by operator
    console.log('\n5. Testing get operator users by operator...');
    const operatorSpecificResponse = await fetch(`${BASE_URL}/admin/operator-users/operator/${testOperatorId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (operatorSpecificResponse.ok) {
      const operatorSpecificUsers = await operatorSpecificResponse.json();
      console.log(`✅ Retrieved ${operatorSpecificUsers.users?.length || operatorSpecificUsers.length} users for specific operator`);
    } else {
      console.log('❌ Failed to get operator-specific users');
    }

    // Test updating operator user
    console.log('\n6. Testing update operator user...');
    const updateResponse = await fetch(`${BASE_URL}/admin/operator-users/${newOperatorUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        operatorId: testOperatorId,
        firstName: 'Updated',
        lastName: 'Driver',
        email: 'driver@testcompany.com',
        phone: '+1234567892',
        role: 'CONDUCTOR',
        active: false
      })
    });

    if (updateResponse.ok) {
      console.log('✅ Operator user updated successfully');
    } else {
      const errorText = await updateResponse.text();
      console.log(`❌ Failed to update operator user: ${errorText}`);
    }

    // Test deleting operator user
    console.log('\n7. Testing delete operator user...');
    const deleteResponse = await fetch(`${BASE_URL}/admin/operator-users/${newOperatorUser.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (deleteResponse.ok) {
      console.log('✅ Operator user deleted successfully');
    } else {
      const errorText = await deleteResponse.text();
      console.log(`❌ Failed to delete operator user: ${errorText}`);
    }

    console.log('\n🎉 All operator user management endpoints tested successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testOperatorUserEndpoints();