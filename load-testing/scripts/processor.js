const faker = require('faker');

// Custom functions for Artillery scenarios
module.exports = {
  // Generate random email
  randomEmail: function(context, events, done) {
    context.vars['randomEmail'] = faker.internet.email();
    return done();
  },

  // Generate random phone number
  randomPhone: function(context, events, done) {
    context.vars['randomPhone'] = `+25677${Math.floor(Math.random() * 9000000) + 1000000}`;
    return done();
  },

  // Generate future date
  futureDate: function(context, events, done) {
    const future = new Date();
    future.setDate(future.getDate() + Math.floor(Math.random() * 30) + 1);
    context.vars['futureDate'] = future.toISOString().split('T')[0];
    return done();
  },

  // Generate past date
  pastDate: function(context, events, done) {
    const past = new Date();
    past.setDate(past.getDate() - Math.floor(Math.random() * 30) - 1);
    context.vars['pastDate'] = past.toISOString().split('T')[0];
    return done();
  },

  // Generate timestamp
  timestamp: function(context, events, done) {
    context.vars['timestamp'] = new Date().toISOString();
    return done();
  },

  // Generate random float
  randomFloat: function(min, max) {
    return Math.random() * (max - min) + min;
  },

  // Generate random integer
  randomInt: function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Pick random item from array
  randomPick: function(array) {
    return array[Math.floor(Math.random() * array.length)];
  },

  // Log response times for analysis
  logResponse: function(requestParams, response, context, events, done) {
    if (response.statusCode >= 400) {
      console.log(`❌ Error ${response.statusCode}: ${requestParams.url}`);
    } else if (response.timings && response.timings.response > 2000) {
      console.log(`⚠️  Slow response (${response.timings.response}ms): ${requestParams.url}`);
    }
    return done();
  },

  // Custom validation for booking responses
  validateBooking: function(requestParams, response, context, events, done) {
    if (response.statusCode === 201 && response.body) {
      const booking = JSON.parse(response.body);
      if (booking.id && booking.status) {
        console.log(`✅ Booking created: ${booking.id}`);
      } else {
        console.log(`⚠️  Invalid booking response structure`);
      }
    }
    return done();
  },

  // Track concurrent users
  trackConcurrentUser: function(context, events, done) {
    if (!global.concurrentUsers) {
      global.concurrentUsers = 0;
    }
    global.concurrentUsers++;
    context.vars['concurrentUsers'] = global.concurrentUsers;
    
    // Log every 50 users
    if (global.concurrentUsers % 50 === 0) {
      console.log(`👥 Concurrent users: ${global.concurrentUsers}`);
    }
    
    return done();
  },

  // Cleanup on user exit
  cleanupUser: function(context, events, done) {
    if (global.concurrentUsers > 0) {
      global.concurrentUsers--;
    }
    return done();
  }
};