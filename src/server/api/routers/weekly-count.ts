import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const weeklyCountRouter = createTRPCRouter({
  getList: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/weekly-count' } })
    .input(z.object({
      timespan: z.enum(['1d', '7d', '14d', '30d', 'all']).optional()
    }))
    .output(z.object({
      data: z.array(z.object({
        week: z.string(),
        messageCount: z.number(),
        reactionCount: z.number()
      }))
    }))
    .query(async ({ ctx, input }) => {
      // Get current date and set to start of day in UTC
      const now = new Date();
      now.setUTCHours(0, 0, 0, 0);
      const nowTs = Math.floor(now.getTime() / 1000);
      
      const secondsInDay = 86400;
      const days = 7;

      // Initialize array for last 7 days
      const dailyCounts = [];
      for (let i = 0; i < days; i++) {
        const dayStart = nowTs - (i * secondsInDay);
        const dayEnd = dayStart + secondsInDay;

        console.log(dayStart, dayEnd);

        // Get message counts for the day
        const messageCounts = await ctx.db.message.count({
          where: {
            eventTs: {
              gte: dayStart.toString(),
              lt: dayEnd.toString()
            }
          }
        });

        // Get reaction counts for the day
        const reactionCounts = await ctx.db.reaction.count({
          where: {
            eventTs: {
              gte: dayStart.toString(),
              lt: dayEnd.toString()
            }
          }
        });

        // Format date as YYYY-MM-DD and get day name
        const date = new Date(dayStart * 1000);
        const formattedDate = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        dailyCounts.unshift({
          week: `${dayName}: ${formattedDate}`,
          messageCount: messageCounts,
          reactionCount: reactionCounts
        });
      }

      return {
        data: dailyCounts
      };
    }),
});
