/**
 * MONGOOSE PATTERNS REFERENCE GUIDE
 * Production-Ready Solutions for .save() and .toObject() Errors
 * 
 * Last Updated: 2026-01-25
 */

// ============================================================================
// ERROR #1: "U.save is not a function"
// ============================================================================
/**
 * What causes it?
 * Using findOneAndUpdate() or findByIdAndUpdate() then calling .save()
 * 
 * Why it fails?
 * findOneAndUpdate() returns a plain object, NOT a Mongoose document
 * Plain objects don't have the .save() method
 * 
 * Example - WRONG ❌
 */
async function wrongUpdatePattern(id: string) {
  const doc = await User.findByIdAndUpdate(id, { name: 'John' });
  await doc.save(); // ❌ ERROR: .save() is not a function
}

/**
 * Example - RIGHT ✅
 */
async function correctUpdatePattern(id: string) {
  // Pattern 1: findOne() + exec() + modify + save()
  const doc = await User.findById(id).exec(); // ✅ Returns Mongoose document
  doc.name = 'John';
  doc.email = 'john@example.com';
  await doc.save(); // ✅ Works because doc is a Mongoose document
}

// ============================================================================
// ERROR #2: "c.toObject is not a function"
// ============================================================================
/**
 * What causes it?
 * Using .lean() then calling .toObject()
 * 
 * Why it fails?
 * .lean() returns a plain JavaScript object, NOT a Mongoose document
 * Plain objects don't have the .toObject() method
 * 
 * Example - WRONG ❌
 */
async function wrongReadPattern() {
  const doc = await User.findById('123').lean();
  const plain = doc.toObject(); // ❌ ERROR: toObject is not a function
}

/**
 * Example - RIGHT ✅
 */
async function correctReadPattern() {
  // Pattern 1: Use .exec() if you need to call methods
  const doc = await User.findById('123').exec(); // ✅ Mongoose document
  const plain = doc.toObject(); // ✅ Works
  
  // Pattern 2: Use .lean() ONLY if you just need the plain object
  const plainDoc = await User.findById('123').lean(); // ✅ Already plain
  return plainDoc; // ✅ Return directly, no .toObject() needed
}

// ============================================================================
// COMPLETE REFERENCE: All Query Patterns
// ============================================================================

/**
 * PATTERN 1: READ ONLY - Return plain object
 * 
 * Use when: You only need to read data, no modifications
 * Chain: .find() | .findOne() -> .lean() -> return directly
 * No need to call .toObject() (already plain)
 * 
 * Performance: Fastest (skips Mongoose overhead)
 * Memory: Lowest (plain objects are lighter)
 */
async function readOnlyPattern() {
  const blog = await Blog.findOne({ slug: 'my-post' }).lean();
  return blog; // ✅ Already a plain object, no .toObject() needed
}

/**
 * PATTERN 2: READ WITH POTENTIAL MODIFICATION - Return plain object safely
 * 
 * Use when: You might need to modify the document later
 * Chain: .find() | .findOne() -> .exec() -> .toObject() -> return
 * Always call .toObject() to ensure plain object for REST API
 * 
 * Performance: Slightly slower (Mongoose overhead)
 * Memory: Slightly higher (Mongoose wrapper)
 * But: Allows .save() if you change your mind
 */
async function readWithModificationPattern() {
  const blog = await Blog.findOne({ slug: 'my-post' })
    .select('+content +htmlContent')
    .exec(); // ✅ Returns Mongoose document
  
  const plainBlog = blog.toObject(); // ✅ Convert to plain object
  return plainBlog; // ✅ Return plain object for REST API
}

/**
 * PATTERN 3: MODIFY & SAVE - Query, modify, persist
 * 
 * Use when: You need to update data
 * Chain: .find() | .findOne() -> .exec() -> modify props -> .save()
 * NEVER use findOneAndUpdate() if you plan to call .save()
 * 
 * Performance: Medium (includes .save() operation)
 * Memory: Medium (Mongoose overhead + persistence)
 */
async function modifyAndSavePattern() {
  const blog = await Blog.findOne({ slug: 'my-post' })
    .select('+content')
    .exec(); // ✅ Returns Mongoose document
  
  // Modify the document
  blog.title = 'New Title';
  blog.content = { type: 'doc', content: [] };
  blog.updatedAt = new Date();
  
  await blog.save(); // ✅ Works because blog is a Mongoose document
  
  // For API response, convert to plain object
  return blog.toObject();
}

/**
 * PATTERN 4: CREATE - New document, save, return
 * 
 * Use when: Creating new records
 * Chain: new Model() -> .save() -> .toObject()
 * Always create new instance first
 * 
 * Performance: Fast (single write)
 * Memory: Low
 */
