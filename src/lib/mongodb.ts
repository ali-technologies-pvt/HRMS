import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGODB_URL || process.env.DATABASE_URL;
const options = {};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

if (uri) {
  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri!, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // In production mode (e.g. Vercel Serverless), it's best to not use a global variable.
    client = new MongoClient(uri!, options);
    clientPromise = client.connect();
  }
} else {
  // Graceful fallback when running in local preview or before env vars are added
  clientPromise = null;
}

export async function getDatabase(): Promise<Db | null> {
  if (!clientPromise) return null;
  try {
    const connectedClient = await clientPromise;
    const dbName = process.env.MONGODB_DB || 'quickslogx_hrms';
    return connectedClient.db(dbName);
  } catch (err) {
    console.warn('[MongoDB Atlas] Failed to connect to database:', err);
    return null;
  }
}

export default clientPromise;
