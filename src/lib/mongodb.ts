import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017";

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 20,
  minPoolSize: 5,
  maxIdleTimeMS: 45000,
  waitQueueTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
  connectTimeoutMS: 30000,  // Increased from 10000 to 30 seconds
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 30000,  // Added for better cluster discovery
  ssl: true,
  authSource: "admin",
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global._mongoClientPromise) {
  console.log('🔄 [MongoDB] Initializing MongoDB connection...');
  console.log(`📍 [MongoDB] Connection URI: ${uri.replace(/:[^:]*@/, ':****@')}`); // Log URI without password
  console.log(`⚙️  [MongoDB] Connection timeout: ${options.connectTimeoutMS}ms, Server selection timeout: ${options.serverSelectionTimeoutMS}ms`);
  
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client
    .connect()
    .then((connectedClient) => {
      console.log('✅ [MongoDB] Connected Successfully!');
      console.log(`📦 [MongoDB] Pool size: min=${options.minPoolSize}, max=${options.maxPoolSize}`);
      return connectedClient;
    })
    .catch((error) => {
      console.error('❌ [MongoDB] Failed to connect to MongoDB');
      console.error('📋 [MongoDB] Error details:', error.message);
      console.error('🔍 [MongoDB] Error code:', error.code);
      if (error.message.includes('timed out') || error.message.includes('ECONNREFUSED')) {
        console.error('💡 [MongoDB] Connection timeout detected. Check:');
        console.error('   - MongoDB Atlas cluster status (not paused/overloaded)');
        console.error('   - IP whitelist on MongoDB Atlas (add current server IP)');
        console.error('   - Network connectivity and firewall settings');
        console.error('   - VPN/Proxy configuration');
      }
      throw error;
    });
}
clientPromise = global._mongoClientPromise;

export default clientPromise;
