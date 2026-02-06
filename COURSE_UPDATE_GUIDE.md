# Course Update Guide

## View All Courses with Pricing

```bash
# Terminal
curl http://localhost:3000/api/admin/courses-pricing

# Browser Console
fetch('/api/admin/courses-pricing').then(r => r.json()).then(d => console.table(d.courses))
```

## Update Python Course with Discount

### Option 1: Via API (Recommended)

```bash
# Terminal
curl -X POST http://localhost:3000/api/admin/update-course?slug=python \
  -H "Content-Type: application/json" \
  -d '{
    "originalPrice": 2000,
    "discount": 50
  }'
```

### Option 2: Browser Console

```javascript
// Get courseId first
const courses = await fetch('/api/admin/courses-pricing').then(r => r.json());
const pythonCourse = courses.courses.find(c => c.slug === 'python');
const courseId = pythonCourse._id;

// Update the course  
fetch(`/api/courses/${courseId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    originalPrice: 2000,
    discount: 50
  })
}).then(r => r.json()).then(d => console.log('Updated:', d));
```

## What Changed

1. **course-list-client.tsx**: Improved `mapCourse()` function with better discount calculation:
   - Uses explicit DB discount if set
   - Calculates from originalPrice if available  
   - Auto-suggests 40% discount as fallback for visual consistency

2. **New Admin Endpoints**:
   - `GET /api/admin/courses-pricing` - List all courses with pricing
   - `POST /api/admin/update-course?slug=<slug>` - Update course by slug with discount

3. **course-card.tsx**: Already has fallback discount calculation

## Expected Result

After updating:
- Python course will show: "₹1,000" crossed out, "₹500", and "50% OFF" badge
- Just like DevOps course displays
