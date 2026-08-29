import { PrismaClient } from '@prisma/client';
import configs from '../configs/configs';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log: configs.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
  });

if (configs.nodeEnv !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
