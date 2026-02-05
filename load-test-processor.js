module.exports = {
  setup: function(context, ee, next) {
    console.log('Load test started at:', new Date().toISOString());
    ee.on('done', function(report) {
      console.log('\n=== Load Test Results ===');
      console.log('Total requests:', report.aggregate.codes['200'] || 0);
      console.log('Failed requests:', report.aggregate.codes['500'] || 0);
      console.log('Mean latency:', Math.round(report.aggregate.latency.mean), 'ms');
      console.log('p95 latency:', Math.round(report.aggregate.latency.p95), 'ms');
      console.log('p99 latency:', Math.round(report.aggregate.latency.p99), 'ms');
    });
    next();
  },

  beforeRequest: function(requestParams, context, ee, next) {
    // Add user agent
    requestParams.headers = requestParams.headers || {};
    requestParams.headers['User-Agent'] = 'Artillery-LoadTest/1.0';
    
    // Add request ID for tracking
    requestParams.headers['X-Request-ID'] = Math.random().toString(36).substr(2, 9);
    
    next();
  },

  afterResponse: function(requestParams, response, context, ee, next) {
    // Track response times
    if (response.statusCode === 200) {
      ee.emit('customStat', {
        stat: 'request_success',
        value: 1,
        tags: ['endpoint:' + requestParams.path.split('/')[1]],
      });
    } else {
      ee.emit('customStat', {
        stat: 'request_failed',
        value: 1,
        tags: ['status:' + response.statusCode],
      });
    }

    // Check cache headers
    if (response.headers['cache-control']) {
      ee.emit('customStat', {
        stat: 'cache_hits',
        value: 1,
      });
    }

    next();
  },
};
