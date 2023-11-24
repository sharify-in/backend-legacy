import {
  User,
  Blacklist,
  Subscription,
  UserDiscord,
  UserSettings,
} from "@prisma/client";

declare module "fastify" {
  interface PassportUser extends User {
    blacklist: Blacklist;
    subscription: Subscription;
    discord: UserDiscord;
    settings: UserSettings;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
