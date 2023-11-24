import { Authenticator } from "@fastify/passport";
import { Strategy } from "passport-local";
import { User } from "@prisma/client";
import { getUser } from "./Database";

import * as argon2 from "argon2";
import prisma from "./Prisma";

export function SetupPassport(passport: Authenticator) {
  passport.use(
    new Strategy(async function (username, password, done) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: username, mode: "insensitive" } },
            { email: username.toLowerCase() },
          ],
        },
        include: {
          blacklist: true,
          subscription: true,
          discord: true,
          settings: true,
          privacySettings: true,
          embedSettings: true,
          linkSettings: true,
        },
      });

      if (!user) {
        return done(null, false);
      }

      if (await argon2.verify(user.password, password)) {
        return done(null, user);
      }

      return done(null, false);
    })
  );

  passport.registerUserSerializer(async (user: User) => {
    return user.id;
  });

  passport.registerUserDeserializer(async (uuid: string) => {
    return await getUser(uuid, true);
  });
}
