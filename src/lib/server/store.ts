import { promises as fs } from "fs";
import path from "path";
import type { AppState } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/cycle";
import type { StoredUser } from "./users";

type Store = {
  getUser(id: string): Promise<StoredUser | null>;
  getUserByEmail(email: string): Promise<StoredUser | null>;
  saveUser(user: StoredUser): Promise<void>;
  getCycleData(userId: string): Promise<AppState | null>;
  saveCycleData(userId: string, data: AppState): Promise<void>;
};

const DATA_DIR = path.join(process.cwd(), "data");

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function userPath(id: string): string {
  return path.join(DATA_DIR, "users", `${id}.json`);
}

function emailPath(email: string): string {
  return path.join(DATA_DIR, "emails", `${email}.txt`);
}

function cyclePath(userId: string): string {
  return path.join(DATA_DIR, "cycles", `${userId}.json`);
}

const fileStore: Store = {
  async getUser(id) {
    try {
      const raw = await fs.readFile(userPath(id), "utf8");
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  },

  async getUserByEmail(email) {
    try {
      const id = await fs.readFile(emailPath(email), "utf8");
      return this.getUser(id.trim());
    } catch {
      return null;
    }
  },

  async saveUser(user) {
    await ensureDataDir();
    await fs.mkdir(path.join(DATA_DIR, "users"), { recursive: true });
    await fs.mkdir(path.join(DATA_DIR, "emails"), { recursive: true });
    await fs.writeFile(userPath(user.id), JSON.stringify(user));
    await fs.writeFile(emailPath(user.email), user.id);
  },

  async getCycleData(userId) {
    try {
      const raw = await fs.readFile(cyclePath(userId), "utf8");
      const parsed = JSON.parse(raw) as AppState;
      return {
        cycles: parsed.cycles ?? [],
        days: parsed.days ?? {},
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      };
    } catch {
      return null;
    }
  },

  async saveCycleData(userId, data) {
    await ensureDataDir();
    await fs.mkdir(path.join(DATA_DIR, "cycles"), { recursive: true });
    await fs.writeFile(cyclePath(userId), JSON.stringify(data));
  },
};

function getRedisEnv(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ??
    process.env.KV_REST_API_URL ??
    process.env.UPSTASH_REDIS_REDIS_URL ??
    process.env.UPSTASH_REDIS_URL;

  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.KV_REST_API_TOKEN ??
    process.env.UPSTASH_REDIS_REDIS_TOKEN ??
    process.env.UPSTASH_REDIS_TOKEN;

  if (!url || !token) return null;
  return { url, token };
}

async function getRedis() {
  const env = getRedisEnv();
  if (!env) return null;

  const { Redis } = await import("@upstash/redis");
  return new Redis({ url: env.url, token: env.token });
}

const redisStore: Store = {
  async getUser(id) {
    const redis = await getRedis();
    if (!redis) return null;
    return redis.get<StoredUser>(`bewell:user:${id}`);
  },

  async getUserByEmail(email) {
    const redis = await getRedis();
    if (!redis) return null;
    const id = await redis.get<string>(`bewell:email:${email}`);
    if (!id) return null;
    return redis.get<StoredUser>(`bewell:user:${id}`);
  },

  async saveUser(user) {
    const redis = await getRedis();
    if (!redis) throw new Error("Redis is not configured.");
    await redis.set(`bewell:user:${user.id}`, user);
    await redis.set(`bewell:email:${user.email}`, user.id);
  },

  async getCycleData(userId) {
    const redis = await getRedis();
    if (!redis) return null;
    const data = await redis.get<AppState>(`bewell:cycle:${userId}`);
    if (!data) return null;
    return {
      cycles: data.cycles ?? [],
      days: data.days ?? {},
      settings: { ...DEFAULT_SETTINGS, ...data.settings },
    };
  },

  async saveCycleData(userId, data) {
    const redis = await getRedis();
    if (!redis) throw new Error("Redis is not configured.");
    await redis.set(`bewell:cycle:${userId}`, data);
  },
};

async function pickStore(): Promise<Store> {
  const redis = await getRedis();
  return redis ? redisStore : fileStore;
}

let storePromise: Promise<Store> | null = null;

function getStore(): Promise<Store> {
  if (!storePromise) storePromise = pickStore();
  return storePromise;
}

export const readStore = {
  getUser: (id: string) => getStore().then((s) => s.getUser(id)),
  getUserByEmail: (email: string) =>
    getStore().then((s) => s.getUserByEmail(email)),
  saveUser: (user: StoredUser) => getStore().then((s) => s.saveUser(user)),
  getCycleData: (userId: string) =>
    getStore().then((s) => s.getCycleData(userId)),
  saveCycleData: (userId: string, data: AppState) =>
    getStore().then((s) => s.saveCycleData(userId, data)),
};
