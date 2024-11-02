import { RequestHandler } from "express";
import appAssert from "../utils/appAssert";
import { UNAUTHORIZED } from "../constans/http";
import AppErrorCode from "../constans/appErrorCode";
import { verifyToken } from "../utils/jwt";
import { Types } from "mongoose";

interface MyRequest extends Request {
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
}

const authenticate: RequestHandler<
  unknown,
  unknown,
  unknown,
  unknown,
  MyRequest
> = (req, res, next) => {
  const accessToken = req.cookies.accessToken as string;
  console.log(req.userId);
  appAssert(
    accessToken,
    UNAUTHORIZED,
    "Acceso no permitido",
    AppErrorCode.invalidAccessToken
  );

  const { error, payload } = verifyToken(accessToken);
  appAssert(
    payload,
    UNAUTHORIZED,
    error === "jwt expired" ? "token expired" : "Invalid token",
    AppErrorCode.invalidAccessToken
  );

  req.userId = payload.userId as Types.ObjectId;
  req.sessionId = payload.sessionId as Types.ObjectId;
  next();
};

export default authenticate;
