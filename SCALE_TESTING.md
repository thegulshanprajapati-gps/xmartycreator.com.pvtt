# Scale Testing Guide

## 1. Load Test with K6

### Run test locally:
```bash
k6 run --vus 100 --duration 5m load-test.k6.js
```

### Run on cloud:
```bash
k6 cloud load-test.k6.js
```

### With custom target:
```bash
K6_BASE_URL=https://xmartycreator.com k6 run load-test.k6.js
```

## 2. Load Test with Artillery

### Run basic test:
```bash
artillery run artillery.yml
```

### Generate HTML report:
```bash
artillery run artillery.yml --output report.json
artillery report report.json
```

### Custom target:
```bash
artillery run artillery.yml -t https://xmartycreator.com
```

## 3. Monitor During Tests

### Check system health:
```bash
curl -H "Authorization: Bearer $MONITORING_TOKEN" \
  https://xmartycreator.com/api/monitoring/metrics
```

### Monitor rate limits:
```bash
curl https://xmartycreator.com/api/health
```

## 4. Expected Results at 10 Lakh+ Users/Day

- **RPS**: 500-1000 requests/second
- **Response Time (P95)**: < 500ms
- **Cache Hit Rate**: 90%+
- **DB Pool Utilization**: < 80%
- **Error Rate**: < 1%
- **Circuit Breaker**: Healthy

## 5. Load Test Stages

1. **Ramp Up** (1 min): 0 → 100 users
2. **Scale** (3 min): 100 → 500 users  
3. **Peak** (5 min): 500-1000 users
4. **Stress** (10 min): Sustain 1000 users
5. **Ramp Down** (2 min): 1000 → 0 users

## 6. Success Criteria

✅ P95 response time < 500ms
✅ P99 response time < 1000ms
✅ Cache hit rate > 85%
✅ Error rate < 1%
✅ No rate limiting needed
