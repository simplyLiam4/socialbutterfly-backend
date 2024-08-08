import { z } from "zod";
import { signup } from "../controllers/auth";

export const SignupSchema = z.object({
  // sign up
  firstName: z.string().min(3),
  lastName: z.string().min(3),
  address: z.string().max(50),
  county: z.string().min(3),
  postalCode: z.string().min(3).max(8),
  identificationNumber: z.string().min(8),
  email: z.string().email({
    message: "Email is invalid",
  }),
  password: z.string().min(6, {
    message: "Password must contain at least 6 characters",
  }),
});

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is invalid",
  }),
  password: z.string().min(6, {
    message: "Password must contain at least 6 characters",
  }),
});
