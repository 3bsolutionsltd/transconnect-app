# TransConnect Load Testing Guide 🚀

## Overview
Comprehensive load testing framework for TransConnect MVP1 covering API performance, database optimization, concurrent user scenarios, and real-time agent tracking under load.

## 📁 Project Structure
```
load-testing/
├── 📋 package.json              # Artillery + Custom scripts
├── 📝 README.md                 # Complete documentation  
├── ⚙️  .env                     # Environment configuration
├── 📊 scenarios/                # Load test scenarios
│   ├── light-load.yml          # 25 users, 2 min (development)
│   ├── moderate-load.yml       # 100 users, 5 min (staging)
│   ├── heavy-load.yml          # 500+ users, 10 min (production)
│   ├── spike-test.yml          # Traffic spikes simulation
│   ├── agent-load.yml          # Agent tracking specific
│   └── booking-load.yml        # Booking system specific
└── 🔧 scripts/                 # Custom test scripts
    ├── processor.js            # Artillery helper functions
    ├── api-load-test.js        # API performance testing
    ├── db-performance-test.js  # Database performance
    └── concurrent-users-test.js # Concurrency testing
```

## 🎯 Test Types Available

### 1. 🔥 Artillery Load Tests
- **Light Load**: 25 users, 2 minutes (perfect for development)
- **Moderate Load**: 100 users, 5 minutes (staging environment)  
- **Heavy Load**: 500+ users, 10 minutes (production simulation)
- **Spike Tests**: 0-2000 users burst testing

### 2. 🎪 Custom Performance Tests
- **API Load Testing**: Custom scenarios with detailed metrics
- **Database Performance**: Query optimization, connection pooling
- **Concurrent Users**: Race condition testing, seat booking conflicts

## ⚡ Quick Start Commands

### Initial Setup
```bash
cd load-testing
npm install
cp .env.example .env
# Edit .env with your environment URLs
```

### Basic Load Tests
```bash
npm run test:light      # Development testing (25 users)
npm run test:moderate   # Staging testing (100 users) 
npm run test:heavy      # Production simulation (500+ users)
npm run test:spike      # Traffic spike testing
```

### Component-Specific Tests
```bash
npm run test:agents     # Agent tracking load testing
npm run test:booking    # Booking system stress testing
```

### Custom Performance Tests
```bash
npm run test:api        # Custom API performance scenarios
npm run test:database   # Database query optimization
npm run test:concurrent # Concurrent user race conditions
```

### Generate Reports
```bash
npm run report          # Generate HTML performance reports
npm run all            # Run light + moderate + heavy tests
```

## 📊 Metrics Tracked

### Performance Metrics
- **Response Time**: P50, P95, P99 percentiles
- **Throughput**: Requests per second  
- **Error Rate**: HTTP errors, timeouts
- **Success Rate**: Successful request completion

### Business Metrics
- **Booking Success Rate**: End-to-end booking completion
- **Payment Processing**: Transaction success rates
- **Agent Tracking**: Online status accuracy under load
- **Data Consistency**: Database integrity during stress

### Concurrency Metrics
- **Race Condition Handling**: Multiple users, same resource
- **Database Lock Performance**: Transaction conflicts
- **Connection Pool Efficiency**: Concurrent database access

## 🔧 Environment Configuration

### .env Variables
```env
# API Endpoints
API_BASE_URL=http://localhost:5000/api
WEB_BASE_URL=http://localhost:3002
ADMIN_BASE_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/transconnect_test

# Load Test Parameters
LIGHT_LOAD_USERS=25
MODERATE_LOAD_USERS=100
HEAVY_LOAD_USERS=500
TEST_DURATION_SECONDS=120

# Performance Thresholds
MAX_RESPONSE_TIME_MS=2000
MAX_ERROR_RATE_PERCENT=5
MIN_THROUGHPUT_RPS=10
```

## 🎭 Test Scenarios Explained

### Agent Tracking Load (`agent-load.yml`)
- Simulates multiple agents logging in simultaneously
- Tests heartbeat system under load
- Validates online status tracking accuracy
- Admin dashboard monitoring under stress

### Booking System Load (`booking-load.yml`)
- End-to-end booking flow testing
- Concurrent seat selection conflicts
- Payment processing under load
- Race condition handling validation

### API Performance (`api-load-test.js`)
- Custom user journey simulation
- Detailed response time analysis
- Error rate monitoring
- Throughput measurement

### Database Performance (`db-performance-test.js`)
- Query optimization testing
- Connection pooling stress testing
- Transaction performance analysis
- Complex join query evaluation

### Concurrent Users (`concurrent-users-test.js`)
- Race condition simulation
- Multiple users booking same seats
- Agent activity synchronization
- Database deadlock detection

## 📈 Understanding Reports

