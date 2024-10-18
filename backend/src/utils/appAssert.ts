import assert from "node:assert";
import AppError from "./appErros";
import { HttpStatusCode } from "../constans/http";
import AppErrorCode from "../constans/appErrorCode";

type AppAssert = (
  condition: any,
  httpStatusCode: HttpStatusCode,
  message: string,
  appErrorCode?: AppErrorCode
) => asserts condition;

/*

* Asserts a condition and throws an AppError if the condition is false.

*/

const appAssert: AppAssert = (
  condition: any,
  httpStatusCode,
  message,
  appErrorCode
) => assert(condition, new AppError(httpStatusCode, message, appErrorCode));

export default appAssert;
