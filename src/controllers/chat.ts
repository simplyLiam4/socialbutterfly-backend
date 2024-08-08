import { Request, Response, NextFunction } from "express";
import { prismaClient } from "../db/prisma";

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { eventId, message } = req.body;
    const user = req.user!;

    // Check if the user has booked the event
    const booking = await prismaClient.booking.findFirst({
      where: { eventId, userId: user.id },
    });

    if (!booking) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Create the message
    const newMessage = await prismaClient.message.create({
      data: {
        content: message,
        chatRoom: { connect: { eventId } },
        user: { connect: { id: user.id } },
      },
      include: { user: true },
    });

    res.json(newMessage);
  } catch (error) {
    next(error);
  }
};
