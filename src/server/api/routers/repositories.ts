import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const repositoriesRouter = createTRPCRouter({
  getRepositories: publicProcedure
    .meta({ openapi: { method: "GET", path: "/repositories" } })
    .input(
      z.object({
        _start: z.number().optional(),
        _end: z.number().optional(),
        _sort: z.enum(["name", "owner"]).optional(),
        _order: z.enum(["asc", "desc"]).optional(),
        _filter: z.enum(["name", "owner"]).optional(),
        _value: z.string().optional(),
        _operator: z.enum(["contains"]).optional(),
        name: z.string().optional(),
        owner: z.string().optional(),
        url: z.string().optional(),
        numberOfContributors: z.string().optional(),
        numberOfLinesAdded: z.string().optional(),
        numberOfLinesRemoved: z.string().optional(),
      }),
    )
    .output(
      z.object({
        data: z.array(
          z.object({
            name: z.string(),
            owner: z.string(),
            url: z.string(),
            contributors: z.array(
              z.object({
                name: z.string(),
                linesAdded: z.number(),
                linesRemoved: z.number(),
              }),
            ),
            numberOfContributors: z.number(),
            numberOfLinesAdded: z.number(),
            numberOfLinesRemoved: z.number(),
          }),
        ),
        total: z.number(),
        hasNextPage: z.boolean(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const skip = input._start;
      const take = input._end ? input._end - (input._start ?? 0) : undefined;

      // Parse number filters
      const numberOfContributorsFilter = input.numberOfContributors?.split(',').map(n => parseInt(n));
      const numberOfLinesAddedFilter = input.numberOfLinesAdded?.split(',').map(n => parseInt(n));
      const numberOfLinesRemovedFilter = input.numberOfLinesRemoved?.split(',').map(n => parseInt(n));

      const [repositories, total] = await Promise.all([
        ctx.dbGithub.repo.findMany({
          skip: skip,
          take: take,
          where: {
            AND: [
              // Name filter
              input.name ? {
                name: { contains: input.name, mode: 'insensitive' }
              } : {},
              // Owner filter
              input.owner ? {
                user: { GitHubUsername: { contains: input.owner, mode: 'insensitive' } }
              } : {},
              // URL filter
              input.url ? {
                url: { contains: input.url, mode: 'insensitive' }
              } : {},
            ]
          },
          orderBy: {
            [input._sort ?? "name"]: input._order ?? "asc",
          },
          include: {
            user: true,
            commits: {
              select: {
                author: true,
                numberOfLinesAdded: true,
                numberOfLinesRemoved: true,
              },
              where: {
                author: {
                  not: null,
                  notIn: ["web-flow"],
                },
              },
            },
          },
        }),
        ctx.dbGithub.repo.count({
          where: {
            AND: [
              // Name filter
              input.name ? {
                name: { contains: input.name, mode: 'insensitive' }
              } : {},
              // Owner filter
              input.owner ? {
                user: { GitHubUsername: { contains: input.owner, mode: 'insensitive' } }
              } : {},
              // URL filter
              input.url ? {
                url: { contains: input.url, mode: 'insensitive' }
              } : {},
            ]
          }
        }),
      ]);

      // Post-process the data to apply numeric filters that can't be done in the query
      let data = repositories.map((repository) => {
        const contributorStats = repository.commits.reduce(
          (acc, commit) => {
            if (!commit.author) return acc;

            if (!acc[commit.author]) {
              acc[commit.author] = { linesAdded: 0, linesRemoved: 0 };
            }

            acc[commit.author]!.linesAdded += commit.numberOfLinesAdded ?? 0;
            acc[commit.author]!.linesRemoved += commit.numberOfLinesRemoved ?? 0;

            return acc;
          },
          {} as Record<string, { linesAdded: number; linesRemoved: number }>,
        );

        const contributors = Object.entries(contributorStats).map(
          ([name, stats]) => ({
            name,
            linesAdded: stats.linesAdded,
            linesRemoved: stats.linesRemoved,
          }),
        );

        return {
          name: repository.name,
          owner: repository.user.GitHubUsername,
          url: repository.url,
          contributors,
          numberOfContributors: contributors.length,
          numberOfLinesAdded: contributors.reduce(
            (acc, c) => acc + c.linesAdded,
            0,
          ),
          numberOfLinesRemoved: contributors.reduce(
            (acc, c) => acc + c.linesRemoved,
            0,
          ),
        };
      });

      // Apply numeric filters
      if (numberOfContributorsFilter?.length === 2) {
        const [minNum, maxNum] = numberOfContributorsFilter;
        console.log(minNum, maxNum)
        data = data.filter(repo => {
            if(Number.isNaN(maxNum) && Number.isNaN(minNum)) {
                return true
            }
            if(Number.isNaN(maxNum)) {
                return repo.numberOfContributors >= (minNum ?? 0)
            }
            if(Number.isNaN(minNum)) {
                return repo.numberOfContributors <= (maxNum ?? Infinity)
            }
        }
        );
      }

      if (numberOfLinesAddedFilter?.length === 2) {
        const [minNum, maxNum] = numberOfLinesAddedFilter;
        data = data.filter(repo => {
            if(Number.isNaN(maxNum) && Number.isNaN(minNum)) {
                return true
            }
            if(Number.isNaN(maxNum)) {
                return repo.numberOfLinesAdded >= (minNum ?? 0)
            }
            if(Number.isNaN(minNum)) {
                return repo.numberOfLinesAdded <= (maxNum ?? Infinity)
            }
            
        }
        );
      }

      if (numberOfLinesRemovedFilter?.length === 2) {
        const [minNum, maxNum] = numberOfLinesRemovedFilter;
        data = data.filter(repo => {
            if(Number.isNaN(maxNum) && Number.isNaN(minNum)) {
                return true
            }
            if(Number.isNaN(maxNum)) {
                return repo.numberOfLinesRemoved >= (minNum ?? 0)
            }
            if(Number.isNaN(minNum)) {
                return repo.numberOfLinesRemoved <= (maxNum ?? Infinity)
            }
        }
        );
      }

      // Update total count after filtering
      const filteredTotal = data.length;

      return {
        data: data,
        total: filteredTotal,
        hasNextPage: (skip ?? 0) + (take ?? 0) < filteredTotal,
      };
    }),
});