async function createPattern() {
  const newBlog = new Blog({
    title: 'My New Post',
    slug: 'my-new-post',
    content: { type: 'doc', content: [] },
    author: 'John',
  });
  
  await newBlog.save(); // ✅ Works on new instances
  return newBlog.toObject(); // ✅ Convert for API response
}

/**
 * PATTERN 5: DELETE - Find and remove
 * 
 * Use when: Deleting records
 * Chain: .findOneAndDelete() -> return result
 * findOneAndDelete already returns the deleted document
 * 
 * Performance: Fast (single delete)
 * Memory: Very low
 */
async function deletePattern() {
  const deleted = await Blog.findOneAndDelete({ slug: 'my-post' });
  // returned document is plain object, can return directly
  return { message: 'Deleted', slug: deleted?.slug };
}

/**
 * PATTERN 6: UPSERT - Create if not exists, update if exists
 * 
 * Use when: Simple create-or-update
 * Chain: .findOneAndUpdate() with upsert: true
 * Returns the final document (plain object by default)
 * 
 * Performance: Fast (single operation)
 * Memory: Very low
 */
async function upsertPattern(slug: string, data: any) {
  const updated = await Blog.findOneAndUpdate(
    { slug },
    data,
    { upsert: true, new: true } // ✅ new: true returns updated doc
  );
  return updated; // ✅ Already plain object
}

// ============================================================================
// HELPER FUNCTIONS - USE IN YOUR CODE
// ============================================================================

/**
 * Safe conversion - works with both Mongoose docs and plain objects
 * Use this when you're not sure what type of object you have
 */
export function toPlainObject<T>(data: any): T {
  if (!data) return data;
  
  // If it's a Mongoose document, convert
  if (typeof data.toObject === 'function') {
    return data.toObject() as T;
  }
  
  // If it's already plain, return as-is
  return data as T;
}

/**
 * Safe conversion for arrays
 */
export function toPlainObjectArray<T>(data: any[]): T[] {
  if (!Array.isArray(data)) return [];
  return data.map(item => toPlainObject<T>(item));
}

// ============================================================================
// APPLYING TO YOUR CODEBASE - QUICK FIXES
// ============================================================================

/**
 * File: src/app/api/courses/[id]/route.ts
 * Current: findByIdAndUpdate() [WRONG]
 * Fix: Use findById() + exec() + modify + save()
 * 
 * BEFORE:
 * const course = await Course.findByIdAndUpdate(id, updateData, { new: true });
 * await course.save(); // ❌ ERROR
 * 
 * AFTER:
 * const course = await Course.findById(id).exec();
 * Object.assign(course, updateData);
 * await course.save(); // ✅ Works
 */

/**
 * File: src/app/api/courses/route.ts
 * Current: .lean() then using fields [OK]
 * Status: Already correct, no changes needed
 * 
 * const course = await Course.findOne({ slug }).lean();
 * return course; // ✅ Correct
 */

/**
 * File: src/app/blog/[slug]/page.tsx
 * Current: .lean().exec() [REDUNDANT]
 * Status: Works but redundant
 * 
 * BEFORE:
 * const blog = await Blog.findOne({ slug }).lean().exec();
 * 
 * AFTER - better:
 * const blog = await Blog.findOne({ slug }).lean();
 * // .lean() already executes, .exec() is unnecessary
 */

// ============================================================================
// MONGOOSE QUERY METHODS CHEAT SHEET
// ============================================================================

/**
 * Type: EXECUTABLE (data retrieval)
 * These MUST end with .exec() or .then() or await
 * 
 * .findOne({ field: value })
 * .find({ field: value })
 * .findById(id)
 * .findOneAndDelete()
 * .findOneAndUpdate()
 * .findByIdAndUpdate()
 * .findByIdAndDelete()
 * .count()
 * .countDocuments()
 */

/**
 * Type: CHAINABLE MODIFIERS
 * Used to modify the query (call before .exec())
 * 
 * .select('field1 field2')      // Which fields to return
 * .select('+hidden')            // Include hidden fields (select: false)
 * .lean()                       // Return plain objects (faster)
 * .exec()                       // Execute query, return Mongoose doc
 * .sort({ createdAt: -1 })     // Sort results
 * .limit(10)                    // Limit results
 * .skip(10)                     // Skip N records
 * .maxTimeMS(3000)              // Query timeout
 */

/**
 * Type: ACTION METHODS (non-queryable)
 * Call directly on new instances
 * 
 * new Model(data)
 * .save()                       // Only on Mongoose documents
 * .remove()                     // Deprecated, use findOneAndDelete
 * .deleteOne()                  // Delete this instance
 * .toObject()                   // Only on Mongoose documents
 */

