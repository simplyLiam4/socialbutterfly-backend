import { NextFunction, Request, Response } from "express";
import { HttpException, ErrorCode } from "./exceptions/root";
import { InternalException } from "./exceptions/internal-exception";

export const errorHandler = (method: Function) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // pass the controller through error handler
      // high level function wrapping all controllers

      await method(req, res, next);
    } catch (error: any) {
      let exception: HttpException;

      if (error instanceof HttpException) {
        // error we have defined and handled

        exception = error;
      } else {
        // Runtime Errors errors we havent handled
        exception = new InternalException(
          "Something went wrong",
          error,
          ErrorCode.INTERNAL_EXCEPTION
        );
      }
      next(exception);
    }
  };
};
