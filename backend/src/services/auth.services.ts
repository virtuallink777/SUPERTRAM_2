import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constans/env";
import {
  CONFLICT,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  UNAUTHORIZED,
} from "../constans/http";
import VerificationCodeType from "../constans/verificationCodeTypes";
import SessionModel from "../models/sessionModel";
import UserModel from "../models/user.model";
import VerificationCodeModel from "../models/verificationCode.model";
import appAssert from "../utils/appAssert";
import { ONE_DAY_MS, oneYearFromNow, thirtyDaysForNow } from "../utils/date";
import jwt from "jsonwebtoken";
import {
  RefreshTokenPayload,
  refreshTokenSignOptions,
  signToken,
  verifyToken,
} from "../utils/jwt";
import { string } from "zod";

export type createAccountparams = {
  email: string;
  password: string;

  userAgent?: string;
};

// CREATE ACCOUNT

export const createAccount = async (data: createAccountparams) => {
  try {
    // verify existing user doesnt exist

    const existingUser = await UserModel.exists({ email: data.email });

    appAssert(!existingUser, CONFLICT, "El usuario ya existe");

    if (existingUser) {
      return {
        error: true,
        message: "El usuario ya existe",
      };
    }

    // create user

    const user = await UserModel.create({
      email: data.email,
      password: data.password,
    });

    // create verification code

    const userId = user._id;

    const verificationCode = await VerificationCodeModel.create({
      userId,
      type: VerificationCodeType.EmailVerification,
      expiresAt: oneYearFromNow(),
    });
    console.log("Código de verificación creado:", verificationCode);

    // send verificaction email

    // create session

    const session = await SessionModel.create({
      userId,
      userAgent: data.userAgent,
    });

    console.log("Sesión creada:", session);

    // sign access token & refresh token

    const sessionInfo = {
      sessionId: session._id,
    };

    const refreshToken = signToken(sessionInfo, refreshTokenSignOptions);

    const accessToken = signToken({ ...sessionInfo, userId });

    console.log("Tokens creados:", { accessToken, refreshToken });

    // return user & tokens

    return {
      user: user.omitPassword(),

      accessToken,
      refreshToken,
    };
  } catch (error) {
    // En caso de que ocurra un error inesperado
    return {
      error: true,
      message: "Error en la creación de la cuenta",
    };
  }
};

type LoginParams = {
  email: string;
  password: string;
  userAgent?: string;
};

// LOGUEO

export const loginUser = async ({
  email,
  password,
  userAgent,
}: LoginParams) => {
  // get user by email

  const user = await UserModel.findOne({ email });
  appAssert(user, UNAUTHORIZED, "Credenciales incorrectas");

  // validate password from the request

  const isValid = await user.comparePassword(password);
  appAssert(isValid, UNAUTHORIZED, "Credenciales incorrectas");

  const userId = user._id;

  // create a session

  const session = await SessionModel.create({
    userId,
    userAgent,
    expiresAt: thirtyDaysForNow(),
  });

  const sessionInfo = {
    sessionId: session._id,
  };
  // sign access token & refresh token

  const refreshToken = jwt.sign({ sessionInfo }, JWT_REFRESH_SECRET, {
    audience: ["user"],
    expiresIn: "30d",
  });
  const accessToken = jwt.sign(
    { userId: user._id, ...sessionInfo },
    JWT_SECRET,
    {
      audience: ["user"],
      expiresIn: "15m",
    }
  );

  // return user & tokens

  return {
    user: user.omitPassword(),
    accessToken,
    refreshToken,
  };
};

export const refreshUserAccessToken = async (refreshToken: string) => {
  const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, {
    secret: refreshTokenSignOptions.secret,
  });
  appAssert(payload, UNAUTHORIZED, "Invalid refresh token");

  const session = await SessionModel.findById(payload.sessionId);
  const now = Date.now();
  appAssert(
    session && session.expiresAt.getTime() > now,
    UNAUTHORIZED,
    "Session expired"
  );

  // Agregamos logs para debugging
  console.log("Tiempos de sesión:", {
    sessionExpiresAt: session?.expiresAt,
    sessionExpiresAtTimestamp: session?.expiresAt?.getTime(),
    currentTime: now,
    currentTimeDate: new Date(now),
    diferencia: session?.expiresAt?.getTime() - now,
  });

  // Primero verificamos si la sesión existe
  if (!session) {
    throw new Error("Session not found");
  }

  console.log("Tiempo actual:", new Date(now));
  console.log("Tiempo de expiración:", session.expiresAt);

  // Luego verificamos la expiración
  if (session.expiresAt.getTime() <= now) {
    throw new Error(
      `Session expired. Expires: ${session.expiresAt}, Current: ${new Date(
        now
      )}`
    );
  }

  // Si llegamos aquí, la sesión es válida
  console.log("Sesión válida, continuando...");

  // refresh the session if it expires in the next 24 hours
  const sessionNeedsRefresh = session.expiresAt.getTime() - now <= ONE_DAY_MS;
  if (sessionNeedsRefresh) {
    session.expiresAt = thirtyDaysForNow();
    await session.save();
  }

  const newRefreshToken = sessionNeedsRefresh
    ? signToken(
        {
          sessionId: session._id,
        },
        refreshTokenSignOptions
      )
    : undefined;

  const accessToken = signToken({
    userId: session.userId,
    sessionId: session._id,
  });

  return {
    accessToken,
    newRefreshToken,
  };
};

export const verifyEmail = async (code: string) => {
  // get verification code
  const validCode = await VerificationCodeModel.findOne({
    _id: code,
    type: VerificationCodeType.EmailVerification,
    expiresAt: { $gt: new Date() },
  });

  appAssert(validCode, NOT_FOUND, "Invalid or expired verification code");

  // update user to verified true
  const UpdateUser = await UserModel.findByIdAndUpdate(
    validCode.userId,
    {
      verified: true,
    },
    { new: true }
  );
  appAssert(UpdateUser, INTERNAL_SERVER_ERROR, "faild to verify email");

  // delete verification code
  await validCode.deleteOne();
  // return user
  return {
    user: UpdateUser.omitPassword(),
  };
};
