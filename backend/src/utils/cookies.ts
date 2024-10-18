import { CookieOptions, Response } from "express";
import { oneDayFromNow, thirtyMinutesFromNow } from "./date";

const secure = process.env.NODE_ENV !== "development";

const defaults: CookieOptions = {
  sameSite: "strict",
  httpOnly: true,
  secure,
};

const getAccessTokenCookieOptions = () => ({
  ...defaults,

  expires: thirtyMinutesFromNow(),
});

const getRefreshTokenCookieOptions = () => ({
  ...defaults,

  expires: oneDayFromNow(),
  path: "/auth/refresh",
});

type Params = {
  res: Response;
  accessToken?: string;
  refreshToken?: string;
};

export const setAuthCookies = ({ res, accessToken, refreshToken }: Params) =>
  res
    .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
    .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());
