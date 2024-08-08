import { Router } from "express";
import { errorHandler } from "../error-handler";
import {
  createBooking,
  deleteBooking,
  editBooking,
  fetchAllBookings,
  fetchBookingById,
  fetchUserBookings,
} from "../controllers/booking";
import authMiddleware from "../middlewares/auth";

const bookingRoutes: Router = Router();

bookingRoutes.post(
  "/create-booking",
  [authMiddleware],
  errorHandler(createBooking)
);
bookingRoutes.get("/fetch-bookings", errorHandler(fetchAllBookings));
bookingRoutes.get(
  "/fetch-bookings/user",
  [authMiddleware],
  errorHandler(fetchUserBookings)
);
bookingRoutes.get("/fetch-booking/:id", errorHandler(fetchBookingById));
bookingRoutes.put(
  "/update-booking/:id",
  [authMiddleware],
  errorHandler(editBooking)
);
bookingRoutes.delete(
  "/delete-booking/:id",
  [authMiddleware],
  errorHandler(deleteBooking)
);

export default bookingRoutes;
