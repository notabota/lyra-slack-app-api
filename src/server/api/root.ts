import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { messageRouter } from "~/server/api/routers/messages";
import { messageCountRouter } from "~/server/api/routers/messages-count";
import { reactionsCountRouter } from "./routers/reactions-count";
import { fileCountRouter } from "./routers/files-count";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  message: messageRouter,
  messageCount: messageCountRouter,
  reactionsCount: reactionsCountRouter,
  filesCount: fileCountRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
