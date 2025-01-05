import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const githubRouter = createTRPCRouter({
  addUser: publicProcedure
    
    .input(
      z.object({
        slackUserId: z.number(),
        GitHubUsername: z.string(),
      }),
    )
    .output(
      z.object({
        status: z.string(),
        message: z.string(),
      }),
    )
    .meta({ openapi: { method: "POST", path: "/add-user" } })
    .mutation(async ({ ctx, input }) => {
     console.log(input)
      let status = "success";
      let message = "User added successfully";
      const newUser = await ctx.dbGithub.user.upsert({
        where: {
          GitHubUsername: input.GitHubUsername,
        },
        update: {
          slackUserId: BigInt(input.slackUserId),
        },
        create: {
          slackUserId: BigInt(input.slackUserId),
          GitHubUsername: input.GitHubUsername,
        },
      });
      if (!newUser) {
        status = "error";
        message = "User already exists";
      }
      console.log(newUser)
      return {
        status,
        message,
      };
    }),
});
