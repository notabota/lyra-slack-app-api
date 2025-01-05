import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const commitsRouter = createTRPCRouter({
  getCommitsCountOfUsers: publicProcedure
    .meta({ openapi: { method: "GET", path: "/commits-count-of-users" } })
    .input(
      z.object({
        _start: z.number().optional(),
        _end: z.number().optional(),
        _sort: z.enum(["author", "count"]).optional(),
        _order: z.enum(["asc", "desc"]).optional(),
        _filter: z.enum(["author", "count"]).optional(),
        _value: z.string().optional() || z.array(z.number()).optional(),
        _operator: z.enum(["contains", "between"]).optional(),
        timespan: z.enum(["1d", "7d", "14d", "30d", "all"]).optional(),
      }),
    )
    .output(
      z.object({
        data: z.array(
          z.object({
            author: z.string(),
            count: z.number(),
            timespan: z.enum(["1d", "7d", "14d", "30d", "all"]),
          }),
        ),
        total: z.number(),
        hasNextPage: z.boolean(),
      }),
    )
    .query(async ({ ctx, input }) => {
      
      const skip = input._start;
      const take = input._end ? input._end - (input._start ?? 0) : undefined;

      const timeFilter =
        input.timespan && input.timespan !== "all"
          ? {
              timestamp: {
                gte: new Date(
                  Date.now() -
                    {
                      "1d": 1000 * 60 * 60 * 24,
                      "7d": 1000 * 60 * 60 * 24 * 7,
                      "14d": 1000 * 60 * 60 * 24 * 14,
                      "30d": 1000 * 60 * 60 * 24 * 30,
                    }[input.timespan],
                ),
              },
            }
          : {};

      const [summary, total] = await Promise.all([
        ctx.dbGithub.commit.groupBy({
          by: ['author'],
          skip,
          take,
          where: {
            AND: [
              timeFilter,
              input._filter === 'author' && input._value
                ? {
                    author: {
                      contains: input._value,
                      mode: "insensitive" as const,
                    },
                  }
                : {},
            ],
          },
          _count: {
            author: true
          },
          having: input._filter === 'count' && input._value ? {
            author: {
              _count: {
                gte: input._value[0] ? Number(input._value[0]) : undefined,
                lte: input._value[1] ? Number(input._value[1]) : undefined,
              }
            }
          } : undefined,
          orderBy: input._sort === 'author' 
            ? { author: input._order?.toLowerCase() as "asc" | "desc" ?? "asc" }
            : {
                _count: {
                  committer: input._order?.toLowerCase() as "asc" | "desc" ?? "desc"
                }
              }
        }),
        ctx.dbGithub.commit.count({
          where: timeFilter,
        }),
      ]);
      
      return {
        data: summary.map((group) => ({
          author: group.author ?? "Unknown",
          count: group._count.author ?? 0,
          timespan: input.timespan ?? "all",
        })),
        total: total,
        hasNextPage: (skip ?? 0) + (take ?? 0) < total,
      };
    }),
});
