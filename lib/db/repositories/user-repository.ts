import { getDatabase, COLLECTIONS } from '@/lib/db/mongodb'
import { hashPassword, normalizeMobile, UserRole } from '@/lib/auth/jwt'
import { ObjectId } from 'mongodb'

export interface UserRecord {
  id: string
  email: string
  mobile?: string
  password: string // hashed
  name: string
  role: UserRole
  status: 'active' | 'disabled'
  failedLoginAttempts: number
  lockUntil?: Date | null
  tokenVersion: number
  createdAt: Date
  updatedAt: Date
}

// In-memory fallback cache to ensure zero downtime during development or Atlas network config changes
const memoryUsers = new Map<string, UserRecord>()

/**
 * Initializes default SuperAdmin if not present
 */
const DEFAULT_SUPERADMIN_EMAIL = 'mohsindude5@gmail.com'
const DEFAULT_SUPERADMIN_PASS = 'admin123456' // Can be updated by admin

let isBootstrapped = false

async function bootstrapSuperAdmin() {
  if (isBootstrapped) return
  isBootstrapped = true

  const defaultAdmin: UserRecord = {
    id: 'superadmin_initial_id',
    email: DEFAULT_SUPERADMIN_EMAIL,
    mobile: '01700000000',
    password: hashPassword(DEFAULT_SUPERADMIN_PASS),
    name: 'Mohsin (Super Admin)',
    role: 'super_admin',
    status: 'active',
    failedLoginAttempts: 0,
    lockUntil: null,
    tokenVersion: 1,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date(),
  }

  // Add to in-memory fallback
  if (!memoryUsers.has(DEFAULT_SUPERADMIN_EMAIL)) {
    memoryUsers.set(DEFAULT_SUPERADMIN_EMAIL, defaultAdmin)
  }

  // Also upsert to MongoDB if connected
  try {
    const db = await getDatabase()
    if (db) {
      const collection = db.collection<any>(COLLECTIONS.USERS)
      const existing = await collection.findOne({ email: DEFAULT_SUPERADMIN_EMAIL })
      if (!existing) {
        await collection.insertOne({
          email: defaultAdmin.email,
          mobile: defaultAdmin.mobile,
          password: defaultAdmin.password,
          name: defaultAdmin.name,
          role: defaultAdmin.role,
          status: defaultAdmin.status,
          failedLoginAttempts: defaultAdmin.failedLoginAttempts,
          lockUntil: null,
          tokenVersion: defaultAdmin.tokenVersion,
          createdAt: defaultAdmin.createdAt,
          updatedAt: defaultAdmin.updatedAt,
        })
      }
    }
  } catch (err) {
    // Non-blocking warning if MongoDB connection has network restriction
    console.warn('[UserRepo] MongoDB connection warning during bootstrap:', (err as any)?.message)
  }
}

// Automatically trigger bootstrap check
bootstrapSuperAdmin().catch(() => {})

/**
 * Transform MongoDB document to clean UserRecord
 */
function sanitizeDoc(doc: any): UserRecord {
  return {
    id: doc._id?.toString() || doc.id,
    email: doc.email,
    mobile: doc.mobile || '',
    password: doc.password,
    name: doc.name,
    role: (doc.role as UserRole) || 'customer',
    status: doc.status || 'active',
    failedLoginAttempts: doc.failedLoginAttempts || 0,
    lockUntil: doc.lockUntil ? new Date(doc.lockUntil) : null,
    tokenVersion: doc.tokenVersion || 0,
    createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
  }
}

/**
 * Find user by ID
 */
export async function findUserById(id: string): Promise<UserRecord | null> {
  await bootstrapSuperAdmin()

  try {
    const db = await getDatabase()
    if (db) {
      const collection = db.collection<any>(COLLECTIONS.USERS)
      let query: any = { id }
      if (ObjectId.isValid(id)) {
        query = { $or: [{ _id: new ObjectId(id) }, { id }] }
      }
      const doc = await collection.findOne(query)
      if (doc) {
        return sanitizeDoc(doc)
      }
    }
  } catch (err) {
    console.warn('[UserRepo] MongoDB query error:', (err as any)?.message)
  }

  // Memory fallback
  for (const user of memoryUsers.values()) {
    if (user.id === id) return user
  }
  return null
}

/**
 * Find user by Email or Bangladeshi Mobile Number
 */
export async function findUserByEmailOrMobile(identifier: string): Promise<UserRecord | null> {
  await bootstrapSuperAdmin()
  const cleanId = identifier.trim().toLowerCase()
  const isEmail = cleanId.includes('@')
  const mobile = !isEmail ? normalizeMobile(cleanId) : ''

  try {
    const db = await getDatabase()
    if (db) {
      const collection = db.collection<any>(COLLECTIONS.USERS)
      const query = isEmail
        ? { email: cleanId }
        : { $or: [{ mobile }, { mobile: cleanId }] }

      const doc = await collection.findOne(query)
      if (doc) {
        return sanitizeDoc(doc)
      }
    }
  } catch (err) {
    console.warn('[UserRepo] MongoDB query error:', (err as any)?.message)
  }

  // Memory fallback
  for (const user of memoryUsers.values()) {
    if (isEmail && user.email.toLowerCase() === cleanId) return user
    if (!isEmail && user.mobile && (user.mobile === mobile || user.mobile === cleanId)) return user
  }
  return null
}

/**
 * Create a new user
 */
