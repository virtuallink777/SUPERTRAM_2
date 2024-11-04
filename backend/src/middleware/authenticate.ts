import { RequestHandler } from "express";
import appAssert from "../utils/appAssert";
import AppErrorCode from "../constans/appErrorCode";
import { UNAUTHORIZED } from "../constans/http";
import { AccessTokenPayload, verifyToken } from "../utils/jwt";
import { Types } from "mongoose";

// wrap with catchErrors() if you need this to be async
const authenticate: RequestHandler = (req, res, next) => {
  const accessToken = req.cookies.accessToken as string | undefined;
  appAssert(accessToken, UNAUTHORIZED, "Not authorized");

  const { error, payload } = verifyToken<AccessTokenPayload>(accessToken);
  appAssert(
    payload,
    UNAUTHORIZED,
    error === "jwt expired" ? "Token expired" : "Invalid token"
  );

  if (
    typeof payload.userId === "string" &&
    typeof payload.sessionId === "string"
  ) {
    req.userId = new Types.ObjectId(payload.userId);
    req.sessionId = new Types.ObjectId(payload.sessionId);
    next();
  } else {
    throw new Error("Invalid payload format");
  }
};

export default authenticate;
