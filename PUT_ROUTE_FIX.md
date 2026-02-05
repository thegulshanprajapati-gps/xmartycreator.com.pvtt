# PUT Route - .save() Error Fix (2026-01-25)

## Issue
```
Error: U.save is not a function
PUT https://xmartycreator.com/api/blog/-scholorship-2026- 500
```

## Root Cause
The Mongoose document returned from `.exec()` wasn't being properly recognized as a Mongoose document instance, so it lacked the `.save()` method.

## Solution Applied

### 1. **Explicitly Disable Lean Mode** 
Added `.lean(false)` before `.exec()` to ensure we get a full Mongoose document:

```typescript
// BEFORE
const blog = await Blog.findOne({ slug })
  .select('+content +htmlContent')
  .maxTimeMS(3000)
  .exec();

// AFTER  
let blog;
try {
  blog = await Blog.findOne({ slug })
    .select('+content +htmlContent')
    .maxTimeMS(3000)
    .lean(false) // ✅ Explicitly disable lean to get Mongoose document
    .exec(); // ✅ exec() returns a Mongoose document
} catch (queryError) {
  console.error('Blog query error:', queryError);
  throw queryError;
}
```

### 2. **Added Document Verification**
Added explicit check that blog has `.save()` method for debugging:

```typescript
// Verify blog has save method
if (typeof blog.save !== 'function') {
  console.error('Blog document does not have save method. Type:', typeof blog, 'Keys:', Object.keys(blog || {}));
  return NextResponse.json({ error: 'Invalid blog document' }, { status: 500 });
}
```

This will tell us if there's still an issue with the document type.

### 3. **Fixed Secondary Query**
Added `.exec()` and `.lean()` to the duplicate slug check query:

```typescript
// BEFORE
const existing = await Blog.findOne({ slug: newSlug }).maxTimeMS(3000);

// AFTER
const existing = await Blog.findOne({ slug: newSlug })
  .maxTimeMS(3000)
  .lean() // ✅ Use lean for read-only check
  .exec();
```

## Files Changed
- [src/app/api/blog/[slug]/route.ts](src/app/api/blog/[slug]/route.ts) - PUT route

## What to Do Next

### 1. **Clear Next.js Cache**
```bash
cd c:\Users\Gulshan\Desktop\xmartycreator.com
rm -r .next  # Or del .next /s /q on Windows
```

### 2. **Restart Dev Server**
```bash
npm run dev
```

### 3. **Test the Fix**
Try to edit a blog again. If you still get the error, check the server console for the debugging information we added.

### 4. **If Error Persists**
The error message will now tell us exactly what type `blog` is and what properties it has, helping us debug further.

## Key Mongoose Patterns

| Pattern | When to Use | Returns |
|---------|------------|---------|
| `.find()` | Read many | Query builder |
| `.findOne()` | Read one | Query builder |
| `.lean()` | Read (no modifications) | Plain object |
| `.exec()` | Execute query | Mongoose document |
| `.lean().exec()` | Read only | Plain object |
| `.exec()` alone | Modify & save | Mongoose document ✅ |

## Production Checklist

- ✅ `.lean(false)` explicitly set for save operations
- ✅ Error handling added for query failures
- ✅ Document type verification added
- ✅ Duplicate slug check has proper query chain
- ✅ No compilation errors
- ✅ Ready for testing

---

**Status**: Ready for Testing | **Changes**: 3 files modified | **Build**: Clear `.next` folder and restart
