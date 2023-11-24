import { type FastifyInstance } from "fastify";

import { isLoggedIn } from "../../../Middlewares/AuthMiddleware";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import isStrongPassword from "validator/lib/isStrongPassword";
import prisma from "../../../Utils/Prisma";
import * as argon2 from "argon2";

export default async function (fastify: FastifyInstance) {
  fastify.addHook("preHandler", isLoggedIn);

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "PATCH",
    url: "/change",
    schema: {
      body: z.object({
        password: z.string().min(8),
        newPassword: z.string().min(8).max(72),
        confirmNewPassword: z.string().min(8).max(72),
      }),
    },
    handler: async (request, reply) => {
      const { password, newPassword, confirmNewPassword } = request.body;

      const { user } = request;

      if (newPassword !== confirmNewPassword) {
        return reply.status(400).send({
          statusCode: 400,
          error: "INVALID_PASSWORD",
          message: "New password and confirm new password does not match",
        });
      }

      if (await argon2.verify(user.password, password)) {
        if (
          !isStrongPassword(newPassword, {
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

        const hash = await argon2.hash(newPassword, { type: argon2.argon2i });

        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            password: hash,
          },
        });

        request.logout();
        return reply.status(200).send({
          statusCode: 200,
          message: "Successfully changed password",
        });
      }
    },
  });
}
export const autoPrefix = "/user/@me/password";
