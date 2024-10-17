import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constans/env";
import VerificationCodeType from "../constans/verificationCodeTypes";
import SessionModel from "../models/sessionModel";
import UserModel from "../models/user.model";
import VerificationCodeModel from "../models/verificationCode.model";
import { oneYearFromNow } from "../utils/date";
import jwt from "jsonwebtoken";

export type createAccountparams = {
  email: string;
  password: string;
  userAgent: string;
};

export const createAccount = async (data: createAccountparams) => {
  // verify existing user doesnt exist

  const existingUser = await UserModel.exists({ email: data.email });

  if (existingUser) {
    throw new Error("El usuario ya existe");
  }

  // create user

  const user = await UserModel.create({
    email: data.email,
    password: data.password,
  });

  // create verification code

  const verificationCode = await VerificationCodeModel.create({
    userId: user._id,
    type: VerificationCodeType.EmailVerification,
    expiresAt: oneYearFromNow(),
  });

  // send verificaction email

  // create session

  const session = await SessionModel.create({
    userId: user._id,
    userAgent: data.userAgent,
  });

  // sign access token & refresh token

  const refreshToken = jwt.sign(
    { sessionId: session._id },
    JWT_REFRESH_SECRET,
    {
      audience: ["user"],
      expiresIn: "1d",
    }
  );
  const accessToken = jwt.sign(
    { userId: user._id, sessionId: session._id },
    JWT_SECRET,
    {
      audience: ["user"],
      expiresIn: "30m",
    }
  );

  // return user & tokens

  return {
    user,

    accessToken,
    refreshToken,
  };
};
