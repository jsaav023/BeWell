import type { AppState } from "@/lib/types";

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
};

export async function getUserById(id: string): Promise<StoredUser | null> {
  const { readStore } = await import("./store");
  return readStore.getUser(id);
}

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const { readStore } = await import("./store");
  return readStore.getUserByEmail(email);
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
}): Promise<StoredUser> {
  const { readStore } = await import("./store");
  const user: StoredUser = {
    id: crypto.randomUUID(),
    name: input.name,
    email: input.email,
    passwordHash: input.passwordHash,
    salt: input.salt,
    createdAt: new Date().toISOString(),
  };
  await readStore.saveUser(user);
  await readStore.saveCycleData(user.id, {
    cycles: [],
    days: {},
    settings: {
      averageCycleLength: 28,
      averagePeriodLength: 5,
    },
  });
  return user;
}

export async function getCycleData(userId: string): Promise<AppState | null> {
  const { readStore } = await import("./store");
  return readStore.getCycleData(userId);
}

export async function saveCycleData(
  userId: string,
  data: AppState,
): Promise<void> {
  const { readStore } = await import("./store");
  await readStore.saveCycleData(userId, data);
}

export function toPublicUser(user: StoredUser): PublicUser {
  return { id: user.id, name: user.name, email: user.email };
}
