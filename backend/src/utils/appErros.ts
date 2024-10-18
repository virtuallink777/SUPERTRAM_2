import AppErrorCode from "../constans/appErrorCode";
import { HttpStatusCode } from "../constans/http";

export class AppError extends Error {
  constructor(
    public statusCode: HttpStatusCode,
    public message: string,
    public errorCode?: AppErrorCode
  ) {
    super(message);
  }
}

new AppError(
  200,
  "msg",

  AppErrorCode.InternalServerError
);

export default AppError;
