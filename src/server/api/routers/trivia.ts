import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

interface QueryResult {
  userId: number;
  text: string;
  count: bigint;
}

interface RandomMessage {
  text: string;
  channelId: bigint;
  timestamp: string;
  channelName: string;
}

export const triviaRouter = createTRPCRouter({
  getList: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/trivia' } })
    .input(z.void())
    .output(z.object({
      data: z.object({
        bro: z.object({
          userName: z.string(),
          messageCount: z.number(),
          profileImage: z.string().nullable(),
          randomLine: z.string(),
          randomLineChannelId: z.string(),
          randomLineChannelName: z.string(),
          randomLineTimestamp: z.string()
        }),
        sorry: z.object({
          userName: z.string(),
          messageCount: z.number(),
          profileImage: z.string().nullable(),
          randomLine: z.string(),
          randomLineChannelId: z.string(),
          randomLineChannelName: z.string(),
          randomLineTimestamp: z.string()
        })
      }),
    }))
    .query(async ({ ctx, input }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      
      const broResults = await ctx.db.$queryRaw`
        SELECT "userId", COUNT(*) as count
        FROM "message"
        WHERE text ~* '\\mbro\\M'
        AND "createdAt" >= ${sevenDaysAgo}
        AND "createdAt" <= ${today}
        GROUP BY "userId"
        ORDER BY count DESC
      ` as QueryResult[];

      const sorryResults = await ctx.db.$queryRaw`
        SELECT "userId", COUNT(*) as count
        FROM "message"
        WHERE text ~* '\\msorry\\M'
        AND "createdAt" >= ${sevenDaysAgo}
        AND "createdAt" <= ${today}
        GROUP BY "userId"
        ORDER BY count DESC
      ` as QueryResult[];

      if (!broResults.length && !sorryResults.length) {
        return {
          data: {
            bro: {
              userName: "No users found",
              messageCount: 0,
              profileImage: null,
              randomLine: "No messages found",
              randomLineChannelId: "0",
              randomLineChannelName: "unknown",
              randomLineTimestamp: "0"
            },
            sorry: {
              userName: "No users found", 
              messageCount: 0,
              profileImage: null,
              randomLine: "No messages found",
              randomLineChannelId: "0",
              randomLineChannelName: "unknown",
              randomLineTimestamp: "0"
            }
          }
        };
      }

      const topBro = broResults[0] || { userId: 0, count: BigInt(0) };
      const topSorry = sorryResults[0] || { userId: 0, count: BigInt(0) };

      // Get user names for tag replacement
      const allUsers = await ctx.db.user.findMany({
        select: {
          id: true,
          userId: true,
          displayName: true,
          realName: true
        }
      });

      const userIdToName = new Map(
        allUsers.map(user => [
          String(user.userId),
          user.displayName ?? user.realName ?? `User ${user.userId}`
        ])
      );

      const replaceUserTags = (text: string) => {
        return text.replace(/<@([A-Z0-9]+)>/g, (match, userId) => {
          return `@${userIdToName.get(userId) || match}`;
        });
      };

      const randomBroMessage = topBro.userId ? await ctx.db.$queryRaw`
        SELECT m.text, c."channelId", m.timestamp, c.name as "channelName"
        FROM "message" m
        JOIN "channel" c ON m."channelId" = c.id
        WHERE m.text ~* '\\mbro\\M'
        AND m."userId" = ${topBro.userId}
        AND m."createdAt" >= ${sevenDaysAgo}
        AND m."createdAt" <= ${today}
        ORDER BY random()
        LIMIT 1
      ` as RandomMessage[] : [];

      const randomSorryMessage = topSorry.userId ? await ctx.db.$queryRaw`
        SELECT m.text, c."channelId", m.timestamp, c.name as "channelName"
        FROM "message" m
        JOIN "channel" c ON m."channelId" = c.id
        WHERE m.text ~* '\\msorry\\M'
        AND m."userId" = ${topSorry.userId}
        AND m."createdAt" >= ${sevenDaysAgo}
        AND m."createdAt" <= ${today}
        ORDER BY random()
        LIMIT 1
      ` as RandomMessage[] : [];

      const broUser = topBro.userId ? await ctx.db.user.findFirst({
        where: {
          id: topBro.userId
        },
        select: {
          firstName: true,
          lastName: true,
          image: true
        }
      }) : null;

      const sorryUser = topSorry.userId ? await ctx.db.user.findFirst({
        where: {
          id: topSorry.userId
        },
        select: {
          firstName: true,
          lastName: true,
          image: true
        }
      }) : null;

      const data = {
        bro: {
            userName: broUser?.firstName && broUser?.lastName 
              ? `${broUser.firstName} ${broUser.lastName}`
              : topBro.userId ? `User ${topBro.userId}` : "No users found",
            messageCount: Number(topBro.count),
            profileImage: broUser?.image ?? null,
            randomLine: replaceUserTags(randomBroMessage[0]?.text ?? "No messages found"),
            randomLineChannelId: String(randomBroMessage[0]?.channelId ?? "0"),
            randomLineChannelName: randomBroMessage[0]?.channelName ?? "unknown",
            randomLineTimestamp: randomBroMessage[0]?.timestamp ?? "0"
          },
          sorry: {
            userName: sorryUser?.firstName && sorryUser?.lastName
              ? `${sorryUser.firstName} ${sorryUser.lastName}`
              : topSorry.userId ? `User ${topSorry.userId}` : "No users found",
            messageCount: Number(topSorry.count),
            profileImage: sorryUser?.image ?? null,
            randomLine: replaceUserTags(randomSorryMessage[0]?.text ?? "No messages found"),
            randomLineChannelId: String(randomSorryMessage[0]?.channelId ?? "0"),
            randomLineChannelName: randomSorryMessage[0]?.channelName ?? "unknown",
            randomLineTimestamp: randomSorryMessage[0]?.timestamp ?? "0"
          }
        };

      return {
        data
      };
    })
});