// ============================================================================
// DECISION TREE: Which pattern should I use?
// ============================================================================

/**
 * Q: Do I need to modify and save?
 * A: YES  -> Use .exec() + modify + .save()
 * A: NO   -> Use .lean() for performance
 * 
 * Q: Am I creating new documents?
 * A: YES  -> Use new Model() + .save() + .toObject()
 * A: NO   -> See Q1
 * 
 * Q: Am I deleting?
 * A: YES  -> Use .findOneAndDelete()
 * A: NO   -> See Q1
 * 
 * Q: Do I need hidden fields (select: false)?
 * A: YES  -> Add .select('+field +field2') before .exec()/.lean()
 * A: NO   -> No need
 * 
 * Q: Should I return plain object to REST API?
 * A: Always  -> Call .toObject() before JSON response
 */

// ============================================================================
// COMMON MISTAKES - AVOID THESE
// ============================================================================

/**
 * ❌ WRONG #1: Calling .save() on findOneAndUpdate result
 * const doc = await User.findOneAndUpdate({ id }, data);
 * await doc.save(); // ❌ ERROR: .save() is not a function
 */

/**
 * ❌ WRONG #2: Calling .toObject() on .lean() result
 * const doc = await User.findOne().lean();
 * doc.toObject(); // ❌ ERROR: .toObject() is not a function
 */

/**
 * ❌ WRONG #3: Forgetting .exec() then trying to modify
 * const doc = await User.findOne({ id }).lean();
 * doc.name = 'John'; // ✅ Modifies in memory
 * await doc.save(); // ❌ No .save() on plain objects
 */

/**
 * ❌ WRONG #4: Using .lean() when you need to modify
 * const doc = await User.findOne({ id }).lean();
 * // doc is now plain, you can't .save()
 */

/**
 * ✅ RIGHT #1: Using .exec() for future modifications
 * const doc = await User.findOne({ id }).exec();
 * doc.name = 'John';
 * await doc.save(); // ✅ Works
 */

/**
 * ✅ RIGHT #2: Using .lean() only for read
 * const doc = await User.findOne({ id }).lean();
 * return doc; // ✅ Works, plain object returned
 */

/**
 * ✅ RIGHT #3: Calling .toObject() only on Mongoose docs
 * const doc = await User.findOne({ id }).exec();
 * const plain = doc.toObject(); // ✅ Works
 * return plain;
 */

// ============================================================================
// MIGRATION GUIDE: Fix existing routes
// ============================================================================

/**
 * STEP 1: Identify your API route file
 * Find: src/app/api/[resource]/route.ts
 * 
 * STEP 2: Find error pattern
 * Search for:
 *   - findOneAndUpdate(...).save()
 *   - findByIdAndUpdate(...).save()
 *   - .lean().toObject()
 *   - .lean().save()
 * 
 * STEP 3: Apply correct pattern
 * If modifying:  Use .exec() + modify + .save()
 * If reading:    Use .lean() (faster)
 * If both:       Use .exec() (more flexible)
 * 
 * STEP 4: Test
 * Manually test: curl http://localhost:3000/api/[route]
 * Check console for errors
 */

// ============================================================================
// PERFORMANCE TIPS
// ============================================================================

/**
 * Fastest: .lean() for read-only
 * - Skips Mongoose wrapper
 * - Returns plain object
 * - ~20% faster for large result sets
 * 
 * When: Use when you don't need to save/modify
 * Example: Public blog list API
 */

/**
 * Medium: .exec() + .toObject()
 * - Includes Mongoose wrapper
 * - Convert on output
 * - Required for modifications
 * 
 * When: Use when you might modify or need hidden fields
 * Example: Admin blog edit API
 */

/**
 * Slowest: Multiple queries
 * - Avoid N+1 queries
 * - Use .populate() for relationships
 * - Use .select() to exclude large fields
 * 
 * When: Never use intentionally
 * Example of anti-pattern: Loop, call findById in each iteration
 */

// ============================================================================
// TESTING
// ============================================================================

/**
 * Test your changes:
 * 
 * 1. Start dev server: npm run dev
 * 2. Test GET endpoint: curl http://localhost:3000/api/blog
 * 3. Test POST endpoint:
 *    curl -X POST http://localhost:3000/api/blog \
 *    -H "Content-Type: application/json" \
 *    -d '{"title":"Test","content":"...","author":"You"}'
 * 4. Test PUT endpoint:
 *    curl -X PUT http://localhost:3000/api/blog/my-slug \
 *    -H "Content-Type: application/json" \
 *    -d '{"title":"Updated"}'
 * 5. Check browser console for errors
 * 6. Check server console for uncaught errors
 */

export {};