### Artillery Reports
- **Response Time Distribution**: Histogram of response times
- **Throughput Over Time**: RPS throughout test duration
- **Error Rate Analysis**: Types and frequency of errors
- **Scenario Performance**: Individual test scenario results

### Custom Test Reports
- **Success Rate Summary**: Overall test completion rates
- **Performance Evaluation**: Automated pass/fail assessment
- **Bottleneck Identification**: Slowest endpoints highlighted
- **Recommendations**: Optimization suggestions

## 🚨 Performance Thresholds

### Excellent Performance
- ✅ Error rate < 1%
- ✅ Average response time < 500ms
- ✅ Throughput > 50 req/s
- ✅ P95 response time < 1000ms

### Acceptable Performance  
- ⚠️ Error rate < 5%
- ⚠️ Average response time < 2000ms
- ⚠️ Throughput > 20 req/s
- ⚠️ P95 response time < 3000ms

### Poor Performance
- ❌ Error rate > 5%
- ❌ Average response time > 2000ms
- ❌ Throughput < 20 req/s
- ❌ P95 response time > 3000ms

## 🔍 Troubleshooting Common Issues

### High Response Times
```bash
# Check database query performance
npm run test:database

# Profile slow endpoints
grep "slow response" reports/latest.log
```

### High Error Rates
```bash
# Check API endpoint health
curl http://localhost:5000/api/health

# Review error logs
tail -f transconnect-backend/logs/error.log
```

### Database Connection Issues
```bash
# Test database connectivity
npm run test:database

# Check connection pool settings
grep "pool" transconnect-backend/src/config/database.js
```

### Memory Leaks
```bash
# Monitor memory usage during tests
npm run test:moderate &
top -p $(pgrep node)
```

## 💡 Optimization Recommendations

### Database Optimization
- Add indexes for frequently queried columns
- Optimize connection pool size
- Implement query result caching
- Review slow query logs

### API Optimization
- Implement response compression
- Add rate limiting for protection
- Optimize payload sizes
- Cache frequent requests

### Infrastructure Optimization
- Configure load balancing
- Implement CDN for static assets
- Monitor server resource usage
- Set up auto-scaling policies

## 🚀 Best Practices

### Before Load Testing
1. **Warm up your system**: Run light tests first
2. **Clear logs and caches**: Start with clean state
3. **Monitor system resources**: CPU, memory, disk I/O
4. **Backup database**: Especially before heavy testing

### During Load Testing
1. **Monitor in real-time**: Watch for immediate issues
2. **Check error logs**: Identify problems early
3. **Validate data integrity**: Ensure no corruption
4. **Track resource usage**: Prevent system overload

### After Load Testing
1. **Analyze reports thoroughly**: Identify bottlenecks
2. **Document findings**: Keep optimization history
3. **Implement fixes**: Address identified issues
4. **Re-test improvements**: Validate optimizations

## 📋 Load Testing Checklist

### Pre-Test Setup
- [ ] Environment variables configured
- [ ] Test data prepared
- [ ] System resources monitored
- [ ] Baseline metrics recorded

### Test Execution
- [ ] Light load test completed
- [ ] Moderate load test completed
- [ ] Component-specific tests run
- [ ] Error logs reviewed

### Post-Test Analysis
- [ ] Performance reports generated
- [ ] Bottlenecks identified
- [ ] Optimization plan created
- [ ] Results documented

## 🎯 Load Testing Strategy

### Phase 1: Development Testing
- Run light load tests regularly
- Focus on functionality correctness
- Identify obvious performance issues
- Validate basic scalability

### Phase 2: Staging Testing
- Execute moderate load tests
- Simulate realistic user patterns
- Test with production-like data
- Validate monitoring systems

### Phase 3: Production Readiness
- Run heavy load tests
- Test peak traffic scenarios
- Validate disaster recovery
- Confirm monitoring alerts

### Phase 4: Continuous Testing
- Integrate into CI/CD pipeline
- Run regression tests automatically
- Monitor performance trends
- Alert on performance degradation

## 📞 Support & Resources

### Documentation
- Full README in `load-testing/README.md`
- Artillery documentation: https://artillery.io/docs
- Node.js performance guides
- PostgreSQL optimization resources

### Monitoring Integration
- Grafana dashboards for real-time metrics
- Prometheus for metric collection
- Slack notifications for test results
- Email alerts for performance degradation

### Team Collaboration
- Share performance reports with team
- Review optimization recommendations
- Plan performance improvement sprints
- Document lessons learned

---

## 🎉 Ready to Load Test!

Your TransConnect system now has comprehensive load testing capabilities. Start with light tests, analyze results, optimize bottlenecks, and gradually increase load to ensure your system can handle production traffic.

**Remember**: Load testing is most effective when done regularly throughout development, not just before launch!

Good luck with your performance optimization! 🚀