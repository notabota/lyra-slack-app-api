import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const leaderboardRouter = createTRPCRouter({
  getGitHubLeaderboard: publicProcedure
    .meta({ openapi: { method: "GET", path: "/leaderboard/github" } })
    .input(
      z.object({
        timespan: z.enum(["1d", "7d", "14d", "30d", "all"]).optional(),
      }),
    )
    .output(
      z.object({
        data: z.array(
          z.object({
            userId: z.number(),
            userName: z.string().nullable(),
            image: z.string().nullable(),
            commits: z.number(),
            pullRequests: z.number().nullable(),
            reviews: z.number().nullable(),
            commitPoints: z.number(),
          }),
        ),
      }),
    )
    .query(async ({ ctx, input }) => {
      let cutoffDate = new Date();
      if (input.timespan && input.timespan !== "all") {
        const days = parseInt(input.timespan);
        cutoffDate.setDate(cutoffDate.getDate() - days);
      }else{
        cutoffDate = new Date(0);
      }

      const users = await ctx.db.user.findMany({
        where: {
          teamId: "T05U5TCF695",
          isBot: false,
        },
        select: { id: true, displayName: true, realName: true, image: true },
      });

      const userIds = users.map((user) => user.id);

      const userWithGithub = await ctx.dbGithub.user.findMany({
        where: {
          slackUserId: {
            in: userIds,
          },
        },
        select: {
          slackUserId: true,
          GitHubUsername: true,
        },
      });

      const SlackUserIdToGitHubUsername = new Map<bigint, string[]>();

      userWithGithub.forEach((user) => {
        if (user.slackUserId) {
          const existing =
            SlackUserIdToGitHubUsername.get(user.slackUserId) || [];
          existing.push(user.GitHubUsername);
          SlackUserIdToGitHubUsername.set(user.slackUserId, existing);
        }
      });

      type CommitSummary = {
        slackUserId: bigint;
        commit_count: bigint;
        weighted_score: bigint;
      };

      const summary: CommitSummary[] = await ctx.dbGithub.$queryRaw`
        SELECT 
          "User"."slackUserId",
          COUNT(*) as commit_count,
          SUM(
            CASE 
              WHEN GREATEST(COALESCE("numberOfLinesAdded", 0), COALESCE("numberOfLinesRemoved", 0)) BETWEEN 0 AND 30 THEN 1
              WHEN GREATEST(COALESCE("numberOfLinesAdded", 0), COALESCE("numberOfLinesRemoved", 0)) BETWEEN 31 AND 100 THEN 3
              WHEN GREATEST(COALESCE("numberOfLinesAdded", 0), COALESCE("numberOfLinesRemoved", 0)) BETWEEN 101 AND 250 THEN 7
              WHEN GREATEST(COALESCE("numberOfLinesAdded", 0), COALESCE("numberOfLinesRemoved", 0)) > 250 THEN 12
              ELSE 0
            END
          ) as weighted_score
        FROM (
          SELECT DISTINCT ON ("commitHash") *
          FROM "Commit"
          WHERE "timestamp" >= ${cutoffDate}
        ) as "DistinctCommit" 
        JOIN "User" ON "DistinctCommit"."author" = "User"."GitHubUsername"
        WHERE "User"."slackUserId" IS NOT NULL
        GROUP BY "User"."slackUserId"
        ORDER BY weighted_score DESC
      `;
      const data = summary.map((stat) => ({
        userId: Number(stat.slackUserId),
        userName: users.find((user) => user.id === stat.slackUserId)?.displayName || users.find((user) => user.id === stat.slackUserId)?.realName || null,
        commits: Number(stat.commit_count),
        commitPoints: Number(stat.weighted_score),
        image: users.find((user) => user.id === stat.slackUserId)?.image || null,
        pullRequests: null,
        reviews: null,
      }));
      return { data };
    }),
  getSlackLeaderboard: publicProcedure
    .meta({ openapi: { method: "GET", path: "/leaderboard/slack" } })
    .input(
      z.object({
        timespan: z.enum(["1d", "7d", "14d", "30d", "all"]).optional(),
      }),
    )
    .output(
      z.object({
        data: z.array(
          z.object({
            userId: z.number(),
            userName: z.string().nullable(),
            messageCount: z.number(),
            reactionCount: z.number(),
            fileCount: z.number(),
            totalCount: z.number(),
            image: z.string().nullable(),
          }),
        ),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Calculate date filter based on timespan from current time
      let dateFilter = {};
      if (input.timespan && input.timespan !== "all") {
        const now = new Date();
        const days = parseInt(input.timespan);
        const cutoffDate = new Date(now);
        cutoffDate.setDate(now.getDate() - days);
        dateFilter = {
          createdAt: {
            gte: cutoffDate.toISOString(),
          },
        };
      }

      // Get all users who are team members and not bots
      const users = await ctx.db.user.findMany({
        where: {
          teamId: "T05U5TCF695",
          isBot: false,
        },
        select: { id: true, displayName: true, realName: true, image: true },
      });
      const userIds = users.map((user) => user.id);
      // Get counts for each metric
      const [messageCounts, reactionCounts, fileCounts] = await Promise.all([
        ctx.db.message.groupBy({
          by: ["userId"],
          _count: { userId: true },
          where: { ...dateFilter, userId: { in: userIds } },
        }),
        ctx.db.reaction.groupBy({
          by: ["userId"],
          _count: { userId: true },
          where: { ...dateFilter, userId: { in: userIds } },
        }),
        ctx.db.file.groupBy({
          by: ["userId"],
          _count: { userId: true },
          where: { ...dateFilter, userId: { in: userIds } },
        }),
      ]);

      // Combine data for all users
      const combinedData = users.map((user) => {
        const messageCount =
          messageCounts.find((m) => m.userId === user.id)?._count.userId ?? 0;
        const reactionCount =
          reactionCounts.find((r) => r.userId === user.id)?._count.userId ?? 0;
        const fileCount =
          fileCounts.find((f) => f.userId === user.id)?._count.userId ?? 0;
        const totalCount = messageCount + reactionCount + fileCount;

        return {
          userId: Number(user.id),
          userName: user.displayName || user.realName || null,
          messageCount,
          reactionCount,
          fileCount,
          totalCount,
          image: user.image || null,
        };
      });

      // Sort by totalCount desc
      combinedData.sort((a, b) => b.totalCount - a.totalCount);

      return {
        data: combinedData,
      };
    }),
});
