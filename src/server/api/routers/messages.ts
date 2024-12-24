import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const messageRouter = createTRPCRouter({
  getList: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/messages' } })
    .input(z.object({
      _start: z.number().optional(),
      _end: z.number().optional(),
      _sort: z.string().optional(),
      _order: z.string().optional(),
    }))
    .output(z.object({
      data: z.array(z.object({
        id: z.number(),
        userId: z.number(),
        type: z.string(),
        timestamp: z.string(),
        text: z.string().nullable(),
        channelId: z.number(),
        channelType: z.string(),
        eventTs: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
        parentId: z.string().nullable(),
        threadTs: z.string().nullable()
      })),
      total: z.number()
    }))
    .query(async ({ ctx, input }) => {
      const skip = input._start;
      const take = input._end ? input._end - (input._start ?? 0) : undefined;

      const where = {};
      const orderBy: Record<string, 'asc' | 'desc'> = {};

      console.log("--------------- INPUT -----------------");
      console.log(input);
      console.log("--------------------------------");


      if (input._sort && input._order) {
        orderBy[input._sort] = input._order.toLowerCase() as 'asc' | 'desc';
      }

      const [messages, total] = await Promise.all([
        ctx.db.message.findMany({
          skip,
          take,
          where,
          orderBy
        }),
        ctx.db.message.count({ where })
      ]);

      console.log("---------------- MESSAGES ----------------");
      console.log(messages);
      console.log("--------------------------------");

      return {
        data: messages,
        total
      };
    }),

  getOne: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/messages/{id}' } })
    .input(z.object({
      id: z.number()
    }))
    .output(z.object({
      data: z.object({
        id: z.number(),
        userId: z.number(),
        type: z.string(),
        timestamp: z.string(),
        text: z.string().nullable(),
        channelId: z.number(),
        channelType: z.string(),
        eventTs: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
        parentId: z.string().nullable(),
        threadTs: z.string().nullable()
      })
    }))
    .query(async ({ ctx, input }) => {
      const message = await ctx.db.message.findUniqueOrThrow({
        where: { id: input.id }
      });

      return {
        data: message,
        total: 1
      };
    }),

  create: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/messages' } })
    .input(z.object({
      variables: z.object({
        userId: z.number(),
        type: z.string(),
        timestamp: z.string(),
        text: z.string().optional(),
        channelId: z.number(),
        channelType: z.string(),
        eventTs: z.string(),
        parentId: z.string().optional(),
        threadTs: z.string().optional()
      })
    }))
    .output(z.object({
      data: z.object({
        id: z.number(),
        userId: z.number(),
        type: z.string(),
        timestamp: z.string(),
        text: z.string().nullable(),
        channelId: z.number(),
        channelType: z.string(),
        eventTs: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
        parentId: z.string().nullable(),
        threadTs: z.string().nullable()
      })
    }))
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.db.message.create({
        data: input.variables
      });

      return {
        data: message,
        total: 1
      };
    }),

  update: publicProcedure
    .meta({ openapi: { method: 'PATCH', path: '/messages/{id}' } })
    .input(z.object({
      id: z.number(),
      variables: z.object({
        userId: z.number().optional(),
        type: z.string().optional(),
        timestamp: z.string().optional(),
        text: z.string().optional(),
        channelId: z.number().optional(),
        channelType: z.string().optional(),
        eventTs: z.string().optional(),
        parentId: z.string().optional(),
        threadTs: z.string().optional()
      })
    }))
    .output(z.object({
      data: z.object({
        id: z.number(),
        userId: z.number(),
        type: z.string(),
        timestamp: z.string(),
        text: z.string().nullable(),
        channelId: z.number(),
        channelType: z.string(),
        eventTs: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
        parentId: z.string().nullable(),
        threadTs: z.string().nullable()
      })
    }))
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.db.message.update({
        where: { id: input.id },
        data: input.variables
      });

      return {
        data: message,
        total: 1
      };
    }),

  deleteOne: publicProcedure
    .meta({ openapi: { method: 'DELETE', path: '/messages/{id}' } })
    .input(z.object({
      id: z.number()
    }))
    .output(z.object({
      data: z.object({
        id: z.number()
      })
    }))
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.db.message.delete({
        where: { id: input.id }
      });

      return {
        data: {
          id: message.id
        }
      };
    })
});
