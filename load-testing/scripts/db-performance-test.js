const { Client } = require('pg');
const chalk = require('chalk');
const cliProgress = require('cli-progress');
require('dotenv').config();

class DatabasePerformanceTester {
  constructor() {
    this.client = null;
    this.results = {
      queryTests: [],
      connectionTests: [],
      transactionTests: [],
      concurrencyTests: []
    };
  }

  async connect() {
    try {
      this.client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      
      await this.client.connect();
      console.log(chalk.green('✅ Database connected successfully'));
    } catch (error) {
      console.error(chalk.red('❌ Database connection failed:'), error.message);
      throw error;
    }
  }

  async runAllTests() {
    console.log(chalk.blue('\n🗄️  Starting Database Performance Tests\n'));
    
    await this.connect();
    
    try {
      await this.testBasicQueries();
      await this.testComplexQueries();
      await this.testTransactionPerformance();
      await this.testConcurrentConnections();
      
      this.generateReport();
    } finally {
      await this.client.end();
    }
  }

  async testBasicQueries() {
    console.log(chalk.yellow('🔍 Testing Basic Query Performance...'));
    
    const queries = [
      {
        name: 'Select All Agents',
        sql: 'SELECT * FROM \"Agent\" LIMIT 100'
      },
      {
        name: 'Count Online Agents',
        sql: 'SELECT COUNT(*) FROM \"Agent\" WHERE \"isOnline\" = true'
      },
      {
        name: 'Recent Bookings',
        sql: 'SELECT * FROM \"Booking\" ORDER BY \"createdAt\" DESC LIMIT 50'
      },
      {
        name: 'Active Routes',
        sql: 'SELECT * FROM \"Route\" WHERE \"isActive\" = true'
      },
      {
        name: 'Agent Dashboard Data',
        sql: `SELECT a.*, COUNT(b.id) as total_bookings 
              FROM \"Agent\" a 
              LEFT JOIN \"Booking\" b ON a.id = b.\"agentId\" 
              WHERE a.id = $1 
              GROUP BY a.id`
      }
    ];

    const progressBar = new cliProgress.SingleBar({
      format: 'Basic Queries |{bar}| {percentage}% | {value}/{total}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
    });

    progressBar.start(queries.length * 10, 0); // 10 iterations per query

    for (const query of queries) {
      const queryResults = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        
        try {
          let result;
          if (query.sql.includes('$1')) {
            // For parameterized queries, use a test agent ID
            result = await this.client.query(query.sql, ['test-agent-id']);
          } else {
            result = await this.client.query(query.sql);
          }
          
          const duration = Date.now() - startTime;
          queryResults.push({
            duration,
            rowCount: result.rowCount,
            success: true
          });
        } catch (error) {
          queryResults.push({
            duration: Date.now() - startTime,
            error: error.message,
            success: false
          });
        }
        
        progressBar.increment();
      }
      
      this.results.queryTests.push({
        name: query.name,
        results: queryResults,
        avgDuration: queryResults.reduce((sum, r) => sum + r.duration, 0) / queryResults.length,
        successRate: (queryResults.filter(r => r.success).length / queryResults.length) * 100
      });
    }
    
