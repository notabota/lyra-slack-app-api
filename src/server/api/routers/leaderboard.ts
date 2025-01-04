import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const leaderboardRouter = createTRPCRouter({
  getSlackLeaderboard: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/leaderboard/slack' } })
    .input(z.object({
      timespan: z.enum(['1d', '7d', '14d', '30d', 'all']).optional()
    }))
    .output(z.object({
      data: z.array(z.object({
        userId: z.number(),
        userName: z.string().nullable(),
        messageCount: z.number(),
        reactionCount: z.number(), 
        fileCount: z.number(),
        totalCount: z.number(),
        image: z.string().nullable()
      }))
    }))
    .query(async ({ ctx, input }) => {
      // Calculate date filter based on timespan from current time
      let dateFilter = {};
      if (input.timespan && input.timespan !== 'all') {
        const now = new Date();
        const days = parseInt(input.timespan);
        const cutoffDate = new Date(now);
        cutoffDate.setDate(now.getDate() - days);
        dateFilter = {
          createdAt: {
            gte: cutoffDate.toISOString()
          }
        };
      }

      // Get all users who are team members and not bots
      const users = await ctx.db.user.findMany({
        where: {
          teamId: "T05U5TCF695",
          isBot: false
        },
        select: { id: true, displayName: true, realName: true, image: true }
      });
      const userIds = users.map(user => user.id);

      // Get counts for each metric
      const [messageCounts, reactionCounts, fileCounts] = await Promise.all([
        ctx.db.message.groupBy({
          by: ['userId'],
          _count: { userId: true },
          where: { ...dateFilter, userId: { in: userIds } }
        }),
        ctx.db.reaction.groupBy({
          by: ['userId'],
          _count: { userId: true },
          where: { ...dateFilter, userId: { in: userIds } }
        }),
        ctx.db.file.groupBy({
          by: ['userId'],
          _count: { userId: true },
          where: { ...dateFilter, userId: { in: userIds } }
        })
      ]);

      // Combine data for all users
      let combinedData = users.map(user => {
        const messageCount = messageCounts.find(m => m.userId === user.id)?._count.userId ?? 0;
        const reactionCount = reactionCounts.find(r => r.userId === user.id)?._count.userId ?? 0;
        const fileCount = fileCounts.find(f => f.userId === user.id)?._count.userId ?? 0;
        const totalCount = messageCount + reactionCount + fileCount;
        
        return {
          userId: Number(user.id),
          userName: user.displayName || user.realName || null,
          messageCount,
          reactionCount,
          fileCount,
          totalCount,
          image: user.image || null
        };
      });

      // Sort by totalCount desc
      combinedData.sort((a, b) => b.totalCount - a.totalCount);

      console.log('--------------------------------');
      console.log(combinedData);
      console.log('--------------------------------');

      return {
        data: combinedData
      };
    }),
});
