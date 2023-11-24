import { FastifyRequest, FastifyReply } from "fastify";
import { File } from "fastify-multer/lib/interfaces";
import prisma from "../Utils/Prisma";

export async function VerifyUser(request: FastifyRequest, reply: FastifyReply) {
  const { authorization } = request.headers;

  if (!authorization) {
    return reply.status(400).send({
      statusCode: 400,
      error: "NO_API_KEY_PROVIDED",
      message: "Please provide api key",
    });
  }

  const user = await prisma.user.findUnique({
    where: {
      token: authorization,
    },
    include: {
      blacklist: true,
    },
  });

  if (!user) {
    return reply.status(401).send({
      statusCode: 401,
      error: "INVALID_API_KEY",
      message: "Invalid api key",
    });
  }

  if (user.blacklist.status) {
    let blReason = user.blacklist.reason;
    return reply.status(401).send({
      statusCode: 401,
      error: "USER_BANNED",
      reason: blReason || "No reason provided.",
      message: `You are banned for: ${blReason || "No reason provided."}`,
    });
  }
}

// Stolen from varity
interface FileRequest extends FastifyRequest {
  file: File;
}

export async function VerifyUpload(request: FileRequest, reply: FastifyReply) {
  if (!request.file) {
    return reply.status(400).send({
      statusCode: 400,
      error: "NO_FILE_PROVIDED",
      message: "No file provided",
    });
  }

  if (!request.file.mimetype || !request.file.size || !request.file.buffer) {
    return reply.status(400).send({
      statusCode: 400,
      error: "FILE_VERIFICATION_FAILED",
      message: "Invalid file",
    });
  }

  return;
}
