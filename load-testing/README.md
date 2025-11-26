# TransConnect Load Testing Suite 🚀

## Overview
Comprehensive load testing for the TransConnect MVP1 platform covering:
- API endpoints performance
- Database query optimization
- Concurrent user scenarios  
- Real-time agent tracking under load
- Booking system stress testing

## Quick Start

### 1. Install Dependencies
```bash
cd load-testing
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your test environment URLs
```

### 3. Run Tests

#### Light Load (Development Testing)
```bash
npm run test:light
```

#### Moderate Load (Staging Testing)  
```bash
npm run test:moderate
```

#### Heavy Load (Production Simulation)
```bash
npm run test:heavy
```

#### Specific Component Tests
```bash
npm run test:agents     # Agent tracking load
npm run test:booking    # Booking system load
npm run test:api        # Custom API tests
npm run test:database   # Database performance
```

## Test Scenarios

### 1. API Load Testing
- **Authentication**: Login/register under load
- **Agent Management**: Dashboard, status updates
- **Booking Flow**: Search, select, payment
- **Real-time Features**: Online tracking, heartbeat

### 2. Database Performance
- **Query Optimization**: Complex joins, indexing
- **Connection Pooling**: Concurrent connections
- **Transaction Handling**: Booking atomicity

### 3. Concurrent Users
- **Simultaneous Bookings**: Race condition testing
- **Agent Status Updates**: Real-time synchronization
- **Payment Processing**: Transaction integrity

## Load Levels

| Test Type | Virtual Users | Duration | RPS Target |
|-----------|---------------|----------|------------|
| Light     | 10-50        | 2 min    | 10-25      |
| Moderate  | 100-500      | 5 min    | 50-100     |
| Heavy     | 1000-5000    | 10 min   | 200-500    |
| Spike     | 0-2000       | 30 sec   | Burst      |

## Metrics Tracked

### Performance Metrics
- **Response Time**: P50, P95, P99 percentiles
- **Throughput**: Requests per second
- **Error Rate**: HTTP errors, timeouts
- **Resource Usage**: CPU, Memory, Database connections

### Business Metrics
- **Booking Success Rate**: End-to-end completion
- **Payment Processing**: Transaction success rate
- **Agent Tracking**: Online status accuracy
- **Data Consistency**: Database integrity

## Reports & Analysis

### HTML Reports
```bash
npm run report
```
- Interactive performance charts
- Error analysis and bottlenecks
- Recommendations for optimization

### Real-time Monitoring
- Live performance dashboard
- Alert thresholds for critical metrics
- Automated issue detection

## Integration

### CI/CD Pipeline
```yaml
# Example GitHub Actions
- name: Load Testing
  run: |
    cd load-testing
    npm install
    npm run test:moderate
```

### Monitoring Integration
- Grafana dashboards
- Prometheus metrics
- Slack/Email alerts

## Best Practices

### Before Testing
1. Use dedicated test environment
2. Warm up database connections
3. Clear cache and logs
4. Monitor system resources

### During Testing
1. Watch for memory leaks
2. Monitor database locks
3. Check error logs
4. Validate data integrity

### After Testing
1. Analyze performance reports
2. Identify bottlenecks
3. Optimize slow queries
4. Update load balancing

## Troubleshooting

### Common Issues
- **Connection Timeouts**: Increase pool size
- **Memory Issues**: Optimize query patterns
- **High CPU**: Profile code performance
- **Database Locks**: Review transaction scopes

### Performance Tuning
- Database indexing strategies
- Connection pool optimization
- Caching implementation
- Load balancer configuration

## Contact
For load testing support and performance optimization assistance.