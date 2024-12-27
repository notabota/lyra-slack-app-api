import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

interface QueryResult {
  userId: number;
  text: string;
  count: bigint;
}

interface RandomMessage {
  text: string;
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
          randomLine: z.string()
        }),
        sorry: z.object({
          userName: z.string(),
          messageCount: z.number(),
          profileImage: z.string().nullable(),
          randomLine: z.string()
        })
      }),
    }))
    .query(async ({ ctx, input }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      
      const broResults = await ctx.db.$queryRaw`
        SELECT "userId", text, COUNT(*) as count
        FROM "message"
        WHERE text ~* '\\mbro\\M'
        AND "createdAt" >= ${sevenDaysAgo}
        AND "createdAt" <= ${today}
        GROUP BY "userId", text
        ORDER BY count DESC
      ` as QueryResult[];

      const sorryResults = await ctx.db.$queryRaw`
        SELECT "userId", text, COUNT(*) as count
        FROM "message"
        WHERE text ~* '\\msorry\\M'
        AND "createdAt" >= ${sevenDaysAgo}
        AND "createdAt" <= ${today}
        GROUP BY "userId", text
        ORDER BY count DESC
      ` as QueryResult[];

      const randomBroMessage = await ctx.db.$queryRaw`
        SELECT text 
        FROM "message" 
        WHERE text ~* '\\mbro\\M'
        AND "createdAt" >= ${sevenDaysAgo}
        AND "createdAt" <= ${today}
        ORDER BY random()
        LIMIT 1
      ` as RandomMessage[];

      const randomSorryMessage = await ctx.db.$queryRaw`
        SELECT text
        FROM "message"
        WHERE text ~* '\\msorry\\M'
        AND "createdAt" >= ${sevenDaysAgo}
        AND "createdAt" <= ${today}
        ORDER BY random()
        LIMIT 1
      ` as RandomMessage[];

      console.log(broResults);
      console.log(sorryResults);
      
      const topBro = broResults[0];
      const topSorry = sorryResults[0];

      console.log(topBro);
      console.log(topSorry);

      if (!topBro || !topSorry) {
        throw new Error("No results found");
      }

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
            messageCount: broResults.length,
            profileImage: broUser?.image ?? null,
            randomLine: randomBroMessage[0]?.text ?? "No messages found"
          },
          sorry: {
            userName: sorryUser?.firstName && sorryUser?.lastName
              ? `${sorryUser.firstName} ${sorryUser.lastName}`
              : `User ${topSorry.userId}`,
            messageCount: sorryResults.length,
            profileImage: sorryUser?.image ?? null,
            randomLine: randomSorryMessage[0]?.text ?? "No messages found"
          }
        };
        
      console.log(data);

      return {
        data
      };
    })
});
