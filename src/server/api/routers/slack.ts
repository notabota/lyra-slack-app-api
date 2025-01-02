import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { WebClient } from '@slack/web-api';

// Read a token from the environment variables
const token = process.env.SLACK_USER_TOKEN;

// Initialize
const web = new WebClient(token);

export const slackRouter = createTRPCRouter({
  inviteUser: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/slack/invite' } })
    .input(z.object({
      email: z.string().email(),
      channel_ids: z.tuple([z.string()]).rest(z.string()),
      team_id: z.string().default('T05U5TCF695'),
    }))
    .output(z.object({
      ok: z.boolean(),
      error: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        const response = await web.admin.users.invite({
          email: input.email,
          channel_ids: input.channel_ids,
          team_id: input.team_id,
          is_restricted: true,
        });
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
      }
    }),
    sendMessage: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/slack/message' } })
    .input(z.object({
      channel: z.string(),
      text: z.string(),
    }))
    .output(z.object({
      ok: z.boolean(),
      error: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        const response = await web.chat.postMessage({
          channel: input.channel,
          text: input.text,
        });
        return { ok: true };
      } catch (error) {
        return {
          ok: false, 
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
      }
    })
});

