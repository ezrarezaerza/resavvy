import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const basePrisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma;

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      const errStr = String(error?.message || error?.cause || error || '');
      const isClosedErr =
        errStr.includes('Closed') ||
        errStr.includes('kind: Closed') ||
        errStr.includes('P1001') ||
        errStr.includes('P1017') ||
        errStr.includes('P2024') ||
        errStr.includes('connection') ||
        errStr.includes('closed') ||
        errStr.includes('terminated');

      if (isClosedErr && attempt < maxRetries) {
        console.warn(`[Prisma] Database connection closed/lost. Reconnecting (attempt ${attempt}/${maxRetries})...`);
        try {
          await basePrisma.$disconnect();
        } catch (_) {}
        try {
          await basePrisma.$connect();
        } catch (_) {}
        await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
        continue;
      }
      throw error;
    }
  }
}

function createResilientPrismaClient(client: PrismaClient): PrismaClient {
  return new Proxy(client, {
    get(target: any, prop: string | symbol, receiver: any) {
      const orig = Reflect.get(target, prop, receiver);

      if (typeof orig === 'function') {
        if (prop === '$connect' || prop === '$disconnect') {
          return orig.bind(target);
        }
        return function (...args: any[]) {
          if (prop === '$transaction' && typeof args[0] === 'function') {
            const txFn = args[0];
            return withRetry(() => target.$transaction((tx: any) => txFn(createResilientPrismaClient(tx)), args[1]));
          }
          return withRetry(() => orig.apply(target, args));
        };
      }

      if (orig && typeof orig === 'object') {
        return new Proxy(orig, {
          get(modelTarget: any, modelProp: string | symbol, modelReceiver: any) {
            const modelOrig = Reflect.get(modelTarget, modelProp, modelReceiver);
            if (typeof modelOrig === 'function') {
              return function (...args: any[]) {
                return withRetry(() => modelOrig.apply(modelTarget, args));
              };
            }
            return modelOrig;
          }
        });
      }

      return orig;
    }
  });
}

export const prisma = createResilientPrismaClient(basePrisma) as PrismaClient;

export default prisma;
