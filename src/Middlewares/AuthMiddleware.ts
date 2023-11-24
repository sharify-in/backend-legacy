import { FastifyRequest, FastifyReply } from "fastify";

export async function isAlreadyLoggedIn(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { user } = request;

  if (user) {
    return reply.status(400).send({
      statusCode: 400,
      error: "ALREADY_LOGGED_IN",
      message: "You are already logged in",
    });
  }

  return;
}

export async function isLoggedIn(request: FastifyRequest, reply: FastifyReply) {
  const { user } = request;

  if (!user) {
    return reply.status(401).send({
      statusCode: 401,
      error: "NOT_LOGGED_IN",
      message: "You are not logged in",
    });
  }

  if (user.blacklist.status) {
    let blReason = user.blacklist.reason || "No reason provided.";

    return reply.status(401).send({
      statusCode: 401,
      error: "USER_BANNED",
      reason: blReason,
      message: `You are banned for: ${blReason}`,
    });
  }

  // if (!user.discord.discordId) {
  //   return reply.status(401).send({
  //     statusCode: 401,
  //     error: "NO_LINKED_DISCORD",
  //     message: "Please link your discord account first",
  //   });
  // }

  return;
}

export async function isBlacklisted(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { user } = request;

  if (user && user.blacklist.status) {
    let blReason = user.blacklist.reason;

    if (blReason === null) {
      blReason = "No reason provided.";
    }

    return reply.status(401).send({
      statusCode: 401,
      error: "USER_BANNED",
      reason: blReason,
      message: `You are banned for: ${blReason}`,
    });
  }
}
