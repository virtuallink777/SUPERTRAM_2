import { ErrorRequestHandler, Response } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../constans/http";
import { z } from "zod";

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

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  console.log(`PATH: ${req.path} `, error);

  if (error instanceof z.ZodError) {
    return handleZodError(res, error);
  }

  res.status(INTERNAL_SERVER_ERROR).send("internal server error");
};

export default errorHandler;
