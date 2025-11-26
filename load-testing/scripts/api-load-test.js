const axios = require('axios');
const chalk = require('chalk');
const cliProgress = require('cli-progress');
require('dotenv').config();

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000/api';
const CONCURRENT_USERS = parseInt(process.env.MODERATE_LOAD_USERS) || 100;
const TEST_DURATION = 5 * 60 * 1000; // 5 minutes

class APILoadTester {
  constructor() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: [],
      startTime: null,
      endTime: null
    };
    
    this.progressBar = new cliProgress.SingleBar({
      format: 'API Load Test |{bar}| {percentage}% | {value}/{total} Users | ETA: {eta}s',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });
  }

  async runLoadTest() {
    console.log(chalk.blue('\n🚀 Starting API Load Test'));
    console.log(chalk.gray(`Target: ${API_BASE}`));
    console.log(chalk.gray(`Concurrent Users: ${CONCURRENT_USERS}`));
    console.log(chalk.gray(`Duration: ${TEST_DURATION / 1000}s\n`));

    this.results.startTime = Date.now();
    this.progressBar.start(CONCURRENT_USERS, 0);

    // Create array of user simulation promises
    const userPromises = Array.from({ length: CONCURRENT_USERS }, (_, index) => 
      this.simulateUser(index)
    );

    try {
      await Promise.all(userPromises);
      this.results.endTime = Date.now();
      this.progressBar.stop();
      this.generateReport();
    } catch (error) {
      this.progressBar.stop();
      console.error(chalk.red('Load test failed:'), error.message);
    }
  }

  async simulateUser(userId) {
    const userEmail = `loadtest${userId}@transconnect.test`;
    const userPassword = 'LoadTest123!';
    let userToken = null;
    let agentId = null;

    try {
      // 1. User Registration/Login
      const loginResponse = await this.makeRequest('POST', '/auth/login', {
        email: userEmail,
        password: userPassword
      });

      if (loginResponse.token) {
        userToken = loginResponse.token;
        agentId = loginResponse.agent?.id;
      }

      // 2. Simulate user activity for test duration
      const endTime = Date.now() + TEST_DURATION;
      
      while (Date.now() < endTime) {
        await this.simulateUserActivity(userToken, agentId);
        await this.sleep(Math.random() * 5000 + 1000); // 1-6 second intervals
      }

      this.progressBar.increment();
      
    } catch (error) {
      this.results.errors.push({
        userId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async simulateUserActivity(token, agentId) {
    const activities = [
      () => this.testAgentDashboard(token, agentId),
      () => this.testAgentActivity(token),
      () => this.testRouteSearch(),
      () => this.testBusListing(),
      () => this.testOnlineAgents()
    ];

    // Random activity selection
    const activity = activities[Math.floor(Math.random() * activities.length)];
    await activity();
  }

  async testAgentDashboard(token, agentId) {
    if (!token || !agentId) return;
    
    return this.makeRequest('GET', `/agents/${agentId}/dashboard`, null, {
      'Authorization': `Bearer ${token}`
    });
  }

  async testAgentActivity(token) {
    if (!token) return;
    
    return this.makeRequest('POST', '/agents/activity', {
      action: 'heartbeat',
      location: {
        lat: Math.random(),
        lng: 32 + Math.random()
      },
      timestamp: new Date().toISOString()
    }, {
      'Authorization': `Bearer ${token}`
    });
  }

  async testRouteSearch() {
    const origins = ['Kampala', 'Entebbe', 'Jinja', 'Mbarara'];
    const destinations = ['Kampala', 'Entebbe', 'Jinja', 'Mbarara'];
    
    return this.makeRequest('GET', '/routes', null, null, {
      origin: origins[Math.floor(Math.random() * origins.length)],
      destination: destinations[Math.floor(Math.random() * destinations.length)],
      date: this.getFutureDate()
    });
  }

  async testBusListing() {
    return this.makeRequest('GET', '/buses', null, null, {
      status: 'active'
    });
  }

  async testOnlineAgents() {
    return this.makeRequest('GET', '/agents/online');
  }

  async makeRequest(method, endpoint, data = null, headers = {}, params = {}) {
    const startTime = Date.now();
    
    try {
      const config = {
        method,
        url: `${API_BASE}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (data) config.data = data;
      if (Object.keys(params).length > 0) config.params = params;

      const response = await axios(config);
      const responseTime = Date.now() - startTime;
      
      this.results.totalRequests++;
      this.results.successfulRequests++;
      this.results.responseTimes.push(responseTime);
      
      return response.data;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.results.totalRequests++;
      this.results.failedRequests++;
      this.results.responseTimes.push(responseTime);
      
      throw error;
    }
  }

  generateReport() {
    const duration = (this.results.endTime - this.results.startTime) / 1000;
    const avgResponseTime = this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length;
    const p95ResponseTime = this.calculatePercentile(this.results.responseTimes, 95);
    const p99ResponseTime = this.calculatePercentile(this.results.responseTimes, 99);
    const throughput = this.results.totalRequests / duration;
    const errorRate = (this.results.failedRequests / this.results.totalRequests) * 100;

    console.log(chalk.green('\n📊 API Load Test Results'));
    console.log(chalk.gray('=' * 50));
    console.log(chalk.white(`Duration: ${duration.toFixed(2)}s`));
    console.log(chalk.white(`Total Requests: ${this.results.totalRequests}`));
    console.log(chalk.white(`Successful: ${this.results.successfulRequests}`));
    console.log(chalk.white(`Failed: ${this.results.failedRequests}`));
    console.log(chalk.white(`Success Rate: ${(100 - errorRate).toFixed(2)}%`));
    console.log(chalk.white(`Error Rate: ${errorRate.toFixed(2)}%`));
    console.log(chalk.white(`Throughput: ${throughput.toFixed(2)} req/s`));
    console.log(chalk.white(`Avg Response Time: ${avgResponseTime.toFixed(2)}ms`));
    console.log(chalk.white(`P95 Response Time: ${p95ResponseTime.toFixed(2)}ms`));
    console.log(chalk.white(`P99 Response Time: ${p99ResponseTime.toFixed(2)}ms`));

    // Performance evaluation
    console.log(chalk.blue('\n🎯 Performance Evaluation'));
    if (errorRate < 1) {
      console.log(chalk.green('✅ Error rate: Excellent'));
    } else if (errorRate < 5) {
      console.log(chalk.yellow('⚠️  Error rate: Acceptable'));
    } else {
      console.log(chalk.red('❌ Error rate: Poor'));
    }

    if (avgResponseTime < 500) {
      console.log(chalk.green('✅ Response time: Excellent'));
    } else if (avgResponseTime < 2000) {
      console.log(chalk.yellow('⚠️  Response time: Acceptable'));
    } else {
      console.log(chalk.red('❌ Response time: Poor'));
    }

    if (throughput > 50) {
      console.log(chalk.green('✅ Throughput: Excellent'));
    } else if (throughput > 20) {
      console.log(chalk.yellow('⚠️  Throughput: Acceptable'));  
    } else {
      console.log(chalk.red('❌ Throughput: Poor'));
    }

    // Error details
    if (this.results.errors.length > 0) {
      console.log(chalk.red(`\n❌ Error Details (${this.results.errors.length} errors):`));
      this.results.errors.slice(0, 10).forEach(error => {
        console.log(chalk.gray(`  - User ${error.userId}: ${error.error}`));
      });
      if (this.results.errors.length > 10) {
        console.log(chalk.gray(`  ... and ${this.results.errors.length - 10} more errors`));
      }
    }

    console.log(chalk.gray('\n' + '=' * 50));
  }

  calculatePercentile(arr, percentile) {
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
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

// Run the load test
if (require.main === module) {
  const tester = new APILoadTester();
  tester.runLoadTest().catch(console.error);
}

module.exports = APILoadTester;