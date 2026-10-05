import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || 'kichubanai'

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

export function isMongoConfigured(): boolean {
  return Boolean(uri && uri.trim().length > 0)
}

export async function getMongoClient(): Promise<MongoClient | null> {
  if (!isMongoConfigured()) {
    return null
  }

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri!, {
        serverSelectionTimeoutMS: 5000,
      })
      global._mongoClientPromise = client.connect()
    }
    return global._mongoClientPromise
  } else {
    if (!clientPromise) {
      client = new MongoClient(uri!, {
        serverSelectionTimeoutMS: 5000,
      })
      clientPromise = client.connect()
    }
    return clientPromise
  }
}

export async function getDatabase(): Promise<Db | null> {
  try {
    const mongoClient = await getMongoClient()
    if (!mongoClient) return null
    return mongoClient.db(dbName)
  } catch (err: any) {
    console.warn('MongoDB connection failed (check Atlas IP whitelist):', err.message)
    return null
  }
}

export const COLLECTIONS = {
  USERS: 'users',
  DESIGNS: 'designs',
  DESIGN_VERSIONS: 'designVersions',
  TEMPLATES: 'templates',
  ORDERS: 'orders',
  ORDER_SNAPSHOTS: 'orderSnapshots',
  PRODUCTION_REVISIONS: 'productionRevisions',
} as const
