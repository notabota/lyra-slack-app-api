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

      console.log(broResults);
      console.log(sorryResults);
      
      const topBro = broResults[0];
      const topSorry = sorryResults[0];

      console.log(topBro);
      console.log(topSorry);

      if (!topBro || !topSorry) {
        throw new Error("No results found");
      }
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

      console.log(userIdToName);

      const replaceUserTags = (text: string) => {
        return text.replace(/<@([A-Z0-9]+)>/g, (match, userId) => {
          console.log("--------------------------------");
          console.log(match, userId);
          console.log(userIdToName.get(userId));
          console.log("--------------------------------");
          return `@${userIdToName.get(userId) || match}`;
        });
      };

      const randomBroMessage = await ctx.db.$queryRaw`
        SELECT m.text, c."channelId", m.timestamp, c.name as "channelName"
        FROM "message" m
        JOIN "channel" c ON m."channelId" = c.id
        WHERE m.text ~* '\\mbro\\M'
        AND m."userId" = ${topBro.userId}
        AND m."createdAt" >= ${sevenDaysAgo}
        AND m."createdAt" <= ${today}
        ORDER BY random()
        LIMIT 1
      ` as RandomMessage[];

      const randomSorryMessage = await ctx.db.$queryRaw`
        SELECT m.text, c."channelId", m.timestamp, c.name as "channelName"
        FROM "message" m
        JOIN "channel" c ON m."channelId" = c.id
        WHERE m.text ~* '\\msorry\\M'
        AND m."userId" = ${topSorry.userId}
        AND m."createdAt" >= ${sevenDaysAgo}
        AND m."createdAt" <= ${today}
        ORDER BY random()
        LIMIT 1
      ` as RandomMessage[];

      const broUser = await ctx.db.user.findFirst({
        where: {
          id: topBro.userId
        },
        select: {
          firstName: true,
          lastName: true,
          image: true
        }
      });

      const sorryUser = await ctx.db.user.findFirst({
        where: {
          id: topSorry.userId
        },
        select: {
          firstName: true,
          lastName: true,
          image: true
        }
      });

      const data = {
        bro: {
            userName: broUser?.firstName && broUser?.lastName 
              ? `${broUser.firstName} ${broUser.lastName}`
              : `User ${topBro.userId}`,
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
              : `User ${topSorry.userId}`,
            messageCount: Number(topSorry.count),
            profileImage: sorryUser?.image ?? null,
            randomLine: replaceUserTags(randomSorryMessage[0]?.text ?? "No messages found"),
            randomLineChannelId: String(randomSorryMessage[0]?.channelId ?? "0"),
            randomLineChannelName: randomSorryMessage[0]?.channelName ?? "unknown",
            randomLineTimestamp: randomSorryMessage[0]?.timestamp ?? "0"
          }
        };
        
      console.log(data);

      return {
        data
      };
    })
});