export async function createUser(data: {
  email: string
  mobile?: string
  password: string // raw or hashed
  name: string
  role?: UserRole
  status?: 'active' | 'disabled'
}): Promise<UserRecord> {
  await bootstrapSuperAdmin()
  const cleanEmail = data.email.trim().toLowerCase()
  const cleanMobile = data.mobile ? normalizeMobile(data.mobile) : ''
  const hashedPassword = data.password.length === 64 ? data.password : hashPassword(data.password)

  const newUser: UserRecord = {
    id: new ObjectId().toString(),
    email: cleanEmail,
    mobile: cleanMobile,
    password: hashedPassword,
    name: data.name.trim(),
    role: data.role || 'customer',
    status: data.status || 'active',
    failedLoginAttempts: 0,
    lockUntil: null,
    tokenVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // Save to Memory
  memoryUsers.set(cleanEmail, newUser)

  // Save to MongoDB
  try {
    const db = await getDatabase()
    if (db) {
      const collection = db.collection<any>(COLLECTIONS.USERS)
      const result = await collection.insertOne({
        email: newUser.email,
        mobile: newUser.mobile,
        password: newUser.password,
        name: newUser.name,
        role: newUser.role,
        status: newUser.status,
        failedLoginAttempts: newUser.failedLoginAttempts,
        lockUntil: null,
        tokenVersion: newUser.tokenVersion,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      })
      newUser.id = result.insertedId.toString()
      memoryUsers.set(cleanEmail, newUser)
    }
  } catch (err) {
    console.warn('[UserRepo] MongoDB insert error:', (err as any)?.message)
  }

  return newUser
}

/**
 * Update user fields
 */
export async function updateUser(
  id: string,
  updates: Partial<Omit<UserRecord, 'id' | 'createdAt'>>
): Promise<UserRecord | null> {
  const user = await findUserById(id)
  if (!user) return null

  const updated: UserRecord = {
    ...user,
    ...updates,
    updatedAt: new Date(),
  }

  // Update in memory
  memoryUsers.set(updated.email.toLowerCase(), updated)

  try {
    const db = await getDatabase()
    if (db) {
      const collection = db.collection<any>(COLLECTIONS.USERS)
      let query: any = { id }
      if (ObjectId.isValid(id)) {
        query = { $or: [{ _id: new ObjectId(id) }, { id }] }
      }
      await collection.updateOne(query, {
        $set: {
          ...updates,
          updatedAt: updated.updatedAt,
        },
      })
    }
  } catch (err) {
    console.warn('[UserRepo] MongoDB update error:', (err as any)?.message)
  }

  return updated
}

/**
 * Record a failed login attempt with brute-force lock protection
 */
export async function recordFailedLogin(id: string): Promise<UserRecord | null> {
  const user = await findUserById(id)
  if (!user) return null

  const attempts = (user.failedLoginAttempts || 0) + 1
  let lockUntil: Date | null = null

  // Lock account for 10 minutes if 5 failed attempts reached
  if (attempts >= 5) {
    lockUntil = new Date(Date.now() + 10 * 60 * 1000)
  }

  return updateUser(id, {
    failedLoginAttempts: attempts,
    lockUntil,
  })
}

/**
 * Reset failed login attempts on successful login
 */
export async function resetFailedLogin(id: string): Promise<UserRecord | null> {
  return updateUser(id, {
    failedLoginAttempts: 0,
    lockUntil: null,
  })
}

/**
 * List all users with pagination and search (For Admin / SuperAdmin portal)
 */
export async function listUsers(params?: {
  role?: UserRole
  search?: string
  page?: number
  limit?: number
}): Promise<{ users: UserRecord[]; total: number }> {
  await bootstrapSuperAdmin()
  const page = params?.page || 1
  const limit = params?.limit || 50
  const skip = (page - 1) * limit

  try {
    const db = await getDatabase()
    if (db) {
      const collection = db.collection<any>(COLLECTIONS.USERS)
      const query: any = {}

      if (params?.role) {
        query.role = params.role
      }

      if (params?.search) {
        const regex = new RegExp(params.search, 'i')
        query.$or = [{ name: regex }, { email: regex }, { mobile: regex }]
      }

      const total = await collection.countDocuments(query)
      const docs = await collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()

      return {
        users: docs.map(sanitizeDoc),
        total,
      }
    }
  } catch (err) {
    console.warn('[UserRepo] MongoDB list error:', (err as any)?.message)
  }

  // In-memory fallback
  let list = Array.from(memoryUsers.values())
  if (params?.role) {
    list = list.filter((u) => u.role === params.role)
  }
  if (params?.search) {
    const s = params.search.toLowerCase()
    list = list.filter(
      (u) =>
        u.name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        (u.mobile && u.mobile.includes(s))
    )
  }
  const total = list.length
  const paginated = list.slice(skip, skip + limit)

  return { users: paginated, total }
}

/**
 * Delete a user (SuperAdmin only)
 */
export async function deleteUser(id: string): Promise<boolean> {
  const user = await findUserById(id)
  if (!user) return false

  memoryUsers.delete(user.email.toLowerCase())

  try {
    const db = await getDatabase()
    if (db) {
      const collection = db.collection<any>(COLLECTIONS.USERS)
      let query: any = { id }
      if (ObjectId.isValid(id)) {
        query = { $or: [{ _id: new ObjectId(id) }, { id }] }
      }
      const res = await collection.deleteOne(query)
      return res.deletedCount > 0
    }
  } catch (err) {
    console.warn('[UserRepo] MongoDB delete error:', (err as any)?.message)
  }

  return true
}
