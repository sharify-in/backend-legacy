import { type FastifyInstance } from "fastify";

import { ZodTypeProvider } from "fastify-type-provider-zod";
import { isLoggedIn } from "../../../Middlewares/AuthMiddleware";
import { z } from "zod";

import prisma from "../../../Utils/Prisma";
import { getUser } from "../../../Utils/Database";

export default async function MeRouter(fastify: FastifyInstance) {
  fastify.addHook("preHandler", isLoggedIn);

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "patch",
    url: "/embed",
    schema: {
      body: z.object({
        enabled: z.boolean(),
        color: z
          .string()
          .min(4)
          .max(7)
          .regex(/^#?([0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$/i),
        title: z.string().min(1).max(50),
        description: z.string().min(1).max(120).optional(),
        providerName: z.string().min(1).max(20).optional(),
        author: z.string().min(1).max(20).optional(),
      }),
    },
    handler: async (request, reply) => {
      const { enabled, color, title, description, author, providerName } =
        request.body;

      const user = await prisma.user.findUnique({
        where: {
          id: request.user.id,
        },
      });

      await prisma.embedSettings.update({
        where: {
          id: user.embedSettingsId,
        },
        data: {
          enabled,
          color,
          providerName: providerName || "",
          author: author || "",
          title,
          description: description || "",
        },
      });

      return reply.status(200).send({
        statusCode: 200,
        message: "Successfully updated embed!",
      });
    },
  });
}

export const autoPrefix = "/user/@me/settings";
