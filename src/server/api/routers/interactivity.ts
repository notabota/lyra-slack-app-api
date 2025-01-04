import { z } from "zod";
import { WebClient } from "@slack/web-api";

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
      userId: z.number().optional(),
      channelId: z.number().optional()
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
      console.log(input)
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

      // Get all users who are team members and not bots
      const users = await ctx.db.user.findMany({
        where: {
          teamId: "T05U5TCF695",
          isBot: false,
          ...(input.userId ? { id: input.userId } : {})
        },
        select: { id: true, displayName: true, realName: true }
      });
      const userIds = users.map(user => user.id);

      // Add channel filter if provided
      const channelFilter = input.channelId ? { channelId: input.channelId } : {};

      // Get message counts and message IDs for the channel if filtered
      const messageData = await ctx.db.message.groupBy({
        by: ['userId'],
        _count: {
          userId: true
        },
        where: {
          ...dateFilter,
          ...channelFilter,
          userId: {
            in: userIds
          }
        }
      });

      // If channel filter is applied, get message IDs for that channel
      let messageIds: number[] = [];
      if (input.channelId) {
        const channelMessages = await ctx.db.message.findMany({
          where: {
            ...dateFilter,
            ...channelFilter,
          },
          select: {
            id: true
          }
        });
        messageIds = channelMessages.map(m => Number(m.id));
      }

      // Get reaction counts, filtered by message IDs if channel filter is applied
      const reactionCounts = await ctx.db.reaction.groupBy({
        by: ['userId'],
        _count: {
          userId: true
        },
        where: {
          ...dateFilter,
          userId: {
            in: userIds
          },
          ...(input.channelId ? {
            messageId: {
              in: messageIds
            }
          } : {})
        }
      });

      // Get file counts, filtered by message IDs if channel filter is applied
      const fileCounts = await ctx.db.file.groupBy({
        by: ['userId'],
        _count: {
          userId: true
        },
        where: {
          ...dateFilter,
          userId: {
            in: userIds
          },
          ...(input.channelId ? {
            messageId: {
              in: messageIds
            }
          } : {})
        }
      });

      // Combine data for all users
      const combinedData = users.map(user => {
        const messageCount = messageData.find(m => m.userId === user.id)?._count.userId ?? 0;
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

      // Sort the data if requested
      if (input._sort && input._order) {
        const sortField = input._sort;
        const sortOrder = input._order.toLowerCase() as 'asc' | 'desc';
        
        combinedData.sort((a, b) => {
          const aValue = a[sortField as keyof typeof a];
          const bValue = b[sortField as keyof typeof b];
          return sortOrder === 'asc' 
            ? ((aValue ?? 0) < (bValue ?? 0) ? -1 : 1)
            : ((aValue ?? 0) > (bValue ?? 0) ? -1 : 1);
        });
      } else {
        // Default sort by totalCount desc
        combinedData.sort((a, b) => b.totalCount - a.totalCount);
      }

      // Apply pagination
      const paginatedData = combinedData.slice(skip ?? 0, input._end);

      return {
        data: paginatedData,
        total: combinedData.length,
        hasNextPage: (skip ?? 0) + (take ?? 0) < combinedData.length
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
        })),
        channelStats: z.array(z.object({
          channelName: z.string(),
          messageCount: z.number()
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

      // Get daily message counts with channel info
      const messages = await ctx.db.message.findMany({
        where: {
          userId: input.id,
          timestamp: {
            gte: Math.floor(startDate.getTime() / 1000).toString(),
            lte: Math.floor(endDate.getTime() / 1000).toString()
          }
        },
        include: {
          channel: true
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

      // Build channel stats array by grouping messages by channelId
      const channelStatsMap = new Map<number, { channelName: string; messageCount: number }>();
      
      messages.forEach(message => {
        const channelId = message.channelId;
        const channelName = message.channel.name;
        
        const existing = channelStatsMap.get(Number(channelId));
        if (existing) {
          existing.messageCount++;
        } else {
          channelStatsMap.set(Number(channelId), {
            channelName: channelName ?? "Unknown",
            messageCount: 1
          });
        }
      });

      const channelStats = Array.from(channelStatsMap.values())
        .sort((a, b) => b.messageCount - a.messageCount);

      return {
        data: {
          userId: Number(user.id),
          userName: user.displayName || user.realName || null,
          dailyStats,
          channelStats
        }
      };
    }),
});
