import { Router } from "express";
import { errorHandler } from "../error-handler";
import {
  createEvent,
  deleteEvent,
  editEvent,
  fetchAllEvents,
  fetchAttendees,
  fetchCategories,
  fetchEventById,
  fetchEventsByCategory,
  fetchUserEvents,
} from "../controllers/event";
import authMiddleware from "../middlewares/auth";

const eventRoutes: Router = Router();

eventRoutes.post("/create-event", [authMiddleware], errorHandler(createEvent));
eventRoutes.get("/fetch-events", errorHandler(fetchAllEvents));
eventRoutes.get(
  "/fetch-events/user",
  [authMiddleware],
  errorHandler(fetchUserEvents)
);
eventRoutes.get("/fetch-event/:id", errorHandler(fetchEventById));
eventRoutes.put("/update-event/:id", [authMiddleware], errorHandler(editEvent));
eventRoutes.delete(
  "/delete-event/:id",
  [authMiddleware],
  errorHandler(deleteEvent)
);
eventRoutes.get("/fetch-categories", errorHandler(fetchCategories));
eventRoutes.get(
  "/fetch-events/category/:category",
  errorHandler(fetchEventsByCategory)
);

eventRoutes.get("/fetch-attendees/:id", errorHandler(fetchAttendees));

export default eventRoutes;
