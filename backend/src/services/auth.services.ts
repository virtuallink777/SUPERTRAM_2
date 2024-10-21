import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constans/env";
import { CONFLICT, UNAUTHORIZED } from "../constans/http";
import VerificationCodeType from "../constans/verificationCodeTypes";
import SessionModel from "../models/sessionModel";
import UserModel from "../models/user.model";
import VerificationCodeModel from "../models/verificationCode.model";
import appAssert from "../utils/appAssert";
import { oneYearFromNow } from "../utils/date";
import jwt from "jsonwebtoken";
import { refreshTokenSignOptions, signToken } from "../utils/jwt";




export type createAccountparams = {
  email: string;
  password: string;

  userAgent?: string;
};

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


    const sessionInfo ={
      sessionId: session._id,
    }

    const refreshToken = signToken(
      sessionInfo, refreshTokenSignOptions
    )
    
   


    const accessToken = signToken(
     { ...sessionInfo,
      userId,
     },
    )
    

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
  email: string,
  password: string,
  userAgent?: string

}


export const loginUser = async ({email, password, userAgent} : LoginParams) => {
  // get user by email

  const user = await UserModel.findOne({ email });
  appAssert(user, UNAUTHORIZED, "Credenciales incorrectas");


  // validate password from the request

  const isValid =  await user.comparePassword(password);
  appAssert(isValid, UNAUTHORIZED, "Credenciales incorrectas");

  const userId = user._id;

  // create a session

  const session = await SessionModel.create({
    userId,
    userAgent
  });

  const sessionInfo = {
    sessionId: session._id,
  }
  // sign access token & refresh token

  const refreshToken = jwt.sign(
    { sessionInfo },
    JWT_REFRESH_SECRET,
    {
      audience: ["user"],
      expiresIn: "1d",
    }
  );
  const accessToken = jwt.sign(
    { userId: user._id, ...sessionInfo},
    JWT_SECRET,
    {
      audience: ["user"],
      expiresIn: "30m",
    }
  );


  // return user & tokens

  return {
    user: user.omitPassword(),
    accessToken,
    refreshToken,
  };
}
