import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const messageCountRouter = createTRPCRouter({
  getList: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/dashboard' } })
    .input(z.object({
      _start: z.number().optional(),
      _end: z.number().optional(),
      _sort: z.string().optional(), 
      _order: z.string().optional(),
      timespan: z.enum(['1d', '7d', '14d', '30d', 'all']).optional()
    }))
    .output(z.object({
      data: z.array(z.object({
        userId: z.number(),
        userName: z.string().nullable(),
        count: z.number(),
        timespan: z.enum(['1d', '7d', '14d', '30d', 'all'])
      })),
      total: z.number()
    }))
    .query(async ({ ctx, input }) => {
      const skip = input._start;
      const take = input._end ? input._end - (input._start ?? 0) : undefined;

      const orderBy: Record<string, 'asc' | 'desc'> = {};

      console.log("--------------- INPUT -----------------");
      console.log(input);
      console.log("--------------------------------");

      if (input._sort && input._order) {
        orderBy[input._sort] = input._order.toLowerCase() as 'asc' | 'desc';
      }

      // Calculate date filter based on timespan
      let dateFilter = {};
      if (input.timespan && input.timespan !== 'all') {
        const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds as string
        const days = parseInt(input.timespan);
        const secondsInDay = 86400;
        const cutoffTime = (now - (days * secondsInDay)).toString();
        dateFilter = {
          eventTs: {
            gte: cutoffTime
          }
        };
      }

      // Get message counts grouped by userId
      const messageCounts = await ctx.db.message.groupBy({
        by: ['userId'],
        _count: {
          userId: true
        },
        where: dateFilter,
        skip,
        take,
        orderBy: input._sort ? (
          input._sort === 'userId' ? {
            userId: input._order?.toLowerCase() as 'asc' | 'desc'
          } : {
            _count: {
              userId: input._order?.toLowerCase() as 'asc' | 'desc'
            }
          }
        ) : {
          _count: {
            userId: 'desc'
          }
        }
      });

      // Get user names in a separate query
      const userIds = messageCounts.map(m => m.userId);
      const users = await ctx.db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true }
      });

      // Get total number of unique users with messages
      const total = await ctx.db.message.groupBy({
        by: ['userId'],
        where: dateFilter,
      }).then(results => results.length);

      console.log("---------------- MESSAGE COUNTS ----------------");
      console.log(messageCounts);
      console.log("--------------------------------");

      // Transform the data into the expected format
      const data = messageCounts.map(count => ({
        userId: Number(count.userId),
        userName: users.find(u => u.id === count.userId)
          ? `${users.find(u => u.id === count.userId)?.firstName ?? ''} ${users.find(u => u.id === count.userId)?.lastName ?? ''}`.trim() || null
          : null,
        count: count._count.userId,
        timespan: input.timespan ?? "7d"
      }));

      return {
        data,
        total
      };
    }),

});
