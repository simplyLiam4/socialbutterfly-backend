import { Request, Response, NextFunction } from "express";
import { prismaClient } from "../db/prisma";
import { hashSync, compareSync } from "bcrypt";
import * as jwt from "jsonwebtoken";
import { JWT_SECRET } from "../secrets";
import { BadRequestsException } from "../exceptions/bad-requests";
import { ErrorCode } from "../exceptions/root";
import { UnprocessableEntity } from "../exceptions/validation";
import { LoginSchema, SignupSchema } from "../schemas/users";
import { NotFoundException } from "../exceptions/not-found";

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  SignupSchema.parse(req.body);
  const {
    email,
    firstName,
    lastName,
    password,
    address,
    county,
    postalCode,
    identificationNumber,
  } = req.body;
  console.log("signup", req.body);

  let user = await prismaClient.user.findFirst({ where: { email } });

  if (user) {
    next(
      new BadRequestsException(
        "User already exists",
        ErrorCode.USER_ALREADY_EXISTS
      )
    );
  }
  user = await prismaClient.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashSync(password, 10),
      address,
      county,
      postalCode,
      identificationNumber,
    },
  });
  const token = jwt.sign({ userId: user.id }, JWT_SECRET);
  res.status(200).json({
    userInfo: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      address: user.address,
      county: user.county,
      postalCode: user.postalCode,
      identificationNumber: user.identificationNumber,
    },
    message: "User Created Successfully",
    token,
  });
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  LoginSchema.parse(req.body);
  const { email, password } = req.body;

  let user = await prismaClient.user.findFirst({ where: { email } });

  if (!user) {
    // throw new Error("User not here");

    next(new NotFoundException("User not found", ErrorCode.USER_NOT_FOUND));
  } else {
    if (!compareSync(password, user.password)) {
      next(
        new BadRequestsException(
          "Invalid Passssssssword",
          ErrorCode.INCORRECT_PASSWORD
        )
      );
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);

    res.status(200).json({
      userInfo: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        address: user.address,
        county: user.county,
        postalCode: user.postalCode,
        identificationNumber: user.identificationNumber,
      },
      token,
    });
  }
};

//
export const me = async (req: Request, res: Response) => {
  res.json(req.user);
};
