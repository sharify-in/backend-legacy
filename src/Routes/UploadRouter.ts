import { FastifyRequest, type FastifyInstance } from "fastify";
import fastifyMulter from "fastify-multer";
import prisma from "../Utils/Prisma";

import { VerifyUpload, VerifyUser } from "../Middlewares/UploadMiddleware";
import { RandomString } from "../Utils/Generate";
import { File } from "fastify-multer/lib/interfaces";
import { UploadFile } from "../Utils/Storage";

const multer = fastifyMulter({
  storage: fastifyMulter.memoryStorage(),
  limits: {
    // 50 mb
    fileSize: 52428800,
  },
});

interface verifiedFile extends File {
  size: number;
  buffer: Buffer;
}

interface FileRequest extends FastifyRequest {
  file: File;
}

export default async function UploadRouter(fastify: FastifyInstance) {
  fastify.route({
    method: "POST",
    url: "/upload",
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 minute",
      },
    },
    preHandler: [VerifyUser, multer.single("file"), VerifyUpload],
    handler: async (request: FileRequest, reply) => {
      // TODO: Understand how tf this works
      const {
        file,
        headers: { authorization },
      } = request as { file: verifiedFile; headers: { authorization: string } };

      const user = await prisma.user.findUnique({
        where: {
          token: authorization,
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

      const filename = `${RandomString(24)}.${file.mimetype.split("/")[1]}`;

      UploadFile(user.id, filename, file.buffer, file.mimetype, file.size);

      const uploadedFile = await prisma.file.create({
        data: {
          filename,
          originalFileName: file.originalname,
          cdnUrl: `${process.env.CDN_URL}/${user.id}/${filename}`,
          mimeType: file.mimetype,
          size: file.size,
          uploadedBy: user.id,
        },
      });

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          storageUsed: user.storageUsed + file.size,
          uploads: user.uploads + 1,
        },
      });

      let fileurl: string;

      if (user.linkSettings.urlType == "NORMAL") {
        fileurl = `https://${user.linkSettings.domain}/${uploadedFile.filename}`;
      } else {
        fileurl = uploadedFile.cdnUrl;
      }

      return reply.status(201).send({
        statusCode: 201,
        message: "Successfully uploaded file!",
        url: fileurl,
      });
    },
  });
}

export const autoPrefix = "/";
