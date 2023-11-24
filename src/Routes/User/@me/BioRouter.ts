// import { type FastifyInstance } from "fastify";

// import { ZodTypeProvider } from "fastify-type-provider-zod";
// import { isLoggedIn } from "../../../Middlewares/AuthMiddleware";
// import { z } from "zod";

// import { Bio } from "../../../Models/BioModel";

// export default async function MeRouter(fastify: FastifyInstance) {
//   fastify.addHook("preHandler", isLoggedIn);

//   fastify.withTypeProvider<ZodTypeProvider>().route({
//     method: "POST",
//     url: "/create",
//     schema: {
//       body: z.object({
//         name: z.string().min(1).max(20).regex(/^\w+$/, {
//           message: "Name contains illegal characters",
//         }),
//         displayname: z.string().min(1).max(20).regex(/^\w+$/, {
//           message: "Displayname contains illegal characters",
//         }),
//       }),
//     },
//     handler: async (request, reply) => {
//       const { name, displayname } = request.body;

//       const page = await Bio.findOne({ owner: request.user._id });

//       if (page) {
//         return reply.status(400).send({
//           statusCode: 400,
//           message: "You already have a portfolio",
//         });
//       }

//       const checkName = await Bio.findOne({ _id: name });

//       if (checkName) {
//         return reply.status(400).send({
//           statusCode: 400,
//           message: "Name already taken",
//         });
//       }

//       await Bio.create({
//         _id: name,
//         owner: request.user._id,
//         displayname,
//         links: [],
//       });

//       return reply.status(200).send({
//         statusCode: 200,
//         message: "Bio successfully created",
//       });
//     },
//   });

//   fastify.withTypeProvider<ZodTypeProvider>().route({
//     method: "DELETE",
//     url: "/delete",
//     schema: {
//       body: z.object({
//         confirm: z.boolean(),
//       }),
//     },
//     handler: async (request, reply) => {
//       const { confirm } = request.body;

//       if (!confirm) {
//         return reply.status(400).send({
//           statusCode: 400,
//           message: "You must confirm that you want to delete your portfolio",
//         });
//       }

//       const page = await Bio.findOne({ owner: request.user._id });

//       if (!page) {
//         return reply.status(404).send({
//           statusCode: 404,
//           message: "Portfolio not found",
//         });
//       }

//       await page.deleteOne();

//       return reply.status(200).send({
//         statusCode: 200,
//         message: "Portofio successfully deleted",
//       });
//     },
//   });

//   fastify.withTypeProvider<ZodTypeProvider>().route({
//     method: "PUT",
//     url: "/update",
//     schema: {
//       body: z.object({
//         displayname: z.string().min(1).max(20).regex(/^\w+$/, {
//           message: "Displayname contains illegal characters",
//         }),
//         links: z
//           .array(
//             z.object({
//               type: z.union([
//                 // Send help plz
//                 z.literal("github"),
//                 z.literal("discord"),
//                 z.literal("guilded"),
//                 z.literal("linkedin"),
//                 z.literal("twitter"),
//                 z.literal("website"),
//               ]),
//               url: z.string(),
//             })
//           )
//           .min(1)
//           .max(5),
//       }),
//     },
//     handler: async (request, reply) => {
//       const { displayname, links } = request.body;

//       const page = await Bio.findOne({ owner: request.user._id });

//       if (!page) {
//         return reply.status(404).send({
//           statusCode: 404,
//           message: "Portfolio not found",
//         });
//       }

//       await page.updateOne({
//         displayname,
//         links,
//       })

//       return reply.status(200).send({
//         statusCode: 200,
//         message: "Portofio successfully updated",
//       });
//     },
//   });
// }

// export const autoPrefix = "/user/@me";
