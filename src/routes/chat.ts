import { Router } from "express";
import authMiddleware from "../middlewares/auth";
import { sendMessage } from "../controllers/chat";

const chatRoutes: Router = Router();

chatRoutes.post("/send", authMiddleware, sendMessage);

export default chatRoutes;
