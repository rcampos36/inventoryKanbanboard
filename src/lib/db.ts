import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/** Bump when adding/removing Prisma models/fields so hot reload drops a stale client. */
const PRISMA_CLIENT_VERSION = 16;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientVersion?: number;
};

/** Neon/Vercel URLs sometimes include channel_binding, which breaks node-pg. */
function sanitizeDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("channel_binding");
    return parsed.toString();
  } catch {
    return url
      .replace(/([?&])channel_binding=require&?/g, "$1")
      .replace(/[?&]$/, "");
  }
}

function resolveDatabaseUrl(): string {
  const raw =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED;

  if (!raw) {
    throw new Error(
      "No database URL found. Set DATABASE_URL (or POSTGRES_URL) in Vercel Environment Variables."
    );
  }

  return sanitizeDatabaseUrl(raw);
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: resolveDatabaseUrl() });
  return new PrismaClient({ adapter });
}

function organizationHasBrandField(client: PrismaClient): boolean {
  const models = (
    client as {
      _runtimeDataModel?: {
        models?: Record<string, { fields?: Array<{ name: string }> }>;
      };
    }
  )._runtimeDataModel?.models;
  const fields = models?.Organization?.fields;
  if (!Array.isArray(fields)) return true;
  return fields.some((field) => field.name === "brand");
}

function isStaleClient(client: PrismaClient | undefined): boolean {
  if (!client) return true;
  if (globalForPrisma.prismaClientVersion !== PRISMA_CLIENT_VERSION) return true;
  // Hot reload can keep an old client that predates new models/fields.
  if (typeof (client as { organization?: unknown }).organization === "undefined") {
    return true;
  }
  return !organizationHasBrandField(client);
}

export function getPrisma(): PrismaClient {
  if (isStaleClient(globalForPrisma.prisma)) {
    globalForPrisma.prisma = createPrismaClient();
    globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION;
  }
  return globalForPrisma.prisma!;
}

/** Prefer getPrisma() for lazy init. Kept for existing imports. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
