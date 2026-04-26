import mongoose from "mongoose";

type MongooseGlobal = typeof globalThis & {
  __skillforge_mongoose__?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

const globalRef = globalThis as MongooseGlobal;

if (!globalRef.__skillforge_mongoose__) {
  globalRef.__skillforge_mongoose__ = { conn: null, promise: null };
}

export async function connectMongoose() {
  const MONGOOSE_URI = process.env.MONGODB_URI;
  if (!MONGOOSE_URI) {
    throw new Error("Missing MONGODB_URI in environment.");
  }

  const cache = globalRef.__skillforge_mongoose__!;

  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGOOSE_URI, {
      dbName: process.env.MONGODB_DB,
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
