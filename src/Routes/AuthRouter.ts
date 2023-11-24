import { type FastifyInstance } from "fastify";

import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  isBlacklisted,
  isAlreadyLoggedIn,
} from "../Middlewares/AuthMiddleware";

import { GenerateVerification } from "../Utils/Database";
import { SendVerificationEmail } from "../Utils/Mail";
import { RandomString } from "../Utils/Generate";
import { TimeExpired } from "../Utils/Time";
import { User } from "@prisma/client";
import { z } from "zod";

import isStrongPassword from "validator/lib/isStrongPassword";
import fastifyPassport from "@fastify/passport";
import prisma from "../Utils/Prisma";
import * as argon2 from "argon2";
import Filter from "bad-words";
import crypto from "crypto";
import dayjs from "dayjs";

export default async function RegisterRouter(fastify: FastifyInstance) {
  const filter = new Filter();

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/register",
    schema: {
      body: z.object({
        username: z.string().min(1).max(28).regex(/^\w+$/, {
          message: "Username contains illegal characters",
        }),
        password: z.string().min(8).max(72),
        email: z.string().email(),
        invite: z.string().optional(),
        agree: z.boolean().optional(),
      }),
    },
    handler: async (request, reply) => {
      const { username, password, email, invite, agree } = request.body;
      const ipAddress: any = request.headers["cf-connecting-ip"] || request.ip;

      if (!agree) {
        return reply.status(400).send({
          statusCode: 400,
          error: "NO_AGREE",
          message: "Please agree to Terms of Service and Privacy Policy",
        });
      }

      if (filter.isProfane(username)) {
        return reply.status(400).send({
          statusCode: 400,
          error: "BAD_USERNAME",
          message: "Inappropriate username",
        });
      }

      const findEmail = await prisma.user.findUnique({
        where: {
          email: email.toLowerCase(),
        },
      });

      if (findEmail) {
        return reply.status(400).send({
          statusCode: 400,
          error: "USED_EMAIL",
          message: "Email is already in use",
        });
      }

      const findUsername = await prisma.user.findFirst({
        where: {
          username: {
            equals: username,
            mode: "insensitive",
          },
        },
      });

      if (findUsername) {
        return reply.status(400).send({
          statusCode: 400,
          error: "USED_USERNAME",
          message: "This username is already used",
        });
      }

      if (
        !isStrongPassword(password, {
          minLength: 8,
          minLowercase: 0,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1,
        })
      ) {
        return reply.status(400).send({
          statusCode: 400,
          error: "PASSWORD_REQUIREMENTS_NOT_MET",
          message:
            "Password Should Contain At least One Special Character One Uppercase Character and One Number",
        });
      }

      const findInvite = await prisma.invite.findUnique({
        where: {
          code: invite,
        },
      });
      const getState = await prisma.state.findFirst({});
      let invitedBy: string;

      // Nightmare (it gave me 6 errors)
      if (getState.inviteOnly) {
        if (!findInvite || findInvite.used) {
          if (findInvite && TimeExpired(findInvite.expires)) {
            await prisma.invite.delete({
              where: {
                code: invite,
              },
            });
          }

          return reply.status(400).send({
            statusCode: 400,
            error: "INVALID_INVITE",
            message: "Invalid invite",
          });
        }
        invitedBy = findInvite.createdBy;
      }

      const hash = await argon2.hash(password, { type: argon2.argon2i });
      const ipHash = crypto
        .createHash("sha256")
        .update(ipAddress)
        .digest("hex");

      const user = await prisma.user.create({
        data: {
          username,
          email: email.toLowerCase(),
          password: hash,
          beta: getState.beta,
          token: `sh_${RandomString(64)}`,
          invitedBy: invitedBy || "No one",
          registerIp: ipHash,
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

      if (getState.inviteOnly) {
        await prisma.user.update({
          where: {
            id: findInvite.createdBy,
          },
          data: {
            invitedUsers: {
              push: user.username,
            },
          },
        });

        await prisma.invite.update({
          where: {
            code: invite,
          },
          data: {
            used: true,
            usedBy: user.id,
          },
        });
      }

      const key = await GenerateVerification(user);

      await SendVerificationEmail(user, key.code);

      return reply.status(200).send({
        statusCode: 200,
        message: "Successfully created account, Please verify your email",
      });
    },
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/login",
    schema: {
      body: z.object({
        username: z.string(),
        password: z.string(),
      }),
    },
    preHandler: [
      isAlreadyLoggedIn,
      fastifyPassport.authenticate(
        "local",
        async function (request, reply, _, user: User) {
          if (!user) {
            return reply.code(401).send({
              statusCode: 401,
              error: "INVALID_CREDENTIALS",
              message: "Invalid username or password",
            });
          }
          if (!user.emailConfirmed) {
            return reply.status(400).send({
              statusCode: 400,
              error: "MAIL_NOT_CONFIRMED",
              message: "Please confirm your email first",
            });
          }
          request.logIn(user);
        }
      ),
    ],
    handler: async (request, reply) => {
      const { user } = request;

      const ipAddress: any = request.headers["cf-connecting-ip"] || request.ip;
      const ipHash = crypto
        .createHash("sha256")
        .update(ipAddress)
        .digest("hex");

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          lastLogin: dayjs().toDate(),
          lastLoginIp: ipHash,
        },
      });

      return reply.status(200).send({
        statusCode: 200,
        message: "Successfully logged in",
        user,
      });
    },
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/confirm_email",
    schema: {
      querystring: z.object({
        code: z.string(),
      }),
    },
    handler: async (request, reply) => {
      const { code } = request.query;

      const findCode = await prisma.verification.findUnique({
        where: {
          code: code,
        },
      });

      if (!findCode) {
        return reply.status(400).send({
          statusCode: 400,
          error: "INVALID_CODE",
          message: "Invalid verification code",
        });
      }

      if (TimeExpired(findCode.expires)) {
        await prisma.verification.delete({
          where: {
            code,
          },
        });

        return reply.status(400).send({
          statusCode: 400,
          error: "INVALID_CODE",
          message: "Invalid verification code",
        });
      }

      const findUser = await prisma.user.findUnique({
        where: {
          id: findCode.owner,
        },
      });

      if (!findUser) {
        await prisma.verification.delete({
          where: {
            code,
          },
        });
        return reply.status(400).send({
          statusCode: 400,
          error: "INVALID_CODE",
          message: "Invalid verification code",
        });
      }

      await prisma.user.update({
        where: {
          id: findCode.owner,
        },
        data: {
          emailConfirmed: true,
        },
      });

      await prisma.verification.delete({
        where: {
          code,
        },
      });

      return reply.status(200).send({
        statusCode: 200,
        message: "Successfully confirmed email",
      });
    },
  });

  fastify.route({
    method: "GET",
    url: "/user",
    preHandler: isBlacklisted,
    handler: (request, reply) => {
      const { user } = request;

      if (!user) {
        return reply.status(400).send({
          statusCode: 400,
          error: "NOT_LOGGED_IN",
          message: "You are not logged in!",
        });
      }

      return reply.status(200).send({ statusCode: 200, user });
    },
  });

  fastify.route({
    method: "POST",
    url: "/logout",
    handler: (request, reply) => {
      const { user } = request;

      if (!user) {
        return reply.status(400).send({
          statusCode: 400,
          error: "NOT_LOGGED_IN",
          message: "You are not logged in!",
        });
      }

      request.logout();
      return reply
        .status(200)
        .send({ statusCode: 200, message: "Successfully logged out" });
    },
  });
}

export const autoPrefix = "/auth";
