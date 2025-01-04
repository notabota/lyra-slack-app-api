import { z } from "zod";
import { decode } from "html-entities";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

interface QueryResult {
  userId: number;
  count: bigint;
}

interface PingResult {
  mentioned_user: string[];
  count: bigint;
}

interface RandomMessage {
  text: string;
  channelId: bigint;
  timestamp: string;
  channelName: string;
}

export const triviaRouter = createTRPCRouter({
  getTrivia: publicProcedure
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
        }),
        mostPinged: z.object({
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
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      
      const broResults = await ctx.db.$queryRaw`
        SELECT "userId", COUNT(*) as count
        FROM "message"
        WHERE text ~* '\\mbro\\M'
        AND "createdAt" >= ${sevenDaysAgo}
        AND "createdAt" <= ${now}
        GROUP BY "userId"
        ORDER BY count DESC
      ` as QueryResult[];

      const sorryResults = await ctx.db.$queryRaw`
        SELECT "userId", COUNT(*) as count
        FROM "message"
        WHERE text ~* '\\msorry\\M'
        AND "createdAt" >= ${sevenDaysAgo}
        AND "createdAt" <= ${now}
        GROUP BY "userId"
        ORDER BY count DESC
      ` as QueryResult[];

      const pingResults = await ctx.db.$queryRaw`
        SELECT REGEXP_MATCHES(text, '<@([A-Z0-9]+)>', 'g') as mentioned_user,
               COUNT(*) as count
        FROM "message"
        WHERE "userId" = 3
        AND "createdAt" >= ${sevenDaysAgo}
        AND "createdAt" <= ${now}
        GROUP BY mentioned_user
        ORDER BY count DESC 
      ` as PingResult[];

      // Get all users to map Slack IDs to user IDs
      const allUsers = await ctx.db.user.findMany({
        select: {
          id: true,
          userId: true
        }
      });

      const slackIdToUserId = new Map(
        allUsers.map(user => [String(user.userId), user.id])
      );

      const pingResultsConverted: QueryResult[] = pingResults
        .filter(result => result.mentioned_user[0] && slackIdToUserId.has(result.mentioned_user[0]))
        .map(result => ({
          userId: Number(slackIdToUserId.get(result.mentioned_user[0]!)!),
          count: result.count
        }));

      if (!broResults.length && !sorryResults.length && !pingResultsConverted.length) {
        const emptyResult = {
          userName: "No users found",
          messageCount: 0,
          profileImage: null,
          randomLine: "No messages found",
          randomLineChannelId: "0",
          randomLineChannelName: "unknown",
          randomLineTimestamp: "0"
        };
        return {
          data: {
            bro: emptyResult,
            sorry: emptyResult,
            mostPinged: emptyResult
          }
        };
      }

      const topBro = broResults[0] || { userId: 0, count: BigInt(0) };
      const topSorry = sorryResults[0] || { userId: 0, count: BigInt(0) };
      const topPinged = pingResultsConverted[0] || { userId: 0, count: BigInt(0) };

      console.log('--------------------------------');
      console.log(pingResults);
      console.log(topPinged);
      console.log(topBro);
      console.log('--------------------------------');

      // Get user names for tag replacement
      const allUsersWithNames = await ctx.db.user.findMany({
        select: {
          id: true,
          userId: true,
          displayName: true,
          realName: true
        }
      });

      const userIdToName = new Map(
        allUsersWithNames.map(user => [
          String(user.userId),
          user.displayName ?? user.realName ?? `User ${user.userId}`
        ])
      );

      const replaceUserTags = (text: string) => {
        return text.replace(/<@([A-Z0-9]+)>/g, (match, userId) => {
          return `@${userIdToName.get(userId) || match}`;
        });
      };

      const formatMessage = (text: string) => {
        const decodedText = decode(text);
        return replaceUserTags(decodedText);
      };

      const randomBroMessage = topBro.userId ? await ctx.db.$queryRaw`
        SELECT m.text, c."channelId", m.timestamp, c.name as "channelName"
        FROM "message" m
        JOIN "channel" c ON m."channelId" = c.id
        WHERE m.text ~* '\\mbro\\M'
        AND m."userId" = ${topBro.userId}
        AND m."createdAt" >= ${sevenDaysAgo}
        AND m."createdAt" <= ${now}
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
        AND m."createdAt" <= ${now}
        ORDER BY random()
        LIMIT 1
      ` as RandomMessage[] : [];

      // Get the Slack user ID for the most pinged user
      const pingedUserSlackId = allUsers.find(user => Number(user.id) === topPinged.userId)?.userId;

      const randomPingMessage = topPinged.userId && pingedUserSlackId ? await ctx.db.$queryRaw`
        SELECT m.text, c."channelId", m.timestamp, c.name as "channelName"
        FROM "message" m
        JOIN "channel" c ON m."channelId" = c.id
        WHERE m.text LIKE ${'%<@' + pingedUserSlackId + '>%'}
        AND m."userId" = 3
        AND m."createdAt" >= ${sevenDaysAgo}
        AND m."createdAt" <= ${now}
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

      console.log('--------------------------------');
      console.log(topPinged.userId);
      console.log('--------------------------------');

      const pingedUser = topPinged.userId ? await ctx.db.user.findFirst({
        where: {
          id: topPinged.userId
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
          randomLine: formatMessage(randomBroMessage[0]?.text ?? "No messages found"),
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
          randomLine: formatMessage(randomSorryMessage[0]?.text ?? "No messages found"),
          randomLineChannelId: String(randomSorryMessage[0]?.channelId ?? "0"),
          randomLineChannelName: randomSorryMessage[0]?.channelName ?? "unknown",
          randomLineTimestamp: randomSorryMessage[0]?.timestamp ?? "0"
        },
        mostPinged: {
          userName: pingedUser?.firstName && pingedUser?.lastName
            ? `${pingedUser.firstName} ${pingedUser.lastName}`
            : topPinged.userId ? `User ${topPinged.userId}` : "No users found",
          messageCount: Number(topPinged.count),
          profileImage: pingedUser?.image ?? null,
          randomLine: formatMessage(randomPingMessage[0]?.text ?? "No messages found"),
          randomLineChannelId: String(randomPingMessage[0]?.channelId ?? "0"),
          randomLineChannelName: randomPingMessage[0]?.channelName ?? "unknown",
          randomLineTimestamp: randomPingMessage[0]?.timestamp ?? "0"
        }
      };

      return {
        data
      };
    })
});
