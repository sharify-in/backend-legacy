import { Verification, User } from "@prisma/client";
import { RandomString } from "./Generate";

import consola from "consola";
import prisma from "./Prisma";
import dayjs from "dayjs";

async function SetupDatabase() {
  try {
    const SystemAcc = await prisma.user.findFirst({
      where: {
        username: {
          equals: "System",
          mode: "insensitive",
        },
      },
    });
    const MainState = await prisma.state.findFirst();

    if (!SystemAcc) {
      await prisma.user.create({
        data: {
          username: "System",
          email: "",
          password: "",
          token: `sh_${RandomString(64)}`,
          role: "ADMIN",
          blacklist: {
            create: {},
          },
          subscription: {
            create: {},
          },
          discord: {
            create: {},
          },
          settings: {
            create: {},
          },
          privacySettings: {
            create: {},
          },
          embedSettings: {
            create: {},
          },
          linkSettings: {
            create: {},
          },
        },
      });
    }

    if (!MainState) {
      await prisma.state.create({
        data: {},
      });
    }
  } catch (error) {
    consola.fatal(new Error("Database setup failed"));
    throw consola.fatal(error);
  }
}

async function getUser(user: string, token: boolean = false) {
  return prisma.user.findFirst({
    where: {
      OR: [{ id: user }, { username: { equals: user, mode: "insensitive" } }],
    },
    select: {
      id: true,
      username: true,
      token: token,
      email: true,
      role: true,
      isAdmin: true,
      invites: true,
      uploads: true,
      lastLogin: true,
      registerDate: true,
      emailConfirmed: true,
      invitedBy: true,
      // there is probably a better way
      // but who cares anyway lmao (kill me plz)
      subscription: {
        select: { id: false, type: true, subscribeDate: true, expires: true },
      },
      blacklist: { select: { status: true, reason: true } },
      discord: {
        select: {
          id: false,
          username: true,
          refreshToken: true,
          avatar: true,
          discordId: true,
        },
      },
      settings: { select: { aboutme: true } },
      privacySettings: {
        select: {
          id: false,
          privateProfile: true,
          showDiscordOnProfile: true,
          showMatureDomains: true,
        },
      },
      embedSettings: {
        select: {
          id: false,
          enabled: true,
          color: true,
          providerName: true,
          providerUrl: true,
          author: true,
          authorUrl: true,
          title: true,
          description: true,
        },
      },
      linkSettings: {
        select: { id: false, urlType: true, subdomain: true, domain: true },
      },
      removed: true,
      invitedUsers: true,
      storageUsed: true,
    },
  });
}

async function getUserSafe(user: string) {
  return prisma.user.findFirst({
    where: {
      OR: [{ id: user }, { username: { equals: user, mode: "insensitive" } }],
    },
    select: {
      username: true,
      role: true,
      isAdmin: true,
      uploads: true,
      lastLogin: true,
      invitedBy: true,
      registerDate: true,
      invitedUsers: true,
      storageUsed: true,
      settings: { select: { aboutme: true } },
      discord: { select: { username: true, avatar: true, discordId: true } },
      privacySettings: {
        select: { privateProfile: true, showDiscordOnProfile: true },
      },
    },
  });
}

async function GenerateVerification(user: User): Promise<Verification> {
  return prisma.verification.create({
    data: {
      owner: user.id,
      expires: dayjs().add(30, "minute").toDate(),
    },
  });
}

export { SetupDatabase, getUser, getUserSafe, GenerateVerification };
