import { type FastifyInstance } from "fastify";

import { VerifyAdmin } from "../../Middlewares/AdminMiddleware";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { GenerateInvite } from "../../Utils/Generate";
import { getUser } from "../../Utils/Database";
import { z } from "zod";

import dayjs from "dayjs";
import prisma from "../../Utils/Prisma";

export default async function AdminInviteRouter(fastify: FastifyInstance) {
  fastify.addHook("preHandler", VerifyAdmin);

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/generate",
    schema: {
      body: z.object({
        user: z.string().optional(),
      }),
    },
    handler: async (request, reply) => {
      const { user } = request.body;

      let findUser = await getUser(user);
      const invite = GenerateInvite(24);

      if (!findUser) {
        findUser = await getUser("System");
      }

      await prisma.invite.create({
        data: {
          code: invite,
          expires: dayjs().add(7, "days").toDate(),
          createdBy: findUser.id,
        },
      });

      reply.status(201).send({
        statusCode: 201,
        message: "Invite created successfully",
        invite,
      });
    },
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "DELETE",
    url: "/:invite",
    schema: {
      params: z.object({
        invite: z.string(),
      }),
    },
    handler: async (request, reply) => {
      const { invite } = request.params;

      const findInvite = await prisma.invite.findUnique({
        where: {
          code: invite,
        },
      });

      if (!findInvite) {
        return reply.status(404).send({
          statusCode: 404,
          error: "INVALID_INVITE",
          message: "Invite not found",
        });
      }

      await prisma.invite.delete({
        where: {
          code: findInvite.code,
        },
      });

      reply.status(200).send({
        statusCode: 200,
        message: "Invite deleted successfully",
      });
    },
  });
}

export const autoPrefix = "/admin/invite";
