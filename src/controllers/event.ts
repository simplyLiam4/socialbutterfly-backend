import { NextFunction, Request, Response } from "express";
import { prismaClient } from "../db/prisma";
import { EventSchema } from "../schemas/events";
import { BadRequestsException } from "../exceptions/bad-requests";
import { ErrorCode } from "../exceptions/root";
import { NotFoundException } from "../exceptions/not-found";
import { UnauthorizedException } from "../exceptions/unauthorized";

// Helper function to handle categories
const handleCategories = (categories: string[]) => {
  return categories.map((categoryName) => ({
    where: { name: categoryName },
    create: { name: categoryName },
  }));
};

export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("req.body", req.body);
    EventSchema.parse(req.body);
    const user = req.user!;
    const { categories, ...eventData } = req.body;

    const categoryConnectOrCreate = handleCategories(categories);
    const event = await prismaClient.event.create({
      data: {
        eventCreatedById: user.id,
        ...eventData,
        categories: {
          create: categoryConnectOrCreate.map((cat) => ({
            category: {
              connectOrCreate: cat,
            },
          })),
        },
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    // Create the chat room and add the user who created the event to it
    const chatRoom = await prismaClient.chatRoom.create({
      data: {
        event: { connect: { id: event.id } },
        // Initially, the user who created the event is added to the chat room
        messages: {
          create: [
            {
              content: `${user.firstName} created this chat room.`,
              userId: user.id,
            },
          ],
        },
      },
    });

    await prismaClient.event.update({
      where: { id: event.id },
      data: { chatRoomId: chatRoom.id },
    });
    await prismaClient.booking.create({
      data: {
        status: "confirmed", // or any default status you prefer
        user: { connect: { id: user.id } },
        event: { connect: { id: event.id } },
      },
    });
    res.json({
      event,
      message: "Event created successfully",
    });
  } catch (error) {
    console.log("error", error);
    next(error);
  }
};

// Fetch All Events
export const fetchAllEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const events = await prismaClient.event.findMany({
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
    res.json(events);
  } catch (error) {
    next(error);
  }
};

// Fetch Event by ID
export const fetchEventById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = req.params.id;

    const event = await prismaClient.event.findUnique({
      where: { id: eventId },
      include: {
        eventCreatedBy: true,
        bookings: {
          include: {
            user: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!event) {
      next(
        new NotFoundException("Event does not exist", ErrorCode.EVENT_NOT_FOUND)
      );
    } else {
      const ownerInfo = {
        id: event.eventCreatedBy.id,
        email: event.eventCreatedBy.email,
        firstName: event.eventCreatedBy.firstName,
        lastName: event.eventCreatedBy.lastName,
      };
      const bookings = event.bookings;
      console.log("event.bookings", event.bookings);

      const eventInfo = {
        id: event.id,
        title: event.title,
        description: event.description,
        price: event.price,
        location: event.location,
        mapData: event.mapData,
        photos: event.photos,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        categories: event.categories.map((cat) => cat.category.name),
      };
      res.json({
        ownerInfo,
        bookings,
        eventInfo,
      });
    }
  } catch (error) {
    next(error);
  }
};

// Fetch User Events
export const fetchUserEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user!;

    const events = await prismaClient.event.findMany({
      where: { eventCreatedById: user.id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!events.length) {
      next(
        new NotFoundException(
          "No events found for this user",
          ErrorCode.USER_DOESNT_HAVE_EVENTS
        )
      );
    }

    res.json(events);
  } catch (error) {
    next(error);
  }
};

// Edit Event
export const editEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = req.params.id;
    const user = req.user!;
    EventSchema.parse(req.body);
    const { categories, ...eventData } = req.body;

    const event = await prismaClient.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      next(
        new NotFoundException("Event does not exist", ErrorCode.EVENT_NOT_FOUND)
      );
    }

    if (event!.eventCreatedById !== user.id) {
      next(
        new UnauthorizedException(
          "You do not have permission to perform this action",
          ErrorCode.UNAUTHORIZED
        )
      );
    }

    const bookingCount = await prismaClient.booking.count({
      where: { eventId: eventId },
    });

    if (bookingCount > 0) {
      next(
        new BadRequestsException(
          "Cannot update event tied to a booking",
          ErrorCode.EVENT_IS_LOCKED
        )
      );
    }

    const categoryConnectOrCreate = await handleCategories(categories);

    const updatedEvent = await prismaClient.event.update({
      where: { id: eventId },
      data: {
        ...eventData,
        categories: {
          set: [],
          connectOrCreate: categoryConnectOrCreate,
        },
      },
    });

    res.json(updatedEvent);
  } catch (error) {
    next(error);
  }
};

// Delete Event
export const deleteEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = req.params.id;
    const user = req.user!;

    const event = await prismaClient.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      next(
        new NotFoundException("Event does not exist", ErrorCode.EVENT_NOT_FOUND)
      );
    }

    if (event!.eventCreatedById !== user.id) {
      next(
        new UnauthorizedException(
          "You do not have permission to perform this action",
          ErrorCode.UNAUTHORIZED
        )
      );
    }

    const bookingCount = await prismaClient.booking.count({
      where: { eventId: eventId },
    });

    if (bookingCount > 0) {
      next(
        new BadRequestsException(
          "Cannot delete event tied to a booking",
          ErrorCode.EVENT_IS_LOCKED
        )
      );
    }

    await prismaClient.event.delete({
      where: { id: eventId },
    });

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const fetchCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await prismaClient.category.findMany();
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

export const fetchEventsByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categoryName = req.params.category;
    const events = await prismaClient.event.findMany({
      where: {
        categories: {
          some: {
            category: {
              name: categoryName,
            },
          },
        },
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
    res.json(events);
  } catch (error) {
    next(error);
  }
};

export const fetchChatMessages = async (req: Request, res: Response) => {
  const { eventId } = req.params;

  try {
    const messages = await prismaClient.message.findMany({
      where: { chatRoom: { eventId } },
      include: { user: true },
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching chat messages: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const fetchAttendees = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = req.params.id;

    const participants = await prismaClient.booking.findMany({
      where: { eventId: eventId },
      include: {
        user: true,
      },
    });

    if (!participants.length) {
      next(
        new NotFoundException(
          "No participants found for this event",
          ErrorCode.NO_PARTICIPANTS_FOUND
        )
      );
      return;
    }

    // Format the response to include user details
    const participantDetails = participants.map((participant) => ({
      id: participant.user.id,
      firstName: participant.user.firstName,
      lastName: participant.user.lastName,
      email: participant.user.email,
    }));

    res.json(participantDetails);
  } catch (error) {
    next(error);
  }
};
