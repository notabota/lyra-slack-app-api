import { z } from "zod";
import { writeFile } from "fs/promises";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const githubRouter = createTRPCRouter({
  getUserCommits: publicProcedure
    .meta({ openapi: { method: "GET", path: "/get-user-commits" } })
    .input(
      z.object({
        slackUserId: z.number(),
      }),
    )
    .output(z.array(z.string()))
    .query(async ({ctx, input}) => {
      const commits = await ctx.dbGithub.commit.findMany({
        where: {
          author: "MrHawker",
          // timestamp: {
          //   gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          // },
        },
      });

      // Write commits to file
      const commitLog = commits.map(commit => 
        `${commit.timestamp?.toISOString()} - ${commit.message}`
      ).join('\n');
      
      await writeFile('commits.txt', commitLog, 'utf-8')
        .catch(err => console.error('Failed to write commits file:', err));
      
      console.log(commits)
      return [];
    }),
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
