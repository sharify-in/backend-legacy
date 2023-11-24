import { z } from "zod";
import { type FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { isLoggedIn } from "../../Middlewares/AuthMiddleware";
import { getUserSafe } from "../../Utils/Database";

export default async function UserRouter(fastify: FastifyInstance) {
  fastify.addHook("preHandler", isLoggedIn);

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/:uid",
    schema: {
      params: z.object({
        uid: z.string(),
      }),
    },
    handler: async (request, reply) => {
      const { uid } = request.params;

      const user = await getUserSafe(uid);

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
}

export const autoPrefix = "/user";
