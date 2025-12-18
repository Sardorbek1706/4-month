import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private static warnedAboutDatabaseUrl = false;

  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      if (!PrismaService.warnedAboutDatabaseUrl) {
        console.warn(
          'DATABASE_URL is not set — skipping Prisma connect in development',
        );
        PrismaService.warnedAboutDatabaseUrl = true;
      }
      return;
    }
    try {
      await this.$connect();
      console.log('Prisma connected');
    } catch (err: unknown) {
      const maybeMsg =
        err && typeof err === 'object' && 'message' in err
          ? (err as Record<string, unknown>)['message']
          : undefined;
      const msg = typeof maybeMsg === 'string' ? maybeMsg : String(err);
      console.warn('Prisma connection failed:', msg);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Prisma disconnected');
  }
}