    progressBar.stop();
  }

  async testComplexQueries() {
    console.log(chalk.yellow('🧮 Testing Complex Query Performance...'));
    
    const complexQueries = [
      {
        name: 'Agent Analytics with Joins',
        sql: `
          SELECT 
            a.id, a.name, a."isOnline",
            COUNT(DISTINCT b.id) as total_bookings,
            COUNT(DISTINCT r.id) as total_routes,
            AVG(b.amount) as avg_booking_amount
          FROM "Agent" a
          LEFT JOIN "Booking" b ON a.id = b."agentId"
          LEFT JOIN "Route" r ON a.id = r."operatorId"
          WHERE a."createdAt" >= NOW() - INTERVAL '30 days'
          GROUP BY a.id, a.name, a."isOnline"
          ORDER BY total_bookings DESC
          LIMIT 20
        `
      },
      {
        name: 'Popular Routes Analysis',
        sql: `
          SELECT 
            r.origin, r.destination,
            COUNT(b.id) as booking_count,
            SUM(b.amount) as total_revenue,
            AVG(b.amount) as avg_price
          FROM "Route" r
          LEFT JOIN "Booking" b ON r.id = b."routeId"
          WHERE r."isActive" = true
          GROUP BY r.origin, r.destination
          HAVING COUNT(b.id) > 0
          ORDER BY booking_count DESC
          LIMIT 10
        `
      },
      {
        name: 'Revenue Report with Date Ranges',
        sql: `
          SELECT 
            DATE_TRUNC('day', b."createdAt") as booking_date,
            COUNT(b.id) as daily_bookings,
            SUM(b.amount) as daily_revenue,
            COUNT(DISTINCT b."userId") as unique_customers
          FROM "Booking" b
          WHERE b."createdAt" >= NOW() - INTERVAL '7 days'
          GROUP BY DATE_TRUNC('day', b."createdAt")
          ORDER BY booking_date DESC
        `
      }
    ];

    for (const query of complexQueries) {
      const startTime = Date.now();
      
      try {
        const result = await this.client.query(query.sql);
        const duration = Date.now() - startTime;
        
        this.results.queryTests.push({
          name: query.name,
          duration,
          rowCount: result.rowCount,
          success: true,
          type: 'complex'
        });
        
        console.log(chalk.green(`  ✅ ${query.name}: ${duration}ms (${result.rowCount} rows)`));
      } catch (error) {
        this.results.queryTests.push({
          name: query.name,
          duration: Date.now() - startTime,
          error: error.message,
          success: false,
          type: 'complex'
        });
        
        console.log(chalk.red(`  ❌ ${query.name}: ${error.message}`));
      }
    }
  }

  async testTransactionPerformance() {
    console.log(chalk.yellow('💳 Testing Transaction Performance...'));
    
    const transactionTests = [
      {
        name: 'Simple Booking Transaction',
        operations: [
          'BEGIN',
          `INSERT INTO "Booking" (id, "userId", "routeId", "seatNumber", amount, status, "createdAt", "updatedAt") 
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          `UPDATE "Route" SET "availableSeats" = "availableSeats" - 1 WHERE id = $3`,
          'COMMIT'
        ],
        params: [
          [],
          ['test-booking-' + Date.now(), 'test-user', 'test-route', 15, 25000, 'confirmed'],
          ['test-route'],
          []
        ]
      }
    ];

    for (const test of transactionTests) {
      const results = [];
      
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        
        try {
          for (let j = 0; j < test.operations.length; j++) {
            const operation = test.operations[j];
            const params = test.params[j] || [];
            
            if (params.length > 0) {
              // Replace dynamic values
              const finalParams = params.map(p => 
                typeof p === 'string' && p.includes('test-booking-') 
                  ? 'test-booking-' + Date.now() + '-' + i 
                  : p
              );
              await this.client.query(operation, finalParams);
            } else {
              await this.client.query(operation);
            }
          }
          
          const duration = Date.now() - startTime;
          results.push({ duration, success: true });
          
        } catch (error) {
          // Rollback on error
          try {
            await this.client.query('ROLLBACK');
          } catch (rollbackError) {
            // Ignore rollback errors
          }
          
          results.push({
            duration: Date.now() - startTime,
            success: false,
            error: error.message
          });
        }
      }
      
      this.results.transactionTests.push({
        name: test.name,
        results,
        avgDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
        successRate: (results.filter(r => r.success).length / results.length) * 100
      });
    }
  }

  async testConcurrentConnections() {
    console.log(chalk.yellow('🔄 Testing Concurrent Connection Performance...'));
    
    const connectionPromises = Array.from({ length: 20 }, async (_, index) => {
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      
      const startTime = Date.now();
      
      try {
        await client.connect();
        await client.query('SELECT COUNT(*) FROM \"Agent\"');
        await client.end();
        
        return {
          connectionId: index,
          duration: Date.now() - startTime,
          success: true
        };
      } catch (error) {
        return {
          connectionId: index,
          duration: Date.now() - startTime,
          success: false,
          error: error.message
        };
      }
    });

    const results = await Promise.all(connectionPromises);
    
    this.results.concurrencyTests.push({
      name: 'Concurrent Connections',
      results,
      avgDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
      successRate: (results.filter(r => r.success).length / results.length) * 100
    });
  }

  generateReport() {
    console.log(chalk.green('\n📊 Database Performance Test Results'));
    console.log(chalk.gray('=' * 60));
    
    // Basic Query Results
    console.log(chalk.blue('\n🔍 Basic Query Performance:'));
    this.results.queryTests
      .filter(test => test.type !== 'complex')
      .forEach(test => {
        const status = test.successRate === 100 ? chalk.green('✅') : chalk.red('❌');
        console.log(`  ${status} ${test.name}: ${test.avgDuration?.toFixed(2)}ms avg (${test.successRate?.toFixed(1)}% success)`);
      });

    // Complex Query Results
    console.log(chalk.blue('\n🧮 Complex Query Performance:'));
    this.results.queryTests
      .filter(test => test.type === 'complex')
      .forEach(test => {
        const status = test.success ? chalk.green('✅') : chalk.red('❌');
        console.log(`  ${status} ${test.name}: ${test.duration}ms (${test.rowCount || 0} rows)`);
      });

    // Transaction Results
    console.log(chalk.blue('\n💳 Transaction Performance:'));
    this.results.transactionTests.forEach(test => {
      const status = test.successRate === 100 ? chalk.green('✅') : chalk.red('❌');
      console.log(`  ${status} ${test.name}: ${test.avgDuration.toFixed(2)}ms avg (${test.successRate.toFixed(1)}% success)`);
    });

    // Concurrency Results
    console.log(chalk.blue('\n🔄 Concurrency Performance:'));
    this.results.concurrencyTests.forEach(test => {
      const status = test.successRate > 95 ? chalk.green('✅') : chalk.red('❌');
      console.log(`  ${status} ${test.name}: ${test.avgDuration.toFixed(2)}ms avg (${test.successRate.toFixed(1)}% success)`);
    });

    // Overall Assessment
    console.log(chalk.blue('\n🎯 Performance Assessment:'));
    const avgQueryTime = this.results.queryTests.reduce((sum, test) => 
      sum + (test.avgDuration || test.duration || 0), 0) / this.results.queryTests.length;
    
    if (avgQueryTime < 100) {
      console.log(chalk.green('  ✅ Database performance: Excellent'));
    } else if (avgQueryTime < 500) {
      console.log(chalk.yellow('  ⚠️  Database performance: Good'));
    } else {
      console.log(chalk.red('  ❌ Database performance: Needs optimization'));
    }

    console.log(chalk.gray('\n' + '=' * 60));
  }
}

// Run the database tests
if (require.main === module) {
  const tester = new DatabasePerformanceTester();
  tester.runAllTests().catch(console.error);
}

module.exports = DatabasePerformanceTester;