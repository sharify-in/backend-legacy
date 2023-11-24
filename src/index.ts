import "dotenv/config";
import Fastify, { FastifyInstance } from "fastify";

import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import secureSession from "@fastify/secure-session";
import fastifyPassport from "@fastify/passport";
import rateLimit from "@fastify/rate-limit";
import autoLoad from "@fastify/autoload";
import helmet from "@fastify/helmet";
import multer from "fastify-multer";
import redis from "@fastify/redis";
import cors from "@fastify/cors";
import ms from "ms";

import { SetupPassport } from "./Utils/Passport";
import { SetupDatabase } from "./Utils/Database";
import { ZodError } from "zod";
import consola from "consola";
import { join } from "path";

// Fastify instance (server var)
const server: FastifyInstance = Fastify();

// Secure headers
server.register(helmet, {
  noSniff: true,
  xssFilter: true,
});

// Redis
server.register(redis, {
  url: process.env.REDIS_URI,
});

// Cors
server.register(cors, {
  credentials: true,
  origin: ["https://sharify.in", /^http:\/\/localhost:\d+$/],
});

// Rate-limiting
server.register(rateLimit, {
  max: 120,
  timeWindow: "3 minutes",
});

// Secure session
server.register(secureSession, {
  key: Buffer.from(process.env.SESSION_SECRET, "hex"),
  cookieName: "_session",
  cookie: {
    path: "/",
    httpOnly: true,
    maxAge: ms("30m"),
  },
});

// Passport
server.register(fastifyPassport.initialize());
server.register(fastifyPassport.secureSession());

SetupPassport(fastifyPassport);

// Multer contentParser
server.register(multer.contentParser);

// Zod validation
server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

server.setNotFoundHandler(function (request, reply) {
  reply.status(404).send({
    statusCode: 404,
    error: "INVALID_ENDPOINT",
    message: "Endpoint not found",
  });
});

// Loading all endpoints
server.register(autoLoad, {
  dir: join(__dirname, "Routes"),
  // http://localhost/[prefix](v1)/[endpoint]
  options: { prefix: "v1" },
});

// Error handler
server.setErrorHandler((error, request, reply) => {
  if (error instanceof ZodError) {
    reply.status(400).send({
      statusCode: reply.statusCode,
      message: "SCHEMA_VALIDATION_ERR",
      errors: JSON.parse(error.message),
    });
    // TODO: Refactor (use switch case)
  } else if (error.statusCode == 429) {
    reply.send(error);
  } else if (error.statusCode == 400) {
    reply.send(error);
  } else {
    reply.status(500).send({
      statusCode: 500,
      error: "INTERNAL_SERVER_ERROR",
      message: "Unknown error occurred, Please try again later",
    });
  }
});

const start = async () => {
  try {
    await SetupDatabase();
    await server.listen({ port: parseInt(process.env.PORT!), host: "0.0.0.0" });

    const address = server.server.address();
    const port = typeof address === "string" ? address : address?.port;

    consola.info(`Server listening at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    consola.fatal(err);
    process.exit(1);
  }
};
start();
