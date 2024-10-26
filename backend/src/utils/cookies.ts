import { CookieOptions, Response } from "express";
import { oneDayFromNow, thirtyMinutesFromNow } from "./date";

const secure = process.env.NODE_ENV !== "development";

export const REFRESH_PATH = "/auth/refresh";

const defaults: CookieOptions = {
  sameSite: "strict",
  httpOnly: true,
  secure,
};

export const getAccessTokenCookieOptions = () => ({
  ...defaults,

  expires: thirtyMinutesFromNow(),
});

export const getRefreshTokenCookieOptions = () => ({
  ...defaults,

  expires: oneDayFromNow(),
  path: REFRESH_PATH,
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

export const clearAuthCookies = (res: Response) =>
  res.clearCookie("accessToken").clearCookie("refreshToken", {
    path: REFRESH_PATH,
  });
