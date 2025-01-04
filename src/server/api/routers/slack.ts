import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { WebClient } from '@slack/web-api';

// Read a token from the environment variables
const token = process.env.SLACK_USER_TOKEN;

// Initialize
const web = new WebClient(token);

export const slackRouter = createTRPCRouter({
  getChannels: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/slack' } })
    .input(z.object({}).optional())
    .output(z.object({
      data: z.array(z.object({
        id: z.number(),
        name: z.string(),
      })),
      error: z.string().optional()
    }))
    .query(async ({ ctx }) => {
      try {
        const channels = await ctx.db.channel.findMany({
          select: {
            id: true,
            name: true,
          },
          where: {
            isChannel: true,
          }
        });

        console.log("--------------- CHANNELS -----------------");
        console.log(channels);
        console.log("--------------------------------");

        return {
          data: channels.map(channel => ({
            id: Number(channel.id),
            name: channel.name ?? '',
          }))
        };
      } catch (error) {
        return {
          data: [],
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
      }
    })
  ,
  getTeamMembers: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/slack/team/members' } })
    .input(z.object({}).optional())
    .output(z.object({
      data: z.array(z.object({
        id: z.number(),
        name: z.string().nullable()
      })),
      error: z.string().optional()
    }))
    .query(async ({ ctx }) => {
      try {
        const users = await ctx.db.user.findMany({
          where: {
            teamId: "T05U5TCF695",
            isBot: false
          },
          select: {
            id: true,
            displayName: true,
            realName: true
          }
        });

        return {
          data: users.map(user => ({
            id: Number(user.id),
            name: user.displayName || user.realName || null
          }))
        };
      } catch (error) {
        return {
          data: [],
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
      }
    })
});
