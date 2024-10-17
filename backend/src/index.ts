import express, { Request, Response, NextFunction } from "express";
import connectToDatabase from "./config/db";
import "dotenv/config";
import { PORT, NODE_ENV, APP_ORIGIN } from "./constans/env";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/errorHandler";
import catchErrors from "./utils/catchErrors";
import { OK } from "./constans/http";

import authRoutes from "./routes/auth.route";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: APP_ORIGIN,
    credentials: true,
  })
);

app.use(cookieParser());

app.get(
  "/",

  catchErrors(async (req, res, next) => {
    return res.status(OK).json({
      status: "healthy",
    });
  })
);

app.use("/auth", authRoutes);

app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`Server started on port ${PORT} in ${NODE_ENV} mode`);
  await connectToDatabase();
});
