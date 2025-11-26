const axios = require('axios');
const chalk = require('chalk');
const cliProgress = require('cli-progress');
require('dotenv').config();

class ConcurrentUserTester {
  constructor() {
    this.API_BASE = process.env.API_BASE_URL || 'http://localhost:5000/api';
    this.results = {
      scenarios: [],
      overallStats: {
        totalUsers: 0,
        successfulSessions: 0,
        failedSessions: 0,
        averageSessionDuration: 0,
        peakConcurrentUsers: 0
      }
    };
    this.activeSessions = new Set();
  }

  async runConcurrentUserTests() {
    console.log(chalk.blue('\n👥 Starting Concurrent User Tests\n'));
    
    await this.testConcurrentAgentLogin();
    await this.testConcurrentBookingFlow();
    await this.testConcurrentAgentActivity();
    await this.testRaceConditions();
    
    this.generateReport();
  }

  async testConcurrentAgentLogin() {
    console.log(chalk.yellow('🔐 Testing Concurrent Agent Login...'));
    
    const CONCURRENT_LOGINS = 50;
    const progressBar = new cliProgress.SingleBar({
      format: 'Agent Logins |{bar}| {percentage}% | {value}/{total} Users',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
    });

    progressBar.start(CONCURRENT_LOGINS, 0);
    
    const loginPromises = Array.from({ length: CONCURRENT_LOGINS }, async (_, index) => {
      const startTime = Date.now();
      const email = `concurrentagent${index}@transconnect.test`;
      
      try {
        // First try to register
        await axios.post(`${this.API_BASE}/auth/register`, {
          email,
          password: 'ConcurrentTest123!',
          name: `Concurrent Agent ${index}`,
          phone: `+25677${String(1000000 + index).substring(0, 7)}`,
          role: 'agent'
        });
      } catch (error) {
        // Ignore registration errors (user might already exist)
      }
      
      try {
        // Now login
        const response = await axios.post(`${this.API_BASE}/auth/login`, {
          email,
          password: 'ConcurrentTest123!'
        });
        
        const duration = Date.now() - startTime;
        progressBar.increment();
        
        return {
          userId: index,
          success: true,
          duration,
          token: response.data.token,
          agentId: response.data.agent?.id
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        progressBar.increment();
        
        return {
          userId: index,
          success: false,
          duration,
          error: error.response?.data?.message || error.message
        };
      }
    });

    const results = await Promise.all(loginPromises);
    progressBar.stop();
    
    this.results.scenarios.push({
      name: 'Concurrent Agent Login',
      totalUsers: CONCURRENT_LOGINS,
      results,
      successRate: (results.filter(r => r.success).length / results.length) * 100,
      avgDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length
    });
  }

  async testConcurrentBookingFlow() {
    console.log(chalk.yellow('🎫 Testing Concurrent Booking Flow...'));
    
    const CONCURRENT_BOOKINGS = 30;
    const SAME_ROUTE_BOOKINGS = 15; // Half will try to book the same route/seat
    
    const progressBar = new cliProgress.SingleBar({
      format: 'Booking Flow |{bar}| {percentage}% | {value}/{total} Users',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
    });

    progressBar.start(CONCURRENT_BOOKINGS, 0);
    
    const bookingPromises = Array.from({ length: CONCURRENT_BOOKINGS }, async (_, index) => {
      const startTime = Date.now();
      const email = `bookinguser${index}@transconnect.test`;
      
      try {
        // Register user
        await axios.post(`${this.API_BASE}/auth/register`, {
          email,
          password: 'BookingTest123!',
          name: `Booking User ${index}`,
          phone: `+25677${String(2000000 + index).substring(0, 7)}`,
          role: 'customer'
        });
        
        // Login
        const loginResponse = await axios.post(`${this.API_BASE}/auth/login`, {
          email,
          password: 'BookingTest123!'
        });
        
        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        
        // Search routes
        await axios.get(`${this.API_BASE}/routes`, {
          params: {
            origin: 'Kampala',
            destination: 'Entebbe',
            date: this.getFutureDate()
          }
        });
        
        // Attempt booking - some will conflict
        const routeId = 1; // Same route for race conditions
        const seatNumber = index < SAME_ROUTE_BOOKINGS ? 15 : Math.floor(Math.random() * 40) + 1;
        
        const bookingResponse = await axios.post(`${this.API_BASE}/bookings`, {
          routeId,
          seatNumber,
          passengerName: `Passenger ${index}`,
          passengerPhone: `+25677${String(3000000 + index).substring(0, 7)}`
        }, { headers });
        
        const duration = Date.now() - startTime;
        progressBar.increment();
        
        return {
          userId: index,
          success: true,
          duration,
          bookingId: bookingResponse.data.id,
          seatNumber,
          conflictPotential: index < SAME_ROUTE_BOOKINGS
        };
        
      } catch (error) {
        const duration = Date.now() - startTime;
        progressBar.increment();
        
        return {
          userId: index,
          success: false,
          duration,
          error: error.response?.data?.message || error.message,
          seatNumber: index < SAME_ROUTE_BOOKINGS ? 15 : Math.floor(Math.random() * 40) + 1,
          conflictPotential: index < SAME_ROUTE_BOOKINGS
        };
      }
    });

    const results = await Promise.all(bookingPromises);
    progressBar.stop();
    
    // Analyze conflicts
    const conflictAttempts = results.filter(r => r.conflictPotential);
    const conflictSuccesses = conflictAttempts.filter(r => r.success);
    
    this.results.scenarios.push({
      name: 'Concurrent Booking Flow',
      totalUsers: CONCURRENT_BOOKINGS,
      results,
      successRate: (results.filter(r => r.success).length / results.length) * 100,
      avgDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
      conflictAnalysis: {
        conflictAttempts: conflictAttempts.length,
        conflictSuccesses: conflictSuccesses.length,
        conflictHandling: conflictSuccesses.length <= 1 ? 'Good' : 'Poor'
      }
    });
  }

  async testConcurrentAgentActivity() {
    console.log(chalk.yellow('📡 Testing Concurrent Agent Activity Updates...'));
    
    const CONCURRENT_AGENTS = 40;
    const ACTIVITY_DURATION = 30000; // 30 seconds
    
    // First, login all agents
    const agents = [];
    for (let i = 0; i < CONCURRENT_AGENTS; i++) {
      const email = `activityagent${i}@transconnect.test`;
      
      try {
        await axios.post(`${this.API_BASE}/auth/register`, {
          email,
          password: 'ActivityTest123!',
          name: `Activity Agent ${i}`,
          phone: `+25677${String(4000000 + i).substring(0, 7)}`,
          role: 'agent'
        });
        
        const loginResponse = await axios.post(`${this.API_BASE}/auth/login`, {
          email,
          password: 'ActivityTest123!'
        });
        
        agents.push({
          id: i,
          token: loginResponse.data.token,
          agentId: loginResponse.data.agent?.id
        });
      } catch (error) {
        // Skip failed agent setups
      }
    }

    console.log(`  💡 Testing with ${agents.length} concurrent agents for ${ACTIVITY_DURATION/1000}s...`);
    
    const activityPromises = agents.map(async (agent) => {
      const results = [];
      const endTime = Date.now() + ACTIVITY_DURATION;
      
      while (Date.now() < endTime) {
        const startTime = Date.now();
        
        try {
          await axios.post(`${this.API_BASE}/agents/activity`, {
            action: 'heartbeat',
            location: {
              lat: Math.random(),
              lng: 32 + Math.random()
            },
            timestamp: new Date().toISOString()
          }, {
            headers: { Authorization: `Bearer ${agent.token}` }
          });
          
          results.push({
            success: true,
            duration: Date.now() - startTime
          });
        } catch (error) {
          results.push({
            success: false,
            duration: Date.now() - startTime,
            error: error.message
          });
        }
        
        await this.sleep(1000 + Math.random() * 2000); // 1-3 second intervals
      }
      
      return {
        agentId: agent.id,
        results,
        successRate: (results.filter(r => r.success).length / results.length) * 100,
        avgDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length
      };
    });

    const results = await Promise.all(activityPromises);
    
    this.results.scenarios.push({
      name: 'Concurrent Agent Activity',
      totalUsers: agents.length,
      results,
      overallSuccessRate: results.reduce((sum, r) => sum + r.successRate, 0) / results.length,
      avgDuration: results.reduce((sum, r) => sum + r.avgDuration, 0) / results.length
    });
  }

  async testRaceConditions() {
    console.log(chalk.yellow('🏁 Testing Race Condition Handling...'));
    
    // Test 1: Multiple users trying to book the same seat
    const RACE_USERS = 20;
    const TARGET_SEAT = 10;
    
    const racePromises = Array.from({ length: RACE_USERS }, async (_, index) => {
      const email = `raceuser${index}@transconnect.test`;
      
      try {
        await axios.post(`${this.API_BASE}/auth/register`, {
          email,
          password: 'RaceTest123!',
          name: `Race User ${index}`,
          phone: `+25677${String(5000000 + index).substring(0, 7)}`,
          role: 'customer'
        });
        
        const loginResponse = await axios.post(`${this.API_BASE}/auth/login`, {
          email,
          password: 'RaceTest123!'
        });
        
        // All users try to book the same seat simultaneously
        const bookingResponse = await axios.post(`${this.API_BASE}/bookings`, {
          routeId: 1,
          seatNumber: TARGET_SEAT,
          passengerName: `Race Passenger ${index}`,
          passengerPhone: `+25677${String(6000000 + index).substring(0, 7)}`
        }, {
          headers: { Authorization: `Bearer ${loginResponse.data.token}` }
        });
        
        return {
          userId: index,
          success: true,
          bookingId: bookingResponse.data.id
        };
      } catch (error) {
        return {
          userId: index,
          success: false,
          error: error.response?.data?.message || error.message
        };
      }
    });

    const results = await Promise.all(racePromises);
    const successfulBookings = results.filter(r => r.success);
    
    this.results.scenarios.push({
      name: 'Race Condition Handling',
      totalUsers: RACE_USERS,
      results,
      successfulBookings: successfulBookings.length,
      raceConditionHandling: successfulBookings.length === 1 ? 'Excellent' : 
                           successfulBookings.length <= 2 ? 'Good' : 'Poor',
      analysis: `${successfulBookings.length} users successfully booked seat ${TARGET_SEAT}`
    });
  }

  generateReport() {
    console.log(chalk.green('\n📊 Concurrent User Test Results'));
    console.log(chalk.gray('=' * 60));
    
    this.results.scenarios.forEach(scenario => {
      console.log(chalk.blue(`\n📋 ${scenario.name}:`));
      console.log(`  👥 Total Users: ${scenario.totalUsers}`);
      
      if (scenario.successRate !== undefined) {
        const successIcon = scenario.successRate > 95 ? '✅' : scenario.successRate > 80 ? '⚠️' : '❌';
        console.log(`  ${successIcon} Success Rate: ${scenario.successRate.toFixed(1)}%`);
        console.log(`  ⏱️  Average Duration: ${scenario.avgDuration.toFixed(0)}ms`);
      }
      
      if (scenario.overallSuccessRate !== undefined) {
        const successIcon = scenario.overallSuccessRate > 95 ? '✅' : scenario.overallSuccessRate > 80 ? '⚠️' : '❌';
        console.log(`  ${successIcon} Overall Success Rate: ${scenario.overallSuccessRate.toFixed(1)}%`);
      }
      
      if (scenario.conflictAnalysis) {
        console.log(`  🎯 Conflict Handling: ${scenario.conflictAnalysis.conflictHandling}`);
        console.log(`  📊 Successful Conflicts: ${scenario.conflictAnalysis.conflictSuccesses}/${scenario.conflictAnalysis.conflictAttempts}`);
      }
      
      if (scenario.raceConditionHandling) {
        const raceIcon = scenario.raceConditionHandling === 'Excellent' ? '✅' : 
                        scenario.raceConditionHandling === 'Good' ? '⚠️' : '❌';
        console.log(`  ${raceIcon} Race Condition Handling: ${scenario.raceConditionHandling}`);
        console.log(`  📝 ${scenario.analysis}`);
      }
    });

    // Overall Assessment
    console.log(chalk.blue('\n🎯 Overall Concurrency Assessment:'));
    const avgSuccessRate = this.results.scenarios.reduce((sum, s) => 
      sum + (s.successRate || s.overallSuccessRate || 0), 0) / this.results.scenarios.length;
    
    if (avgSuccessRate > 95) {
      console.log(chalk.green('  ✅ Concurrency handling: Excellent'));
    } else if (avgSuccessRate > 85) {
      console.log(chalk.yellow('  ⚠️  Concurrency handling: Good'));
    } else {
      console.log(chalk.red('  ❌ Concurrency handling: Needs improvement'));
    }

    // Recommendations
    console.log(chalk.blue('\n💡 Recommendations:'));
    console.log('  • Implement proper database locking for seat reservations');
    console.log('  • Add rate limiting for high-frequency operations');
    console.log('  • Consider connection pooling optimization');
    console.log('  • Monitor database deadlock scenarios');
    console.log('  • Implement circuit breaker patterns for resilience');

    console.log(chalk.gray('\n' + '=' * 60));
  }

  getFutureDate() {
    const future = new Date();
    future.setDate(future.getDate() + Math.floor(Math.random() * 30) + 1);
    return future.toISOString().split('T')[0];
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the concurrent user tests
if (require.main === module) {
  const tester = new ConcurrentUserTester();
  tester.runConcurrentUserTests().catch(console.error);
}

module.exports = ConcurrentUserTester;