import { type FastifyInstance } from "fastify";

import { isLoggedIn } from "../../../Middlewares/AuthMiddleware";
import { RandomString } from "../../../Utils/Generate";
import prisma from "../../../Utils/Prisma";

export default async function MeRouter(fastify: FastifyInstance) {
  fastify.addHook("preHandler", isLoggedIn);

  fastify.route({
    method: "GET",
    url: "/",
    handler: (request, reply) => {
      return reply.status(200).send({
        statusCode: 200,
        user: request.user,
      });
    },
  });

  fastify.route({
    method: "POST",
    url: "/refresh_key",
    handler: async (request, reply) => {
      const { user } = request;

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          token: `sh_${RandomString(64)}`,
        },
      });

      return reply.status(200).send({
        statusCode: 200,
        message: "Sucessfully regenerated API Key!",
      });
    },
  });

  fastify.route({
    method: "GET",
    url: "/config",
    handler: async (request, reply) => {
      const { user } = request;

      const config = {
        Name: "Sharify.in Image uploader",
        DestinationType: "ImageUploader, FileUploader",
        RequestType: "POST",
        RequestURL: `${process.env.FRONTEND_URL}/api/v1/upload`,
        FileFormName: "file",
        Headers: {
          authorization: user.token,
        },
        URL: "$json:url$",
        ErrorMessage: "$json:message$",
      };

      reply.header(
        "Content-Disposition",
        `attachment; filename=${user.id}.sxcu`
      );
      reply.send(Buffer.from(JSON.stringify(config, null, 2), "utf8"));
    },
  });
}

export const autoPrefix = "/user/@me";
