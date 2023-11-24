import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../Utils/Prisma";

export async function VerifyAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const key = request.headers.authorization;

  // 404 is on purpose
  if (!key) {
    return reply.status(404).send({
      statusCode: 404,
      error: "INVALID_ENDPOINT",
      message: "Endpoint not found",
    });
  }

  const user = await prisma.user.findUnique({
    where: {
      token: key,
    },
    include: {
      blacklist: true,
    },
  });

  if (!user) {
    return reply.status(404).send({
      statusCode: 404,
      error: "INVALID_ENDPOINT",
      message: "Endpoint not found",
    });
  }

  if (!["OWNER", "ADMIN", "MODERATOR", "TRAINEE"].includes(user.role)) {
    return reply.status(404).send({
      statusCode: 404,
      error: "INVALID_ENDPOINT",
      message: "Endpoint not found",
    });
  }

  if (user.blacklist.status) {
    const blReason = user.blacklist.reason;

    return reply.status(500).send({
      statusCode: 500,
      error: "USER_BANNED",
      reason: blReason || "No reason provided.",
      message: `You are banned for: ${blReason || "No reason provided."}`,
    });
  }

  return;
}
