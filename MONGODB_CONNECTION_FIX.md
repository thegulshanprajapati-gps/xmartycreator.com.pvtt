# MongoDB Connection Timeout Fix

## Problem
```
MongoNetworkTimeoutError: Socket 'secureConnect' timed out after 11583ms (connectTimeoutMS: 10000)
```

The MongoDB connection was timing out after 11.5 seconds, but the connection timeout was only set to 10 seconds.

## Root Causes
1. **Insufficient connection timeout** - `connectTimeoutMS: 10000` (10 seconds) is too short for Atlas clusters under load or with network latency
2. **Missing server selection timeout** - No configuration for `serverSelectionTimeoutMS`
3. **Undersized connection pool** - `maxPoolSize: 10` and `minPoolSize: 2` may be insufficient
4. **Mixed connection approaches** - Using both `clientPromise` and `mongoose.connect()` independently

## Solutions Applied

### 1. Updated MongoDB Configuration (`src/lib/mongodb.ts`)

**Changes:**
- `connectTimeoutMS`: 10000 → 30000 (30 seconds)
- `socketTimeoutMS`: 45000 (unchanged, but documented)
- `serverSelectionTimeoutMS`: Added 30000 (handles host discovery)
- `maxPoolSize`: 10 → 20 (more concurrent connections)
- `minPoolSize`: 2 → 5 (maintain more ready connections)
- `maxIdleTimeMS`: Added 45000 (cleanup idle connections)
- `ssl`: Added `true` (explicit SSL enforcement for Atlas)
- `authSource`: Added `"admin"` (explicit authentication database)

**Enhanced error logging** to diagnose connection issues:
```typescript
if (error.message.includes('timed out') || error.message.includes('ECONNREFUSED')) {
  console.error('💡 [MongoDB] Connection timeout detected. Check:');
  console.error('   - MongoDB Atlas cluster status (not paused/overloaded)');
  console.error('   - IP whitelist on MongoDB Atlas (add current server IP)');
  console.error('   - Network connectivity and firewall settings');
  console.error('   - VPN/Proxy configuration');
}
```

### 2. Refactored Courses API (`src/app/api/courses/route.ts`)

**Changes:**
- Removed dependency on `clientPromise`
- Uses Mongoose directly with proper connection state checking
- Unified connection logic for GET and POST methods
- Better error handling with informative messages
- Explicit environment variable fallback (MONGODB_URI → MONGO_URI)

### 3. Pages API File

The [src/app/api/pages/[slug]/route.ts](src/app/api/pages/[slug]/route.ts) still uses `clientPromise` but will benefit from the improved timeout settings.

## Troubleshooting Steps

If the error persists after these changes:

### 1. Check MongoDB Atlas Cluster Status
```
- Go to https://cloud.mongodb.com
- Select your cluster (Cluster0)
- Verify cluster status is "Active" (not "Paused" or "Creating")
- Check your cluster has enough capacity
```

### 2. Verify IP Whitelist
```
- In MongoDB Atlas, go to Network Access > IP Whitelist
- Ensure your server's public IP is whitelisted
- For development: Add 0.0.0.0/0 (allows all IPs) - NOT recommended for production
- For production with app hosting: Add the specific IP or use "Cloud Environment"
```

### 3. Check Environment Variables
```bash
# Verify MONGO_URI and MONGODB_URI are properly set
echo "MONGO_URI: $MONGO_URI"
echo "MONGODB_URI: $MONGODB_URI"
```

### 4. Test Direct Connection
```bash
# Use MongoDB shell to test connection
mongosh "mongodb+srv://xmartycreator:xmarty123@cluster0.kclupy4.mongodb.net/xmartydb"

# If it connects and works, the issue is app-specific
# If it times out, the problem is network/credentials
```

### 5. Check Network/Firewall
- Verify you can reach MongoDB Atlas ports (27017 for standard, 443 for srv)
- Check if running through a VPN or proxy that blocks outbound connections
- Test from command line: `ping cluster0.kclupy4.mongodb.net`

### 6. Monitor Atlas Metrics
```
- Check Connection Count in Atlas metrics
- Look for connection errors in Atlas logs
- Check Database Activity for slow queries
```

## API Routes That Need Updating

The following routes still use the old `clientPromise` pattern and should be updated similarly when accessed:

- `src/app/api/updates/route.ts`
- `src/app/api/updates/[id]/route.ts`
- `src/app/api/pages/[slug]/route.ts` (affected in error logs)
- `src/app/api/images/route.ts`
- `src/app/api/images/[id]/route.ts`
- `src/app/api/images/seed/route.ts`

Consider creating a shared utility function to handle MongoDB connection as shown in the updated courses route.

## Recommended Next Steps

1. **Rebuild and test**
   ```bash
   npm run build
   npm run dev
   ```

2. **Monitor logs** for the new diagnostic output showing:
   - Connection timeout values
   - Pool size configuration
   - Successful connection confirmation

3. **Check Atlas metrics** during requests to verify:
   - New connections are being made
   - Connection pooling is working
   - No errors in server logs

4. **If still failing**, share the full error logs which will now include more diagnostic information

## Performance Tips

- **Connection Pooling**: The increased pool sizes help with concurrent requests
- **Retry Logic**: `retryWrites: true` and `retryReads: true` handle transient network issues
- **Timeout Tuning**: Adjust `connectTimeoutMS` based on your network conditions
- **Compression**: Consider adding `compressors: ['snappy', 'zlib']` for large datasets

## Environment Variables

Ensure both are set in `.env`:
```
MONGO_URI=mongodb+srv://xmartycreator:xmarty123@cluster0.kclupy4.mongodb.net/xmartydb?appName=Cluster0&retryWrites=true&w=majority&ssl=true
MONGODB_URI=mongodb+srv://xmartycreator:xmarty123@cluster0.kclupy4.mongodb.net/xmartydb?appName=Cluster0&retryWrites=true&w=majority&ssl=true
```

Both variables are set to ensure compatibility with different connection methods.
