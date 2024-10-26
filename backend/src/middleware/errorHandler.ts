import { ErrorRequestHandler, Response } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../constans/http";
import { z } from "zod";
import AppError from "../utils/appErros";
import { clearAuthCookies, REFRESH_PATH } from "../utils/cookies";

const handleZodError = (res: Response, error: z.ZodError) => {
  const errors = error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

  res.status(BAD_REQUEST).json({
    message: error.message,
    errors: errors,
  });
};

const handleAppError = (res: Response, error: AppError) => {
  return res.status(error.statusCode).json({
    message: error.message,
    errorCode: error.errorCode,
  });
};

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  console.log(`PATH: ${req.path} `, error);

  if (req.path === REFRESH_PATH) {
    clearAuthCookies(res);
  }

  if (error instanceof z.ZodError) {
    handleZodError(res, error);
  } else if (error instanceof AppError) {
    handleAppError(res, error);
  } else {
    res.status(INTERNAL_SERVER_ERROR).send("internal server error");
  }
};

export default errorHandler;
