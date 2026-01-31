import { createTRPCRouter } from "./create-context";
import { placesRouter } from "./routes/places";

export const appRouter = createTRPCRouter({
  places: placesRouter,
});

export type AppRouter = typeof appRouter;
