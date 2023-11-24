import { type FastifyInstance } from "fastify";

import { VerifyAdmin } from "../../Middlewares/AdminMiddleware";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { getUser } from "../../Utils/Database";
import { z } from "zod";
import prisma from "../../Utils/Prisma";

export default async function AdminUsersRouter(fastify: FastifyInstance) {
  fastify.addHook("preHandler", VerifyAdmin);

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/:uid",
    schema: {
      params: z.object({
        uid: z.any(),
      }),
    },
    handler: async (request, reply) => {
      const { uid } = request.params;

      const user = await getUser(uid);

      if (!user) {
        return reply.status(404).send({
          statusCode: 404,
          error: "INVALID_USER",
          message: "User not found",
        });
      }

      return reply.status(200).send({
        statusCode: 200,
        user,
      });
    },
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/blacklist",
    schema: {
      body: z.object({
        username: z.string(),
        reason: z.string().optional(),
      }),
    },
    handler: async (request, reply) => {
      const { username, reason } = request.body;

      const user = await prisma.user.findFirst({
        where: {
          OR: [{ username: username }, { email: username }],
        },
      });

      if (!user) {
        return reply.status(404).send({
          statusCode: 404,
          error: "INVALID_USER",
          message: "User not found",
        });
      }

      await prisma.blacklist.update({
        where: {
          id: user.blacklistId,
        },
        data: {
          status: true,
          reason: reason,
        },
      });

      return reply.status(200).send({
        statusCode: 200,
        message: "User blacklisted",
      });
    },
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "DELETE",
    url: "/blacklist",
    schema: {
      body: z.object({
        username: z.string(),
      }),
    },
    handler: async (request, reply) => {
      const { username } = request.body;

      const user = await prisma.user.findFirst({
        where: {
          OR: [{ username: username }, { email: username }],
        },
      });

      if (!user) {
        return reply.status(404).send({
          statusCode: 404,
          error: "INVALID_USER",
          message: "User not found",
        });
      }

      await prisma.blacklist.update({
        where: {
          id: user.blacklistId,
        },
        data: {
          status: false,
        },
      });

      return reply.status(200).send({
        statusCode: 200,
        message: "User unblacklisted",
      });
    },
  });
}

export const autoPrefix = "/admin";
