import { Router } from "express";
import authRoutes from "./auth";
import eventRoutes from "./event";
import bookingRoutes from "./booking";
import chatRoutes from "./chat";
// Combines all the routes into one large route file
const rootRouter: Router = Router();

rootRouter.use("/auth", authRoutes);
rootRouter.use("/events", eventRoutes);
rootRouter.use("/booking", bookingRoutes);
rootRouter.use("/chat", chatRoutes);
export default rootRouter;
