import { protectedProcedure, publicProcedure, router } from "../index";
import { getCachedNextLaunch } from "../scrapers/nextspaceflight";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  nextLaunch: publicProcedure.query(async () => {
    return getCachedNextLaunch();
  }),
});
export type AppRouter = typeof appRouter;
