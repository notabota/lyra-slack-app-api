import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const triviaRouter = createTRPCRouter({
  getList: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/trivia' } })
    .input(z.object({
      _start: z.number().optional(),
      _end: z.number().optional(),
      _sort: z.string().optional(), 
      _order: z.string().optional(),
      timespan: z.enum(['1d', '7d', '14d', '30d', 'all']).optional(),
      userName: z.string().optional()
    }))
    .output(z.object({
      data: z.array(z.object({
        userId: z.number(),
        userName: z.string().nullable(),
        messageCount: z.number(),
        reactionCount: z.number(),
        fileCount: z.number(),
        totalCount: z.number(),
        timespan: z.enum(['1d', '7d', '14d', '30d', 'all'])
      })),
      total: z.number()
    }))
    .query(async ({ ctx, input }) => {
      const skip = input._start;
      const take = input._end ? input._end - (input._start ?? 0) : undefined;

      // Calculate date filter based on timespan
      let dateFilter = {};
      if (input.timespan && input.timespan !== 'all') {
        const now = Math.floor(Date.now() / 1000);
        const days = parseInt(input.timespan);
        const secondsInDay = 86400;
        const cutoffTime = (now - (days * secondsInDay)).toString();
        dateFilter = {
          createdAt: {
            gte: new Date(parseInt(cutoffTime) * 1000).toISOString()
          }
        };
      }

      // Get message counts
      const messageCounts = await ctx.db.message.groupBy({
        by: ['userId'],
        _count: {
          userId: true
        },
        where: dateFilter
      });

      // Get reaction counts
      const reactionCounts = await ctx.db.reaction.groupBy({
        by: ['userId'],
        _count: {
          userId: true
        },
        where: dateFilter
      });

      // Get file counts
      const fileCounts = await ctx.db.file.groupBy({
        by: ['userId'],
        _count: {
          userId: true
        },
        where: dateFilter
      });

      // Combine all unique userIds
      const userIds = [...new Set([
        ...messageCounts.map(m => m.userId),
        ...reactionCounts.map(r => r.userId),
        ...fileCounts.map(f => f.userId)
      ])];

      // Get user details
      const users = await ctx.db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true }
      });

      // Combine all counts
      const combinedData = userIds.map(userId => {
        const messageCount = messageCounts.find(m => m.userId === userId)?._count.userId ?? 0;
        const reactionCount = reactionCounts.find(r => r.userId === userId)?._count.userId ?? 0;
        const fileCount = fileCounts.find(f => f.userId === userId)?._count.userId ?? 0;
        const totalCount = messageCount + reactionCount + fileCount;
        const user = users.find(u => u.id === userId);
        
        return {
          userId,
          userName: user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || null : null,
          messageCount,
          reactionCount,
          fileCount,
          totalCount,
          timespan: input.timespan ?? "7d"
        };
      });

      // Filter by userName if provided
      let filteredData = combinedData;
      if (input.userName) {
        filteredData = combinedData.filter(item => 
          item.userName?.toLowerCase().includes(input.userName!.toLowerCase())
        );
      }

      // Sort the data if requested
      if (input._sort && input._order) {
        const sortField = input._sort;
        const sortOrder = input._order.toLowerCase() as 'asc' | 'desc';
        
        filteredData.sort((a, b) => {
          const aValue = a[sortField as keyof typeof a];
          const bValue = b[sortField as keyof typeof b];
          return sortOrder === 'asc' 
            ? ((aValue ?? 0) < (bValue ?? 0) ? -1 : 1)
            : ((aValue ?? 0) > (bValue ?? 0) ? -1 : 1);
        });
      } else {
        // Default sort by totalCount desc
        filteredData.sort((a, b) => b.totalCount - a.totalCount);
      }

      // Apply pagination
      const paginatedData = filteredData.slice(skip ?? 0, input._end);

      return {
        data: paginatedData,
        total: filteredData.length
      };
    }),
});
