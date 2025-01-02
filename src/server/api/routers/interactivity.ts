import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const interactivityRouter = createTRPCRouter({
  getList: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/interactivity' } })
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
      total: z.number(),
      hasNextPage: z.boolean()
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

      // Get all users first
      const users = await ctx.db.user.findMany({
        select: { id: true, displayName: true, realName: true }
      });

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

      // Combine data for all users
      const combinedData = users.map(user => {
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
        total: filteredData.length,
        hasNextPage: (skip ?? 0) + (take ?? 0) < filteredData.length
      };
    }),

  getOne: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/interactivity/{id}' } })
    .input(z.object({
      id: z.number(),
      timespan: z.enum(['7d', '14d', '30d']).optional(),
    }))
    .output(z.object({
      data: z.object({
        userId: z.number(),
        userName: z.string().nullable(),
        dailyStats: z.array(z.object({
          date: z.string(),
          messageCount: z.number(),
          reactionCount: z.number(),
          totalCount: z.number()
        }))
      })
    }))
    .query(async ({ ctx, input }) => {
      // Get user details
      const user = await ctx.db.user.findUniqueOrThrow({
        where: { id: input.id },
        select: { id: true, displayName: true, realName: true }
      });

      // Calculate date range
      const days = parseInt(input.timespan?.replace('d', '') ?? '7');
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999); // End of day
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - (days - 1)); // Subtract days-1 to include current day
      startDate.setHours(0, 0, 0, 0); // Start of day

      // Get daily message counts
      const messages = await ctx.db.message.findMany({
        where: {
          userId: input.id,
          timestamp: {
            gte: Math.floor(startDate.getTime() / 1000).toString(),
            lte: Math.floor(endDate.getTime() / 1000).toString()
          }
        }
      });

      // Get daily reaction counts  
      const reactions = await ctx.db.reaction.findMany({
        where: {
          userId: input.id,
          eventTs: {
            gte: Math.floor(startDate.getTime() / 1000).toString(),
            lte: Math.floor(endDate.getTime() / 1000).toString()
          }
        }
      });

      // Build daily stats array
      const dailyStats = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]!;
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayMessages = messages.filter(m => {
          const ts = parseInt(m.timestamp);
          return ts >= dayStart.getTime() / 1000 && ts <= dayEnd.getTime() / 1000;
        }).length;

        const dayReactions = reactions.filter(r => {
          const ts = parseInt(r.eventTs);
          return ts >= dayStart.getTime() / 1000 && ts <= dayEnd.getTime() / 1000;
        }).length;
        
        dailyStats.push({
          date: dateStr,
          messageCount: dayMessages,
          reactionCount: dayReactions,
          totalCount: dayMessages + dayReactions
        });
      }

      return {
        data: {
          userId: Number(user.id),
          userName: user.displayName || user.realName || null,
          dailyStats
        }
      };
    }),
});
