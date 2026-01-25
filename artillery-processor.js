module.exports = {
  setup: function(context, ee, next) {
    console.log('🚀 Load test starting...');
    
    // Track metrics
    ee.on('counter', (name, value) => {
      console.log(`Counter: ${name} = ${value}`);
    });

    return next();
  },

  cleanup: function(context, ee, next) {
    console.log('🏁 Load test completed');
    return next();
  },

  beforeRequest: function(requestParams, context, ee, next) {
    // Add custom headers
    requestParams.headers = requestParams.headers || {};
    requestParams.headers['X-Load-Test'] = 'true';
    requestParams.headers['X-Timestamp'] = Date.now().toString();

    return next();
  },

  afterResponse: function(requestParams, responseParams, context, ee, next) {
    // Log slow requests
    if (responseParams.statusCode !== 200 && responseParams.statusCode !== 404) {
      console.warn(`⚠️ Status ${responseParams.statusCode}: ${requestParams.url}`);
    }

    if (responseParams.rtt > 1000) {
      console.warn(`🐢 Slow response ${responseParams.rtt}ms: ${requestParams.url}`);
    }

    // Check for rate limiting
    if (responseParams.statusCode === 429) {
      console.warn('🚫 Rate limited!');
      ee.emit('customStat', 'rate_limit_hit', 1);
    }

    // Track cache hits
    if (responseParams.headers['x-cache'] === 'HIT') {
      ee.emit('customStat', 'cache_hit', 1);
    }

    return next();
  },

  generateContext: function(contextVars, callback) {
    return callback(null, contextVars);
  },
};
