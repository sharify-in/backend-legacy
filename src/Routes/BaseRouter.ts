import { type FastifyInstance } from "fastify";

import FunFactsData from "../Utils/json/FunFacts.json";
import prisma from "../Utils/Prisma";

export default async function BaseRouter(fastify: FastifyInstance) {
  const { redis } = fastify;

  fastify.route({
    method: "GET",
    url: "/",
    handler: (request, reply) => {
      const { funFacts } = FunFactsData;
      const randomFunFact =
        funFacts[Math.floor(Math.random() * funFacts.length)];

      return reply
        .status(200)
        .send({ statusCode: 200, funFact: randomFunFact });
    },
  });

  fastify.route({
    method: "GET",
    url: "/stats",
    handler: async (request, reply) => {
      let getStats = await redis.get("stats");
      const state = await prisma.state.findFirst({
        select: {
          id: false,
          beta: true,
          regEnabled: true,
          inviteOnly: true,
        },
      });

      if (!getStats) {
        const users = await prisma.user.count();
        const domains = await prisma.domain.count();
        const files = await prisma.file.count();

        const json = JSON.stringify({
          users,
          domains,
          files,
        });

        //cache stats in redis for 1 hour
        await redis.set("stats", json, "EX", 3600);
        getStats = json;
      }

      return reply.status(200).send({
        statusCode: 200,
        state,
        stats: JSON.parse(getStats),
      });
    },
  });
}

export const autoPrefix = "/";
