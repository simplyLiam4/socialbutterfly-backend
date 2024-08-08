import { NextFunction, Request, Response } from "express";
import { prismaClient } from "../db/prisma";
import { BookingSchema } from "../schemas/bookings";
import { BadRequestsException } from "../exceptions/bad-requests";
import { ErrorCode } from "../exceptions/root";
import { NotFoundException } from "../exceptions/not-found";
import { UnauthorizedException } from "../exceptions/unauthorized";

export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user!;
    const { eventId, status } = req.body;

    // Find the event
    const event = await prismaClient.event.findFirst({
      where: { id: eventId },
    });

    if (!event) {
      return next(
        new NotFoundException("Event not found", ErrorCode.EVENT_NOT_FOUND)
      );
    }

    // Check if the user already has a booking
    const existingBooking = await prismaClient.booking.findFirst({
      where: { userId: user.id, eventId: event.id },
    });

    if (existingBooking) {
      return next(
        new BadRequestsException(
          "User already has a booking for this event",
          ErrorCode.USER_ALREADY_HAS_BOOKING
        )
      );
    }

    // Create a booking
    const booking = await prismaClient.booking.create({
      data: {
        userId: user.id,
        eventId,
        status,
      },
      include: {
        user: true,
        event: true,
      },
    });

    // Add the user to the chatroom
    await prismaClient.chatRoomUser.create({
      data: {
        userId: user.id,
        chatRoomId: event.chatRoomId!,
      },
    });

    res.json({
      booking,
      message: "Booking created successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Fetch All Bookings
export const fetchAllBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bookings = await prismaClient.booking.findMany({
      include: {
        user: true,
        event: true,
      },
    });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

// Fetch Booking by ID
export const fetchBookingById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bookingId = req.params.id;

    const booking = await prismaClient.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        event: true,
      },
    });

    if (!booking) {
      return next(
        new NotFoundException("Booking not found", ErrorCode.BOOKING_NOT_FOUND)
      );
    }

    res.json(booking);
  } catch (error) {
    next(error);
  }
};

// Fetch User Bookings
export const fetchUserBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user!;

    const bookings = await prismaClient.booking.findMany({
      where: { userId: user.id },
      include: {
        event: true,
      },
    });

    if (!bookings.length) {
      return next(
        new NotFoundException(
          "No bookings found for this user",
          ErrorCode.USER_DOESNT_HAVE_BOOKINGS
        )
      );
    }

    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

// Edit Booking
export const editBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bookingId = req.params.id;
    const user = req.user!;
    BookingSchema.parse(req.body);

    const booking = await prismaClient.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return next(
        new NotFoundException("Booking not found", ErrorCode.BOOKING_NOT_FOUND)
      );
    }

    if (booking.userId !== user.id) {
      return next(
        new UnauthorizedException(
          "You do not have permission to perform this action",
          ErrorCode.UNAUTHORIZED
        )
      );
    }

    const updatedBooking = await prismaClient.booking.update({
      where: { id: bookingId },
      data: { ...req.body },
    });

    res.json(updatedBooking);
  } catch (error) {
    next(error);
  }
};

// Delete Booking
export const deleteBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bookingId = req.params.id;
    const user = req.user!;

    const booking = await prismaClient.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return next(
        new NotFoundException("Booking not found", ErrorCode.BOOKING_NOT_FOUND)
      );
    }

    if (booking.userId !== user.id) {
      return next(
        new UnauthorizedException(
          "You do not have permission to perform this action",
          ErrorCode.UNAUTHORIZED
        )
      );
    }

    await prismaClient.booking.delete({
      where: { id: bookingId },
    });

    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    next(error);
  }
};
