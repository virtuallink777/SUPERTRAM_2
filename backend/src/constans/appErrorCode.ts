const enum AppErrorCode {
  Unauthorized = "UNAUTHORIZED",
  Forbidden = "FORBIDDEN",
  NotFound = "NOT_FOUND",
  Conflict = "CONFLICT",
  UnprocessableContent = "UNPROCESSABLE_CONTENT",
  TooManyRequests = "TOO_MANY_REQUESTS",
  InternalServerError = "INTERNAL_SERVER_ERROR",
  invalidAccessToken = "INVALID_ACCESS_TOKEN",
  invalidRefreshToken = "INVALID_REFRESH_TOKEN",
  invalidEmailOrPassword = "INVALID_EMAIL_OR_PASSWORD",
}

export default AppErrorCode;
